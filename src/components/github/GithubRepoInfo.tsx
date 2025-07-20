// src/components/github/GithubRepoInfo.tsx
import { Github } from "lucide-react";
import type { AnalysisResults } from "@/types/analysis-result";
import { analysisStorage } from "@/services/analysisStorage";

interface GithubRepoInfoProps {
  metadata: AnalysisResults["metadata"];
}

export function GithubRepoInfo({ metadata }: GithubRepoInfoProps) {
  if (!metadata || metadata.source !== "github") return null;
  
  const storageStats = analysisStorage.getStorageStats();
  const isPrivate = metadata.private ?? false; // Safe access with nullish coalescing
  
  return (
    <div className="border rounded-lg p-4 bg-muted/50">
      <div className="flex items-center gap-3">
        <Github className="w-6 h-6 text-foreground" />
        <div>
          <h3 className="font-medium">
            <a
              href={`https://github.com/${metadata.owner}/${metadata.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {metadata.owner}/{metadata.repo}
            </a>
            {isPrivate && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-foreground/10 rounded-full">
                Private
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Branch: <span className="font-mono">{metadata.branch}</span> •{" "}
            {metadata.fileCount} files analyzed
            {metadata.repoSize && (
              <span> • {formatBytes(metadata.repoSize)}</span>
            )}
          </p>
          <div className="mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span>Storage:</span>
              <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.min(storageStats.usagePercentage, 100)}%` }}
                />
              </div>
              <span>
                {Math.round(storageStats.usagePercentage)}% used
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}