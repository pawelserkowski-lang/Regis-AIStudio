const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let backendProcess;
let frontendProcess;

// Sciezka do projektu
const projectPath = __dirname;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, 'icon.ico'),
        title: 'Regis AI Studio',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Laduj frontend
    mainWindow.loadURL('http://localhost:5173');

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    backendProcess = spawn('python', ['api/index.py'], {
        cwd: projectPath,
        shell: true,
        detached: false
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
}

function startFrontend() {
    frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectPath,
        shell: true,
        detached: false
    });

    frontendProcess.stdout.on('data', (data) => {
        console.log(`Frontend: ${data}`);
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.ico'));
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Otworz Regis', 
            click: () => mainWindow.show() 
        },
        { 
            label: 'Health Check', 
            click: () => shell.openExternal('http://localhost:8000/api/health') 
        },
        { type: 'separator' },
        { 
            label: 'Zamknij', 
            click: () => {
                if (backendProcess) backendProcess.kill();
                if (frontendProcess) frontendProcess.kill();
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Regis AI Studio');
    tray.setContextMenu(contextMenu);
    
    tray.on('double-click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    // Uruchom serwery
    startBackend();
    
    setTimeout(() => {
        startFrontend();
    }, 2000);

    // Poczekaj na frontend
    setTimeout(() => {
        createWindow();
        createTray();
    }, 5000);
});

app.on('window-all-closed', () => {
    // Nie zamykaj - zostaw w tray
});

app.on('before-quit', () => {
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
