const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Languages
  getLanguages: () => ipcRenderer.invoke('get-languages'),
  
  // Versions
  getVersionsByLanguage: (languageTag) => ipcRenderer.invoke('get-versions-by-language', languageTag),
  
  // Books
  getBooksByVersion: (versionId) => ipcRenderer.invoke('get-books-by-version', versionId),
  
  // Chapter content
  getChapterContent: (params) => ipcRenderer.invoke('get-chapter-content', params),
  
  // Download
  downloadBible: (params) => ipcRenderer.invoke('download-bible', params),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  removeDownloadProgressListener: () => ipcRenderer.removeAllListeners('download-progress'),
  
  // Export
  exportBible: (params) => ipcRenderer.invoke('export-bible', params),
  
  // Local storage
  getDownloadedBibles: () => ipcRenderer.invoke('get-downloaded-bibles'),
  readDownloadedBible: (filePath) => ipcRenderer.invoke('read-downloaded-bible', filePath),
  saveBibleLocal: (bibleData) => ipcRenderer.invoke('save-bible-local', bibleData),
  isBibleDownloaded: (abbreviation) => ipcRenderer.invoke('is-bible-downloaded', abbreviation),
  deleteDownloadedBible: (abbreviation) => ipcRenderer.invoke('delete-downloaded-bible', abbreviation),
  
  // Token
  getToken: () => ipcRenderer.invoke('get-token'),
  setToken: (token) => ipcRenderer.invoke('set-token', token),
});
