"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatShareProps {
  chatId: string;
  onShare?: () => void;
  disabled?: boolean;
}

export function ChatShare({ chatId, onShare, disabled = false }: ChatShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateShare = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chats/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, expiresIn: 7, includeMessages: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate share link");
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      onShare?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [chatId, onShare]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleRevokeShare = useCallback(async () => {
    if (!shareUrl) return;

    try {
      const token = shareUrl.split("/").pop();
      const response = await fetch(`/api/chats/share?token=${token}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShareUrl(null);
      }
    } catch (error) {
      console.error("[ChatShare] Revoke error:", error);
    }
  }, [shareUrl]);

  return (
    <>
      {/* Share button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </motion.div>

      {/* Share panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl p-4 w-80 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Share Conversation
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-destructive/20 text-destructive text-xs rounded">
                {error}
              </div>
            )}

            {!shareUrl ? (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  Create a shareable link to this conversation. The link expires in 7 days.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateShare}
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Generate Share Link"}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="h-8 text-xs"
                    onClick={() => handleCopy()}
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>• Link expires in 7 days</p>
                  <p>• Includes all messages</p>
                  <p>• Anyone with the link can view</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={handleRevokeShare}
                  >
                    Revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
