/**
 * Gym Tracker — Firebase Cloud Functions
 * Entry point: exporta todas las funciones del backend.
 */

const { initializeApp } = require("firebase-admin/app");
initializeApp();

// Auth
exports.onUserCreated = require("./auth/onUserCreated").onUserCreated;
exports.verificarAcceso = require("./auth/verificarAcceso").verificarAcceso;

// Grupos
exports.repararMiembrosVip = require("./grupos/repararMiembros").repararMiembrosVip;
exports.crearGrupo = require("./grupos/gestionGrupos").crearGrupo;
exports.unirseAGrupo = require("./grupos/gestionGrupos").unirseAGrupo;

// Categorías
exports.restaurarCategorias = require("./categorias/restaurarCategorias").restaurarCategorias;
