# RDK 文档站点矩阵（Docusaurus 拆分方案）

本目录是按思维导图将原单体 `rdk_doc` 仓库拆分后的**多站点骨架**。
每个子目录都是一个**独立可运行的 Docusaurus 站点**，规划上每一个都会迁出成独立 Git 仓库。当前仓库仅用作：

1. 拆分蓝图（目录即架构）；
2. 骨架脚手架（可一键重新生成、调整站点清单）；
3. 总的"文档管理门户站"（`sites/portal`）的源码仓库。

> 原 `docs/`（X3/X5）与 `docs_s/`（S100）内容本阶段**保持不动**，后续再由人工按章节搬迁到对应子站点 `docs/` 目录下。

---

## 1. 总览架构

```
rdk_doc/
├─ docs/            # 旧 X3/X5 文档（暂留，待人工迁移）
├─ docs_s/          # 旧 S100 文档（暂留，待人工迁移）
├─ docusaurus.config.js
│
└─ sites/                       # ★ 新的多站点根目录
   ├─ README.md                  # 你正在阅读的文件
   ├─ sites.config.json          # 所有子站点的元数据（脚手架输入）
   ├─ scripts/
   │   └─ scaffold.mjs           # 按 sites.config.json 生成/刷新骨架
   ├─ _template/                 # 共享脚手架模板（package.json、config 模板、css 等）
   │
   ├─ portal/                    # 总的"文档管理 Docusaurus" —— 门户站 / landing
   │
   ├─ product-rdk-x3/            # 产品文档：RDK X3
   ├─ product-rdk-x3-md/         # 产品文档：X3 Module
   ├─ product-rdk-x5/            # 产品文档：RDK X5
   ├─ product-rdk-x5-md/         # 产品文档：X5 Module
   ├─ product-rdk-s100/          # 产品文档：RDK S100
   ├─ product-rdk-s600/          # 产品文档：RDK S600
   │
   ├─ os-rdk-x3/                 # OS 文档：X3（含 V3.0.0 / V3.5.0 / V4.0.5 版本）
   ├─ os-rdk-x3-md/
   ├─ os-rdk-x5/
   ├─ os-rdk-x5-md/
   ├─ os-rdk-s100/
   ├─ os-rdk-s600/
   │
   ├─ model-zoo/                 # 算法应用 Model Zoo（主要是外链 + 目录页）
   ├─ tros/                      # 机器人应用 TROS（各平台同步发版，一个 repo）
   ├─ examples/                  # 应用开发示例（X3/X5/S100/S600 合一个 repo）
   ├─ accessories/               # 配件（IMU / Stereo Camera Module / GS130W / GS130WI）
   │
   ├─ software-rdk-studio/       # 软件：RDK Studio
   ├─ software-xburn/            # 软件：Xburn
   │
   └─ algorithm-toolchain/       # 算法工具链
```

一共 **1 个门户 + 6 产品 + 6 OS + 1 Model Zoo + 1 TROS + 1 Examples + 1 配件 + 2 软件 + 1 算法工具链 = 20 个 Docusaurus 站点**。

---

## 2. 站点映射（与思维导图一一对应）

| 思维导图节点 | 站点目录 | 说明 |
|---|---|---|
| 产品 · RDK X3 | `product-rdk-x3` | 硬件简介 / 系统烧录 / 配件清单 / 下载资源 / 附录 / FAQ |
| 产品 · X3 MD | `product-rdk-x3-md` | 同上结构 |
| 产品 · RDK X5 | `product-rdk-x5` | 同上结构 |
| 产品 · X5 MD | `product-rdk-x5-md` | 同上结构 |
| 产品 · RDK S100 | `product-rdk-s100` | 同上结构 |
| 产品 · RDK S600 | `product-rdk-s600` | 同上结构 |
| OS · 各产品 × 版本 | `os-rdk-<product>` | 每产品一个仓库，内置 **版本列表**（V3.0.0 / V3.5.0 / V4.0.5）；每版本包含 入门配置 / 远程登录 / 显示屏使用 / 算法体验 / 基础应用开发 / 进阶开发 / 下载资料 / FAQ / 附录 / Release Note |
| 算法应用 · Model Zoo | `model-zoo` | 主要提供 RDK X、RDK S 两个 Model Zoo 的外链入口 |
| 机器人应用 TROS | `tros` | 各平台同步发版，一个仓库 |
| 应用开发示例 | `examples` | 内部按 X3 / X5 / S100 / S600 分 sidebar，一个仓库 |
| 配件 | `accessories` | RDK IMU Module / Stereo Camera Module / GS130W / GS130WI |
| 软件 · RDK Studio | `software-rdk-studio` | 独立仓库 |
| 软件 · Xburn | `software-xburn` | 独立仓库 |
| 算法工具链 | `algorithm-toolchain` | 独立仓库 |
| 文档管理总入口 | `portal` | 卡片式门户站，聚合跳转到所有子站 |

---

## 3. 使用方式

### 3.1 生成/刷新所有子站骨架

所有子站骨架由 `sites/scripts/scaffold.mjs` 基于 `sites/sites.config.json` + `sites/_template/` 生成。新增 / 调整站点时**只需编辑 `sites.config.json` 并重新运行脚本**。

```bash
node sites/scripts/scaffold.mjs                      # 生成所有缺失的站点骨架
node sites/scripts/scaffold.mjs --force              # 强制覆盖已有骨架文件（谨慎）
node sites/scripts/scaffold.mjs --only os-rdk-s100   # 只处理指定站点
```

脚本生成内容（每个子站都是"独立可运行"状态）：

- 基础：`package.json`、`docusaurus.config.js`、`sidebars.js`、`docs/` 占位 Markdown、`src/css/custom.css`、`static/img/`
- 迁出友好：`LICENSE`（Apache-2.0）、`.editorconfig`、`.nvmrc`、`.github/workflows/deploy.yml`（GitHub Pages 部署）、`MIGRATION.md`、`README.md`
- 版本化（若启用）：`versions.json`、`versioned_docs/version-X.Y.Z/`、`versioned_sidebars/version-X.Y.Z-sidebars.json`

> 已存在的文件默认不会覆盖，你在某个站点里真实写的内容不会被脚本破坏。

### 3.2 启动某个子站

```bash
cd sites/product-rdk-x3
npm install
npm run start          # 默认 http://localhost:3000，多站同时开发用 `--port 3001`
```

或者从仓库根目录一键启动：

```bash
node sites/scripts/dev.mjs product-rdk-x3
node sites/scripts/dev.mjs os-rdk-s100 --port 3005
```

### 3.3 启动门户站

**勿在仓库根目录执行根目录的 `npm run start`**（那是旧版单体文档站，不是 Portal）。门户站必须在 `sites/portal` 下启动，或在根目录执行 `npm run start:portal`。

```bash
cd sites/portal
npm install
npm run start
```

开发与线上路径以 **`sites/portal/docusaurus.config.js` 的 `baseUrl`** 为准；本地访问请打开 `http://localhost:3000<baseUrl>/`（例如 `baseUrl` 为 `/rdk_doc_manage/` 时即 `http://localhost:3000/rdk_doc_manage/`）。

门户站首页以卡片形式列出所有子站，卡片的跳转地址在 `sites/portal/src/data/sites.js` 中维护；**子站部署地址变化时只改这里**。带 `versions` 字段的卡片会自动显示 "最新 Vx.y.z" 与 "共 N 个版本" 徽标。

---

## 4. 版本切换（OS 等多版本子站）

每个带版本化的子站遵循 Docusaurus 官方约定：

| 文件 / 目录                                  | 作用                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| `docs/`                                      | **当前最新版本**（`lastVersion: "current"`，label 为最新版本号） |
| `versioned_docs/version-V3.5.0/`             | 历史版本 V3.5.0 的文档快照                                   |
| `versioned_sidebars/version-V3.5.0-sidebars.json` | 历史版本 V3.5.0 的侧边栏                                    |
| `versions.json`                              | 历史版本列表，最新在前（不含 "current"）                     |

实际体验：

- 访问子站首页 → 显示最新版本（默认，无 URL 前缀）
- navbar 右侧"版本下拉" → 切到 V3.5.0 / V3.0.0
- 老版本 URL：`/V3.5.0/...`、`/V3.0.0/...`

发布新版本两种方式（二选一）：

**方式 A：Docusaurus 官方命令**

```bash
cd sites/os-rdk-s100
npm run docusaurus docs:version V4.1.0
# 把当前 docs/ 快照到 versioned_docs/version-V4.1.0/
```

**方式 B：声明式（编辑 `sites.config.json`）**

在 `groups.os.versions` 末尾追加 `V4.1.0`，再运行：

```bash
node sites/scripts/scaffold.mjs --only os-rdk-s100
```

脚本会补齐 `versioned_docs/version-V4.1.0/`（仅首次；保留已存在文件）。

---

## 5. 迁出成独立仓库

### 5.1 一键脚本（推荐）

```bash
# 预览（不实际写入）
node sites/scripts/extract.mjs product-rdk-x3 --out ../rdk-x3-docs --dry-run

# 拷贝到目标目录
node sites/scripts/extract.mjs product-rdk-x3 --out ../rdk-x3-docs

# 拷贝 + git init + 首次提交
node sites/scripts/extract.mjs product-rdk-x3 --out ../rdk-x3-docs --git
```

脚本会自动跳过 `node_modules/` / `.docusaurus/` / `build/`，并在目标目录生成完整的"独立仓库"。

### 5.2 后续步骤

```bash
cd ../rdk-x3-docs
npm install
npm run start                                # 本地验证
git remote add origin git@github.com:D-Robotics/rdk-x3-docs.git
git branch -M main && git push -u origin main
```

推到 GitHub 后：

- **启用 Pages**：Settings → Pages → Source 选 "GitHub Actions"，内置 `.github/workflows/deploy.yml` 自动跑起来
- **更新门户跳转**：回到 `rdk_doc/sites/portal/src/data/sites.js`，把 `id=product-rdk-x3` 的 `href` 改成新地址（子路径或独立域名）

每个子站自己的 `MIGRATION.md` 还列出了更细的手动迁出流程。

---

## 6. 各子站 baseUrl / 部署路径规划（默认值，可在各站 `docusaurus.config.js` 覆盖）

| 站点 | 规划 baseUrl |
|---|---|
| portal | `/` |
| product-rdk-x3 | `/product/rdk-x3/` |
| product-rdk-x3-md | `/product/rdk-x3-md/` |
| product-rdk-x5 | `/product/rdk-x5/` |
| product-rdk-x5-md | `/product/rdk-x5-md/` |
| product-rdk-s100 | `/product/rdk-s100/` |
| product-rdk-s600 | `/product/rdk-s600/` |
| os-rdk-x3 | `/os/rdk-x3/` |
| os-rdk-x3-md | `/os/rdk-x3-md/` |
| os-rdk-x5 | `/os/rdk-x5/` |
| os-rdk-x5-md | `/os/rdk-x5-md/` |
| os-rdk-s100 | `/os/rdk-s100/` |
| os-rdk-s600 | `/os/rdk-s600/` |
| model-zoo | `/model-zoo/` |
| tros | `/tros/` |
| examples | `/examples/` |
| accessories | `/accessories/` |
| software-rdk-studio | `/software/rdk-studio/` |
| software-xburn | `/software/xburn/` |
| algorithm-toolchain | `/algorithm-toolchain/` |

---

## 7. 现状与下一步 TODO

- [x] 站点骨架（20 个）
- [x] 门户站（landing）
- [x] 脚手架脚本
- [ ] 把 `docs/` 与 `docs_s/` 的内容按章节迁移到对应 `sites/*/docs/` 目录下
- [ ] 为 OS 系列站点接入 Docusaurus versioning（`npm run docusaurus docs:version V3.0.0`）
- [ ] 为各子站补齐原 `src/`、`static/`、i18n、Algolia/本地搜索、footer、GitHub Actions CI 等
- [ ] 各子站独立建仓并在 `sites/portal/src/data/sites.js` 中替换为正式域名
