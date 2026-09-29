// Tests de las Cloud Functions de grupos (crearGrupo, unirseAGrupo) contra el emulador de
// Firestore (proyecto demo-*, nunca producción). Usan el firebase-admin del backend.
import { createRequire } from "node:module";
import { after, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

const requireBackend = createRequire(new URL("../../backend/package.json", import.meta.url));
const { initializeApp } = requireBackend("firebase-admin/app");
const { getFirestore } = requireBackend("firebase-admin/firestore");
const functionsTest = requireBackend("firebase-functions-test")({ projectId: "demo-gym-tracker" });

initializeApp({ projectId: "demo-gym-tracker" });
const { crearGrupo, unirseAGrupo } = requireBackend("./src/grupos/gestionGrupos.js");
const crear = functionsTest.wrap(crearGrupo);
const unirse = functionsTest.wrap(unirseAGrupo);
const db = getFirestore();

const usuario = (email, verificado = true) => ({ uid: "u-" + email, token: { email, email_verified: verificado } });
const llamada = (data, auth) => ({ data, auth });

const vaciar = async () => {
  const snap = await db.collection("grupos").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
};

beforeEach(vaciar);
after(() => functionsTest.cleanup());

describe("crearGrupo", () => {
  test("crea el grupo con el usuario como admin y único miembro, y código GYM-XXXX", async () => {
    const { id, codigoInvitacion } = await crear(llamada({ nombre: "  Los del gym  " }, usuario("ana@example.com")));
    const g = (await db.doc(`grupos/${id}`).get()).data();
    assert.equal(g.nombre, "Los del gym");
    assert.equal(g.adminEmail, "ana@example.com");
    assert.deepEqual(g.miembros, ["ana@example.com"]);
    assert.match(codigoInvitacion, /^GYM-[A-Z0-9]{4}$/);
    assert.equal(g.codigoInvitacion, codigoInvitacion);
  });

  test("los códigos no se repiten", async () => {
    const codigos = new Set();
    for (let i = 0; i < 15; i++) codigos.add((await crear(llamada({ nombre: `G${i}` }, usuario("ana@example.com")))).codigoInvitacion);
    assert.equal(codigos.size, 15);
  });

  test("rechaza sin login, sin email verificado o con nombre inválido", async () => {
    await assert.rejects(crear(llamada({ nombre: "X" }, undefined)), /autenticación/);
    await assert.rejects(crear(llamada({ nombre: "X" }, usuario("ana@example.com", false))), /verificado/);
    await assert.rejects(crear(llamada({ nombre: "   " }, usuario("ana@example.com"))), /nombre/);
    await assert.rejects(crear(llamada({ nombre: "x".repeat(61) }, usuario("ana@example.com"))), /nombre/);
  });
});

describe("unirseAGrupo", () => {
  test("agrega al usuario sin pisar a los demás", async () => {
    await db.doc("grupos/g1").set({ nombre: "G1", adminEmail: "ana@example.com", miembros: ["ana@example.com"], codigoInvitacion: "GYM-AB12" });
    const res = await unirse(llamada({ codigo: " gym-ab12 " }, usuario("beto@example.com")));
    assert.deepEqual(res, { id: "g1", nombre: "G1" });
    assert.deepEqual((await db.doc("grupos/g1").get()).data().miembros, ["ana@example.com", "beto@example.com"]);
  });

  test("código inexistente, mal formado o ya miembro: error claro", async () => {
    await db.doc("grupos/g1").set({ nombre: "G1", adminEmail: "ana@example.com", miembros: ["ana@example.com"], codigoInvitacion: "GYM-AB12" });
    await assert.rejects(unirse(llamada({ codigo: "GYM-ZZZZ" }, usuario("beto@example.com"))), /No se encontró/);
    await assert.rejects(unirse(llamada({ codigo: "<script>" }, usuario("beto@example.com"))), /GYM-XXXX/);
    await assert.rejects(unirse(llamada({ codigo: "GYM-AB12" }, usuario("ana@example.com"))), /Ya sos miembro/);
  });

  test("código repetido (de antes de la fase 2): no adivina el grupo", async () => {
    await db.doc("grupos/g1").set({ nombre: "G1", miembros: [], codigoInvitacion: "GYM-DUPE" });
    await db.doc("grupos/g2").set({ nombre: "Trampa", miembros: [], codigoInvitacion: "GYM-DUPE" });
    await assert.rejects(unirse(llamada({ codigo: "GYM-DUPE" }, usuario("beto@example.com"))), /repetido/);
  });

  test("rechaza sin login o sin email verificado", async () => {
    await assert.rejects(unirse(llamada({ codigo: "GYM-AB12" }, undefined)), /autenticación/);
    await assert.rejects(unirse(llamada({ codigo: "GYM-AB12" }, usuario("beto@example.com", false))), /verificado/);
  });
});
