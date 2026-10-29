import { readFile, stat } from "node:fs/promises";
const file = process.argv[2];
if (!file) throw new Error("Provide HTML file");
const html = await readFile(file, "utf8");
if (!html.includes('<div id="root"></div>') || !html.includes('<script type="module">')) throw new Error("Missing app root or inline JavaScript");
if (!html.includes("<style>")) throw new Error("Missing inline CSS");
if (/<(?:script|link)\\b[^>]*(?:src|href)="(?!data:|#)[^"]+"[^>]*>/i.test(html)) throw new Error("External JS/CSS/resource link detected");
if (/rel="manifest"/.test(html)) throw new Error("PWA manifest remains");
console.log(`Standalone HTML structure OK (${(await stat(file)).size} bytes)`);
