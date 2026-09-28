/**
 * `constants.js` está DUPLICADO a propósito: el frontend y el backend no comparten
 * paquete (ver CLAUDE.md §4.2). Este test congela que las constantes compartidas
 * sean idénticas en los dos lados, para que "mantenelos en sync" no dependa de
 * acordarse.
 *
 * Si falla: copiá el valor correcto al otro archivo. No lo "arregles" acá.
 */
import { ADMIN_EMAIL, MIEMBROS_MILLER, CATEGORIAS_POR_DEFECTO } from "./constants";

// El backend es CommonJS; Jest lo carga aunque esté fuera de src/.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const backend = require("../../../backend/src/constants.js");

describe("constants.js frontend ↔ backend", () => {
  test("ADMIN_EMAIL es el mismo", () => {
    expect(backend.ADMIN_EMAIL).toBe(ADMIN_EMAIL);
  });

  test("MIEMBROS_MILLER es el mismo (mismos emails, mismo orden)", () => {
    expect(backend.MIEMBROS_MILLER).toEqual(MIEMBROS_MILLER);
  });

  test("CATEGORIAS_POR_DEFECTO es el mismo", () => {
    expect(backend.CATEGORIAS_POR_DEFECTO).toEqual(CATEGORIAS_POR_DEFECTO);
  });
});
