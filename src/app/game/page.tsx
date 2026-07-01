"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCcw, Play, CheckCircle, LucideIcon } from "lucide-react";

type Direction = "up" | "down" | "left" | "right";

interface Block {
  id: string;
  x: number;
  y: number;
  dir: Direction;
  isEscaping?: boolean;
}

const dirMap: Record<Direction, { dx: number; dy: number; icon: LucideIcon }> = {
  up: { dx: 0, dy: -1, icon: ArrowUp },
  down: { dx: 0, dy: 1, icon: ArrowDown },
  left: { dx: -1, dy: 0, icon: ArrowLeft },
  right: { dx: 1, dy: 0, icon: ArrowRight },
};

export default function GamePage() {
  const [level, setLevel] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [rewardInfo, setRewardInfo] = useState<{ reward: number; limitReached: boolean; alreadyRewarded?: boolean } | null>(null);
  const [totalEarned, setTotalEarned] = useState<number | null>(null);

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/user/earnings");
      const data = await res.json();
      if (data.balances) {
        const inrBalance = data.balances.find((b: any) => b.currency === "INR");
        if (inrBalance) {
          setTotalEarned(inrBalance.availableBalance);
        } else {
          setTotalEarned(0);
        }
      }
    } catch (e) {
      console.error("Wallet fetch error", e);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    if (isLevelComplete) {
      const fetchReward = async () => {
        try {
          const res = await fetch("/api/game/reward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level })
          });
          const data = await res.json();
          if (data.success) {
            setRewardInfo({ reward: data.reward, limitReached: data.limitReached, alreadyRewarded: data.alreadyRewarded });
            fetchWallet(); // Update wallet immediately
          }
        } catch (e) {
          console.error("Reward error", e);
        }
      };
      fetchReward();
    }
  }, [isLevelComplete, level]);

  // Procedural generator
  const generateLevel = useCallback((currentLevel: number) => {
    // Determine grid size and block count based on level
    let newSize = 3;
    if (currentLevel >= 3) newSize = 4;
    if (currentLevel >= 6) newSize = 5;
    if (currentLevel >= 11) newSize = 6;
    if (currentLevel >= 21) newSize = 7;
    if (currentLevel >= 36) newSize = 8;
    if (currentLevel >= 56) newSize = 9;
    if (currentLevel >= 81) newSize = 10;
    
    // Scale blocks up to almost full grid (95% full)
    const maxBlocks = Math.floor(newSize * newSize * 0.95);
    const targetBlocks = Math.min(maxBlocks, 4 + Math.floor(currentLevel * 2.5));

    setGridSize(newSize);

    // Generate backwards
    const placedBlocks: Block[] = [];
    
    for (let i = 0; i < targetBlocks; i++) {
      const candidates: { x: number, y: number, dir: Direction, blocksExisting: boolean }[] = [];
      
      for (let y = 0; y < newSize; y++) {
        for (let x = 0; x < newSize; x++) {
          // Skip if cell occupied
          if (placedBlocks.some(b => b.x === x && b.y === y)) continue;

          // Test all directions
          (Object.keys(dirMap) as Direction[]).forEach(dir => {
            const { dx, dy } = dirMap[dir];
            let clear = true;
            let blocksExisting = false;

            // Check path to edge
            let currX = x + dx;
            let currY = y + dy;
            while (currX >= 0 && currX < newSize && currY >= 0 && currY < newSize) {
              if (placedBlocks.some(b => b.x === currX && b.y === currY)) {
                clear = false;
                break;
              }
              currX += dx;
              currY += dy;
            }

            if (clear) {
              // Check if placing this block here blocks the escape path of any ALREADY placed block
              // Meaning, is this cell in the path of any existing block?
              placedBlocks.forEach(pb => {
                const pdx = dirMap[pb.dir].dx;
                const pdy = dirMap[pb.dir].dy;
                let px = pb.x + pdx;
                let py = pb.y + pdy;
                while (px >= 0 && px < newSize && py >= 0 && py < newSize) {
                  if (px === x && py === y) {
                    blocksExisting = true;
                  }
                  px += pdx;
                  py += pdy;
                }
              });

              candidates.push({ x, y, dir, blocksExisting });
            }
          });
        }
      }

      if (candidates.length === 0) {
        break; // Board is full or no valid placements
      }

      // Prefer candidates that create dependencies
      const preferred = candidates.filter(c => c.blocksExisting);
      
      // As level increases, heavily favor moves that block existing pieces
      // Level 1: ~44% chance, Level 10: ~80% chance, Level 20+: 95% chance
      const blockProbability = Math.min(0.95, 0.4 + (currentLevel * 0.04));
      const listToChooseFrom = preferred.length > 0 && Math.random() < blockProbability ? preferred : candidates;
      
      const chosen = listToChooseFrom[Math.floor(Math.random() * listToChooseFrom.length)];
      placedBlocks.push({
        id: `block-${Date.now()}-${i}`,
        x: chosen.x,
        y: chosen.y,
        dir: chosen.dir
      });
    }

    setBlocks(placedBlocks);
    setIsLevelComplete(false);
  }, []);

  useEffect(() => {
    // Load saved level on mount
    const savedLevel = localStorage.getItem("arrowsPuzzleLevel");
    if (savedLevel) {
      setLevel(parseInt(savedLevel, 10));
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    generateLevel(level);
    localStorage.setItem("arrowsPuzzleLevel", level.toString());
  }, [level, generateLevel, isInitialized]);

  const handleBlockClick = (block: Block) => {
    if (block.isEscaping) return;

    const { dx, dy } = dirMap[block.dir];
    let isBlocked = false;
    let currX = block.x + dx;
    let currY = block.y + dy;

    // Forward check
    while (currX >= 0 && currX < gridSize && currY >= 0 && currY < gridSize) {
      if (blocks.some(b => b.x === currX && b.y === currY && !b.isEscaping)) {
        isBlocked = true;
        break;
      }
      currX += dx;
      currY += dy;
    }

    if (isBlocked) {
      setShakeId(block.id);
      setTimeout(() => setShakeId(null), 400); // clear shake
    } else {
      // Escape!
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isEscaping: true } : b));
      
      setTimeout(() => {
        setBlocks(prev => {
          const newBlocks = prev.filter(b => b.id !== block.id);
          if (newBlocks.length === 0) {
            setIsLevelComplete(true);
          }
          return newBlocks;
        });
      }, 500); // wait for animation
    }
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
  };

  const restartLevel = () => {
    generateLevel(level);
  };

  // Cell size computation
  const cellSize = gridSize > 7 ? 40 : gridSize > 5 ? 50 : 60;
  const boardSize = gridSize * cellSize + (gridSize - 1) * 8; // 8px gap

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {!isInitialized ? (
        <div className="z-10 text-white font-medium animate-pulse mt-20">Loading Game...</div>
      ) : (
        <>
          <div className="z-10 w-full max-w-lg flex flex-col items-center">
        <div className="flex w-full items-center justify-between mb-8 text-white px-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              Arrows Escape
            </h1>
            <p className="text-slate-400 font-medium">Level {level}</p>
          </div>
          <div className="flex items-center gap-4">
            {totalEarned !== null && (
              <div className="flex flex-col items-end px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Total Earned</span>
                <span className="text-sm font-bold text-emerald-400">₹{(totalEarned / 100).toFixed(2)}</span>
              </div>
            )}
            <button 
              onClick={restartLevel}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              title="Restart Level"
            >
              <RefreshCcw className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        <div 
          className="relative bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm shadow-2xl"
        >
          <div 
            className="relative"
            style={{
              width: boardSize,
              height: boardSize
            }}
          >
            <AnimatePresence>
              {blocks.map((block) => {
                const isShaking = shakeId === block.id;
                const Icon = dirMap[block.dir].icon;
                
                // Escape animation target
                const escapeDist = boardSize + 100;
                const exitX = block.isEscaping ? block.x * (cellSize + 8) + dirMap[block.dir].dx * escapeDist : block.x * (cellSize + 8);
                const exitY = block.isEscaping ? block.y * (cellSize + 8) + dirMap[block.dir].dy * escapeDist : block.y * (cellSize + 8);

                return (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={
                      isShaking 
                        ? { 
                            x: block.x * (cellSize + 8), 
                            y: block.y * (cellSize + 8), 
                            rotate: [-5, 5, -5, 5, 0],
                            transition: { duration: 0.3 }
                          }
                        : { 
                            scale: 1, 
                            opacity: 1,
                            x: exitX,
                            y: exitY,
                            transition: block.isEscaping ? { duration: 0.5, ease: "easeIn" as const } : { type: "spring", stiffness: 300, damping: 25 }
                          }
                    }
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => handleBlockClick(block)}
                    className={`absolute cursor-pointer rounded-xl flex items-center justify-center shadow-lg transition-colors
                      ${block.isEscaping ? 'pointer-events-none' : ''}
                      ${isShaking ? 'bg-red-500 shadow-red-500/50' : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30 hover:from-emerald-300 hover:to-teal-400'}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      zIndex: block.isEscaping ? 50 : 10
                    }}
                  >
                    <Icon className={`text-white ${cellSize < 50 ? 'w-5 h-5' : 'w-7 h-7'} drop-shadow-md`} strokeWidth={3} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLevelComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Level Cleared!</h2>
              <p className="text-slate-600 mb-6">Excellent logic! You solved level {level}.</p>
              
              {rewardInfo && (
                <div className={`mb-8 p-4 rounded-xl ${rewardInfo.reward > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                  {rewardInfo.reward > 0 ? (
                    <>
                      <p className="text-sm text-emerald-600 font-semibold mb-1">Reward Earned</p>
                      <p className="text-2xl font-bold text-emerald-700">₹{(rewardInfo.reward / 100).toFixed(2)}</p>
                      {rewardInfo.limitReached && (
                        <p className="text-xs text-amber-600 mt-2">You've reached your ₹5 daily limit. No further rewards today.</p>
                      )}
                    </>
                  ) : rewardInfo.alreadyRewarded ? (
                    <>
                      <p className="text-sm text-amber-600 font-semibold mb-1">Already Rewarded</p>
                      <p className="text-sm text-amber-700">You've already claimed the reward for Level {level}!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-amber-600 font-semibold mb-1">Daily Limit Reached</p>
                      <p className="text-sm text-amber-700">You've earned ₹5 today! Come back tomorrow for more rewards.</p>
                    </>
                  )}
                </div>
              )}
              
              <button 
                onClick={nextLevel}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Next Level
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
