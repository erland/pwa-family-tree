import { readFile, stat } from "node:fs/promises";

const file = process.argv[2];
if (!file) throw new Error("Provide HTML file");
const html = await readFile(file, "utf8");

if (!html.includes('<div id="root"></div>')) throw new Error("Missing app root");
const scripts = [...html.matchAll(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi)];
if (scripts.length !== 1 || !/^<script type="module">/.test(scripts[0][0]))
  throw new Error("Expected one inline application script");
if (!html.includes("<style>")) throw new Error("Missing inline CSS");

// Inspect HTML markup outside the bundled JavaScript only. A JS bundle may
// legitimately contain strings that look like external <script>/<link> tags.
const markup = html.slice(0, scripts[0].index) + html.slice(scripts[0].index + scripts[0][0].length);
const external = [...markup.matchAll(/<(?:script|link)\\b[^>]*>/gi)].filter(
  ([tag]) => /\\b(?:src|href)="(?!data:|#)[^"]+"/i.test(tag)
);
if (external.length) throw new Error("External HTML asset: " + external[0][0].slice(0, 160));
if (/rel="manifest"/.test(markup)) throw new Error("PWA manifest remains");

console.log(`Standalone HTML structure OK (${(await stat(file)).size} bytes)`);
