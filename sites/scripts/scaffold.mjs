#!/usr/bin/env node
/**
 * RDK 文档站点矩阵脚手架脚本。
 *
 * 用法：
 *   node sites/scripts/scaffold.mjs                         # 生成/补齐所有站点骨架
 *   node sites/scripts/scaffold.mjs --force                 # 强制覆盖已有骨架文件
 *   node sites/scripts/scaffold.mjs --only id1,id2          # 只处理指定 id
 *   node sites/scripts/scaffold.mjs --skip-portal           # 不处理 portal
 *
 * 骨架内容（每个子站独立可运行）：
 *   - package.json、docusaurus.config.js、sidebars.js
 *   - docs/intro.md + 按 sidebar 占位 .md
 *   - src/css/custom.css、static/img/.gitkeep
 *   - .gitignore、.editorconfig、.nvmrc
 *   - LICENSE（Apache-2.0）
 *   - .github/workflows/deploy.yml（GitHub Pages 部署流水线）
 *   - README.md、MIGRATION.md（迁出为独立仓库的完整指南）
 *
 * 启用版本化的子站额外生成：
 *   - versions.json（历史版本列表，最新在前）
 *   - versioned_docs/version-X.Y.Z/（历史版本文档快照）
 *   - versioned_sidebars/version-X.Y.Z-sidebars.json
 *
 * 规则：
 *   - 已存在的文件默认不覆盖（除非传 --force）。
 *   - portal 站默认跳过（由人工维护），使用 --include-portal 才会处理。
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sitesRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(sitesRoot, "..");
const templateDir = path.join(sitesRoot, "_template");
const configPath = path.join(sitesRoot, "sites.config.json");

const args = parseArgs(process.argv.slice(2));

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const groups = Object.fromEntries((config.groups ?? []).map((g) => [g.id, g]));
const defaults = config.defaults ?? {};

const portalSite = config.sites.find((s) => s.id === "portal");
const portalBaseUrl = portalSite?.baseUrl ?? "/";
const portalUrl = joinUrl(defaults.url ?? "", portalBaseUrl);

const targetSites = filterSites(config.sites, args);

if (targetSites.length === 0) {
  console.log("[scaffold] 没有匹配到任何站点，结束。");
  process.exit(0);
}

console.log(`[scaffold] 站点仓库：${sitesRoot}`);
console.log(`[scaffold] 将处理 ${targetSites.length} 个站点：`, targetSites.map((s) => s.id).join(", "));
console.log(`[scaffold] 模式：${args.force ? "force（覆盖）" : "safe（不覆盖已有文件）"}`);

for (const site of targetSites) {
  scaffoldSite(site);
}

console.log("\n[scaffold] 完成。");

// --------------------------------------------------------------------------
// 核心实现
// --------------------------------------------------------------------------

function scaffoldSite(site) {
  const siteDir = path.join(sitesRoot, site.id);
  const group = site.group ? groups[site.group] : null;
  const sidebar = site.sidebar ?? group?.sidebar ?? [];
  const tagline = site.tagline ?? group?.description ?? defaults.tagline ?? "";

  // 版本化：sites[i].versions 优先，否则继承 groups[x].versions
  const versionsAsc = site.versions ?? group?.versions ?? []; // 由旧→新
  const hasVersioning = Array.isArray(versionsAsc) && versionsAsc.length > 0;
  const lastVersionLabel = hasVersioning ? versionsAsc[versionsAsc.length - 1] : "";
  const historicalVersionsDesc = hasVersioning
    ? versionsAsc.slice(0, -1).slice().reverse() // 去掉最新的，剩下的按新→旧
    : [];

  const vars = {
    id: site.id,
    title: site.title,
    tagline,
    description: site.description ?? group?.description ?? tagline,
    projectName: site.projectName ?? site.id,
    url: site.url ?? defaults.url ?? "",
    baseUrl: site.baseUrl ?? "/",
    organizationName: site.organizationName ?? defaults.organizationName ?? "",
    portalUrl,
    groupLabel: group?.label ?? "未分组",
    lastVersionLabel,
    year: String(new Date().getFullYear()),
  };

  ensureDir(siteDir);
  console.log(`\n[scaffold] → ${site.id}`);
  console.log(`           dir=${path.relative(repoRoot, siteDir)}`);

  if (site.id === "portal" && !args.includePortal) {
    console.log("           (skip: portal 站由人工维护，使用 --include-portal 才会被覆盖)");
    return;
  }

  // 1) 基础骨架文件
  writeFromTpl(path.join(siteDir, "package.json"), "package.json.tpl", vars);
  writeFromTpl(path.join(siteDir, "docusaurus.config.js"), "docusaurus.config.js.tpl", vars);
  writeFromTpl(path.join(siteDir, "sidebars.js"), "sidebars.js.tpl", vars);
  copyFile(path.join(templateDir, "src/css/custom.css"), path.join(siteDir, "src/css/custom.css"));
  ensureDir(path.join(siteDir, "static/img"));
  touch(path.join(siteDir, "static/img/.gitkeep"));
  writeFromTpl(path.join(siteDir, ".gitignore"), ".gitignore.tpl", vars);
  writeFromTpl(path.join(siteDir, "README.md"), "README.md.tpl", vars);

  // 2) 迁出/独立仓库友好资产
  writeFromTpl(path.join(siteDir, "LICENSE"), "LICENSE.tpl", vars);
  writeFromTpl(path.join(siteDir, ".editorconfig"), ".editorconfig.tpl", vars);
  writeFromTpl(path.join(siteDir, ".nvmrc"), ".nvmrc.tpl", vars);
  writeFromTpl(path.join(siteDir, ".github/workflows/deploy.yml"), "deploy.yml.tpl", vars);
  writeFromTpl(path.join(siteDir, "MIGRATION.md"), "MIGRATION.md.tpl", vars);

  // 3) docs/ 作为"当前版本"（label = lastVersionLabel 或单版本）
  writeDocs(path.join(siteDir, "docs"), vars, sidebar);

  // 4) 版本化：生成 versions.json + versioned_docs/ + versioned_sidebars/
  if (hasVersioning) {
    writeVersions(siteDir, vars, sidebar, versionsAsc, historicalVersionsDesc);
  }
}

function writeDocs(docsDir, vars, sidebar) {
  ensureDir(docsDir);

  const sidebarList = sidebar.length
    ? sidebar
        .filter((entry) => !entry.slug.includes("/"))
        .map((entry) => `- **${entry.label}** (\`${entry.slug}\`)`)
        .join("\n")
    : "- （尚未定义侧边栏，请在 sites.config.json 中补充或直接在 docs/ 下添加 Markdown）";

  writeFromTpl(path.join(docsDir, "intro.md"), "intro.md.tpl", { ...vars, sidebarList });

  // 找出所有"带子节点"的前缀（branch），避免"父 md + 同名子目录"双出问题。
  const branchPrefixes = new Set();
  for (const entry of sidebar) {
    const parts = entry.slug.split("/");
    for (let i = 1; i < parts.length; i++) {
      branchPrefixes.add(parts.slice(0, i).join("/"));
    }
  }

  const branchMeta = {};
  sidebar.forEach((entry, idx) => {
    if (branchPrefixes.has(entry.slug)) {
      branchMeta[entry.slug] = { label: entry.label, position: idx + 1, hasOwnEntry: true };
    }
  });
  for (const prefix of branchPrefixes) {
    if (!branchMeta[prefix]) {
      branchMeta[prefix] = {
        label: titleCase(prefix.split("/").pop()),
        position: 50,
        hasOwnEntry: false,
      };
    }
  }

  for (const [prefix, meta] of Object.entries(branchMeta)) {
    const dir = path.join(docsDir, ...prefix.split("/"));
    ensureDir(dir);
    writeFromTpl(
      path.join(dir, "_category_.json"),
      "category.json.tpl",
      { label: meta.label, position: meta.position },
      { onlyIfMissing: true },
    );
    writeFromTpl(
      path.join(dir, "index.md"),
      "doc.md.tpl",
      { label: meta.label, position: 0 },
      { onlyIfMissing: true },
    );
  }

  sidebar.forEach((entry, idx) => {
    if (branchPrefixes.has(entry.slug)) return;
    const parts = entry.slug.split("/");
    const fileName = `${parts.pop()}.md`;
    const dir = path.join(docsDir, ...parts);
    ensureDir(dir);
    writeFromTpl(path.join(dir, fileName), "doc.md.tpl", { ...entry, position: idx + 1 });
  });
}

function writeVersions(siteDir, vars, sidebar, versionsAsc, historicalDesc) {
  // versions.json 按 Docusaurus 约定：最新在前（不包含"当前/current"，当前由 docs/ 承载）。
  const versionsJsonPath = path.join(siteDir, "versions.json");
  if (args.force || !fs.existsSync(versionsJsonPath)) {
    fs.writeFileSync(versionsJsonPath, JSON.stringify(historicalDesc, null, 2) + "\n");
    console.log(`           write  ${path.relative(repoRoot, versionsJsonPath)}`);
  } else {
    console.log(`           keep   ${path.relative(repoRoot, versionsJsonPath)}`);
  }

  // 每个历史版本生成 versioned_docs/version-<v>/ 与 versioned_sidebars/version-<v>-sidebars.json
  const versionedDocsRoot = path.join(siteDir, "versioned_docs");
  const versionedSidebarsRoot = path.join(siteDir, "versioned_sidebars");
  ensureDir(versionedDocsRoot);
  ensureDir(versionedSidebarsRoot);

  for (const v of historicalDesc) {
    const verDocsDir = path.join(versionedDocsRoot, `version-${v}`);
    writeDocs(verDocsDir, { ...vars, lastVersionLabel: v }, sidebar);
    const sidebarPath = path.join(versionedSidebarsRoot, `version-${v}-sidebars.json`);
    writeFromTpl(sidebarPath, "versioned_sidebar.json.tpl", vars, { onlyIfMissing: true });
  }
}

// --------------------------------------------------------------------------
// 工具函数
// --------------------------------------------------------------------------

function filterSites(sites, args) {
  let list = sites.slice();
  if (args.only && args.only.size) {
    list = list.filter((s) => args.only.has(s.id));
  }
  if (args.skipPortal) {
    list = list.filter((s) => s.id !== "portal");
  }
  return list;
}

function parseArgs(argv) {
  const out = { force: false, skipPortal: false, includePortal: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--skip-portal") out.skipPortal = true;
    else if (a === "--include-portal") out.includePortal = true;
    else if (a === "--only") {
      out.only = new Set((argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    } else if (a.startsWith("--only=")) {
      out.only = new Set(a.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean));
    }
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function touch(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "");
}

function copyFile(src, dst, { onlyIfMissing = false } = {}) {
  ensureDir(path.dirname(dst));
  if (!args.force && (onlyIfMissing || fs.existsSync(dst))) {
    if (fs.existsSync(dst)) {
      console.log(`           keep   ${path.relative(repoRoot, dst)}`);
      return;
    }
  }
  fs.copyFileSync(src, dst);
  console.log(`           write  ${path.relative(repoRoot, dst)}`);
}

function writeFromTpl(dst, tplName, vars, { onlyIfMissing = false } = {}) {
  ensureDir(path.dirname(dst));
  if (!args.force && (onlyIfMissing || fs.existsSync(dst))) {
    if (fs.existsSync(dst)) {
      console.log(`           keep   ${path.relative(repoRoot, dst)}`);
      return;
    }
  }
  const tpl = fs.readFileSync(path.join(templateDir, tplName), "utf8");
  const rendered = render(tpl, vars);
  fs.writeFileSync(dst, rendered);
  console.log(`           write  ${path.relative(repoRoot, dst)}`);
}

function render(tpl, vars) {
  return tpl.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    if (key in vars) return String(vars[key]);
    return "";
  });
}

function joinUrl(base, pathname) {
  if (!base) return pathname;
  return base.replace(/\/$/, "") + (pathname.startsWith("/") ? pathname : "/" + pathname);
}

function titleCase(slug) {
  return slug
    .replace(/^\d+-/, "")
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
