import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";

const root = resolve("dist-single");
const htmlPath = join(root, "index.html");
let html = await readFile(htmlPath, "utf8");
const used = new Set();

async function inlineAsset(path) {
  const file = join(root, path.replace(/^\.\//, "").replace(/^\//, ""));
  const bytes = await readFile(file);
  const ext = file.split(".").pop()?.toLowerCase();
  const mime = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    svg: "image/svg+xml", ico: "image/x-icon", webp: "image/webp",
    woff: "font/woff", woff2: "font/woff2" })[ext] || "application/octet-stream";
  used.add(file);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

for (const match of [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]) {
  const src = match[1];
  const source = await readFile(join(root, src.replace(/^\.\//, "")), "utf8");
  used.add(join(root, src.replace(/^\.\//, "")));
  html = html.replace(match[0], `<script type="module">\n${source.replaceAll("</script", "<\\/script")}\n</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]) {
  const href = /href="([^"]+)"/.exec(match[0])?.[1];
  if (!href) throw new Error("Missing stylesheet href");
  const file = join(root, href.replace(/^\.\//, ""));
  const css = await readFile(file, "utf8");
  used.add(file);
  html = html.replace(match[0], `<style>${css.replaceAll("</style", "<\\/style")}</style>`);
}
// A standalone file must not reference its PWA manifest or loose image files.
html = html.replace(/<link\b[^>]*rel="manifest"[^>]*>/g, "");
for (const match of [...html.matchAll(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g)]) {
  const href = /href="([^"]+)"/.exec(match[0])?.[1];
  html = html.replace(match[0], href ? match[0].replace(href, await inlineAsset(href)) : "");
}
await writeFile(join(root, "family-tree.html"), html);
console.log("Created dist-single/family-tree.html");
