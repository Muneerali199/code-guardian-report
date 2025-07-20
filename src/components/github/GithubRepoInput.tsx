// src/components/github/GithubRepoInput.tsx
"use client";

import { useState } from "react";
import { GithubAnalysisService } from "@/services/github-analysis.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { useAnalysis } from "@/components/context/AnalysisContext";
import { toast } from "sonner";
import { storeGitHubToken } from "@/services/github-service";

export function GithubRepoInput({ 
  onAnalysisComplete 
}: { 
  onAnalysisComplete?: (results: any) => void 
}) {
  const [input, setInput] = useState("");
  const [branch, setBranch] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { setResults } = useAnalysis();

  const analyzeRepo = async () => {
    if (!input.trim()) {
      toast.warning("Please enter a repository URL or owner/repo");
      return;
    }

    setIsLoading(true);
    
    try {
      // Store token if provided
      if (token) {
        storeGitHubToken(token);
        toast.info("Using provided GitHub token");
      }

      // Check prerequisites first
      toast.info("Checking repository access...");
      const prereqs = await GithubAnalysisService.checkPrerequisites();
      
      if (!prereqs.canAnalyze) {
        throw new Error(
          prereqs.error || 
          `API rate limit exceeded (${prereqs.rateLimits?.remaining || 0} remaining)`
        );
      }

      toast.info("Starting repository analysis...");
      const results = await GithubAnalysisService.analyzeRepository(input, branch || undefined);
      
      setResults(results);
      onAnalysisComplete?.(results);
      
      toast.success(`Analysis complete`, {
        description: `Analyzed ${results.metadata.fileCount} files${
          results.metadata.repoSize ? ` (${formatBytes(results.metadata.repoSize)})` : ''
        }`,
        action: {
          label: "Details",
          onClick: () => showAnalysisDetails(results)
        }
      });

    } catch (error) {
      console.error("Analysis error:", error);
      showErrorMessage(error);
    } finally {
      setIsLoading(false);
    }
  };

  const showAnalysisDetails = (results: any) => {
    toast.info("Analysis Details", {
      description: (
        <div className="grid gap-1 text-sm">
          <div>Repository: {results.metadata.owner}/{results.metadata.repo}</div>
          <div>Branch: {results.metadata.branch}</div>
          <div>Files: {results.metadata.fileCount}</div>
          {results.metadata.repoSize && <div>Size: {formatBytes(results.metadata.repoSize)}</div>}
          <div>Duration: {(results.metadata.analysisDuration / 1000).toFixed(1)}s</div>
        </div>
      ),
      duration: 10000
    });
  };

  const showErrorMessage = (error: unknown) => {
    let message = "Analysis failed. Please try again.";
    let action;
    
    if (error instanceof Error) {
      if (error.message.includes('branch')) {
        message = "Branch not found. Please verify the branch exists.";
      } else if (error.message.includes('Not Found')) {
        message = "Repository not found. Check the name and permissions.";
      } else if (error.message.includes('rate limit')) {
        message = "API rate limit exceeded. Try again later or add a GitHub token.";
        action = {
          label: "Add Token",
          onClick: () => setShowAdvanced(true)
        };
      } else if (error.message.includes('timed out')) {
        message = "Operation timed out. Try a smaller repository or better network.";
      } else if (error.message.includes('no content')) {
        message = "Repository exists but contains no files to analyze.";
      } else {
        message = error.message;
      }
    }

    toast.error("Analysis failed", {
      description: message,
      action,
      duration: 10000
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="flex items-center gap-2">
        <Input
          placeholder="owner/repo or https://github.com/owner/repo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyzeRepo()}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={analyzeRepo}
          disabled={isLoading || !input.trim()}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Github className="w-4 h-4 mr-2" />
          )}
          Analyze
        </Button>
      </div>

      <div className="space-y-3">
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-sm text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
        </Button>

        {showAdvanced && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch (optional)</label>
              <Input
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use default branch
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Token (optional)</label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Required for private repos or higher rate limits
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Enter a GitHub repository in format: owner/repo or full URL
      </p>
    </div>
  );
}