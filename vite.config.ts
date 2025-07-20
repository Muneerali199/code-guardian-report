import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Git clone function for the server middleware
async function cloneRepo(owner: string, repo: string, branch: string) {
  const tempDir = path.join(process.cwd(), 'temp', `clone-${Date.now()}`);
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Clone repository (shallow clone)
    execSync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${tempDir}`, {
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });

    // Read all files
    const files = await readFilesRecursively(tempDir);
    
    return { 
      success: true, 
      files,
      metadata: {
        owner,
        repo,
        branch,
        clonedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`Git clone failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Helper function to read files recursively
async function readFilesRecursively(dir: string) {
  const files: Array<{
    path: string;
    content: string;
    size: number;
  }> = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readFilesRecursively(fullPath));
    } else if (!shouldSkipFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({
          path: path.relative(dir, fullPath).replace(/\\/g, '/'), // Normalize to forward slashes
          content,
          size: Buffer.byteLength(content, 'utf-8')
        });
      } catch (error) {
        console.warn(`Skipping file ${fullPath}:`, error);
      }
    }
  }

  return files;
}

// File exclusion patterns
function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    /(^|\/|\\)\.git(\/|\\|$)/, // Git files
    /(^|\/|\\)node_modules(\/|\\|$)/, // Node modules
    /\.(png|jpg|jpeg|gif|svg|ico|woff2?|eot|ttf|otf|pdf|zip|tar|gz)$/i, // Binary files
    /(package-lock\.json|yarn\.lock)$/i, // Lock files
    /\.env(\.\w+)?$/i // Environment files
  ];
  return skipPatterns.some(pattern => pattern.test(filePath));
}

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      plugins: [['@swc/plugin-emotion', {}]]
    }),
    {
      name: 'github-clone-api',
      configureServer(server) {
        server.middlewares.use('/api/clone-repo', async (req, res) => {
          // Only handle POST requests
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ 
              error: 'Method not allowed',
              allowedMethods: ['POST']
            }));
          }

          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { owner, repo, branch = 'main' } = JSON.parse(body);
              
              // Validate input
              if (!owner || !repo) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ 
                  error: 'Invalid request',
                  details: 'Missing owner or repo parameters'
                }));
              }

              // Clone repository
              const result = await cloneRepo(owner, repo, branch);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              console.error('Repository clone error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                error: 'Repository clone failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                ...(process.env.NODE_ENV === 'development' && {
                  stack: error instanceof Error ? error.stack : undefined
                })
              }));
            }
          });
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    cors: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
});