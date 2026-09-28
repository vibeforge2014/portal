/** Set the document language before hydration for localized PDF tool pages. */
export function PdfLocaleScript() {
  const code = `(function(){var m=location.pathname.match(/^\\/(zh-hans|zh-hant|en)\\/tools\\/pdf(?:\\/|$)/);if(m)document.documentElement.lang=m[1]==='en'?'en':m[1]==='zh-hant'?'zh-Hant':'zh-Hans';})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
