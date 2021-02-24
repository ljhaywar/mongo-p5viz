const fs = require('fs');
const { IPC, TEMPLATE } = require('./const');
const config = require('./config');
const { app, BrowserWindow, ipcMain } = require('electron');
let win;

if (!fs.existsSync('./selected')) {
  fs.writeFileSync('./selected.js', `module.exports = 'sample1.js';\n`);
}

const sharedState = {
  selectedSketch: require('./selected')
};

function createWindow () {
  win = new BrowserWindow({
    ...config,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true
    }
  });

  win.loadFile('index.html');

  // for debugging
  win.webContents.openDevTools();
}

function saveSketch(file, content) {
  try {
    fs.writeFileSync(`./sketches/${file}`, content);
    return { file };
  } catch (error) {
    return { error };
  }
}

ipcMain.handle(IPC.STATE, (event, action, name, value) => {
  switch (action) {
    case 'set':
      return sharedState[name] = value;
    case 'get':
      return sharedState[name];
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
});

ipcMain.handle(IPC.ACTION, (event, name, args) => {
  switch (name) {
    case 'save':
      return saveSketch(args.file, args.content);
    case 'refresh':
      fs.writeFileSync('./selected.js', `module.exports = '${sharedState.selectedSketch}';\n`);
      win.webContents.reloadIgnoringCache();
      return true;  
    case 'switch':
      const content = fs.readFileSync(`./sketches/${args.file}`, 'utf8');
      return { file: args.file, content };
    case 'new':
      return saveSketch(args.file, TEMPLATE);
    default:
      throw new Error(`Unsupported action: ${name}`);
  }
})

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
