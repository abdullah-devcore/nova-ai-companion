"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, FileText, Table2, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileInfo {
  id: string;
  name: string;
  type: "pdf" | "document" | "image" | "spreadsheet" | "csv" | "text";
  size: number;
  preview: string;
  metadata?: Record<string, any>;
  isProcessing?: boolean;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
}

interface FileManagerProps {
  files: FileInfo[];
  onRemove?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  showDetails?: boolean;
}

function getFileIcon(type: FileInfo["type"]) {
  const iconMap = {
    pdf: FileText,
    document: FileText,
    image: File,
    spreadsheet: Table2,
    csv: Table2,
    text: FileText,
  };
  return iconMap[type] || File;
}

function getFileBgColor(type: FileInfo["type"]) {
  const colorMap = {
    pdf: "bg-red-500/20",
    document: "bg-blue-500/20",
    image: "bg-purple-500/20",
    spreadsheet: "bg-green-500/20",
    csv: "bg-green-500/20",
    text: "bg-yellow-500/20",
  };
  return colorMap[type] || "bg-gray-500/20";
}

export function FileManager({ files, onRemove, onDownload, showDetails = true }: FileManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }, []);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Attached Files</h3>
      <div className="space-y-2">
        <AnimatePresence>
          {files.map((file) => {
            const IconComponent = getFileIcon(file.type);
            const isExpanded = expandedId === file.id;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group"
              >
                <div
                  onClick={() => showDetails && setExpandedId(isExpanded ? null : file.id)}
                  className={`p-3 rounded-lg border border-border/50 cursor-pointer transition-all ${
                    isExpanded ? "bg-secondary/50" : "bg-secondary/20 hover:bg-secondary/30"
                  } ${showDetails ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getFileBgColor(file.type)} shrink-0`}>
                      {file.isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type.toUpperCase()} • {formatFileSize(file.size)}
                        {file.metadata?.pages && ` • ${file.metadata.pages} pages`}
                        {file.metadata?.sheets && ` • ${file.metadata.sheets} sheets`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDownload && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file.id);
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(file.id);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview section */}
                  <AnimatePresence>
                    {isExpanded && showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/30"
                      >
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Preview
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                            {file.preview}
                          </p>

                          {/* Tables preview */}
                          {file.tables && file.tables.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {file.tables.slice(0, 2).map((table, idx) => (
                                <div key={idx} className="text-xs overflow-x-auto">
                                  <table className="border-collapse border border-border/30 text-left">
                                    <thead>
                                      <tr className="bg-muted/30">
                                        {table.headers.slice(0, 5).map((header, hidx) => (
                                          <th key={hidx} className="px-2 py-1 border border-border/20">
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {table.rows.slice(0, 2).map((row, ridx) => (
                                        <tr key={ridx}>
                                          {row.slice(0, 5).map((cell, cidx) => (
                                            <td
                                              key={cidx}
                                              className="px-2 py-1 border border-border/20 max-w-xs truncate"
                                            >
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {table.rows.length > 2 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      +{table.rows.length - 2} more rows
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
