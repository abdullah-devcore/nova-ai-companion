"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Lock, Calendar } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle?: string;
}

export function ShareDialog({ isOpen, onClose, chatId, chatTitle }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState(7);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          expiresIn,
          password: password || undefined,
        }),
      });

      const data = await response.json();
      if (data.share) {
        setShareUrl(data.share.url);
      }
    } catch (error) {
      console.error("[ShareDialog] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{chatTitle || "Conversation"}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expiry Setting */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Expires in
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Password Protection */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              Password (optional)
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for no password"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Share URL Display or Create Button */}
          {shareUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm text-muted-foreground">Share this link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm font-mono"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setShareUrl("");
                  setPassword("");
                  setShowPassword(false);
                }}
                className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Create New Share
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateShare}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Generate Share Link"}
            </motion.button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
