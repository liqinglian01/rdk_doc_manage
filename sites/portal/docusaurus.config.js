// @ts-check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { themes as prismThemes } from "prism-react-renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitesRoot = path.resolve(__dirname, "..");
const sitesConfig = JSON.parse(fs.readFileSync(path.join(sitesRoot, "sites.config.json"), "utf8"));

// 把子站声明为 multi-instance docs plugin
// ------------------------------------------------------------------
// 每个非 portal 子站：
//   - path       指向 ../<id>/docs（复用子站自己的文档源码）
//   - sidebarPath 指向 ../<id>/sidebars.js（复用子站自己的侧边栏）
//   - routeBasePath 从子站 baseUrl 推导（例如 /product/rdk-x3/ → product/rdk-x3）
//   - 若子站启用了版本化：lastVersion=current，current 标签 = 子站最新版本号；
//     版本化文件（<id>_versioned_docs/ 等）由 sites/scripts/portal-prepare.mjs 在启动前
//     以 junction/copy 形式桥接到本目录下（见该脚本）。
const nonPortalSites = sitesConfig.sites.filter((s) => s.id !== "portal");

function baseUrlToRoute(baseUrl) {
  return String(baseUrl || "/").replace(/^\/+|\/+$/g, ""); // 去掉前后斜杠
}

function resolveGroupVersions(site) {
  if (Array.isArray(site.versions) && site.versions.length) return site.versions;
  const group = sitesConfig.groups?.find((g) => g.id === site.group);
  if (group && Array.isArray(group.versions) && group.versions.length) return group.versions;
  return [];
}

const docsPlugins = nonPortalSites.map((site) => {
  const siteDir = path.resolve(sitesRoot, site.id);
  const versions = resolveGroupVersions(site);
  const hasVersioning = versions.length > 0;
  const lastVersionLabel = hasVersioning ? versions[versions.length - 1] : null;

  return [
    "@docusaurus/plugin-content-docs",
    {
      id: site.id,
      path: path.join(siteDir, "docs"),
      sidebarPath: path.join(siteDir, "sidebars.js"),
      routeBasePath: baseUrlToRoute(site.baseUrl),
      showLastUpdateTime: true,
      ...(hasVersioning
        ? {
            lastVersion: "current",
            versions: {
              current: { label: lastVersionLabel },
            },
          }
        : {}),
    },
  ];
});

// 版本化子站在 navbar 右侧挂一个版本下拉（仅该子站的 docs 页面上显示，靠 CSS 控制）
const versionNavbarItems = nonPortalSites
  .filter((s) => resolveGroupVersions(s).length > 0)
  .map((s) => ({
    type: "docsVersionDropdown",
    position: "right",
    docsPluginId: s.id,
    dropdownActiveClassDisabled: true,
    className: `navbar-version-dropdown navbar-version-dropdown--${s.id}`,
  }));

// ------------------------------------------------------------------

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "文档中心",
  tagline: "D-Robotics 开发者文档总入口",
  favicon: "img/logo.png",
  url: "https://liqinglian01.github.io",
  baseUrl: "/",

  organizationName: "liqinglian01",
  projectName: "rdk_doc_manage",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  onBrokenAnchors: "warn",

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans", "en"],
    localeConfigs: {
      en: { label: "EN" },
      "zh-Hans": { label: "CN" },
    },
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        // portal 本身不提供默认 docs；/about /contributing 由 src/pages/*.mdx 承担
        docs: false,
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
        sitemap: { lastmod: "date" },
      }),
    ],
  ],

  plugins: [
    // 把所有非 portal 子站挂载为 multi-instance docs
    ...docsPlugins,
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/docusaurus-social-card.jpg",
      colorMode: { defaultMode: "light", respectPrefersColorScheme: true },
      navbar: {
        title: "文档中心",
        logo: {
          alt: "D-Robotics",
          src: "img/logo.png",
          srcDark: "img/logo.png",
          href: "/",
          width: 32,
          height: 32,
        },
        items: [
          { to: "/", label: "首页", position: "left" },
          { to: "/about", label: "关于文档矩阵", position: "left" },
          { to: "/contributing", label: "贡献指南", position: "left" },
          {
            label: "产品",
            position: "left",
            items: [
              { label: "RDK X3", to: "/product/rdk-x3/" },
              { label: "RDK X3 Module", to: "/product/rdk-x3-md/" },
              { label: "RDK X5", to: "/product/rdk-x5/" },
              { label: "RDK X5 Module", to: "/product/rdk-x5-md/" },
              { label: "RDK S100", to: "/product/rdk-s100/" },
              { label: "RDK S600", to: "/product/rdk-s600/" },
            ],
          },
          {
            label: "系统软件",
            position: "left",
            items: [
              { label: "RDK X3 OS", to: "/os/rdk-x3/" },
              { label: "RDK X3 Module OS", to: "/os/rdk-x3-md/" },
              { label: "RDK X5 OS", to: "/os/rdk-x5/" },
              { label: "RDK X5 Module OS", to: "/os/rdk-x5-md/" },
              { label: "RDK S100 OS", to: "/os/rdk-s100/" },
              { label: "RDK S600 OS", to: "/os/rdk-s600/" },
            ],
          },
          {
            label: "更多",
            position: "left",
            items: [
              { label: "算法应用 · Model Zoo", to: "/model-zoo/" },
              { label: "TROS 机器人应用", to: "/tros/" },
              { label: "应用开发示例", to: "/examples/" },
              { label: "配件", to: "/accessories/" },
              { label: "RDK Studio", to: "/software/rdk-studio/" },
              { label: "Xburn", to: "/software/xburn/" },
              { label: "算法工具链", to: "/algorithm-toolchain/" },
            ],
          },
          // 版本下拉（每个有版本的子站一个，CSS 控制仅在对应 docs 页面显示）
          ...versionNavbarItems,
          { href: "https://developer.d-robotics.cc/", label: "社区", position: "right" },
          { href: "https://github.com/D-Robotics", label: "GitHub", position: "right" },
          { type: "localeDropdown", position: "right" },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "子站导航",
            items: [
              { label: "产品文档", to: "/#products" },
              { label: "系统软件", to: "/#system-software" },
              { label: "机器人应用 TROS", to: "/tros/" },
              { label: "算法工具链", to: "/algorithm-toolchain/" },
            ],
          },
          {
            title: "开发者",
            items: [
              { label: "开发者社区", href: "https://developer.d-robotics.cc/" },
              { label: "GitHub", href: "https://github.com/D-Robotics" },
              { label: "BiLiBiLi", href: "https://space.bilibili.com/437998606" },
            ],
          },
          {
            title: "文档矩阵",
            items: [
              { label: "关于文档矩阵", to: "/about" },
              { label: "贡献指南", to: "/contributing" },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} D-Robotics.`,
      },
      prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
    }),

  // Portal 不启用全文搜索（每个子站在自己独立仓库里各自启用）
  themes: [],
};

export default config;
