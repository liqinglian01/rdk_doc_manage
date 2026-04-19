#!/usr/bin/env node
/**
 * 把 sites/<id>/ 下的整个子站复制到目标目录，作为独立 Git 仓库的初始内容。
 *
 * 用法：
 *   node sites/scripts/extract.mjs <siteId> --out <dir> [--git] [--dry-run] [--force]
 *
 * 选项：
 *   --out <dir>     目标目录（必填）。相对路径相对于当前工作目录。
 *   --git           额外执行 `git init && git add -A && git commit -m "init: <title>"`。
 *   --dry-run       只打印计划，不实际写入。
 *   --force         目标目录非空时强制覆盖（默认拒绝）。
 *
 * 示例：
 *   node sites/scripts/extract.mjs product-rdk-x3 --out ../rdk-x3-docs
 *   node sites/scripts/extract.mjs os-rdk-s100   --out D:/tmp/rdk-s100-os-docs --git
 *   node sites/scripts/extract.mjs portal        --out ../rdk-docs-portal --dry-run
 *
 * 脚本不会修改源目录（sites/<id>/）的任何文件。
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawnSync } from "node:child_process";

const __filename = url.fileURLToPath(import.meta.url);
const sitesRoot = path.resolve(path.dirname(__filename), "..");
const configPath = path.join(sitesRoot, "sites.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const args = parseArgs(process.argv.slice(2));

if (!args.siteId || !args.out) {
  printUsage();
  process.exit(args.siteId || args.out ? 1 : 0);
}

const site = config.sites.find((s) => s.id === args.siteId);
if (!site) {
  console.error(`[extract] 未找到站点 id = ${args.siteId}`);
  console.error(`[extract] 可用 id：${config.sites.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

const srcDir = path.join(sitesRoot, site.id);
if (!fs.existsSync(srcDir)) {
  console.error(`[extract] 源目录不存在：${srcDir}`);
  console.error(`[extract] 请先运行：node sites/scripts/scaffold.mjs --only ${site.id}`);
  process.exit(1);
}

const dstDir = path.resolve(process.cwd(), args.out);

// 目标目录检查
if (fs.existsSync(dstDir)) {
  const isDir = fs.statSync(dstDir).isDirectory();
  if (!isDir) {
    console.error(`[extract] 目标已存在且不是目录：${dstDir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(dstDir);
  if (entries.length > 0 && !args.force) {
    console.error(`[extract] 目标目录非空：${dstDir}`);
    console.error(`[extract] 若确认要复制进去，加 --force；或换一个空目录。`);
    process.exit(1);
  }
}

const projectName = site.projectName ?? site.id;
const title = site.title ?? site.id;

console.log("[extract] 计划：");
console.log(`  源：         ${path.relative(process.cwd(), srcDir) || srcDir}`);
console.log(`  目标：       ${dstDir}`);
console.log(`  站点 id：    ${site.id}`);
console.log(`  包名：       ${projectName}`);
console.log(`  初始化 git： ${args.git ? "是" : "否"}`);
console.log(`  模式：       ${args.dryRun ? "dry-run（不实际写入）" : "实际执行"}`);
console.log();

if (args.dryRun) {
  console.log("[extract] --dry-run：列出将要拷贝的顶层条目：");
  for (const name of listAll(srcDir)) {
    console.log(`  ${name}`);
  }
  console.log();
  console.log("[extract] 本次为 dry-run，未写入。去掉 --dry-run 即可执行。");
  process.exit(0);
}

// 执行拷贝
ensureDir(dstDir);
copyRecursive(srcDir, dstDir);

// 可选：git init + 首次提交
if (args.git) {
  runGit(dstDir, ["init"], { check: true });
  runGit(dstDir, ["add", "-A"], { check: true });
  const commitMsg = `init: ${title}`;
  const res = runGit(dstDir, ["commit", "-m", commitMsg], { check: false });
  if (res.status !== 0) {
    console.warn(`[extract] git commit 返回非零 (${res.status})，可能因为没配置 user.name/user.email。可手动提交：`);
    console.warn(`          git -C "${dstDir}" commit -m "${commitMsg}"`);
  }
}

console.log();
console.log(`[extract] 完成。目标目录：${dstDir}`);
console.log();
console.log("下一步：");
console.log(`  cd "${dstDir}"`);
console.log(`  npm install`);
console.log(`  npm run start        # 本地验证`);
console.log(`  git remote add origin git@github.com:D-Robotics/${projectName}.git`);
console.log(`  git branch -M main && git push -u origin main`);
console.log();
console.log(`别忘了：回到 rdk_doc，在 sites/portal/src/data/sites.js 把 id=${site.id} 的 href 改为新仓库的正式地址。`);

// --------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { siteId: null, out: null, git: false, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--git") out.git = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a === "--out") out.out = argv[++i];
    else if (a.startsWith("--out=")) out.out = a.slice("--out=".length);
    else if (a === "-h" || a === "--help") {
      printUsage();
      process.exit(0);
    } else if (!a.startsWith("--") && !out.siteId) {
      out.siteId = a;
    }
  }
  return out;
}

function printUsage() {
  console.log(`用法: node sites/scripts/extract.mjs <siteId> --out <dir> [--git] [--dry-run] [--force]`);
  console.log(`\n可用站点：`);
  for (const s of config.sites) {
    console.log(`  ${s.id.padEnd(26)}${s.title}`);
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listAll(dir) {
  return fs.readdirSync(dir).sort();
}

function copyRecursive(src, dst) {
  ensureDir(dst);
  for (const name of fs.readdirSync(src)) {
    // 拷贝时跳过不应进入独立仓库的构建产物
    if (name === "node_modules" || name === ".docusaurus" || name === "build") continue;
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyRecursive(s, d);
    } else if (stat.isSymbolicLink()) {
      const link = fs.readlinkSync(s);
      try { fs.symlinkSync(link, d); } catch { fs.copyFileSync(s, d); }
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function runGit(cwd, argv, { check }) {
  const r = spawnSync("git", argv, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (check && r.status !== 0) {
    console.error(`[extract] git ${argv.join(" ")} 失败，退出码 ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return r;
}
