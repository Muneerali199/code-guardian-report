"use client";

import { File, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { RepoFile } from "@/lib/github-utils";

interface FileTreeProps {
  files: RepoFile[];
  onFileSelect?: (file: RepoFile) => void;
  className?: string;
}

export function GithubFileTree({ files, onFileSelect, className }: FileTreeProps) {
  const tree = buildFileTree(files);
  return (
    <div className={`font-mono text-sm overflow-y-auto ${className}`}>
      {Object.entries(tree).map(([name, entry]) => (
        <TreeNode
          key={name}
          name={name}
          entry={entry}
          level={0}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}

function TreeNode({
  name,
  entry,
  level,
  onFileSelect,
}: {
  name: string;
  entry: any;
  level: number;
  onFileSelect?: (file: RepoFile) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first two levels
  
  if (entry.type === "file") {
    return (
      <div
        className={`flex items-center py-1 px-2 hover:bg-accent cursor-pointer ${
          level > 0 ? `ml-${level * 4}` : ""
        }`}
        onClick={() => onFileSelect?.(entry.data)}
      >
        <File className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
        <span className="truncate">{name}</span>
        <span className="ml-auto text-xs text-muted-foreground pl-2">
          {Math.ceil(entry.data.size / 1024)} KB
        </span>
      </div>
    );
  }
  
  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-accent cursor-pointer ${
          level > 0 ? `ml-${level * 4}` : ""
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground" />
        )}
        <Folder className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
        <span>{name}</span>
      </div>
      {expanded && (
        <div>
          {Object.entries(entry.children).map(([childName, childEntry]) => (
            <TreeNode
              key={childName}
              name={childName}
              entry={childEntry}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildFileTree(files: RepoFile[]) {
  const tree: any = {};
  
  files.forEach((file) => {
    let currentLevel = tree;
    const parts = file.path.split('/');
    
    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        currentLevel[part] =
          index === parts.length - 1
            ? { type: 'file', data: file }
            : { type: 'dir', children: {} };
      }
      currentLevel = currentLevel[part].children || {};
    });
  });
  
  return tree;
}