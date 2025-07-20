// pages/api/clone-repo.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const rmAsync = promisify(fs.rm);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { owner, repo, branch = 'main' } = req.body;

  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo' });
  }

  try {
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    const tempDir = path.join(process.cwd(), 'temp', `${owner}-${repo}-${Date.now()}`);
    const cloneCommand = `git clone --depth 1 --branch ${branch} ${repoUrl} ${tempDir}`;

    // Clone the repository
    await execAsync(cloneCommand);

    // Read all files recursively
    const files = await readFilesRecursively(tempDir);

    // Clean up
    await rmAsync(tempDir, { recursive: true, force: true });

    return res.status(200).json({ files });
  } catch (error) {
    console.error('Error cloning repository:', error);
    return res.status(500).json({ 
      error: 'Failed to clone repository',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function readFilesRecursively(dir: string): Promise<any[]> {
  const files = [];
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...await readFilesRecursively(fullPath));
    } else if (!shouldSkipFile(fullPath)) {
      try {
        const content = await readFileAsync(fullPath, 'utf-8');
        files.push({
          path: path.relative(dir, fullPath),
          content,
          size: Buffer.byteLength(content)
        });
      } catch (error) {
        console.warn(`Skipping file ${fullPath}:`, error);
      }
    }
  }

  return files;
}

function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    /\/\.git\//,
    /\/node_modules\//,
    /\.(png|jpg|jpeg|gif|bmp|ico|svg|woff|woff2|ttf|eot|pdf|zip|tar|gz)$/i,
    /(package-lock\.json|yarn\.lock)$/,
  ];
  
  return skipPatterns.some(pattern => pattern.test(filePath));
}