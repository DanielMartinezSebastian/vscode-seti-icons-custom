/**
 * Script para crear y verificar los iconos básicos
 * Este script genera archivos SVG básicos si no existen
 */

const fs = require("fs");
const path = require("path");

// Ruta base de la extensión
const extensionPath = __dirname;
console.log(`Ruta de extensión: ${extensionPath}`);

// Crear directorio de iconos si no existe
const iconsDir = path.join(extensionPath, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Directorio de iconos creado: ${iconsDir}`);
}

// Iconos básicos a crear
const basicIcons = [
  {
    name: "file.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#cccccc" d="M17.5,30h-13c-0.8,0-1.5-0.7-1.5-1.5v-25C3,2.7,3.7,2,4.5,2H21c0.8,0,1.5,0.7,1.5,1.5V17L17.5,30z"/></svg>`,
  },
  {
    name: "folder.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#7ca1c0" d="M27.5,29h-23C3.7,29,3,28.3,3,27.5v-23C3,3.7,3.7,3,4.5,3h9.1c0.4,0,0.8,0.2,1.1,0.4l3.6,3.6 c0.2,0.2,0.3,0.3,0.4,0.4h8.8c0.8,0,1.5,0.7,1.5,1.5v18.5C29,28.3,28.3,29,27.5,29z"/></svg>`,
  },
  {
    name: "folder-open.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#7ca1c0" d="M27.4,29h-23C3.7,29,3,28.3,3,27.5v-23C3,3.7,3.7,3,4.5,3h9.1c0.4,0,0.8,0.2,1.1,0.4l3.6,3.6 C18.5,7.2,18.7,7.4,19,7.5h8.5c0.8,0,1.5,0.7,1.5,1.5v4l-7.2,14.2C21.3,28.2,20.4,29,27.4,29z"/></svg>`,
  },
  {
    name: "js.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#cbcb41" d="M17,30V2c0,0-1.5,0-2,0v12c0,0.6-0.5,1-1,1h-4c-0.5,0-1-0.4-1-1V2H7v12c0,2.2,1.8,4,4,4h2c2.2,0,4-1.8,4-4V2z M24,2h-1c-2.2,0-4,1.8-4,4c0,2.2,1.8,4,4,4h1c0.5,0,1,0.5,1,1c0,0.5-0.5,1-1,1h-4v2h4c2.2,0,4-1.8,4-4c0-2.2-1.8-4-4-4h-1c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h4V2H24z"/></svg>`,
  },
  {
    name: "json.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#f1e05a" d="M17,30V2c0,0-1.5,0-2,0v12c0,0.6-0.5,1-1,1h-4c-0.5,0-1-0.4-1-1V2H7v12c0,2.2,1.8,4,4,4h2c2.2,0,4-1.8,4-4V2z M24,2h-1c-2.2,0-4,1.8-4,4c0,2.2,1.8,4,4,4h1c0.5,0,1,0.5,1,1c0,0.5-0.5,1-1,1h-4v2h4c2.2,0,4-1.8,4-4c0-2.2-1.8-4-4-4h-1c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h4V2H24z"/></svg>`,
  },
];

// Crear iconos básicos si no existen
basicIcons.forEach((icon) => {
  const iconPath = path.join(iconsDir, icon.name);
  if (!fs.existsSync(iconPath)) {
    try {
      fs.writeFileSync(iconPath, icon.content);
      console.log(`Icono creado: ${iconPath}`);
    } catch (error) {
      console.error(`Error al crear icono ${icon.name}:`, error);
    }
  } else {
    console.log(`Icono ya existe: ${iconPath}`);
  }
});

// Crear directorio de frameworks si no existe
const frameworksDir = path.join(iconsDir, "frameworks");
if (!fs.existsSync(frameworksDir)) {
  fs.mkdirSync(frameworksDir, { recursive: true });
  console.log(`Directorio de frameworks creado: ${frameworksDir}`);
}

// Crear archivos de configuración base para iconos si no existen
const baseIconPath = path.join(iconsDir, "seti-base.json");
if (!fs.existsSync(baseIconPath)) {
  try {
    const baseConfig = {
      iconDefinitions: {
        _file: {
          iconPath: "./icons/file.svg",
          fontColor: "#cccccc",
        },
        _folder: {
          iconPath: "./icons/folder.svg",
          fontColor: "#7ca1c0",
        },
        _folder_open: {
          iconPath: "./icons/folder-open.svg",
          fontColor: "#7ca1c0",
        },
        js: {
          iconPath: "./icons/js.svg",
          fontColor: "#cbcb41",
        },
        json: {
          iconPath: "./icons/json.svg",
          fontColor: "#f1e05a",
        },
      },
      file: "_file",
      folder: "_folder",
      folderExpanded: "_folder_open",
      fileExtensions: {
        js: "js",
        json: "json",
      },
      fileNames: {},
      languageIds: {
        javascript: "js",
        json: "json",
      },
      light: {
        file: "_file",
        folder: "_folder",
        folderExpanded: "_folder_open",
      },
      highContrast: {
        file: "_file",
        folder: "_folder",
        folderExpanded: "_folder_open",
      },
    };

    fs.writeFileSync(baseIconPath, JSON.stringify(baseConfig, null, 2));
    console.log(`Archivo base de iconos creado: ${baseIconPath}`);
  } catch (error) {
    console.error(`Error al crear archivo base de iconos:`, error);
  }
}

console.log("\nIconos básicos creados correctamente. Ahora ejecuta:");
console.log("node resetIcons.js");
console.log(
  "para regenerar la configuración completa y luego reinicia VS Code."
);
