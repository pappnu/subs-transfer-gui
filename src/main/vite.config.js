import path from 'path';

import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import {builtinModules} from 'module';

// https://vitejs.dev/config/
export default defineConfig({
    root: __dirname,
    build: {
        sourcemap: 'inline',
        target: `node14`,
        outDir: 'dist',
        assetsDir: '.',
        lib: {
            entry: 'main.js',
            formats: ['cjs'],
        },
        rollupOptions: {
            input: {
                main: path.join(__dirname, 'main.js'),
                mkvProcess: path.join(__dirname, 'mkvProcess.js'),
            },
            external: ['electron', ...builtinModules],
            output: {
                entryFileNames: '[name].js',
            },
        },
        emptyOutDir: true,
    },
});
