#!/usr/bin/env node
/**
 * portal 启动/构建前的预处理：
 *
 *   Docusaurus 的 multi-instance docs 约定：非默认 pluginId 的版本化文件必须放在
 *   siteDir 下并带 pluginId 前缀（`<id>_versioned_docs/`、`<id>_versioned_sidebars/`、`<id>_versions.json`）。
 *   而我们的子站把这些文件保留在自己的目录里（`sites/<id>/versioned_docs/` 等）以保证"自包含、可迁出"。
 *   本脚本负责在 portal 里为每个非 portal 子站创建对应的 junction（Windows 友好）/symlink/copy，
 *   让 Docusaurus 能透明读到子站的版本化文件，而无需把文件物理搬出子站。
 *
 * 清理规则：每次运行都会先移除旧的 junction / 副本再重建，保证 portal 状态始终对齐 sites.config.json。
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const sitesRoot = path.resolve(path.dirname(__filename), "..");
const portalDir = path.join(sitesRoot, "portal");
const configPath = path.join(sitesRoot, "sites.config.json");

if (!fs.existsSync(configPath)) {
  console.error(`[portal-prepare] 缺少 ${configPath}`);
  process.exit(1);
}
if (!fs.existsSync(portalDir)) {
  console.error(`[portal-prepare] 缺少 ${portalDir}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const nonPortalSites = config.sites.filter((s) => s.id !== "portal");

console.log(`[portal-prepare] portalDir=${path.relative(sitesRoot, portalDir)}`);
console.log(`[portal-prepare] 处理 ${nonPortalSites.length} 个子站`);

for (const site of nonPortalSites) {
  const siteDir = path.join(sitesRoot, site.id);
  if (!fs.existsSync(siteDir)) {
    console.log(`  skip ${site.id}（源目录不存在）`);
    continue;
  }

  // 如果子站启用了版本化（存在 versions.json 或 versioned_docs），把它们桥接到 portal。
  const srcVersionsJson = path.join(siteDir, "versions.json");
  const srcVersionedDocs = path.join(siteDir, "versioned_docs");
  const srcVersionedSidebars = path.join(siteDir, "versioned_sidebars");

  const hasVersioning = fs.existsSync(srcVersionsJson) && fs.existsSync(srcVersionedDocs);
  if (!hasVersioning) {
    // 先清理可能存在的旧链接
    cleanBridge(site.id);
    continue;
  }

  // versions.json 用拷贝（小文件，避免 symlink 权限问题）
  const dstVersionsJson = path.join(portalDir, `${site.id}_versions.json`);
  if (fs.existsSync(dstVersionsJson) && fs.lstatSync(dstVersionsJson).isSymbolicLink()) {
    fs.unlinkSync(dstVersionsJson);
  } else if (fs.existsSync(dstVersionsJson)) {
    fs.rmSync(dstVersionsJson, { force: true });
  }
  fs.copyFileSync(srcVersionsJson, dstVersionsJson);
  console.log(`  copy ${path.relative(sitesRoot, dstVersionsJson)}  ← ${path.relative(sitesRoot, srcVersionsJson)}`);

  // versioned_docs / versioned_sidebars 用 junction（Windows 无需管理员权限）
  bridgeDir(site.id, "versioned_docs", srcVersionedDocs);
  if (fs.existsSync(srcVersionedSidebars)) {
    bridgeDir(site.id, "versioned_sidebars", srcVersionedSidebars);
  }
}

console.log("[portal-prepare] 完成。");

// --------------------------------------------------------------------------
// 工具
// --------------------------------------------------------------------------

function bridgeDir(siteId, suffix, src) {
  const dst = path.join(portalDir, `${siteId}_${suffix}`);
  // 清理旧状态（含 junction / symlink / 物理目录）
  if (fs.existsSync(dst) || isBrokenSymlink(dst)) {
    try {
      const s = fs.lstatSync(dst);
      if (s.isSymbolicLink() || s.isFile()) {
        fs.unlinkSync(dst);
      } else if (s.isDirectory()) {
        fs.rmSync(dst, { recursive: true, force: true });
      }
    } catch {}
  }
  // Docusaurus SSG 在 Windows 上对 junction/symlink 的路径解析不稳定（可能报
  // "Cannot read properties of undefined (reading 'id')"）。为了可靠，统一用物理拷贝。
  copyRecursive(src, dst);
  console.log(`  copy ${path.relative(sitesRoot, dst)}  ← ${path.relative(sitesRoot, src)}`);
}

function cleanBridge(siteId) {
  for (const suffix of ["versioned_docs", "versioned_sidebars"]) {
    const p = path.join(portalDir, `${siteId}_${suffix}`);
    if (fs.existsSync(p) || isBrokenSymlink(p)) {
      try {
        const s = fs.lstatSync(p);
        if (s.isSymbolicLink()) fs.unlinkSync(p);
        else if (s.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
        else fs.rmSync(p, { force: true });
      } catch {}
    }
  }
  const j = path.join(portalDir, `${siteId}_versions.json`);
  if (fs.existsSync(j)) fs.rmSync(j, { force: true });
}

function isBrokenSymlink(p) {
  try {
    fs.lstatSync(p);
    try { fs.statSync(p); return false; } catch { return true; }
  } catch {
    return false;
  }
}

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}
