import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
interface SketchUploadProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  className?: string;
}
export function SketchUpload({ files, setFiles, className }: SketchUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [setFiles]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  return (
    <div className={cn("space-y-6", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative p-10 sketch-border sketch-shadow bg-white cursor-pointer transition-all group",
          isDragActive ? "bg-sketch-orange/10 scale-[1.02]" : "hover:bg-paper"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <motion.div
            animate={isDragActive ? { y: -10 } : { y: 0 }}
            className="p-4 bg-sketch-orange/20 rounded-full"
          >
            <Upload className="w-10 h-10 text-charcoal" />
          </motion.div>
          <div>
            <p className="text-2xl font-sketch">Drop your photos here</p>
            <p className="text-muted-foreground italic font-medium">
              ...or click to search your desk (Browse)
            </p>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            JPG, PNG up to 5MB
          </p>
        </div>
      </div>
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group aspect-square sketch-border bg-white overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 p-1 bg-white sketch-border sketch-shadow-sm hover:bg-red-50 transition-colors"
                >
                  <X size={14} className="text-red-500" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-charcoal/80 p-1">
                  <p className="text-[10px] text-white truncate font-medium">{file.name}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}