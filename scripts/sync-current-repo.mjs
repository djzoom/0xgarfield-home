import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const legacyDir = path.resolve(projectRoot, "..", "home-site");

const syncArtifacts = [
  "index.html",
  "index-zh.html",
  "evidence.html",
  "evidence-zh.html",
  "404.html",
  "styles.css",
  "script.js",
  "_headers",
  "images"
];

await buildSite();

for (const artifact of syncArtifacts) {
  const sourcePath = path.join(distDir, artifact);
  const targetPath = path.join(legacyDir, artifact);
  await rm(targetPath, { recursive: true, force: true });
  await cp(sourcePath, targetPath, { recursive: true });
}
