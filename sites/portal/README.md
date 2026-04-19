# RDK 文档中心 · Portal

> 总的文档管理 Docusaurus —— 聚合所有子站入口。

## 本地运行

**不要在仓库根目录执行根目录的 `npm run start`**，那会启动根部的旧版单体文档站（`docusaurus.config.js`），不是本 Portal。

在**本目录**安装并启动（从仓库根目录时先 `cd sites/portal`）：

```bash
cd sites/portal
npm install
npm run start
```

或在仓库根目录一键启动 Portal：

```bash
npm run start:portal
```

浏览器请打开 **带 baseUrl 的路径**（见 `docusaurus.config.js` 里的 `baseUrl`），例如当前若为 `baseUrl: "/rdk_doc_manage/"`，则开发地址为：

`http://localhost:3000/rdk_doc_manage/`（末尾建议保留 `/`）

也可用脚本（会自动执行 `portal-prepare`）：

```bash
node sites/scripts/dev.mjs portal
```

## 维护说明

- 首页所有卡片和跳转的**唯一数据源**：`src/data/sites.js`
  - 子站 baseUrl 变化时只改这里
  - 支持按 group 分区（产品 / OS / 机器人应用 / 示例 / 配件 / 软件 / 算法工具链 / 模型仓库）
- 首页布局组件：`src/pages/index.js` + `src/components/SiteCard`
- 全局样式：`src/css/custom.css`
- 关于文档矩阵：`docs/about.md`
- 贡献指南：`docs/contributing.md`

## 与其他子站的关系

本站只托管：
- 首页（卡片导航）
- 少量元文档（`/docs/about`、`/docs/contributing`）

所有产品 / OS / 示例 / 配件 / 软件 / 算法工具链 的真实内容都在独立子站仓库里。本站通过 **反向代理 / CDN 路径转发**（如 Nginx `location /product/rdk-x3/`）把不同 baseUrl 串成统一域名下的访问，或直接跳转到各子站自己的独立域名。
