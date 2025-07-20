// src/services/github-analysis.service.ts
import { cloneRepository, verifyRepository, checkRateLimits } from './github-service';
import { analyzeCode } from './analysis.service';
import type { AnalysisResults } from '@/types/analysis-result';

const TOOL_VERSION = '1.0.0';

export class GithubAnalysisService {
  static async analyzeRepository(
    repoIdentifier: string,
    branch?: string
  ): Promise<AnalysisResults> {
    const startTime = Date.now();
    
    try {
      const { owner, repo } = this.parseInput(repoIdentifier);
      
      // Verify repository before cloning
      const repoInfo = await verifyRepository(owner, repo);
      if (!repoInfo.exists) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (repoInfo.isEmpty) {
        throw new Error('Repository exists but has no content to analyze');
      }

      // Clone repository with branch handling
      const files = await cloneRepository(owner, repo, branch || repoInfo.defaultBranch);
      
      if (files.length === 0) {
        throw new Error('Repository contains no analyzable files (may be filtered)');
      }

      // Calculate total repository size
      const repoSize = files.reduce((sum, file) => sum + file.size, 0);

      // Perform code analysis
      const analysisResults = await analyzeCode(files);
      const analysisDuration = Date.now() - startTime;

      return {
        ...analysisResults,
        metadata: {
          source: 'github',
          owner,
          repo,
          branch: branch || repoInfo.defaultBranch,
          fileCount: files.length,
          analyzedAt: new Date().toISOString(),
          toolVersion: TOOL_VERSION,
          analysisDuration,
          repoSize,
          defaultBranch: repoInfo.defaultBranch
        }
      };
    } catch (error) {
      console.error('Repository analysis failed:', error);
      throw this.normalizeAnalysisError(error);
    }
  }

  private static parseInput(input: string): { owner: string; repo: string } {
    const cleanedInput = input.trim();
    
    // Handle various GitHub URL formats
    const urlPatterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(\.git)?\/?/i,
      /^git@github\.com:([^\/]+)\/([^\/]+)(\.git)?$/i,
      /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?\/?$/i
    ];

    for (const pattern of urlPatterns) {
      const match = cleanedInput.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }
    
    // Handle owner/repo format
    const [owner, repo] = cleanedInput.split('/');
    if (owner && repo) {
      return { owner, repo: repo.replace(/\.git$/, '') };
    }
    
    throw new Error(
      'Invalid repository identifier. Use: owner/repo or GitHub URL (https or git format)'
    );
  }

  private static normalizeAnalysisError(error: unknown): Error {
    if (error instanceof Error) {
      // Enhance specific error messages
      if (error.message.includes('branch') && error.message.includes('not found')) {
        return new Error(
          'Branch not found. Please check the branch name exists in the repository.'
        );
      }
      if (error.message.includes('Repository not found')) {
        return new Error(
          'Repository not found. Check the name exists and you have proper access.'
        );
      }
      if (error.message.includes('rate limit')) {
        return new Error(
          'GitHub API rate limit exceeded. Please try again later or provide a GitHub token.'
        );
      }
      return error;
    }
    return new Error('An unknown error occurred during analysis');
  }

  static async checkPrerequisites() {
    try {
      const rateLimits = await checkRateLimits();
      return {
        rateLimits,
        hasToken: typeof localStorage !== 'undefined' 
          ? !!localStorage.getItem('githubToken') 
          : !!process.env.GITHUB_TOKEN,
        canAnalyze: rateLimits.remaining > 10
      };
    } catch (error) {
      console.error('Prerequisite check failed:', error);
      return {
        canAnalyze: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}