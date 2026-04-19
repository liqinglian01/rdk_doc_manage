// @ts-check
// 由 sites/scripts/scaffold.mjs 基于 sites/sites.config.json 生成。
// 本文件是"子站独立仓库"友好的版本：迁出后直接可运行，不依赖父仓库。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { themes as prismThemes } from "prism-react-renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 由 scaffold 根据 sites.config.json 填入：
//   - LAST_VERSION_LABEL: 最新版本标签（例如 "V4.0.5"），未启用版本化时为空
const LAST_VERSION_LABEL = "V4.0.5";

// 当存在 versions.json 时，Docusaurus 会读取它识别"历史版本"。
// 最新版本始终由 docs/ 目录提供（label = LAST_VERSION_LABEL，path 空串 = /）。
const hasVersionsFile = fs.existsSync(path.join(__dirname, "versions.json"));
const enableVersioning = Boolean(LAST_VERSION_LABEL) || hasVersionsFile;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "RDK S600 OS 文档",
  tagline: "每个产品一个 repo，内置多版本（V3.0.0 / V3.5.0 / V4.0.5）。入门配置 / 远程登录 / 显示屏使用 / 算法体验 / 基础应用开发 / 进阶开发（算法工具链版本列表）/ 下载资料 / FAQ / 附录 / Release Note",
  favicon: "img/logo.png",
  url: "https://developer.d-robotics.cc",
  baseUrl: "/os/rdk-s600/",

  organizationName: "D-Robotics",
  projectName: "rdk-s600-os-docs",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans", "en"],
    localeConfigs: {
      en: { label: "EN" },
      "zh-Hans": { label: "CN" },
    },
  },

  markdown: { mermaid: true },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
          showLastUpdateTime: true,
          ...(enableVersioning && LAST_VERSION_LABEL
            ? {
                lastVersion: "current",
                versions: {
                  current: { label: LAST_VERSION_LABEL, path: "" },
                },
              }
            : {}),
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
        sitemap: { lastmod: "date" },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 5 },
      navbar: {
        title: "RDK S600 OS 文档",
        logo: { alt: "D-Robotics", src: "img/logo.png", href: "/" },
        items: [
          { type: "docSidebar", sidebarId: "tutorialSidebar", position: "left", label: "文档" },
          ...(enableVersioning
            ? [{ type: "docsVersionDropdown", position: "right", dropdownActiveClassDisabled: true }]
            : []),
          { href: "https://developer.d-robotics.cc/", label: "返回文档中心", position: "right" },
          { href: "https://github.com/D-Robotics", label: "GitHub", position: "right" },
          { type: "localeDropdown", position: "right" },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "相关站点",
            items: [
              { label: "文档中心", href: "https://developer.d-robotics.cc/" },
              { label: "D-Robotics 社区", href: "https://developer.d-robotics.cc/" },
            ],
          },
          {
            title: "联系我们",
            items: [
              { label: "GitHub", href: "https://github.com/D-Robotics" },
              { label: "BiLiBiLi", href: "https://space.bilibili.com/437998606" },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} D-Robotics.`,
      },
      prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
    }),

  themes: [
    "@docusaurus/theme-mermaid",
    [
      // @ts-ignore
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en", "zh"],
        highlightSearchTermsOnTargetPage: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
      },
    ],
  ],
};

export default config;
