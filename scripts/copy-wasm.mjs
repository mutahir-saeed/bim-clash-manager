/**
 * Postinstall script — copies web-ifc WASM binaries to public/wasm/
 * so the browser can fetch them at runtime via the /wasm/ path.
 */
import { cpSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dest = resolve(root, "public", "wasm");

// Ensure destination exists
mkdirSync(dest, { recursive: true });

// Source — the web-ifc package ships WASM binaries at its root
const webIfcDir = resolve(root, "node_modules", "web-ifc");

if (!existsSync(webIfcDir)) {
  console.warn("[copy-wasm] web-ifc not yet installed, skipping WASM copy.");
  process.exit(0);
}

const files = ["web-ifc.wasm", "web-ifc-mt.wasm"];
let copied = 0;

for (const file of files) {
  const src = resolve(webIfcDir, file);
  if (existsSync(src)) {
    cpSync(src, resolve(dest, file));
    copied++;
    console.log(`[copy-wasm] Copied ${file} → public/wasm/`);
  }
}

if (copied === 0) {
  console.warn("[copy-wasm] No WASM files found in web-ifc package.");
} else {
  console.log(`[copy-wasm] Done — ${copied} file(s) copied.`);
}
