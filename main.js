const { app, BrowserWindow, Menu, ipcMain, protocol } = require('electron');
const path = require('path');
const { checkDeviceConnected, isSnapchatOpen, takeScreenshot } = require('./services/adb');
const { runTapper, runScroller, runLeftScroll, runRightScroll, runTapAndScroll, stopAutomation, checkAd } = require('./services/automation');

// process.env.NODE_ENV = 'production';
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

// create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Snappy",
    width: isDev ? 1200 : 600,
    height: 628,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, './renderer/splash.html'));
}

function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Snappy",
    width: 300,
    height: 400,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
  aboutWindow.on('blur', () => aboutWindow.hide());
}

// app ready
app.whenReady().then(() => {
  createMainWindow();

  // implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // remove mainWindow from memory on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  })
})

// menu
const menu = [
  ...(isMac ? [{
    label: 'Snappy',
    submenu: [
      {
        label: 'About',
        click: () => createAboutWindow(),
      }
    ]
  }] : []),
  {
    role: 'fileMenu'
  },
  ...(!isMac ? [{
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => createAboutWindow(),
      }
    ]
  }] : [])
]

ipcMain.handle('check-connection', async () => await checkDeviceConnected());
ipcMain.handle('check-snapchat', async () => await isSnapchatOpen());
ipcMain.handle('start-tapper', (_, config) => runTapper(config));
ipcMain.handle('start-scroller', (_, config) => runScroller(config));
ipcMain.handle('start-left-scroll', (_, config) => runLeftScroll(config));
ipcMain.handle('start-right-scroll', (_, config) => runRightScroll(config));
ipcMain.handle('start-tapscroll', (_, config) => runTapAndScroll(config));
ipcMain.handle('stop-automation', () => stopAutomation());
ipcMain.handle('take-screenshot', async () => await takeScreenshot());
ipcMain.handle('check-ad', (_, config) => checkAd(config));

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
})