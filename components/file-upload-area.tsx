"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  maxSize?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUploadArea({
  onFilesSelected,
  maxSize = 50 * 1024 * 1024,
  acceptedTypes = [
    ".pdf",
    ".docx",
    ".txt",
    ".csv",
    ".xlsx",
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
  ],
  multiple = true,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      // Validate files
      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (file.size > maxSize) {
          setUploads((prev) => [
            ...prev,
            {
              file,
              progress: 0,
              status: "error",
              error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
            },
          ]);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Add to uploads list
      const newUploads: UploadProgress[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending",
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      // Upload files
      await onFilesSelected(validFiles);

      // Mark as success
      setUploads((prev) =>
        prev.map((upload) =>
          validFiles.includes(upload.file)
            ? { ...upload, progress: 100, status: "success" }
            : upload
        )
      );

      // Auto-clear after 3 seconds
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status !== "success"));
      }, 3000);
    },
    [maxSize, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeUpload = (file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ scale: isDragging ? 1.02 : 1 }}
        className={`
          relative rounded-xl border-2 border-dashed p-6 text-center
          transition-colors cursor-pointer
          ${
            isDragging
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 bg-muted/20 hover:bg-muted/40"
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <motion.div animate={{ y: isDragging ? -4 : 0 }} className="flex flex-col items-center gap-2">
          <motion.div animate={{ scale: isDragging ? 1.2 : 1 }}>
            <Upload className="w-6 h-6 text-muted-foreground" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-foreground">Drag files here or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {(maxSize / 1024 / 1024).toFixed(0)}MB • PDF, DOCX, CSV, images, etc.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.map((upload) => (
          <motion.div
            key={upload.file.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
          >
            <div className="mt-0.5">
              {upload.status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {upload.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {upload.status !== "success" && upload.status !== "error" && (
                <File className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{upload.file.name}</p>
              {upload.error ? (
                <p className="text-xs text-red-500">{upload.error}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {(upload.file.size / 1024).toFixed(0)}KB
                  </p>
                  {upload.status === "uploading" && (
                    <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-accent"
                        animate={{ width: `${upload.progress}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {upload.status !== "uploading" && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => removeUpload(upload.file)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
