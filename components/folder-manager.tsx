"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, ChevronRight, Plus, Trash2, Edit2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatFolder {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_pinned: boolean;
  order_index: number;
  child_count?: number;
}

interface FolderManagerProps {
  folders: ChatFolder[];
  onCreateFolder?: (name: string, color?: string) => Promise<void>;
  onRenameFolder?: (id: string, name: string) => Promise<void>;
  onDeleteFolder?: (id: string) => Promise<void>;
  onSelectFolder?: (id: string) => void;
  selectedFolderId?: string;
  isLoading?: boolean;
}

export function FolderManager({
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSelectFolder,
  selectedFolderId,
  isLoading = false,
}: FolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleCreateFolder = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newFolderName.trim() || !onCreateFolder) return;

      try {
        await onCreateFolder(newFolderName);
        setNewFolderName("");
        setIsCreating(false);
      } catch (error) {
        console.error("[FolderManager] Create error:", error);
      }
    },
    [newFolderName, onCreateFolder]
  );

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const pinnedFolders = folders.filter((f) => f.is_pinned);
  const unpinnedFolders = folders.filter((f) => !f.is_pinned);

  return (
    <div className="space-y-2">
      {/* Create folder button */}
      <AnimatePresence>
        {!isCreating && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </motion.button>
        )}

        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateFolder}
            className="flex gap-2 p-2 bg-secondary/20 rounded-lg"
          >
            <Input
              autoFocus
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="h-8 text-sm"
              onBlur={() => !newFolderName.trim() && setIsCreating(false)}
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="h-8"
            >
              Create
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Pinned folders */}
      {pinnedFolders.length > 0 && (
        <div className="space-y-1">
          {pinnedFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderId === folder.id}
              isExpanded={expandedFolders.has(folder.id)}
              onToggleExpanded={() => toggleExpanded(folder.id)}
              onSelect={() => onSelectFolder?.(folder.id)}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
            />
          ))}
        </div>
      )}

      {/* Unpinned folders */}
      {unpinnedFolders.length > 0 && (
        <div className="space-y-1">
          {unpinnedFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderId === folder.id}
              isExpanded={expandedFolders.has(folder.id)}
              onToggleExpanded={() => toggleExpanded(folder.id)}
              onSelect={() => onSelectFolder?.(folder.id)}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
            />
          ))}
        </div>
      )}

      {folders.length === 0 && !isCreating && (
        <p className="text-xs text-muted-foreground text-center py-3">No folders yet</p>
      )}
    </div>
  );
}

function FolderItem({
  folder,
  isSelected,
  isExpanded,
  onToggleExpanded,
  onSelect,
  onRename,
  onDelete,
}: {
  folder: ChatFolder;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelect: () => void;
  onRename?: (id: string, name: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleSaveRename = async () => {
    if (!editName.trim() || !onRename) return;
    try {
      await onRename(folder.id, editName);
      setIsEditing(false);
    } catch (error) {
      console.error("[FolderItem] Rename error:", error);
      setEditName(folder.name);
    }
  };

  return (
    <div>
      <motion.button
        onClick={onSelect}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group ${
          isSelected ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}
      >
        {(folder.child_count ?? 0) > 0 && (
          <ChevronRight
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded();
            }}
          />
        )}
        <Folder className="w-4 h-4" style={{ color: folder.color }} />

        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") {
                setEditName(folder.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 bg-transparent outline-none text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-left truncate">{folder.name}</span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete folder?")) {
                  onDelete(folder.id);
                }
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </motion.button>
    </div>
  );
}
