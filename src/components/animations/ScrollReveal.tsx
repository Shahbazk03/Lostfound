"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: "fade-up" | "slide-in" | "scale-up" | "fade-in";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const getVariants = (): Variants => {
    switch (animation) {
      case "fade-up":
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0, transition: { duration, delay, ease: "easeOut" } },
        };
      case "slide-in":
        return {
          hidden: { opacity: 0, x: -40 },
          visible: { opacity: 1, x: 0, transition: { duration, delay, ease: "easeOut" } },
        };
      case "scale-up":
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1, transition: { duration, delay, ease: "easeOut" } },
        };
      case "fade-in":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration, delay, ease: "easeOut" } },
        };
      default:
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0, transition: { duration, delay, ease: "easeOut" } },
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10%" }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  );
}
