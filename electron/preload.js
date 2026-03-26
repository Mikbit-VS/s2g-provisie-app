const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  getExcelFiles: (folderPath) =>
    ipcRenderer.invoke("filesystem:get-excel-files", folderPath),
  importExcelData: (folderPath) =>
    ipcRenderer.invoke("python:import-excel-data", folderPath)
});
