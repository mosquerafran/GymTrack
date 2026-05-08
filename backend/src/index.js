/**
 * Gym Tracker — Firebase Cloud Functions
 * Entry point: exporta todas las funciones del backend.
 */

// Auth
exports.onUserCreated = require("./auth/onUserCreated").onUserCreated;
exports.verificarAcceso = require("./auth/verificarAcceso").verificarAcceso;

// Grupos
exports.repararMiembrosVip = require("./grupos/repararMiembros").repararMiembrosVip;

// Categorías
exports.restaurarCategorias = require("./categorias/restaurarCategorias").restaurarCategorias;
