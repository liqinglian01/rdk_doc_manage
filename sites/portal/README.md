# RDK 文档中心 · Portal

> 总的文档管理 Docusaurus —— 聚合所有子站入口。

## 本地运行

```bash
npm install
npm run start
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
