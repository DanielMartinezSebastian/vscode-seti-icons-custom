"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Genera la configuración de iconos basada en el framework detectado
 * @param {string} extensionPath - Ruta de la extensión
 * @param {string|null} framework - Framework detectado o null para configuración predeterminada
 * @returns {Promise<object>} - Configuración de iconos
 */
async function generateIconConfig(extensionPath, framework) {
  try {
    console.log(
      `Generando configuración para ${
        framework || "configuración predeterminada"
      }`
    );

    // Verificar estructura de directorios y archivos de iconos
    await verifyIconFilesExist(extensionPath);

    // Ruta al archivo base de configuración de iconos
    const baseIconPath = path.join(extensionPath, "icons", "seti-base.json");

    // Verificar si existe el archivo base
    if (!fs.existsSync(baseIconPath)) {
      console.error(`Archivo base de iconos no encontrado en ${baseIconPath}`);

      // Buscar en ubicaciones alternativas
      const altBaseIconPath = path.join(extensionPath, "seti-base.json");
      if (fs.existsSync(altBaseIconPath)) {
        console.log(`Usando archivo base alternativo en: ${altBaseIconPath}`);
        const baseConfig = JSON.parse(fs.readFileSync(altBaseIconPath, "utf8"));
        return processIconConfig(baseConfig, extensionPath, framework);
      }

      console.log("Extrayendo del archivo package.json...");
      const packagePath = path.join(extensionPath, "package.json");
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        if (
          packageData.contributes &&
          packageData.contributes.iconThemes &&
          packageData.contributes.iconThemes.length > 0
        ) {
          const defaultThemePath = packageData.contributes.iconThemes[0].path;
          const fullThemePath = path.join(extensionPath, defaultThemePath);

          if (fs.existsSync(fullThemePath)) {
            console.log(
              `Usando tema predeterminado encontrado en package.json: ${fullThemePath}`
            );
            const baseConfig = JSON.parse(
              fs.readFileSync(fullThemePath, "utf8")
            );
            return processIconConfig(baseConfig, extensionPath, framework);
          }
        }
      }

      return generateBasicIconConfig(extensionPath);
    }

    // Leer configuración base
    const baseConfig = JSON.parse(fs.readFileSync(baseIconPath, "utf8"));
    return processIconConfig(baseConfig, extensionPath, framework);
  } catch (error) {
    console.error("Error al generar configuración de iconos:", error);
    return generateBasicIconConfig(extensionPath);
  }
}

/**
 * Verifica si los archivos de iconos existen y muestra un diagnóstico
 */
async function verifyIconFilesExist(extensionPath) {
  // Lista de directorios a verificar
  const directories = [
    path.join(extensionPath, "icons"),
    path.join(extensionPath, "icons", "frameworks"),
  ];

  // Verificar que existen los directorios
  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      console.log(`Directorio encontrado: ${dir}`);
    } else {
      console.warn(`Directorio no encontrado: ${dir}`);
    }
  });

  // Verificar si existen los iconos básicos
  const basicIcons = [
    path.join(extensionPath, "icons", "file.svg"),
    path.join(extensionPath, "icons", "folder.svg"),
    path.join(extensionPath, "icons", "folder-open.svg"),
  ];

  let missingBasicIcons = false;

  basicIcons.forEach((icon) => {
    if (fs.existsSync(icon)) {
      console.log(`Icono básico encontrado: ${icon}`);
    } else {
      console.warn(`Icono básico no encontrado: ${icon}`);
      missingBasicIcons = true;
    }
  });

  // Si faltan iconos básicos, buscar en la raíz
  if (missingBasicIcons) {
    console.log("Buscando iconos en directorio raíz...");
    const rootIconsDir = path.join(extensionPath, "icons");

    if (!fs.existsSync(rootIconsDir)) {
      fs.mkdirSync(rootIconsDir, { recursive: true });
      console.log(`Directorio de iconos creado: ${rootIconsDir}`);
    }

    // Intenta encontrar SVG en otras ubicaciones y copiarlos
    const fileIcon = await findFileInDir(extensionPath, "file.svg");
    const folderIcon = await findFileInDir(extensionPath, "folder.svg");
    const folderOpenIcon = await findFileInDir(
      extensionPath,
      "folder-open.svg"
    );

    if (
      fileIcon &&
      !fs.existsSync(path.join(extensionPath, "icons", "file.svg"))
    ) {
      fs.copyFileSync(fileIcon, path.join(extensionPath, "icons", "file.svg"));
      console.log(
        `Icono de archivo copiado a: ${path.join(
          extensionPath,
          "icons",
          "file.svg"
        )}`
      );
    }

    if (
      folderIcon &&
      !fs.existsSync(path.join(extensionPath, "icons", "folder.svg"))
    ) {
      fs.copyFileSync(
        folderIcon,
        path.join(extensionPath, "icons", "folder.svg")
      );
      console.log(
        `Icono de carpeta copiado a: ${path.join(
          extensionPath,
          "icons",
          "folder.svg"
        )}`
      );
    }

    if (
      folderOpenIcon &&
      !fs.existsSync(path.join(extensionPath, "icons", "folder-open.svg"))
    ) {
      fs.copyFileSync(
        folderOpenIcon,
        path.join(extensionPath, "icons", "folder-open.svg")
      );
      console.log(
        `Icono de carpeta abierta copiado a: ${path.join(
          extensionPath,
          "icons",
          "folder-open.svg"
        )}`
      );
    }
  }
}

/**
 * Busca un archivo en un directorio y sus subdirectorios
 */
async function findFileInDir(startPath, fileName) {
  if (!fs.existsSync(startPath)) {
    return null;
  }

  const files = fs.readdirSync(startPath);

  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory() && !filename.includes("node_modules")) {
      const found = await findFileInDir(filename, fileName);
      if (found) return found;
    } else if (files[i].toLowerCase() === fileName.toLowerCase()) {
      return filename;
    }
  }

  return null;
}

/**
 * Procesa la configuración base con las personalizaciones del framework
 */
function processIconConfig(baseConfig, extensionPath, framework) {
  // Asegurarse que las rutas de iconos son correctas
  fixIconPaths(baseConfig, extensionPath);

  // Asegurarse que los colores están definidos correctamente
  fixIconColors(baseConfig);

  // Si no hay framework especificado, devolver configuración base
  if (!framework) {
    return baseConfig;
  }

  // Ruta al archivo de configuración específico del framework
  const frameworkIconPath = path.join(
    extensionPath,
    "icons",
    "frameworks",
    `${framework.toLowerCase().replace(/[\s.]/g, "-")}.json`
  );

  console.log(`Buscando configuración específica en: ${frameworkIconPath}`);

  // Si existe configuración específica del framework, mezclarla con la base
  if (fs.existsSync(frameworkIconPath)) {
    const frameworkConfig = JSON.parse(
      fs.readFileSync(frameworkIconPath, "utf8")
    );
    console.log(
      `Configuración encontrada para ${framework}, mezclando con configuración base`
    );
    return mergeConfigurations(baseConfig, frameworkConfig, extensionPath);
  } else {
    console.log(
      `No se encontró configuración específica para ${framework}, usando configuración base`
    );
    return baseConfig;
  }
}

/**
 * Corrige las rutas de iconos para que sean absolutas o relativas correctas
 */
function fixIconPaths(config, extensionPath) {
  // Verificar si hay definiciones de iconos
  if (!config.iconDefinitions) return;

  // Para cada definición de icono, corregir la ruta
  for (const [key, value] of Object.entries(config.iconDefinitions)) {
    if (value.iconPath) {
      // Verificar si la ruta existe
      const fullPath = path.isAbsolute(value.iconPath)
        ? value.iconPath
        : path.join(extensionPath, value.iconPath);

      if (!fs.existsSync(fullPath)) {
        console.warn(`Advertencia: Icono no encontrado en ${fullPath}`);

        // Intentar corregir la ruta
        let correctedPath = null;

        // 1. Quitar ./ si existe y probar
        if (value.iconPath.startsWith("./")) {
          const withoutDot = value.iconPath.substring(2);
          const withoutDotPath = path.join(extensionPath, withoutDot);
          if (fs.existsSync(withoutDotPath)) {
            correctedPath = withoutDot;
          }
        }
        // 2. Agregar ./ si no existe y probar
        else if (
          !value.iconPath.startsWith("./") &&
          !path.isAbsolute(value.iconPath)
        ) {
          const withDot = `./${value.iconPath}`;
          const withDotPath = path.join(extensionPath, withDot);
          if (fs.existsSync(withDotPath)) {
            correctedPath = withDot;
          }
        }

        // 3. Buscar el archivo en cualquier ubicación
        if (!correctedPath) {
          const fileName = path.basename(value.iconPath);
          findFileInDir(extensionPath, fileName).then((foundPath) => {
            if (foundPath) {
              const relativePath = path.relative(extensionPath, foundPath);
              console.log(`Icono encontrado en: ${relativePath}`);
              value.iconPath = `./${relativePath.replace(/\\/g, "/")}`;
            }
          });
        } else {
          value.iconPath = correctedPath;
        }
      }

      // Si la ruta es relativa, asegurarse que comienza con ./ o ../
      if (!path.isAbsolute(value.iconPath) && !value.iconPath.startsWith(".")) {
        value.iconPath = `./${value.iconPath}`;
      }
    }
  }
}

/**
 * Asegura que los colores estén definidos correctamente en los iconos
 */
function fixIconColors(config) {
  // Verificar si hay definiciones de iconos
  if (!config.iconDefinitions) return;

  // Para cada definición de icono, verificar y corregir colores
  for (const [key, value] of Object.entries(config.iconDefinitions)) {
    // Asegurarse de que el fontColor está definido si es necesario
    if (
      !value.fontColor &&
      key !== "_file" &&
      key !== "_folder" &&
      key !== "_folder_open"
    ) {
      value.fontColor = "#519aba"; // Color azul por defecto de Seti
    }

    // Verificar si hay definiciones de iconos fontCharacter pero sin fontColor
    if (value.fontCharacter && !value.fontColor) {
      value.fontColor = "#519aba"; // Color azul por defecto de Seti
    }
  }
}

/**
 * Mezcla dos configuraciones de iconos
 */
function mergeConfigurations(baseConfig, frameworkConfig, extensionPath) {
  try {
    // Crear una copia profunda del objeto base
    const result = JSON.parse(JSON.stringify(baseConfig));

    // Mezclar definiciones de iconos
    result.iconDefinitions = {
      ...result.iconDefinitions,
      ...frameworkConfig.iconDefinitions,
    };

    // Corregir rutas de iconos en la configuración mezclada
    fixIconPaths(result, extensionPath);

    // Mezclar extensiones de archivo
    if (frameworkConfig.fileExtensions) {
      result.fileExtensions = {
        ...result.fileExtensions,
        ...frameworkConfig.fileExtensions,
      };
    }

    // Mezclar nombres de archivo
    if (frameworkConfig.fileNames) {
      result.fileNames = {
        ...result.fileNames,
        ...frameworkConfig.fileNames,
      };
    }

    // Mezclar IDs de lenguaje
    if (frameworkConfig.languageIds) {
      result.languageIds = {
        ...result.languageIds,
        ...frameworkConfig.languageIds,
      };
    }

    return result;
  } catch (error) {
    console.error("Error al mezclar configuraciones:", error);
    return baseConfig; // Si hay error, devolver la configuración base
  }
}

/**
 * Genera una configuración de iconos básica en caso de error
 */
function generateBasicIconConfig(extensionPath) {
  console.log("Generando configuración básica de emergencia");

  // Verificar si existen iconos básicos
  const filePath = path.join(extensionPath, "icons", "file.svg");
  const folderPath = path.join(extensionPath, "icons", "folder.svg");
  const folderOpenPath = path.join(extensionPath, "icons", "folder-open.svg");

  // Usar rutas relativas correctas
  const fileIconPath = fs.existsSync(filePath) ? "./icons/file.svg" : "";
  const folderIconPath = fs.existsSync(folderPath) ? "./icons/folder.svg" : "";
  const folderOpenIconPath = fs.existsSync(folderOpenPath)
    ? "./icons/folder-open.svg"
    : "";

  return {
    iconDefinitions: {
      _file: {
        iconPath: fileIconPath,
        fontColor: "#cccccc",
      },
      _folder: {
        iconPath: folderIconPath,
        fontColor: "#7ca1c0",
      },
      _folder_open: {
        iconPath: folderOpenIconPath,
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
}

// Si se ejecuta como script principal, generar archivo seti.json
if (require.main === module) {
  const extensionPath = path.join(__dirname, "..");

  // Determinar la ubicación correcta del archivo de configuración
  let iconFilePath;
  try {
    const packageJsonPath = path.join(extensionPath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (
      packageJson.contributes &&
      packageJson.contributes.iconThemes &&
      packageJson.contributes.iconThemes.length > 0
    ) {
      iconFilePath = path.join(
        extensionPath,
        packageJson.contributes.iconThemes[0].path
      );
    } else {
      iconFilePath = path.join(extensionPath, "seti.json");
    }
  } catch (error) {
    console.error("Error al leer package.json:", error);
    iconFilePath = path.join(extensionPath, "seti.json");
  }

  console.log(`Generando archivo de configuración en: ${iconFilePath}`);

  generateIconConfig(extensionPath, null)
    .then((config) => {
      // Asegurar que el directorio existe
      const iconDir = path.dirname(iconFilePath);
      if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
      }

      fs.writeFileSync(iconFilePath, JSON.stringify(config, null, 2));
      console.log("Archivo de configuración de iconos generado correctamente");
    })
    .catch((error) => {
      console.error("Error al generar configuración de iconos:", error);
    });
}

module.exports = {
  generateIconConfig,
};
