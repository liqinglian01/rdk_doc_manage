# RDK X3 Module OS 文档

> 每个产品一个 repo，内置多版本（V3.0.0 / V3.5.0 / V4.0.5）。入门配置 / 远程登录 / 显示屏使用 / 算法体验 / 基础应用开发 / 进阶开发（算法工具链版本列表）/ 下载资料 / FAQ / 附录 / Release Note

本目录是一个 **独立、可直接运行的 Docusaurus 站点**。目前作为 `rdk_doc` 单仓内的骨架，将来会迁出为独立 Git 仓库 `rdk-x3-md-os-docs`。

## 本地运行

```bash
npm install
npm run start          # http://localhost:3000
```

## 构建 & 预览

```bash
npm run build
npm run serve
```

## 版本化（若启用）

- **当前版本** (V4.0.5) 位于 `docs/`，直接编辑即可。
- **历史版本** 位于 `versioned_docs/version-X.Y.Z/`，对应 `versioned_sidebars/` 和 `versions.json`。
- 发布新版本：

  ```bash
  npm run docusaurus docs:version V4.1.0
  ```

- 开启版本化后，navbar 右侧会出现"版本下拉"。

## 约定

- 文档源码位于 `docs/`（当前版本）与 `versioned_docs/`（历史版本）。
- 图片放到 `static/img/` 目录，用 `/img/xxx.png` 引用（迁出后路径仍然有效）。
- 主题样式位于 `src/css/custom.css`。
- 站点 `baseUrl` 默认 `/os/rdk-x3-md/`；迁出后若放在独立域名根路径下，改成 `"/"`。

## 迁出为独立仓库

详见 [`MIGRATION.md`](./MIGRATION.md)。

一句话版本：

```bash
# 在 rdk_doc 仓库根目录执行
node sites/scripts/extract.mjs os-rdk-x3-md --out ../rdk-x3-md-os-docs --git
```

## License

Apache License 2.0（见 [`LICENSE`](./LICENSE)）。
