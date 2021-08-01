import path from 'path';

import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import {builtinModules} from 'module';

// https://vitejs.dev/config/
export default defineConfig({
    root: __dirname,
    build: {
        sourcemap: 'inline',
        target: `chrome91`,
        outDir: 'dist',
        assetsDir: '.',
        lib: {
            entry: 'preload.js',
            formats: ['cjs'],
        },
        rollupOptions: {
            external: ['electron', ...builtinModules],
            output: {
                entryFileNames: '[name].js',
            }
        },
        emptyOutDir: true,
    },
});
