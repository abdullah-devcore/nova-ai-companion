"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Settings, Trash2, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIOrb } from "./ai-orb";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  user: User;
}

export function ChatSidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  user,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="
          fixed left-0 top-0 z-50 md:hidden
          h-full w-72 bg-sidebar border-r border-sidebar-border
          flex flex-col
        "
      >
        <SidebarContent
          chats={chats}
          activeChat={activeChat}
          onSelectChat={(id) => {
            onSelectChat(id);
            onClose();
          }}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
          onOpenSettings={onOpenSettings}
          onClose={onClose}
          showCloseButton
          user={user}
        />
      </motion.aside>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 288,
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="
          hidden md:flex relative z-10
          h-full bg-sidebar border-r border-sidebar-border
          flex-col overflow-hidden
        "
      >
        <SidebarContent
          chats={chats}
          activeChat={activeChat}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
          onOpenSettings={onOpenSettings}
          onClose={onToggleCollapse}
          showCloseButton={false}
          user={user}
        />
      </motion.aside>
    </>
  );
}

interface SidebarContentProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
  showCloseButton: boolean;
  user: User;
}

function SidebarContent({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  onClose,
  showCloseButton,
  user,
}: SidebarContentProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    console.log("[Sidebar] Signing out...");
    await supabase.auth.signOut();
    console.log("[Sidebar] Signed out, redirecting to /auth/login");
    window.location.replace("/auth/login");
  };
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AIOrb size="sm" />
            <span className="font-semibold text-sidebar-foreground">Nova AI</span>
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="
            w-full flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-sidebar-primary text-sidebar-primary-foreground
            hover:opacity-90 transition-opacity
          "
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New chat</span>
        </motion.button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs font-medium text-muted-foreground px-3 py-2">Recent</p>
        <AnimatePresence mode="popLayout">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  w-full text-left p-3 rounded-xl mb-1 transition-colors
                  ${activeChat === chat.id 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.preview}
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Delete button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  opacity-0 group-hover:opacity-100 transition-opacity
                  p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground
                  hover:text-destructive
                "
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>

        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenSettings}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
            text-sidebar-foreground hover:bg-sidebar-accent transition-colors
          "
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
            text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors
          "
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign out</span>
        </motion.button>
      </div>
    </>
  );
}
