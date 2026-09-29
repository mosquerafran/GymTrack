import {
  conteoPorTipo,
  descripcionDe,
  diasEntrenados,
  diasPorMusculo,
  diasPorTren,
  etiquetaDe,
  lideresPorZona,
  musculosDe,
  musculosDeNombre,
  nivelDeCalor,
  tipoDe,
  ultimaVezPorMusculo,
} from "./entrenos";

const NOMBRES = { c1: "Push", c2: "Futbol", c3: "Running 🏳️‍🌈", c4: "Fútbol 5" };

describe("tipoDe", () => {
  test("usa el tipo de los docs nuevos", () => {
    expect(tipoDe({ tipo: "running" })).toBe("running");
  });

  test("docs viejos: deduce por el nombre de la categoría (categoriaId o catId)", () => {
    expect(tipoDe({ categoriaId: "c2" }, NOMBRES)).toBe("futbol");
    expect(tipoDe({ catId: "c4" }, NOMBRES)).toBe("futbol");
    expect(tipoDe({ catId: "c3" }, NOMBRES)).toBe("running");
    expect(tipoDe({ categoriaId: "c1" }, NOMBRES)).toBe("gym");
  });

  test("sin pista (categoría borrada o tipo inválido) asume gym", () => {
    expect(tipoDe({ categoriaId: "borrada" }, NOMBRES)).toBe("gym");
    expect(tipoDe({ tipo: "crossfit" })).toBe("gym");
  });
});

describe("musculosDe", () => {
  test("filtra inválidos, saca repetidos y respeta el orden de la lista", () => {
    expect(musculosDe({ musculos: ["triceps", "pecho", "cualquiera", "pecho"] })).toEqual(["pecho", "triceps"]);
  });

  test("docs viejos no tienen músculos", () => {
    expect(musculosDe({ categoriaId: "c1" })).toEqual([]);
    expect(musculosDe({ musculos: "pecho" })).toEqual([]);
  });
});

describe("etiquetaDe y descripcionDe", () => {
  test("la etiqueta nueva gana; si no, el nombre de la categoría vieja", () => {
    expect(etiquetaDe({ etiqueta: " Minubi 🥵 ", categoriaId: "c1" }, NOMBRES)).toBe("Minubi 🥵");
    expect(etiquetaDe({ catId: "c1" }, NOMBRES)).toBe("Push");
    expect(etiquetaDe({ etiqueta: "   " })).toBe("");
  });

  test("gym con músculos los lista; si no, el nombre del tipo", () => {
    expect(descripcionDe({ tipo: "gym", musculos: ["hombros", "pecho"] })).toBe("Pecho · Hombros");
    expect(descripcionDe({ tipo: "gym" })).toBe("Gym");
    expect(descripcionDe({ tipo: "futbol" })).toBe("Fútbol");
    expect(descripcionDe({ categoriaId: "c2" }, NOMBRES)).toBe("Fútbol");
  });
});

describe("todo suma", () => {
  const entrenos = [
    { fecha: "2026-09-01", tipo: "gym" },
    { fecha: "2026-09-01", tipo: "futbol" }, // mismo día: cuenta una vez
    { fecha: "2026-09-02", categoriaId: "c2" }, // viejo, categoría que antes "no contaba"
    { fecha: "2026-09-03", catId: "borrada" }, // viejo, categoría borrada: antes se ignoraba
    { tipo: "gym" }, // sin fecha: no suma
  ];

  test("diasEntrenados cuenta todos los tipos, docs viejos y categorías borradas", () => {
    expect([...diasEntrenados(entrenos)].sort()).toEqual(["2026-09-01", "2026-09-02", "2026-09-03"]);
  });

  test("conteoPorTipo agrupa y ordena de mayor a menor", () => {
    expect(conteoPorTipo(entrenos, NOMBRES)).toEqual([
      { tipo: "gym", cantidad: 3 },
      { tipo: "futbol", cantidad: 2 },
    ]);
  });
});

describe("diasPorMusculo", () => {
  test("cuenta días distintos por músculo dentro del rango", () => {
    const entrenos = [
      { fecha: "2026-09-21", tipo: "gym", musculos: ["pecho", "triceps"] },
      { fecha: "2026-09-21", tipo: "gym", musculos: ["pecho"] }, // mismo día: 1
      { fecha: "2026-09-23", tipo: "gym", musculos: ["pecho"] },
      { fecha: "2026-09-28", tipo: "gym", musculos: ["pecho"] }, // fuera del rango
      { fecha: "2026-09-22", tipo: "futbol" },
    ];
    expect(diasPorMusculo(entrenos, "2026-09-21", "2026-09-27")).toEqual({ pecho: 2, triceps: 1 });
  });
});

describe("deducción de músculos en entrenos viejos (sin tocar datos)", () => {
  // Las categorías por defecto reales de cada uno (constants.js → CATEGORIAS_POR_DEFECTO).
  test.each([
    ["Push", ["pecho", "hombros", "triceps"]],
    ["Pull", ["trapecio", "dorsales", "biceps", "antebrazos"]],
    ["Legs", ["gluteos", "cuadriceps", "isquios", "aductores", "gemelos"]],
    ["Brazos", ["biceps", "triceps", "antebrazos"]],
    ["Pecho-Espalda", ["pecho", "trapecio", "dorsales"]],
    ["Espalda-triceps", ["trapecio", "dorsales", "triceps"]],
    ["Pecho-biceps", ["pecho", "biceps"]],
    ["Pierna-hombro", ["hombros", "gluteos", "cuadriceps", "isquios", "aductores", "gemelos"]],
    ["Brazos-hombro", ["hombros", "biceps", "triceps", "antebrazos"]],
    ["Torso", ["pecho", "hombros", "trapecio", "dorsales", "biceps", "triceps"]],
    ["Patas", ["gluteos", "cuadriceps", "isquios", "aductores", "gemelos"]],
    ["Empuje", ["pecho", "hombros", "triceps"]],
    ["Tracción", ["trapecio", "dorsales", "biceps", "antebrazos"]],
    ["Minubi 🥵", []],
  ])("%s", (nombre, esperado) => {
    expect(musculosDeNombre(nombre)).toEqual(esperado);
  });

  test("musculosDe deduce solo si el doc no trae músculos y es de gym", () => {
    const nombres = { c1: "Push", c2: "Futbol", c3: "Hikking" };
    expect(musculosDe({ categoriaId: "c1" }, nombres)).toEqual(["pecho", "hombros", "triceps"]);
    expect(musculosDe({ catId: "c2" }, nombres)).toEqual([]); // fútbol: sin músculos
    expect(tipoDe({ catId: "c3" }, nombres)).toBe("otro"); // "Hikking" (sic)
    expect(musculosDe({ categoriaId: "c1", musculos: ["biceps"] }, nombres)).toEqual(["biceps"]); // lo marcado gana
    expect(musculosDe({ categoriaId: "c1", musculos: [] }, nombres)).toEqual([]); // marcado vacío: no deduce
  });
});

describe("stats por músculo", () => {
  const nombres = { push: "Push", legs: "Legs" };
  const entrenos = [
    { fecha: "2026-09-01", userName: "Fran", categoriaId: "push" },
    { fecha: "2026-09-02", userName: "Fran", tipo: "gym", musculos: ["pecho"] },
    { fecha: "2026-09-03", userName: "Juan", catId: "legs" },
    { fecha: "2026-09-04", userName: "Juan", tipo: "gym", musculos: ["cuadriceps", "pecho"] },
    { fecha: "2026-09-05", userName: "Juan", tipo: "gym", musculos: ["pecho"] },
    { fecha: "2026-08-20", userName: "Fran", tipo: "gym", musculos: ["isquios"] }, // fuera de septiembre
  ];

  test("diasPorTren cuenta días con algo de arriba / de abajo", () => {
    expect(diasPorTren(entrenos, "2026-09-01", "2026-09-30", nombres)).toEqual({ superior: 4, inferior: 2 });
  });

  test("ultimaVezPorMusculo toma la fecha más nueva de todo el historial", () => {
    const u = ultimaVezPorMusculo(entrenos, nombres);
    expect(u.pecho).toBe("2026-09-05");
    expect(u.isquios).toBe("2026-09-03");
    expect(u.lumbares).toBeUndefined();
  });

  test("lideresPorZona: el que más días entrenó cada zona, empate por nombre", () => {
    const l = lideresPorZona(entrenos, "2026-09-01", "2026-09-30", nombres);
    expect(l).toContainEqual({ zona: "Pecho", nombre: "Fran", dias: 2 }); // 2 a 2 con Juan: gana por nombre
    expect(l).toContainEqual({ zona: "Piernas", nombre: "Juan", dias: 2 });
    expect(l.find((z) => z.zona === "Core")).toBeUndefined(); // nadie entrenó core
  });

  test("nivelDeCalor según umbrales", () => {
    expect([0, 1, 2, 3, 5, 6].map((d) => nivelDeCalor(d, [1, 3, 6]))).toEqual([0, 1, 1, 2, 2, 3]);
  });
});
