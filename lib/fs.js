"use strict";

const fs = require('fs');
const path = require('path');

const readdir = function(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err ,dirs) => {
            if (err) {
                reject(err);
            } else {
                resolve(dirs);
            }
        })
    })
};

/**
 * Lee un archivo y devuelve su contenido como promesa
 * @param {string} filePath Ruta al archivo
 * @returns {Promise<string>} Contenido del archivo
 */
exports.readFile = function(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

/**
 * Escribe datos en un archivo como promesa
 * @param {string} filePath Ruta al archivo
 * @param {string|Buffer} data Datos a escribir
 * @returns {Promise<void>}
 */
exports.writeFile = function(filePath, data) {
    return new Promise((resolve, reject) => {
        const dirname = path.dirname(filePath);
        
        // Asegurar que el directorio existe
        if (!fs.existsSync(dirname)) {
            try {
                fs.mkdirSync(dirname, { recursive: true });
            } catch (err) {
                return reject(err);
            }
        }
        
        fs.writeFile(filePath, data, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const writeFile = function(file, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
};

// Exportar funciones del fs nativo
exports.existsSync = fs.existsSync;
exports.mkdirSync = fs.mkdirSync;
exports.readFileSync = fs.readFileSync;
exports.writeFileSync = fs.writeFileSync;

exports.readdir = readdir;
exports.readFile = readFile;
exports.writeFile = writeFile;