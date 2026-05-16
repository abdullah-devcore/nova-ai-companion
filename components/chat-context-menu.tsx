"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Copy, Archive, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContextMenuProps {
  x: number;
  y: number;
  chatId: string;
  chatTitle: string;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ChatContextMenu({
  x,
  y,
  chatId,
  chatTitle,
  onRename,
  onDelete,
  onClose,
}: ContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chatTitle);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (newTitle.trim() && newTitle !== chatTitle) {
      onRename(chatId, newTitle.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const menuItems = [
    {
      icon: Edit2,
      label: "Rename",
      action: () => setIsRenaming(true),
    },
    {
      icon: Copy,
      label: "Duplicate",
      action: () => {
        // TODO: Implement duplicate
        onClose();
      },
    },
    {
      icon: Archive,
      label: "Archive",
      action: () => {
        // TODO: Implement archive
        onClose();
      },
    },
    {
      icon: Share2,
      label: "Share",
      action: () => {
        // TODO: Implement share
        onClose();
      },
    },
    {
      icon: Trash2,
      label: "Delete",
      action: () => {
        if (confirm(`Delete "${chatTitle}"?`)) {
          onDelete(chatId);
        }
        onClose();
      },
      danger: true,
    },
  ];

  if (isRenaming) {
    return (
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ top: `${y}px`, left: `${x}px` }}
        className="fixed z-50 w-64 bg-card border border-border rounded-lg shadow-lg p-3"
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Rename conversation</label>
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") {
                setIsRenaming(false);
                onClose();
              }
            }}
            className="w-full px-2 py-2 text-sm bg-muted border border-border rounded font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="New name..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={handleRenameSubmit}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => {
                setIsRenaming(false);
                onClose();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            onClick={item.action}
            whileHover={{ backgroundColor: "rgba(100, 116, 139, 0.1)" }}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
              transition-colors hover:bg-muted
              ${item.danger ? "text-destructive hover:bg-destructive/10" : "text-foreground"}
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
