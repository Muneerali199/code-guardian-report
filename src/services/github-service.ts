// src/services/github-service.ts
import { Octokit } from '@octokit/rest';

// Initialize Octokit with environment-aware token handling
const octokit = new Octokit({
  auth: typeof localStorage !== 'undefined' 
    ? localStorage.getItem('githubToken') || undefined
    : process.env.GITHUB_TOKEN,
  request: {
    timeout: 30000
  },
  userAgent: 'CodeGuardian/v1.0'
});

export interface RepoFile {
  path: string;
  content: string;
  size: number;
  sha: string;
  encoding?: string;
  url?: string;
}

type GitHubContentItem = {
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  size: number;
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
  _links: {
    git: string | null;
    html: string | null;
    self: string;
  };
};

export async function cloneRepository(
  owner: string,
  repo: string,
  branch?: string
): Promise<RepoFile[]> {
  try {
    // Step 1: Verify repository exists and get default branch if needed
    const { defaultBranch, isEmpty } = await verifyRepository(owner, repo);
    const targetBranch = branch || defaultBranch;

    if (isEmpty) {
      throw new Error('Repository exists but has no content');
    }

    // Step 2: Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      ref: targetBranch,
      path: '',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!Array.isArray(contents)) {
      return [await processSingleFile(contents, owner, repo, targetBranch)];
    }

    // Step 3: Process all contents
    const files: RepoFile[] = [];
    await processContents(contents, owner, repo, targetBranch, files);
    return files;
  } catch (error) {
    console.error(`Failed to clone ${owner}/${repo}:`, error);
    throw normalizeError(error);
  }
}

async function processContents(
  contents: GitHubContentItem[],
  owner: string,
  repo: string,
  branch: string,
  files: RepoFile[],
  currentPath: string = ''
): Promise<void> {
  await Promise.all(contents.map(async (item) => {
    const fullPath = currentPath ? `${currentPath}/${item.path}` : item.path;

    if (item.type === 'file' && !shouldSkipFile(fullPath)) {
      try {
        const file = await getFileContent(owner, repo, branch, fullPath);
        files.push({
          path: fullPath,
          content: file.content,
          size: item.size,
          sha: item.sha,
          encoding: file.encoding,
          url: item.html_url || undefined
        });
      } catch (error) {
        console.warn(`Skipping file ${fullPath}:`, error);
      }
    } else if (item.type === 'dir') {
      try {
        const { data: dirContents } = await octokit.repos.getContent({
          owner,
          repo,
          path: fullPath,
          ref: branch
        });
        if (Array.isArray(dirContents)) {
          await processContents(dirContents, owner, repo, branch, files, fullPath);
        }
      } catch (error) {
        console.warn(`Skipping directory ${fullPath}:`, error);
      }
    }
  }));
}

async function processSingleFile(
  fileData: any,
  owner: string,
  repo: string,
  branch: string
): Promise<RepoFile> {
  const content = await getFileContent(owner, repo, branch, fileData.path);
  return {
    path: fileData.path,
    content: content.content,
    size: fileData.size,
    sha: fileData.sha,
    encoding: content.encoding,
    url: fileData.html_url || undefined
  };
}

async function getFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<{ content: string; encoding: string }> {
  try {
    // Try to get raw content first
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
      mediaType: {
        format: 'raw'
      }
    });

    if (typeof response.data === 'string') {
      return {
        content: response.data,
        encoding: 'utf-8'
      };
    }

    // Fallback to base64 encoded content
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    if (typeof data === 'object' && 'content' in data) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        encoding: data.encoding || 'base64'
      };
    }

    throw new Error('Unsupported file content format');
  } catch (error) {
    console.error(`Failed to get content for ${path}:`, error);
    throw error;
  }
}

export async function verifyRepository(
  owner: string,
  repo: string
): Promise<{
  exists: boolean;
  defaultBranch: string;
  isEmpty: boolean;
  message?: string;
}> {
  try {
    // Get repository metadata
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    
    // Check if default branch exists
    try {
      await octokit.repos.getBranch({
        owner,
        repo,
        branch: repoData.default_branch
      });
      return {
        exists: true,
        defaultBranch: repoData.default_branch,
        isEmpty: repoData.size === 0
      };
    } catch (branchError) {
      return {
        exists: true,
        defaultBranch: repoData.default_branch,
        isEmpty: true,
        message: 'Repository exists but default branch has no commits'
      };
    }
  } catch (error) {
    return {
      exists: false,
      defaultBranch: 'main',
      isEmpty: true,
      message: error instanceof Error ? error.message : 'Repository not found'
    };
  }
}

function shouldSkipFile(path: string): boolean {
  const skipPatterns = [
    /\.(png|jpg|jpeg|gif|svg|ico|webp|bmp|woff2?|eot|ttf|otf|pdf|zip|tar|gz|rar|7z)$/i,
    /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i,
    /\.env(\.\w+)?$/i,
    /^(node_modules|dist|build|out|coverage|\.cache|\.next|\.vercel|\.git)/,
    /\.(exe|dll|so|a|lib|obj|bin|class|jar|war|dat|db|sqlite)$/i,
    /(thumbs\.db|desktop\.ini|\.DS_Store)$/i
  ];
  return skipPatterns.some(pattern => pattern.test(path));
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    // Handle GitHub API errors
    if ('status' in error && error.status === 404) {
      return new Error('Repository not found or access denied');
    }
    return error;
  }
  return new Error('An unknown error occurred');
}

// Utility function to store token
export function storeGitHubToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('githubToken', token);
  } else if (typeof process !== 'undefined') {
    process.env.GITHUB_TOKEN = token;
  }
}

// Rate limit checker
export async function checkRateLimits() {
  try {
    const { data } = await octokit.rateLimit.get();
    return {
      limit: data.resources.core.limit,
      remaining: data.resources.core.remaining,
      reset: new Date(data.resources.core.reset * 1000),
      used: data.resources.core.used
    };
  } catch (error) {
    console.error('Failed to check rate limits:', error);
    return {
      limit: 0,
      remaining: 0,
      reset: new Date(),
      used: 0
    };
  }
}