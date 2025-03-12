const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { generateIconConfig } = require("./lib/icon");

let statusBarItem;
// Variable para prevenir reinicios consecutivos
let lastReloadTime = 0;
// Tiempo mínimo entre reinicios (5 minutos)
const RELOAD_COOLDOWN = 5 * 60 * 1000;
// Variable para controlar si ya se mostró un mensaje después del reinicio
let justReloaded = false;
// Ruta del backup de la configuración de iconos
let backupIconPath;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Seti Icons extension is now active!");

  // Crear item en la barra de estado
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "seti-icons.detectFramework";
  context.subscriptions.push(statusBarItem);

  // Registrar comandos
  let detectCommand = vscode.commands.registerCommand(
    "seti-icons.detectFramework",
    async () => {
      await detectFrameworkAndUpdateIcons(true);
    }
  );

  let resetCommand = vscode.commands.registerCommand(
    "seti-icons.resetToDefault",
    async () => {
      await resetToDefaultIcons();
      vscode.window.showInformationMessage(
        "¡Iconos restablecidos a valores predeterminados!"
      );
    }
  );

  context.subscriptions.push(detectCommand);
  context.subscriptions.push(resetCommand);

  // Determinar la ubicación correcta del archivo de configuración de iconos
  const extensionPath =
    vscode.extensions.getExtension("qinjia.seti-icons").extensionPath;
  let iconFilePath;

  try {
    // Leer package.json para determinar la ruta correcta del tema de iconos
    const packageJsonPath = path.join(extensionPath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (
      packageJson.contributes &&
      packageJson.contributes.iconThemes &&
      packageJson.contributes.iconThemes.length > 0
    ) {
      // Usar la ruta definida en package.json
      iconFilePath = path.join(
        extensionPath,
        packageJson.contributes.iconThemes[0].path
      );
      console.log(`Usando ruta de iconos desde package.json: ${iconFilePath}`);
    } else {
      // Ruta por defecto si no está definida en package.json
      iconFilePath = path.join(extensionPath, "seti.json");
      console.log(
        `No se encontró definición de tema en package.json, usando ruta por defecto: ${iconFilePath}`
      );
    }
  } catch (error) {
    console.error("Error al leer package.json:", error);
    // Ruta por defecto en caso de error
    iconFilePath = path.join(extensionPath, "seti.json");
  }

  // Guardar la ruta como variable global para usar en toda la extensión
  global.iconFilePath = iconFilePath;
  backupIconPath = `${iconFilePath}.backup`;

  console.log(`Ruta de archivo de iconos: ${global.iconFilePath}`);
  console.log(`Ruta de backup: ${backupIconPath}`);

  // Si no existe backup pero existe el archivo original, crear backup
  if (fs.existsSync(iconFilePath) && !fs.existsSync(backupIconPath)) {
    try {
      fs.copyFileSync(iconFilePath, backupIconPath);
      console.log("Backup de configuración de iconos creado");
    } catch (error) {
      console.error("Error al crear backup de iconos:", error);
    }
  }

  // Comprobar si acabamos de reiniciar
  const lastStartTime = context.globalState.get("lastStartTime", 0);
  justReloaded = Date.now() - lastStartTime < 3000;
  context.globalState.update("lastStartTime", Date.now());

  // Verificar si la configuración de iconos existe y es válida
  verifyIconConfiguration();

  // Ejecutar detección inicial, sin notificación si acabamos de reiniciar
  detectFrameworkAndUpdateIcons(false, justReloaded);

  // Observar cambios en el workspace
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    detectFrameworkAndUpdateIcons();
  });
}

/**
 * Verifica que la configuración de iconos sea válida
 */
function verifyIconConfiguration() {
  try {
    if (!fs.existsSync(global.iconFilePath)) {
      console.log(
        "Archivo de configuración de iconos no encontrado, restaurando desde backup..."
      );
      restoreFromBackup();
      return;
    }

    // Verificar que el archivo sea un JSON válido y tenga la estructura requerida
    const iconConfig = JSON.parse(fs.readFileSync(global.iconFilePath, "utf8"));

    // Verificar estructura básica requerida para temas de iconos de VS Code
    if (
      !iconConfig ||
      typeof iconConfig !== "object" ||
      !iconConfig.iconDefinitions ||
      !iconConfig.file ||
      !iconConfig.folder
    ) {
      console.log(
        "Configuración de iconos inválida o incompleta, restaurando desde backup..."
      );
      restoreFromBackup();
    }
  } catch (error) {
    console.error("Error al verificar configuración de iconos:", error);
    restoreFromBackup();
  }
}

/**
 * Restaura la configuración de iconos desde el backup
 */
function restoreFromBackup() {
  try {
    if (fs.existsSync(backupIconPath)) {
      fs.copyFileSync(backupIconPath, global.iconFilePath);
      console.log("Configuración de iconos restaurada desde backup");
      return true;
    } else {
      console.log("No se encontró backup de configuración de iconos");
      return generateDefaultIconConfig();
    }
  } catch (error) {
    console.error("Error al restaurar desde backup:", error);
    return generateDefaultIconConfig();
  }
}

/**
 * Genera una configuración de iconos predeterminada
 */
async function generateDefaultIconConfig() {
  try {
    const extensionPath =
      vscode.extensions.getExtension("qinjia.seti-icons").extensionPath;
    const iconConfig = await generateIconConfig(extensionPath, null);

    if (!iconConfig) {
      throw new Error(
        "No se pudo generar configuración de iconos predeterminada"
      );
    }

    // Asegurar que el directorio existe
    const iconDir = path.dirname(global.iconFilePath);
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    fs.writeFileSync(global.iconFilePath, JSON.stringify(iconConfig, null, 2));
    console.log(
      "Configuración de iconos predeterminada generada correctamente"
    );
    return true;
  } catch (error) {
    console.error("Error al generar configuración predeterminada:", error);

    // Si todo falla, crear un archivo básico de configuración
    try {
      const basicConfig = {
        iconDefinitions: {
          _file: {
            iconPath: "./icons/file.svg",
          },
          _folder: {
            iconPath: "./icons/folder.svg",
          },
          _folder_open: {
            iconPath: "./icons/folder-open.svg",
          },
        },
        file: "_file",
        folder: "_folder",
        folderExpanded: "_folder_open",
        fileExtensions: {},
        fileNames: {},
        languageIds: {},
      };

      // Asegurar que el directorio existe
      const iconDir = path.dirname(global.iconFilePath);
      if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
      }

      fs.writeFileSync(
        global.iconFilePath,
        JSON.stringify(basicConfig, null, 2)
      );
      console.log("Configuración básica de emergencia creada");
      return true;
    } catch (err) {
      console.error("Error crítico al crear configuración básica:", err);
      return false;
    }
  }
}

/**
 * Detectar el framework usado en el workspace actual y actualizar los iconos
 */
async function detectFrameworkAndUpdateIcons(
  notifyUser = false,
  skipReloadPrompt = false
) {
  const config = vscode.workspace.getConfiguration("seti-icons");
  if (!config.get("frameworkDetection")) {
    updateStatusBar("Seti Icons: Detección automática desactivada");
    return;
  }

  // Evitar actualizaciones si estamos en periodo de enfriamiento de reinicio
  if (Date.now() - lastReloadTime < RELOAD_COOLDOWN && !notifyUser) {
    updateStatusBar("Seti Icons: Esperando para detectar cambios");
    return;
  }

  const framework = await detectFramework();
  if (framework) {
    const updated = await updateIconsForFramework(
      framework,
      notifyUser,
      skipReloadPrompt
    );
    if (updated) {
      updateStatusBar(`Seti Icons: ${framework} detectado`);

      if (notifyUser) {
        vscode.window.showInformationMessage(
          `Framework detectado: ${framework}. Los iconos han sido actualizados.`
        );
      }
    } else {
      updateStatusBar(
        `Seti Icons: Error al actualizar iconos para ${framework}`
      );
    }
  } else {
    updateStatusBar("Seti Icons: Ningún framework detectado");
  }
}

/**
 * Resetear iconos a la configuración predeterminada
 */
async function resetToDefaultIcons() {
  const extensionPath =
    vscode.extensions.getExtension("qinjia.seti-icons").extensionPath;

  try {
    const iconConfig = await generateIconConfig(extensionPath, null);
    const iconFilePath = path.join(extensionPath, "seti.json");
    fs.writeFileSync(iconFilePath, JSON.stringify(iconConfig, null, 2));

    updateStatusBar("Seti Icons: Iconos predeterminados");

    // Prevenir múltiples reinicios en corto tiempo
    if (Date.now() - lastReloadTime < RELOAD_COOLDOWN) {
      vscode.window.showInformationMessage(
        "Iconos restablecidos. Los cambios se aplicarán cuando reinicie VSCode manualmente."
      );
      return;
    }

    const reload = await vscode.window.showInformationMessage(
      "Iconos restablecidos. Es necesario recargar la ventana para aplicar los cambios.",
      "Recargar ahora",
      "Más tarde"
    );

    if (reload === "Recargar ahora") {
      lastReloadTime = Date.now();
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  } catch (error) {
    console.error("Error al resetear iconos:", error);
  }
}

/**
 * Actualizar el item de la barra de estado
 */
function updateStatusBar(text) {
  statusBarItem.text = text;
  statusBarItem.show();
}

/**
 * Detectar el framework usado en el workspace actual
 */
async function detectFramework() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return null;

  const rootPath = workspaceFolders[0].uri.fsPath;

  // Comprobar package.json
  try {
    const packageJsonPath = path.join(rootPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Verificar frameworks en las dependencias
      if (dependencies["next"]) {
        return "Next.js";
      } else if (dependencies["react-native"]) {
        return "React Native";
      } else if (dependencies["@angular/core"]) {
        return "Angular";
      } else if (dependencies["vue"]) {
        return "Vue";
      } else if (
        dependencies["react"] &&
        !dependencies["next"] &&
        !dependencies["react-native"]
      ) {
        return "React";
      } else if (dependencies["svelte"]) {
        return "Svelte";
      } else if (dependencies["@nestjs/core"]) {
        return "Nest.js";
      } else if (dependencies["express"]) {
        return "Express";
      }
    }

    // Verificar archivos de configuración específicos
    if (fs.existsSync(path.join(rootPath, "next.config.js"))) {
      return "Next.js";
    } else if (fs.existsSync(path.join(rootPath, "angular.json"))) {
      return "Angular";
    } else if (fs.existsSync(path.join(rootPath, "vue.config.js"))) {
      return "Vue";
    } else if (fs.existsSync(path.join(rootPath, "svelte.config.js"))) {
      return "Svelte";
    } else if (
      fs.existsSync(path.join(rootPath, "metro.config.js")) ||
      fs.existsSync(path.join(rootPath, "app.json")) ||
      fs.existsSync(path.join(rootPath, "react-native.config.js"))
    ) {
      return "React Native";
    } else if (fs.existsSync(path.join(rootPath, "nest-cli.json"))) {
      return "Nest.js";
    }
  } catch (error) {
    console.error("Error al detectar framework:", error);
  }

  return null;
}

/**
 * Actualizar iconos según el framework detectado
 */
async function updateIconsForFramework(
  framework,
  notifyUser = false,
  skipReloadPrompt = false
) {
  const extensionPath =
    vscode.extensions.getExtension("qinjia.seti-icons").extensionPath;

  try {
    console.log(`Actualizando iconos para framework: ${framework}`);
    const iconConfig = await generateIconConfig(extensionPath, framework);

    // Verificar que la configuración generada sea válida
    if (
      !iconConfig ||
      typeof iconConfig !== "object" ||
      !iconConfig.iconDefinitions ||
      !iconConfig.file ||
      !iconConfig.folder
    ) {
      throw new Error("Configuración de iconos generada inválida o incompleta");
    }

    // Crear backup antes de modificar
    try {
      if (fs.existsSync(global.iconFilePath)) {
        fs.copyFileSync(global.iconFilePath, `${global.iconFilePath}.previous`);
      }
    } catch (err) {
      console.warn("No se pudo crear backup temporal:", err);
    }

    // Asegurar que el directorio existe
    const iconDir = path.dirname(global.iconFilePath);
    if (!fs.existsSync(iconDir)) {
      console.log(`Creando directorio para iconos: ${iconDir}`);
      fs.mkdirSync(iconDir, { recursive: true });
    }

    // Escribir a un archivo temporal primero
    const tempFilePath = `${global.iconFilePath}.temp`;
    fs.writeFileSync(tempFilePath, JSON.stringify(iconConfig, null, 2));

    // Verificar que el archivo temporal sea válido antes de reemplazar el original
    try {
      const tempConfig = JSON.parse(fs.readFileSync(tempFilePath, "utf8"));
      if (!tempConfig || typeof tempConfig !== "object") {
        throw new Error("Archivo temporal inválido");
      }

      // Si es válido, reemplazar el archivo original
      fs.renameSync(tempFilePath, global.iconFilePath);
      console.log(
        "Configuración de iconos actualizada correctamente en:",
        global.iconFilePath
      );

      // Forzar recargar la configuración de VS Code para que detecte el cambio
      const currentIconTheme = vscode.workspace
        .getConfiguration()
        .get("workbench.iconTheme", "");
      console.log(`Tema de iconos actual: ${currentIconTheme}`);

      if (currentIconTheme === "seti") {
        // Si el tema actual es seti, cambiar a otro y luego volver
        await vscode.workspace
          .getConfiguration()
          .update("workbench.iconTheme", "vs-minimal", true);
        setTimeout(async () => {
          await vscode.workspace
            .getConfiguration()
            .update("workbench.iconTheme", "seti", true);
          console.log("Tema de iconos reiniciado con éxito");
        }, 1000);
      } else {
        // Si no está usando seti, configurarlo
        await vscode.workspace
          .getConfiguration()
          .update("workbench.iconTheme", "seti", true);
        console.log("Tema de iconos configurado a seti");
      }
    } catch (validationError) {
      console.error(
        "Error de validación del archivo temporal:",
        validationError
      );
      // Si el archivo temporal no es válido, eliminarlo y restaurar desde backup
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      restoreFromBackup();
      throw new Error("La configuración generada no es válida");
    }

    // Si acabamos de reiniciar o se debe omitir el mensaje, no mostramos nada
    if (skipReloadPrompt) {
      return true;
    }

    // Prevenir múltiples reinicios en corto tiempo
    if (Date.now() - lastReloadTime < RELOAD_COOLDOWN && !notifyUser) {
      return true;
    }

    const reload = await vscode.window.showInformationMessage(
      `Los iconos han sido actualizados para ${framework}. Es necesario recargar la ventana para aplicar los cambios completamente.`,
      "Recargar ahora",
      "Más tarde"
    );

    if (reload === "Recargar ahora") {
      lastReloadTime = Date.now();
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }

    return true;
  } catch (error) {
    console.error("Error al actualizar iconos:", error);
    vscode.window.showErrorMessage(
      `Error al actualizar iconos para ${framework}: ${error.message}. Restaurando configuración anterior.`
    );
    return false;
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
