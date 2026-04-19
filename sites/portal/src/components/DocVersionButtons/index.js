import React from "react";
import Link from "@docusaurus/Link";
import {
  useActivePluginAndVersion,
  useVersions,
  useActiveDocContext,
} from "@docusaurus/plugin-content-docs/client";
import styles from "./styles.module.css";

/**
 * 文档正文顶部的"版本切换按钮组"。
 *
 * 逻辑：
 *  - 从当前路由识别 active plugin（= 子站）和 active version。
 *  - 列出该 plugin 的全部版本（Docusaurus 返回的顺序：latest 在前）。
 *  - 对每个版本，如果当前 doc 在目标版本也存在（alternateDocVersions），
 *    就链到同名 doc 以保持阅读上下文；否则链到目标版本的 docs 根路径。
 *
 * 仅在多版本站点显示（单版本站点直接返回 null）。
 */
export default function DocVersionButtons() {
  const activePluginAndVersion = useActivePluginAndVersion({ failfast: false });
  const activePlugin = activePluginAndVersion?.activePlugin;
  const pluginId = activePlugin?.pluginId;

  if (!pluginId) return null;

  const versions = useVersions(pluginId);
  const { activeVersion, activeDoc, alternateDocVersions } = useActiveDocContext(pluginId);

  if (!versions || versions.length <= 1) return null;
  if (!activeVersion) return null;

  return (
    <nav className={styles.wrap} aria-label="文档版本切换">
      <span className={styles.label}>版本</span>
      <div className={styles.buttons}>
        {versions.map((v) => {
          const isActive = v.name === activeVersion.name;
          const alt = activeDoc ? alternateDocVersions?.[v.name] : null;
          const href = alt?.path ?? v.path;
          const displayLabel = v.label ?? v.name;
          const isLatest = v.isLast;

          return (
            <Link
              key={v.name}
              className={`${styles.btn} ${isActive ? styles.active : ""}`}
              to={href}
              aria-current={isActive ? "page" : undefined}
              title={
                alt
                  ? `切换到 ${displayLabel}`
                  : `当前文档在 ${displayLabel} 中不存在，跳到该版本首页`
              }
            >
              <span className={styles.name}>{displayLabel}</span>
              {isLatest ? <span className={styles.latestTag}>latest</span> : null}
              {!alt && !isActive ? <span className={styles.warn} aria-hidden>*</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
