const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { BibleApiService } = require('./services/bibleApi');
const { ExportService } = require('./services/exportService');

const store = new Store();
const bibleApi = new BibleApiService();
const exportService = new ExportService();

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// IPC Handlers

// Get all languages
ipcMain.handle('get-languages', async () => {
  try {
    return await bibleApi.getLanguages();
  } catch (error) {
    console.error('Error getting languages:', error);
    throw error;
  }
});

// Get bible versions by language
ipcMain.handle('get-versions-by-language', async (event, languageTag) => {
  try {
    return await bibleApi.getVersionsByLanguage(languageTag);
  } catch (error) {
    console.error('Error getting versions:', error);
    throw error;
  }
});

// Get all books by bible version
ipcMain.handle('get-books-by-version', async (event, versionId) => {
  try {
    return await bibleApi.getBooksByVersion(versionId);
  } catch (error) {
    console.error('Error getting books:', error);
    throw error;
  }
});

// Get chapter content
ipcMain.handle('get-chapter-content', async (event, { versionId, usfm, abbreviation, token }) => {
  try {
    return await bibleApi.getChapterContent(versionId, usfm, abbreviation, token);
  } catch (error) {
    console.error('Error getting chapter content:', error);
    throw error;
  }
});

// Download full bible
ipcMain.handle('download-bible', async (event, { versionId, versionInfo, token, onProgress }) => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const bibleData = await bibleApi.downloadFullBible(
      versionId, 
      versionInfo, 
      token,
      (progress) => {
        mainWindow.webContents.send('download-progress', progress);
      }
    );
    
    return bibleData;
  } catch (error) {
    console.error('Error downloading bible:', error);
    throw error;
  }
});

// Export bible data
ipcMain.handle('export-bible', async (event, { bibleData, format }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${bibleData.abbreviation}.${format}`,
      filters: getFileFilters(format),
    });

    if (result.canceled) return null;

    await exportService.export(bibleData, result.filePath, format);
    return result.filePath;
  } catch (error) {
    console.error('Error exporting bible:', error);
    throw error;
  }
});

// Get downloaded bibles
ipcMain.handle('get-downloaded-bibles', async () => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      return [];
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    const bibles = [];

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
        bibles.push({
          id: data.id,
          abbreviation: data.abbreviation,
          title: data.title,
          local_title: data.local_title,
          language: data.language,
          booksCount: data.books?.length || 0,
          filePath: path.join(dataDir, file),
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    }

    return bibles;
  } catch (error) {
    console.error('Error getting downloaded bibles:', error);
    throw error;
  }
});

// Read downloaded bible
ipcMain.handle('read-downloaded-bible', async (event, filePath) => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data;
  } catch (error) {
    console.error('Error reading bible:', error);
    throw error;
  }
});

// Save bible to local
ipcMain.handle('save-bible-local', async (event, bibleData) => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${bibleData.abbreviation}.json`);
    fs.writeFileSync(filePath, JSON.stringify(bibleData, null, 2), 'utf-8');
    return filePath;
  } catch (error) {
    console.error('Error saving bible:', error);
    throw error;
  }
});

// Get/Set token
ipcMain.handle('get-token', () => {
  return store.get('token', 'fxAgRC8gE-rJH0I7i37xV');
});

ipcMain.handle('set-token', (event, token) => {
  store.set('token', token);
  return true;
});

// Check if bible is downloaded
ipcMain.handle('is-bible-downloaded', async (event, abbreviation) => {
  const dataDir = path.join(app.getPath('userData'), 'data');
  const filePath = path.join(dataDir, `${abbreviation}.json`);
  return fs.existsSync(filePath);
});

// Delete downloaded bible
ipcMain.handle('delete-downloaded-bible', async (event, abbreviation) => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    const filePath = path.join(dataDir, `${abbreviation}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting bible:', error);
    throw error;
  }
});

function getFileFilters(format) {
  switch (format) {
    case 'json':
      return [{ name: 'JSON Files', extensions: ['json'] }];
    case 'csv':
      return [{ name: 'CSV Files', extensions: ['csv'] }];
    case 'xml':
      return [{ name: 'XML Files', extensions: ['xml'] }];
    case 'sqlite':
      return [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }];
    default:
      return [{ name: 'All Files', extensions: ['*'] }];
  }
}
