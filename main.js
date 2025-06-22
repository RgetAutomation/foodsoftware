const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ✅ Handler to preview bill with passed-in data (object from renderer)
ipcMain.handle('open-bill-preview', async (event, billData) => {
  const previewWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  await previewWin.loadFile('bill.html');

  previewWin.webContents.on('did-finish-load', () => {
    previewWin.webContents.send('bill-data', billData);
  });
});

// ✅ Handler to preview a bill by loading it from a saved JSON file
ipcMain.handle('preview-bill-from-file', async (event, fileName) => {
  try {
    const billPath = path.join("C:/restaurant billing software/bills", fileName);
    const billData = JSON.parse(fs.readFileSync(billPath, 'utf-8'));

    const previewWin = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    await previewWin.loadFile('bill.html');

    previewWin.webContents.on('did-finish-load', () => {
      previewWin.webContents.send('bill-data', billData);
    });
  } catch (err) {
    console.error("Error loading bill from file:", err.message);
  }
});

// ✅ Handler for silent print (used in bill.html after preview shown)
ipcMain.handle('print-bill', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  senderWindow.webContents.print({ silent: true, printBackground: true }, (success, errorType) => {
    senderWindow.webContents.send('print-result', {
      success,
      error: success ? null : errorType
    });
  });
});
