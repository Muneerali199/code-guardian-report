// src/components/github/GithubSettings.tsx
"use client";

import { useState } from "react";
import { 
  setGithubToken,
  getGithubToken,
  checkRateLimits 
} from "@/lib/github-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export function GithubSettings() {
  const [token, setToken] = useState(getGithubToken() || "");
  const [saved, setSaved] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    limit: number;
    remaining: number;
    reset: number;
  } | null>(null);
  
  const handleSave = () => {
    setGithubToken(token);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  const handleCheckLimits = async () => {
    try {
      const limits = await checkRateLimits();
      setRateLimit(limits);
      toast.success("Rate limits checked successfully");
    } catch (error) {
      console.error("Failed to check rate limits:", error);
      setRateLimit(null);
      toast.error(
        error instanceof Error ? error.message : "Failed to check rate limits"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          GitHub Integration
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Add a GitHub token to analyze private repositories and increase rate limits.
                Token is stored in your browser's local storage.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="GitHub personal access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={!token.trim()}>
              {saved ? "✓ Saved" : "Save Token"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create tokens at{" "}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub Settings
            </a>
            . Required scope: <code>repo</code> for private repositories.
          </p>
        </div>
        
        <div className="border-t pt-4">
          <Button variant="outline" onClick={handleCheckLimits}>
            Check Rate Limits
          </Button>
          
          {rateLimit && (
            <div className="mt-2 space-y-1 text-sm">
              <p>
                Limit: <span className="font-medium">{rateLimit.limit}</span> requests/hour
              </p>
              <p>
                Remaining:{" "}
                <span
                  className={`font-medium ${
                    rateLimit.remaining < 10 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {rateLimit.remaining}
                </span>
              </p>
              <p>
                Resets at:{" "}
                <span className="font-medium">
                  {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}