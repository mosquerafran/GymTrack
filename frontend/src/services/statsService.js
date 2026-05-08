import { cargarAsistenciasParaStats } from "./asistenciasService";
import { cargarMapaCategorias } from "./categoriasService";

/**
 * Calcula las estadísticas completas para la página Stats.
 *
 * @param {string} userId - UID del usuario actual
 * @param {string} grupoId - ID del grupo activo
 * @param {string} periodo - "mes" | "global"
 * @returns {Promise<{ stats: Array, totalDias: number, ranking: Array }>}
 */
export const calcularStats = async (userId, grupoId, periodo) => {
  const [{ misAsistencias, todasAsistencias }, mapaCategorias] = await Promise.all([
    cargarAsistenciasParaStats(grupoId, userId),
    cargarMapaCategorias(),
  ]);

  // Filtrar por período si corresponde
  let misAsisDocs = misAsistencias;
  let globalAsisDocs = todasAsistencias;

  if (periodo === "mes") {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    misAsisDocs = misAsisDocs.filter((d) => d.data().fecha >= inicioMes);
    globalAsisDocs = globalAsisDocs.filter((d) => d.data().fecha >= inicioMes);
  }

  // Filtro adicional por grupo (documentos sin grupoId son legacy)
  if (grupoId) {
    misAsisDocs = misAsisDocs.filter(
      (d) => !d.data().grupoId || d.data().grupoId === grupoId
    );
    globalAsisDocs = globalAsisDocs.filter(
      (d) => !d.data().grupoId || d.data().grupoId === grupoId
    );
  }

  // ── Mis estadísticas ───────────────────────────────────────────────────────
  const misCategorias = Object.values(mapaCategorias).filter(
    (c) => c.userId === userId
  );

  const conteo = {};
  misCategorias.forEach((c) => (conteo[c.id] = 0));
  const diasQueCuentan = new Set();

  misAsisDocs.forEach((document) => {
    const data = document.data();
    const cat = mapaCategorias[data.categoriaId];
    if (!cat) return;
    if (conteo[cat.id] !== undefined) conteo[cat.id]++;
    if (cat.cuenta) diasQueCuentan.add(data.fecha);
  });

  const stats = misCategorias.map((c) => ({
    nombre: c.nombre,
    valor: conteo[c.id] || 0,
  }));

  // ── Ranking global ─────────────────────────────────────────────────────────
  const usuariosMap = {};
  globalAsisDocs.forEach((document) => {
    const data = document.data();
    const cat = mapaCategorias[data.categoriaId];
    if (!cat) return;

    const usr = data.userName || "Desconocido";
    if (!usuariosMap[usr]) {
      usuariosMap[usr] = { nombre: usr, dias: new Set(), categorias: {} };
    }
    if (!usuariosMap[usr].categorias[cat.nombre]) {
      usuariosMap[usr].categorias[cat.nombre] = 0;
    }
    usuariosMap[usr].categorias[cat.nombre]++;
    if (cat.cuenta) usuariosMap[usr].dias.add(data.fecha);
  });

  const ranking = Object.values(usuariosMap)
    .map((u) => ({ nombre: u.nombre, dias: u.dias.size, categorias: u.categorias }))
    .sort((a, b) => b.dias - a.dias);

  return { stats, totalDias: diasQueCuentan.size, ranking };
};
