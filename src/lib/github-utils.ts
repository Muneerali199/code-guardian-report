// src/lib/github-utils.ts
import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173';

// Token management
let githubToken: string | null = null;

export function setGithubToken(token: string): void {
  githubToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('githubToken', token);
  }
}

export function getGithubToken(): string | null {
  return githubToken || (typeof window !== 'undefined' ? localStorage.getItem('githubToken') : null);
}

export function clearGithubToken(): void {
  githubToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('githubToken');
  }
}

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimits(): Promise<RateLimit> {
  try {
    const token = getGithubToken();
    const headers = {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await axios.get(`${GITHUB_API_URL}/rate_limit`, {
      headers,
      timeout: 5000
    });

    if (response.data?.resources?.core) {
      return {
        limit: response.data.resources.core.limit,
        remaining: response.data.resources.core.remaining,
        reset: response.data.resources.core.reset
      };
    }

    throw new Error('Invalid rate limit response from GitHub');
  } catch (error) {
    console.error('Failed to check rate limits:', error);
    throw new Error(
      axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to check rate limits'
    );
  }
}

export async function cloneRepository(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<RepoFile[]> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/clone-repo`, {
      owner,
      repo,
      branch
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {})
      },
      timeout: 30000
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Clone failed');
    }

    return response.data.files.map((file: any) => ({
      path: file.path,
      content: file.content || '',
      size: file.size || 0
    }));

  } catch (error) {
    let errorMessage = 'Failed to clone repository';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        errorMessage = 'Repository not found. Check the name and permissions.';
      } else if (error.response?.status === 403) {
        errorMessage = 'API rate limit exceeded. Please add a GitHub token.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
    }

    console.error('Clone repository error:', error);
    throw new Error(errorMessage);
  }
}