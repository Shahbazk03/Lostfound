"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Crop, Check } from "lucide-react";
import Image from "next/image";
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: number;
}

export function ImageUpload({ value, onChange, label = "Upload Image", aspectRatio }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropModal, setShowCropModal] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(e.target.files[0]);
      setShowCropModal(true);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      width: 90,
      height: aspectRatio ? 90 / aspectRatio : 90,
      x: 5,
      y: 5
    });
  };

  const handleUploadCropped = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsUploading(true);
    setShowCropModal(false);

    try {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height,
      );

      // Convert canvas to WebP for better compression
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }

        const file = new File([blob], "cropped-image.webp", { type: "image/webp" });
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onChange(data.file.url);
        } else {
          alert("Upload failed");
        }
        setIsUploading(false);
      }, 'image/webp', 0.9);

    } catch (error) {
      console.error("Error uploading cropped image:", error);
      alert("Upload failed");
      setIsUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(e.dataTransfer.files[0]);
      setShowCropModal(true);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      
      {value ? (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 group">
          <Image src={value} alt="Preview" fill className="object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white text-slate-900 rounded-full hover:bg-slate-100"
              type="button"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange("")}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive 
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
              : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-slate-500">
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-sm font-medium">Click or drag image to upload</span>
              <span className="text-xs text-slate-400 mt-1">SVG, PNG, JPG, WEBP, AVIF</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/avif"
        onChange={onSelectFile}
        className="hidden"
      />

      {/* Crop Modal */}
      {showCropModal && !!imgSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Crop className="w-5 h-5 text-emerald-500" /> Crop & Compress
              </h3>
              <button onClick={() => setShowCropModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 flex justify-center max-h-[60vh] overflow-y-auto">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-w-full h-auto object-contain"
                />
              </ReactCrop>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setShowCropModal(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCropped}
                disabled={!completedCrop || isUploading}
                className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isUploading ? "Processing..." : "Crop & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
