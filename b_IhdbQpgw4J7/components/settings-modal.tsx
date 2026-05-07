"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Bell, Shield, Palette, Volume2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const settingsSections = [
  {
    id: "general",
    icon: Sliders,
    label: "General",
    settings: [
      { id: "theme", label: "Dark Mode", type: "toggle", defaultValue: true },
      { id: "language", label: "Language", type: "select", defaultValue: "English" },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    settings: [
      { id: "push", label: "Push Notifications", type: "toggle", defaultValue: true },
      { id: "sound", label: "Sound Effects", type: "toggle", defaultValue: true },
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
      { id: "animations", label: "Animations", type: "toggle", defaultValue: true },
    ],
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, boolean>>({
    theme: true,
    push: true,
    sound: true,
    history: true,
    analytics: false,
    compact: false,
    animations: true,
  });

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentSection = settingsSections.find((s) => s.id === activeSection);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] z-50"
          >
            <div className="h-full glass-strong rounded-2xl overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar navigation */}
              <div className="md:w-48 border-b md:border-b-0 md:border-r border-border p-4">
                <div className="flex items-center justify-between md:mb-6">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {settingsSections.map((section) => (
                    <motion.button
                      key={section.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap
                        text-sm transition-colors
                        ${activeSection === section.id 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }
                      `}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.label}
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* Settings content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="hidden md:flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {currentSection && <currentSection.icon className="w-5 h-5 text-primary" />}
                    <h3 className="text-lg font-medium">{currentSection?.label}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <AnimatePresence mode="wait">
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
                            className={`
                              relative w-12 h-6 rounded-full transition-colors
                              ${settings[setting.id] ? "bg-primary" : "bg-muted"}
                            `}
                          >
                            <motion.div
                              animate={{
                                x: settings[setting.id] ? 24 : 2,
                              }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-4 h-4 rounded-full bg-white"
                            />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
