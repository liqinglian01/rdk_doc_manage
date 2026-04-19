# 迁出为独立仓库 · 算法应用 · Model Zoo

本站点 (`model-zoo` / 包名 `rdk-model-zoo-docs`) 目前作为 **`rdk_doc/sites/model-zoo/`** 下的骨架存在，后续将迁出为独立的 Git 仓库。本文档说明具体步骤。

## 1. 自动化方式（推荐）

在 `rdk_doc` 仓库根目录执行：

```bash
# 预览（不写入，只打印计划）
node sites/scripts/extract.mjs model-zoo --out ../rdk-model-zoo-docs --dry-run

# 正式拷贝到目标目录
node sites/scripts/extract.mjs model-zoo --out ../rdk-model-zoo-docs

# 拷贝 + 初始化 git + 首次提交（可直接推到远端）
node sites/scripts/extract.mjs model-zoo --out ../rdk-model-zoo-docs --git
```

脚本会：

1. 复制 `sites/model-zoo/` 下全部文件到目标目录（包含 `docs/`、`versioned_docs/`、`src/`、`static/`、`LICENSE`、`.github/workflows/deploy.yml` 等）。
2. 确认目标目录的 `package.json` 名为 `rdk-model-zoo-docs`、脚本与依赖自包含。
3. 可选执行 `git init && git add -A && git commit -m "init: 算法应用 · Model Zoo"`。

## 2. 手动方式

```bash
mkdir ../rdk-model-zoo-docs
cp -r sites/model-zoo/* sites/model-zoo/.[!.]* ../rdk-model-zoo-docs/    # 含隐藏文件
cd ../rdk-model-zoo-docs
npm install
npm run start       # 本地验证
git init && git add -A && git commit -m "init: 算法应用 · Model Zoo"
```

## 3. 推到远端并启用 GitHub Pages

```bash
git remote add origin git@github.com:D-Robotics/rdk-model-zoo-docs.git
git branch -M main
git push -u origin main
```

在 GitHub 仓库 → Settings → Pages 选择 "GitHub Actions" 作为 Source 即可。`.github/workflows/deploy.yml` 已经就绪。

## 4. 在 Portal 中更新卡片跳转

回到 `rdk_doc/sites/portal/src/data/sites.js`，把 id 为 `model-zoo` 的卡片的 `href` 改成独立仓库的正式地址（子路径或独立域名皆可）：

```js
{ id: "model-zoo", ..., href: "https://rdk-model-zoo-docs.pages.dev/" }
```

## 5. 独立仓库后的协作

- 日常更新：在独立仓库提交 PR，合入 main 自动触发 GitHub Pages 部署。
- 新版本发布（若为多版本站）：`npm run docusaurus docs:version Vx.y.z` 即可。
- 不需要再同步回 `rdk_doc/sites/model-zoo/`；后者仅作为"初始模板"留档。
