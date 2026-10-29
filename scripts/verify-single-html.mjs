import { readFile, stat } from "node:fs/promises";

const file = process.argv[2];
if (!file) throw new Error("Provide HTML file");
const html = await readFile(file, "utf8");

if (!html.includes('<div id="root"></div>')) throw new Error("Missing app root");
const scriptOpen = html.indexOf('<script type="module">');
const scriptClose = html.lastIndexOf('</script>');
if (scriptOpen < 0 || scriptClose <= scriptOpen) throw new Error("Missing inline application script");
if (!html.includes("<style>")) throw new Error("Missing inline CSS");

// Exclude the embedded application code before inspecting asset links.
const markup = html.slice(0, scriptOpen) + html.slice(scriptClose + '</script>'.length);
const tags = markup.match(/<(?:script|link)\b[^>]*>/gi) ?? [];
const external = tags.find((tag) => /\b(?:src|href)="(?!data:|#)[^"]+"/i.test(tag));
if (external) throw new Error("External HTML asset: " + external.slice(0, 160));
if (markup.includes('rel="manifest"')) throw new Error("PWA manifest remains");

console.log(`Standalone HTML structure OK (${(await stat(file)).size} bytes)`);
