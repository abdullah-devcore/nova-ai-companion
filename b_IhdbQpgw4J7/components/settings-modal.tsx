"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileSliders as Sliders, Bell, Shield, Palette, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveUserMemory } from "@/lib/actions/chat";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const settingsSections = [
  {
    id: "general",
    icon: Sliders,
    label: "General",
    settings: [
      { id: "sound", label: "Sound Effects", type: "toggle", defaultValue: false },
      { id: "animations", label: "Animations", type: "toggle", defaultValue: true },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    settings: [
      { id: "push", label: "Push Notifications", type: "toggle", defaultValue: false },
      { id: "streaming", label: "Streaming Responses", type: "toggle", defaultValue: true },
    ],
  },
  {
    id: "privacy",
    icon: Shield,
    label: "Privacy",
    settings: [
      { id: "history", label: "Save Chat History", type: "toggle", defaultValue: true },
      { id: "analytics", label: "Usage Analytics", type: "toggle", defaultValue: false },
    ],
  },
  {
    id: "appearance",
    icon: Palette,
    label: "Appearance",
    settings: [
      { id: "compact", label: "Compact Mode", type: "toggle", defaultValue: false },
      { id: "blur", label: "Blur Effects", type: "toggle", defaultValue: true },
    ],
  },
];

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, boolean>>({
    sound: false,
    animations: true,
    push: false,
    streaming: true,
    history: true,
    analytics: false,
    compact: false,
    blur: true,
  });
  const [memoryInput, setMemoryInput] = useState("");
  const [memorySaved, setMemorySaved] = useState(false);

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveMemory = async () => {
    if (!memoryInput.trim()) return;
    const success = await saveUserMemory(memoryInput.trim(), "preference", 7);
    if (success) {
      setMemoryInput("");
      setMemorySaved(true);
      setTimeout(() => setMemorySaved(false), 2500);
    }
  };

  const currentSection = settingsSections.find((s) => s.id === activeSection);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[620px] md:max-h-[85vh] z-50"
          >
            <div className="h-full glass-strong rounded-2xl overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar navigation */}
              <div className="md:w-52 border-b md:border-b-0 md:border-r border-border p-4 flex flex-col">
                <div className="flex items-center justify-between md:mb-6">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User profile display */}
                <div className="hidden md:flex items-center gap-3 p-3 mb-4 rounded-xl bg-secondary/40">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {settingsSections.map((section) => (
                    <motion.button
                      key={section.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors
                        ${activeSection === section.id
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }
                      `}
                    >
                      <section.icon className="w-4 h-4 shrink-0" />
                      {section.label}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection("memory")}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors
                      ${activeSection === "memory"
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    <Brain className="w-4 h-4 shrink-0" />
                    Memory
                  </motion.button>
                </nav>
              </div>

              {/* Settings content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="hidden md:flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {activeSection === "memory" ? (
                      <Brain className="w-5 h-5 text-primary" />
                    ) : currentSection ? (
                      <currentSection.icon className="w-5 h-5 text-primary" />
                    ) : null}
                    <h3 className="text-lg font-medium">
                      {activeSection === "memory" ? "Nova's Memory" : currentSection?.label}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {activeSection === "memory" ? (
                    <motion.div
                      key="memory"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        Teach Nova things to remember about you. This helps personalize your conversations.
                      </p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add a memory</label>
                        <textarea
                          value={memoryInput}
                          onChange={(e) => setMemoryInput(e.target.value)}
                          placeholder="E.g. I prefer concise explanations. I work in backend development. I enjoy dark humor."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm resize-none placeholder:text-muted-foreground/60"
                        />
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSaveMemory}
                          disabled={!memoryInput.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
                          style={{ background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.6 0.22 200))" }}
                        >
                          <Sparkles className="w-4 h-4" />
                          {memorySaved ? "Saved!" : "Save memory"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {currentSection?.settings.map((setting) => (
                        <div
                          key={setting.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                        >
                          <span className="text-sm font-medium">{setting.label}</span>
                          {setting.type === "toggle" && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleSetting(setting.id)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${settings[setting.id] ? "bg-primary" : "bg-muted"}`}
                            >
                              <motion.div
                                animate={{ x: settings[setting.id] ? 24 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                              />
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
