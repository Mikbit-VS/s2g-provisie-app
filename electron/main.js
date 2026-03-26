const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    title: "Provisie berekening",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://127.0.0.1:5173");
}

ipcMain.handle("dialog:select-folder", async () => {
  if (!mainWindow) {
    return null;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("filesystem:get-excel-files", async (_event, folderPath) => {
  if (!folderPath) {
    return [];
  }

  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => {
      const extension = path.extname(fileName).toLowerCase();
      return extension === ".xls" || extension === ".xlsx";
    })
    .sort((left, right) => left.localeCompare(right, "nl"));
});

ipcMain.handle("python:import-excel-data", async (_event, folderPath) => {
  if (!folderPath) {
    return {
      success: false,
      error: "Er is nog geen map gekozen."
    };
  }

  const scriptPath = path.join(app.getAppPath(), "python", "main.py");
  const pythonCommand = process.platform === "win32" ? "py" : "python3";
  const pythonArgs =
    process.platform === "win32"
      ? ["-3", scriptPath, folderPath]
      : [scriptPath, folderPath];

  return new Promise((resolve) => {
    const child = spawn(pythonCommand, pythonArgs, {
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        success: false,
        error: `Python kon niet worden gestart: ${error.message}`
      });
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: stderr.trim() || "Python importproces is mislukt."
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (_error) {
        resolve({
          success: false,
          error: "Ongeldige JSON ontvangen van het Python importproces."
        });
      }
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
