import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const cwd = typeof process.cwd === 'function' ? process.cwd() : '.';
  const env = loadEnv(mode, cwd, '');

  return {
    plugins: [react()],
    // Base is crucial for GitHub Pages (e.g. /my-repo-name/)
    // If you are using a custom domain, using '/' is fine. 
    // For github.io/repo, use './'
    base: './', 
    define: {
      // This injects the environment variable into the build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY),
    }
  };
});