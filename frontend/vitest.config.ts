import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup file
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/types/',
        '**/*.d.ts',
        'src/routeTree.gen.ts',
      ],
      // Target coverage thresholds
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Globals (optional - allows using describe, it, expect without imports)
    globals: true,
    
    // Include patterns
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    
    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
    ],
  },
  
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});

