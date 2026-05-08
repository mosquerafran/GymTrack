// ─── Admin & VIP ─────────────────────────────────────────────────────────────
export const ADMIN_EMAIL = "mosquerafran265@gmail.com";

export const MIEMBROS_MILLER = [
  "mosquerafran265@gmail.com",
  "rravenna59@gmail.com",
  "pedrozaffino@gmail.com",
  "jgonzalezgalceran@gmail.com",
];

// ─── Categorías por defecto por usuario ───────────────────────────────────────
export const CATEGORIAS_POR_DEFECTO = {
  "mosquerafran265@gmail.com": ["Brazos", "Pull", "Futbol", "Pecho-Espalda", "Push", "Legs"],
  "pedrozaffino@gmail.com": ["Espalda-triceps", "Pecho-biceps", "Fútbol", "Pierna-hombro", "Brazos-hombro", "Pecho-espalda"],
  "jgonzalezgalceran@gmail.com": ["Running 🏳️‍🌈", "Torso", "Patas", "Empuje", "Minubi 🥵", "Tracción"],
  "rravenna59@gmail.com": ["Push", "Legs", "Hikking", "Pull", "Brazos"],
};

// ─── Chistes motivacionales ───────────────────────────────────────────────────
export const CHISTES = [
  "Levantá más pesado, ese palo de escoba no va a hacer que dejes de dar lástima.",
  "Rafa… Na al pedo si no viene a entrar.",
  "Tus piernas parecen dos escarbadientes. Andá a la prensa.",
  "Metele pesado, que sino vas a terminar runner.",
  "Ese peso lo levanta mi abuela... y está muerta hace 5 años.",
  "Más vale que estés entrenando intenso porque cara no se puede entrenar.",
  "Todos los números suben… Salvo el importante 🥵.",
  "⁠Piernas se entrena aunque juegues al fútbol hijo de puta.",
  "A meterle, hay que seguir siendo hermanos mayores.",
  "Dale anota, que hay que llegar a los 200 días.",
  "El que no entrena es gay.",
  "¿⁠Ese peso levantas? Kjjj andá a crossfit que es más digno.",
  "⁠¿¿¿¿Otra vez arriba???? Vas a terminar como un enchufe 🔌",
  "¿Esa es tu serie de aproximación o ya estás pidiendo el alta en pilates?",
  "⁠Metele un disco más que ese peso lo levanta mi abuela para cerrar la persiana.",
  "Menos mal que el descanso es parte del entrenamiento, porque sos atleta olímpico pedazo de gitano.",
  "⁠Que el talle XL de la remera sea de músculo y no de grasa gordo bondiola.",
];

export const chisteRandom = () => CHISTES[Math.floor(Math.random() * CHISTES.length)];
