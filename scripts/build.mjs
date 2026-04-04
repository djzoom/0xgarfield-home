import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const srcPagesDir = path.join(projectRoot, "src", "pages");
const publicDir = path.join(projectRoot, "public");
const distDir = path.join(projectRoot, "dist");
const configPath = path.join(projectRoot, "config", "site.json");

const routeAliases = new Map([
  ["index-zh.html", path.join("index-zh", "index.html")],
  ["evidence.html", path.join("evidence", "index.html")],
  ["evidence-zh.html", path.join("evidence-zh", "index.html")],
  ["404.html", path.join("404", "index.html")]
]);

function flattenConfig(value, prefix = "", output = {}) {
  if (Array.isArray(value)) {
    output[prefix] = value;
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenConfig(nestedValue, nextPrefix, output);
    }
    return output;
  }
  output[prefix] = value;
  return output;
}

function renderTemplate(template, variables, filename) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (match, key) => {
    if (!(key in variables)) {
      throw new Error(`Missing template variable "${key}" while rendering ${filename}`);
    }
    return String(variables[key]);
  });
}

async function writeAliasIfNeeded(filename, rendered) {
  const alias = routeAliases.get(filename);
  if (!alias) return;
  const aliasPath = path.join(distDir, alias);
  await mkdir(path.dirname(aliasPath), { recursive: true });
  await writeFile(aliasPath, rendered, "utf8");
}

async function copyDirectoryContents(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryContents(sourcePath, targetPath);
      continue;
    }
    const fileContents = await readFile(sourcePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, fileContents);
  }
}

export async function buildSite() {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const variables = flattenConfig(config);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await copyDirectoryContents(publicDir, distDir);

  const pageFilenames = (await readdir(srcPagesDir)).filter((filename) => filename.endsWith(".html"));
  for (const filename of pageFilenames) {
    const sourcePath = path.join(srcPagesDir, filename);
    const outputPath = path.join(distDir, filename);
    const template = await readFile(sourcePath, "utf8");
    const rendered = renderTemplate(template, variables, filename);
    await writeFile(outputPath, rendered, "utf8");
    await writeAliasIfNeeded(filename, rendered);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildSite();
}
