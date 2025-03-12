/**
 * Script para reinstalar los iconos desde cero.
 * Ejecutar este script si los iconos no se muestran correctamente.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Ruta base de la extensión
const extensionPath = __dirname;
console.log(`Ruta de extensión: ${extensionPath}`);

// Determinar la ubicación correcta de la configuración de iconos
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

console.log(`Archivo de configuración de iconos: ${iconFilePath}`);

// Eliminar archivo de configuración existente para forzar regeneración
try {
  if (fs.existsSync(iconFilePath)) {
    console.log(`Eliminando configuración actual: ${iconFilePath}`);
    fs.unlinkSync(iconFilePath);
  }
} catch (error) {
  console.error(`Error al eliminar archivo: ${error.message}`);
}

// Generar configuración básica
try {
  // Importar módulo de generación de iconos
  const { generateIconConfig } = require("./lib/icon");

  console.log("Generando nueva configuración de iconos...");
  generateIconConfig(extensionPath, null)
    .then((config) => {
      // Asegurar que el directorio existe
      const iconDir = path.dirname(iconFilePath);
      if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
      }

      fs.writeFileSync(iconFilePath, JSON.stringify(config, null, 2));
      console.log(
        "Archivo de configuración de iconos regenerado correctamente"
      );

      console.log("\nOperación completada. Ahora necesitas:");
      console.log("1. Recargar VS Code");
      console.log(
        "2. Configurar el tema de iconos: Preferences > File Icon Theme > Seti"
      );
    })
    .catch((error) => {
      console.error("Error al generar configuración de iconos:", error);
    });
} catch (error) {
  console.error(`Error al ejecutar script: ${error.message}`);
}
