import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, dataUrl: string) => void;
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      onImageSelected(base64, file.type, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div
      className={`relative w-full h-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
        ${isDragging ? 'border-[#ff4e00] bg-[rgba(255,78,0,0.05)]' : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
      
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          <UploadCloud className="w-8 h-8 text-[rgba(255,255,255,0.6)]" />
        </div>
        <div>
          <p className="text-lg font-medium text-[rgba(255,255,255,0.9)] mb-1">Upload an inspiration image</p>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">Drag and drop or click to browse</p>
        </div>
      </div>
    </div>
  );
}
