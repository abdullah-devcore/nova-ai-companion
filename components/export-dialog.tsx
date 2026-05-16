"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileJson, FileText, FileBarChart, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportDialogProps {
  isOpen: boolean;
  chatId: string;
  chatTitle: string;
  onClose: () => void;
}

export function ExportDialog({ isOpen, chatId, chatTitle, onClose }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"json" | "markdown" | "pdf" | null>(null);

  const formats = [
    {
      id: "json",
      label: "JSON",
      description: "Machine-readable format with all metadata",
      icon: FileJson,
    },
    {
      id: "markdown",
      label: "Markdown",
      description: "Formatted text for reading or editing",
      icon: FileText,
    },
    {
      id: "pdf",
      label: "PDF",
      description: "Print-friendly formatted document",
      icon: FileBarChart,
    },
  ];

  const handleExport = async (format: "json" | "markdown" | "pdf") => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/chat/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, chatId }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chatTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${format === "markdown" ? "md" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("[Export Dialog] Error:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold">Export Conversation</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isExporting}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Choose a format to export "{chatTitle}"
            </p>

            <div className="space-y-3 mb-6">
              {formats.map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <motion.button
                    key={fmt.id}
                    onClick={() => handleExport(fmt.id as "json" | "markdown" | "pdf")}
                    disabled={isExporting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      w-full text-left p-4 rounded-lg border border-border/50
                      hover:border-accent/50 hover:bg-muted/50 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{fmt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmt.description}
                        </p>
                      </div>
                      {isExporting && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full"
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
