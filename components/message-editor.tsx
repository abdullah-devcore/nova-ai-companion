"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Edit2, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageEditorProps {
  messageId: string;
  originalContent: string;
  onSave?: (content: string) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export function MessageEditor({
  messageId,
  originalContent,
  onSave,
  onCancel,
  disabled = false,
}: MessageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(originalContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!editedContent.trim() || editedContent === originalContent) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error("[MessageEditor] Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editedContent, originalContent, onSave]);

  const handleCancel = useCallback(() => {
    setEditedContent(originalContent);
    setIsEditing(false);
    onCancel?.();
  }, [originalContent, onCancel]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 p-3 bg-secondary/20 rounded-lg"
      >
        <textarea
          autoFocus
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-24"
          placeholder="Edit message..."
        />
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || editedContent === originalContent}
            className="gap-1"
          >
            <Check className="w-3 h-3" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsEditing(true)}
      disabled={disabled}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      title="Edit message"
    >
      <Edit2 className="w-4 h-4" />
    </motion.button>
  );
}

// Message regeneration button
interface MessageRegeneratorProps {
  messageId: string;
  onRegenerate?: () => Promise<void>;
  disabled?: boolean;
}

export function MessageRegenerator({ messageId, onRegenerate, disabled = false }: MessageRegeneratorProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate?.();
    } catch (error) {
      console.error("[MessageRegenerator] Error:", error);
    } finally {
      setIsRegenerating(false);
    }
  }, [onRegenerate]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleRegenerate}
      disabled={disabled || isRegenerating}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      title="Regenerate response"
    >
      {isRegenerating ? (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <RotateCcw className="w-4 h-4" />
        </motion.div>
      ) : (
        <RotateCcw className="w-4 h-4" />
      )}
    </motion.button>
  );
}
