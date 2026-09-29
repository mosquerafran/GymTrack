// Genera los íconos de Gym Tracker a partir del gorila vectorizado (gorila-negro2.svg).
const sharp = require("sharp");
const fs = require("fs");
const { svgPathBbox } = require("svg-path-bbox");

const PUB = "E:/Proyectos-Trabajos/gym-tracker/frontend/public/";
const SRC = "E:/Proyectos-Trabajos/gym-tracker/frontend/src/assets/";
const OUT = "../logo/";
const CARBON = "#0b0b0b"; // fondo oscuro "Fragua" (theme_color del manifest)
const HUESO = "#f2f2ef";  // hueso (texto en oscuro)

const crudo = fs.readFileSync(OUT + "gorila-negro2.svg", "utf8");
const d = [...crudo.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(" ");
const [x0, y0, x1, y1] = svgPathBbox(d);
const w = x1 - x0, h = y1 - y0;
const vb = `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
console.log("bbox", vb, "ratio", (w / h).toFixed(3));

// 1) SVG del gorila solo (para la app: toma el color del texto con currentColor)
const gorilaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="currentColor" fill-rule="evenodd"><path d="${d}"/></svg>\n`;
fs.mkdirSync(SRC, { recursive: true });
fs.writeFileSync(SRC + "gorila.svg", gorilaSvg);

// 2) Ícono cuadrado: gorila centrado ocupando `escala` del lado, sobre carbón.
const icono = (lado, escala, redondeo) => {
  const g = lado * escala;
  const gw = w >= h ? g : g * (w / h), gh = w >= h ? g * (h / w) : g;
  const ox = (lado - gw) / 2, oy = (lado - gh) / 2 + lado * 0.02; // un pelito abajo: el peso visual va arriba
  const s = gw / w;
  const r = redondeo ? ` rx="${lado * redondeo}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
<rect width="${lado}" height="${lado}"${r} fill="${CARBON}"/>
<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${s.toFixed(5)}) translate(${(-x0).toFixed(2)} ${(-y0).toFixed(2)})">
<path d="${d}" fill="${HUESO}" fill-rule="evenodd"/></g></svg>\n`;
};

(async () => {
  // favicon.svg (navegadores modernos), con bordes redondeados
  fs.writeFileSync(PUB + "favicon.svg", icono(64, 0.78, 0.18));
  const png = (svg, archivo) => sharp(Buffer.from(svg)).png().toFile(archivo);
  // "any": gorila grande; maskable: dentro del 80% seguro (Android recorta en círculo/squircle)
  await png(icono(192, 0.74, 0), PUB + "logo192.png");
  await png(icono(512, 0.74, 0), PUB + "logo512.png");
  await png(icono(512, 0.56, 0), PUB + "logo512-maskable.png");
  await png(icono(180, 0.72, 0), PUB + "apple-touch-icon.png");
  // favicon.ico con 16/32/48
  const tam = [16, 32, 48];
  const pngs = await Promise.all(tam.map((t) => sharp(Buffer.from(icono(t, 0.82, 0.18))).png().toBuffer()));
  fs.writeFileSync(PUB + "favicon.ico", ico(pngs, tam));
  // vista previa de todo
  const prev = await Promise.all([
    sharp(PUB + "logo512.png").resize(200).toBuffer(),
    sharp(PUB + "logo512-maskable.png").resize(200).composite([{ input: Buffer.from('<svg width="200" height="200"><circle cx="100" cy="100" r="100" fill="none" stroke="#e65c2a" stroke-width="3"/></svg>') }]).toBuffer(),
    sharp(PUB + "apple-touch-icon.png").resize(120).toBuffer(),
    sharp(Buffer.from(icono(32, 0.82, 0.18))).resize(96, 96, { kernel: "nearest" }).toBuffer(),
  ]);
  await sharp({ create: { width: 700, height: 220, channels: 3, background: "#e9e4da" } })
    .composite([{ input: prev[0], left: 10, top: 10 }, { input: prev[1], left: 230, top: 10 }, { input: prev[2], left: 450, top: 10 }, { input: prev[3], left: 590, top: 10 }])
    .png().toFile(OUT + "iconos.png");
  console.log("ok");
})();

// .ico con PNGs embebidos (formato válido desde Windows Vista y en todos los navegadores)
function ico(pngs, tam) {
  const cab = Buffer.alloc(6);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const dirs = pngs.map((p, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(tam[i] % 256, 0); e.writeUInt8(tam[i] % 256, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(p.length, 8); e.writeUInt32LE(offset, 12);
    offset += p.length;
    return e;
  });
  return Buffer.concat([cab, ...dirs, ...pngs]);
}
