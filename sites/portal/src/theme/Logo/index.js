import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useThemeConfig } from "@docusaurus/theme-common";
import ThemedImage from "@theme/ThemedImage";

/** 覆盖主题 Logo：使用 ThemedImage 正确处理 light/dark 模式 + forcePrependBaseUrl 兼容 baseUrl=/doc/ */
export default function Logo(props) {
  const {
    siteConfig: { title },
  } = useDocusaurusContext();
  const {
    navbar: { title: navbarTitle, logo },
  } = useThemeConfig();

  const { imageClassName, titleClassName, ...propsRest } = props;

  // Use href from config or default to home
  const logoHref = logo?.href ?? "/";
  const logoLink = useBaseUrl(logoHref);

  // Ensure image path respects baseUrl=/doc/
  const logoSrc = useBaseUrl(logo?.src || "", { forcePrependBaseUrl: true });
  const logoSrcDark = useBaseUrl(logo?.srcDark || logo?.src || "", { forcePrependBaseUrl: true });

  const fallbackAlt = navbarTitle ? "" : title;
  const alt = logo?.alt ?? fallbackAlt;

  if (!logo) {
    return null;
  }

  return (
    <Link
      to={logoLink}
      className="navbar__brand"
      {...propsRest}
      {...(logo?.target && { target: logo.target })}
    >
      <ThemedImage
        className={imageClassName || "navbar__logo"}
        sources={{
          light: logoSrc,
          dark: logoSrcDark,
        }}
        alt={alt}
        width={logo.width ?? 32}
        height={logo.height ?? 32}
      />
      {navbarTitle != null && (
        <b
          className={
            titleClassName
              ? `${titleClassName} text--truncate`
              : "navbar__title text--truncate"
          }
        >
          {navbarTitle}
        </b>
      )}
    </Link>
  );
}
