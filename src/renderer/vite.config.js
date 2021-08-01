import path from 'path';

import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import {builtinModules} from 'module';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [reactRefresh()],
    base: '',
    root: __dirname,
    server: {
        fsServe: {
            root: path.join(__dirname, '../..'),
        }
    },
    build: {
        sourcemap: true,
        target: `chrome91`,
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
            external: [...builtinModules],
        },
        emptyOutDir: true,
    },
});
