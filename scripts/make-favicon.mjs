// Draws public/favicon.ico (48px) and public/favicon-96.png from
// public/favicon.svg. Browsers use the SVG; these two are for search engines
// and apps that only ask for the older kinds. Run `node scripts/make-favicon.mjs`
// after changing the icon.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../public/", import.meta.url);
const svg = readFileSync(new URL("favicon.svg", root));
const png = (size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer();

writeFileSync(new URL("favicon-96.png", root), await png(96));

// An .ico file is a small header followed by the picture, here one 48px PNG.
const image = await png(48);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one picture
header.writeUInt8(48, 6); // width
header.writeUInt8(48, 7); // height
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(image.length, 14);
header.writeUInt32LE(22, 18); // where the picture starts
writeFileSync(new URL("favicon.ico", root), Buffer.concat([header, image]));
console.log("wrote public/favicon.ico and public/favicon-96.png");
