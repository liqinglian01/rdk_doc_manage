#!/usr/bin/env node
/**
 * 一键启动任意子站本地开发服务器。
 *
 *   node sites/scripts/dev.mjs portal
 *   node sites/scripts/dev.mjs product-rdk-x3 --port 3005
 *   node sites/scripts/dev.mjs tros --install           # 启动前自动 npm install
 *
 * 若未传站点 id，会列出可选站点。
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawn } from "node:child_process";

const __filename = url.fileURLToPath(import.meta.url);
const sitesRoot = path.resolve(path.dirname(__filename), "..");
const configPath = path.join(sitesRoot, "sites.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const [, , siteId, ...rest] = process.argv;

if (!siteId) {
  console.log("[dev] 用法: node sites/scripts/dev.mjs <siteId> [--install] [--port <n>]");
  console.log("[dev] 可用站点：");
  for (const s of config.sites) {
    console.log(`       ${s.id.padEnd(26)}${s.title}`);
  }
  process.exit(0);
}

const site = config.sites.find((s) => s.id === siteId);
if (!site) {
  console.error(`[dev] 未找到站点 id = ${siteId}`);
  process.exit(1);
}

const siteDir = path.join(sitesRoot, site.id);
if (!fs.existsSync(path.join(siteDir, "package.json"))) {
  console.error(`[dev] ${site.id} 目录缺少 package.json，请先运行 \`node sites/scripts/scaffold.mjs --only ${site.id}\``);
  process.exit(1);
}

const wantInstall = rest.includes("--install") || !fs.existsSync(path.join(siteDir, "node_modules"));
const portIdx = rest.indexOf("--port");
const port = portIdx >= 0 ? rest[portIdx + 1] : null;

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

async function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    // Windows 下 npm/pnpm 等实际是 .cmd 脚本，必须通过 shell 启动才能被 spawn 解析
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: isWin });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
    child.on("error", reject);
  });
}

(async () => {
  if (wantInstall) {
    console.log(`[dev] 安装依赖：${site.id}`);
    await run(npmCmd, ["install"], siteDir);
  }
  const startArgs = ["run", "start"];
  if (port) startArgs.push("--", "--port", port);
  console.log(`[dev] 启动：${site.id}${port ? ` (port=${port})` : ""}`);
  await run(npmCmd, startArgs, siteDir);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
