/**
 * Constantes compartidas entre las Cloud Functions del backend.
 * Deben ser las mismas que en frontend/src/config/constants.js
 */
const ADMIN_EMAIL = "mosquerafran265@gmail.com";

const MIEMBROS_MILLER = [
  "mosquerafran265@gmail.com",
  "rravenna59@gmail.com",
  "pedrozaffino@gmail.com",
  "jgonzalezgalceran@gmail.com",
];

const CATEGORIAS_POR_DEFECTO = {
  "mosquerafran265@gmail.com": ["Brazos", "Pull", "Futbol", "Pecho-Espalda", "Push", "Legs"],
  "pedrozaffino@gmail.com": ["Espalda-triceps", "Pecho-biceps", "Fútbol", "Pierna-hombro", "Brazos-hombro", "Pecho-espalda"],
  "jgonzalezgalceran@gmail.com": ["Running 🏳️‍🌈", "Torso", "Patas", "Empuje", "Minubi 🥵", "Tracción"],
  "rravenna59@gmail.com": ["Push", "Legs", "Hikking", "Pull", "Brazos"],
};

module.exports = { ADMIN_EMAIL, MIEMBROS_MILLER, CATEGORIAS_POR_DEFECTO };
