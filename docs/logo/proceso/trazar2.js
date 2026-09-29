const sharp = require("sharp");
const potrace = require("potrace");
const fs = require("fs");
const src = "E:/Proyectos-Trabajos/gym-tracker/docs/logo/image.png";
const trazar = (buf, o) => new Promise((r, j) => potrace.trace(buf, o, (e, s) => (e ? j(e) : r(s))));
async function v(nombre, region, invertir, blur) {
  let buf = await sharp(src).extract(region).resize({ width: region.width * 8, kernel: "lanczos3" }).greyscale().blur(blur).toBuffer();
  if (invertir) buf = await sharp(buf).negate({ alpha: false }).toBuffer();
  buf = await sharp(buf).threshold(128).png().toBuffer();
  const svg = await trazar(buf, { threshold: 128, turdSize: 400, alphaMax: 1.0, optCurve: true, optTolerance: 0.8, color: "#000000", background: "transparent" });
  fs.writeFileSync(`../logo/gorila-${nombre}.svg`, svg);
  await sharp(Buffer.from(svg)).resize({ width: 480 }).flatten({ background: "#ffffff" }).png().toFile(`../logo/prev-${nombre}.png`);
  console.log(nombre, svg.length);
}
(async () => {
  await v("negro2", { left: 122, top: 32, width: 102, height: 90 }, false, 3);
  await v("blanco", { left: 82, top: 248, width: 110, height: 100 }, true, 2.2);
  const a = await sharp("../logo/prev-negro2.png").toBuffer(), b = await sharp("../logo/prev-blanco.png").toBuffer();
  const ha = (await sharp(a).metadata()).height, hb = (await sharp(b).metadata()).height;
  await sharp({ create: { width: 1000, height: Math.max(ha, hb) + 20, channels: 3, background: "#bbbbbb" } })
    .composite([{ input: a, left: 10, top: 10 }, { input: b, left: 510, top: 10 }]).png().toFile("../logo/comparar.png");
})();
