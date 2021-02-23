const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 1024,
    title: 'MongoDB p5 data visualizer - BuildFest demo',
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true
    }
  });

  win.loadFile('index.html');

  // for debugging
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
