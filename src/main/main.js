const process = require('process');

const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const Store = require('electron-store');

const {processMkvs} = require('./mkvHandling');

let win;
let readyToClose = false;
const store = new Store();

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: `${__dirname}/../preload/preload.js`,
        },
        frame: false,
    });

    win.on('close', (event) => {
        handleClose(event, readyToClose);
    });

    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        win.loadFile('../../dist/index.html');
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const handleClose = (event, ready) => {
    if (ready) {
        readyToClose = true;
        app.quit();
    } else {
        event.preventDefault();
        win.webContents.send('close');
    }
};

ipcMain.on('close', (event, arg) => {
    handleClose(event, true);
});

ipcMain.on('save-state', (event, arg) => {
    store.set('savedState', arg.state);
    event.reply('save-state', arg.reply);
});

ipcMain.on('get-state', async (event, arg) => {
    const savedState = store.get('savedState', arg.default);
    event.reply('get-state', savedState);
})

ipcMain.handle('select-files', async (event, arg) => {
    const paths = await dialog.showOpenDialog({
        filters: [{name: 'Matroska', extensions: ['mkv']}],
        properties: ['openFile', 'multiSelections'],
    });
    return paths;
});

ipcMain.on('process-mkv', async (event, arg) => {
    const log = (data) => {
        event.reply('log', data.toString());
    };
    const end = () => {
        event.reply('process-mkv', true);
    };
    processMkvs(
        arg.source,
        arg.target,
        arg.settings,
        log,
        end,
        arg.sushi,
        arg.mkvmerge,
    );
});

ipcMain.on('minimize-window', (event, arg) => {
    if (BrowserWindow.getAllWindows().length > 0) {
        const currentWindow = BrowserWindow.fromId(event.frameId);
        if (currentWindow.minimizable) {
            currentWindow.minimize();
        }
    }
});

ipcMain.on('max-unmax-window', (event, arg) => {
    if (BrowserWindow.getAllWindows().length > 0) {
        const currentWindow = BrowserWindow.fromId(event.frameId);
        if (currentWindow.isMaximized()) {
            currentWindow.unmaximize();
            event.reply('is-window-maximized', false);
        } else {
            currentWindow.maximize();
            event.reply('is-window-maximized', true);
        }
    }
});

ipcMain.on('close-window', (event, arg) => {
    if (BrowserWindow.getAllWindows().length > 0) {
        BrowserWindow.fromId(event.frameId).close();
    }
});

ipcMain.on('is-window-maximized', (event, arg) => {
    if (BrowserWindow.getAllWindows().length > 0) {
        const currentWindow = BrowserWindow.fromId(event.frameId);
        event.reply('is-window-maximized', currentWindow.isMaximized());
    }
});
