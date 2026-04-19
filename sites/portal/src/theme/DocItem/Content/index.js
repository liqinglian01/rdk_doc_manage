// Swizzle: wrap 官方 DocItem/Content，在正文最上方插入版本切换按钮。
// （不修改 @theme-original 的实现，升级 Docusaurus 时自动兼容。）
import React from "react";
import Content from "@theme-original/DocItem/Content";
import DocVersionButtons from "@site/src/components/DocVersionButtons";

export default function ContentWrapper(props) {
  return (
    <>
      <DocVersionButtons />
      <Content {...props} />
    </>
  );
}
