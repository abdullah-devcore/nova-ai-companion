"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Sparkles, Paperclip, X, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface AttachedFile {
  file: File;
  preview?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Message Nova..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragover, setIsDragover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);
  
  const handleSubmit = () => {
    if ((message.trim() || attachedFiles.length > 0) && !disabled) {
      onSend(message.trim(), attachedFiles.map(af => af.file));
      setMessage("");
      setAttachedFiles([]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const toggleVoice = () => {
    setIsListening(!isListening);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        console.warn(`File ${file.name} exceeds 10MB limit`);
        continue;
      }

      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        try {
          preview = URL.createObjectURL(file);
        } catch (e) {
          console.error("Failed to create preview", e);
        }
      }
      
      newFiles.push({ file, preview });
    }
    
    setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragover(true);
  };

  const handleDragLeave = () => {
    setIsDragover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragover(false);
    handleFileSelect(e.dataTransfer.files);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Gradient border effect */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.2 250 / 0.5), oklch(0.6 0.22 200 / 0.5), oklch(0.55 0.18 180 / 0.5))",
            }}
          />
        )}
      </AnimatePresence>

      {/* Attached files preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-t-2xl p-3 bg-secondary/30 border-b border-border flex flex-wrap gap-2"
          >
            {attachedFiles.map((attached, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group"
              >
                {attached.preview ? (
                  <img
                    src={attached.preview}
                    alt={attached.file.name}
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                    <File className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive/80 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl bg-primary/10 border-2 border-dashed border-primary pointer-events-none flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <Paperclip className="w-6 h-6" />
              <p className="text-sm font-medium">Drop files here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative glass-strong rounded-2xl overflow-hidden transition-colors ${isDragover ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-end gap-2 p-3">
          {/* Sparkle icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 mb-1"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              flex-1 bg-transparent border-none outline-none resize-none
              text-foreground placeholder:text-muted-foreground
              text-sm leading-relaxed min-h-[24px] max-h-[150px]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
          
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* File upload button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </motion.div>
          
          {/* Voice button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              className={`
                shrink-0 rounded-xl h-9 w-9 transition-colors
                ${isListening 
                  ? "bg-destructive/20 text-destructive hover:bg-destructive/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="mic-off"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <MicOff className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
          
          {/* Send button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            animate={{ opacity: (message.trim() || attachedFiles.length > 0) ? 1 : 0.5 }}
          >
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!(message.trim() || attachedFiles.length > 0) || disabled}
              className="
                shrink-0 rounded-xl h-9 w-9 p-0
                bg-primary hover:bg-primary/90
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
