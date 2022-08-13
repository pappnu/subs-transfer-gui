// based on https://github.com/cawa-93/vite-electron-builder/blob/main/scripts/watch.js

const {createServer, build, createLogger} = require('vite');
const electronPath = require('electron');
const {spawn} = require('child_process');

/** @type 'production' | 'development' | 'test' */
const mode = (process.env.NODE_ENV = process.env.NODE_ENV || 'development');

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'warn';

/** @type {import('vite').InlineConfig} */
const sharedConfig = {
    mode,
    server: {
        port: 3000,
    },
    build: {
        watch: {},
    },
    logLevel: LOG_LEVEL,
};

const getWatcher = ({name, configFile, writeBundle}) => {
    return build({
        ...sharedConfig,
        configFile,
        plugins: [{name, writeBundle}],
    });
};

/**
 * Start or restart App when main package files are changed
 */
const setupMainPackageWatcher = (viteDevServer) => {
    // Write a value to an environment variable to pass it to the main process.
    {
        const protocol = viteDevServer.config.server.https ? 'https' : 'http';
        const host = viteDevServer.config.server.host || 'localhost';
        const port = viteDevServer.config.server.port; // Vite searches for and occupies the first free port: 3000, 3001, 3002 and so on
        const path = '/';
        process.env.VITE_DEV_SERVER_URL = `${protocol}://${host}:${port}${path}`;
    }

    const logger = createLogger(LOG_LEVEL, {
        prefix: '[main]',
    });

    let spawnProcess = null;

    return getWatcher({
        name: 'reload-app-on-main-package-change',
        configFile: 'src/main/vite.config.js',
        writeBundle() {
            if (spawnProcess !== null) {
                spawnProcess.kill('SIGINT');
                spawnProcess = null;
            }

            spawnProcess = spawn(String(electronPath), ['.']);

            spawnProcess.stdout.on(
                'data',
                (d) =>
                    d.toString().trim() &&
                    logger.warn(d.toString(), {timestamp: true}),
            );
            spawnProcess.stderr.on(
                'data',
                (d) =>
                    d.toString().trim() &&
                    logger.error(d.toString(), {timestamp: true}),
            );
        },
    });
};

/**
 * Start or restart App when preload package files are changed
 */
const setupPreloadPackageWatcher = (viteDevServer) => {
    return getWatcher({
        name: 'reload-page-on-preload-package-change',
        configFile: 'src/preload/vite.config.js',
        writeBundle() {
            viteDevServer.ws.send({
                type: 'full-reload',
            });
        },
    });
};

(async () => {
    try {
        const viteDevServer = await createServer({
            ...sharedConfig,
            configFile: 'src/renderer/vite.config.js',
        });

        await viteDevServer.listen();

        await setupPreloadPackageWatcher(viteDevServer);
        await setupMainPackageWatcher(viteDevServer);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
