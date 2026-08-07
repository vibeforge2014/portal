/**
 * Inline theme script injected before hydration. No actual theme toggling is
 * needed (we follow the system via CSS media queries), but keeping a hook here
 * makes a future manual toggle trivial and documents intent. It also lets us
 * set a base background on <html> instantly to avoid a white flash on dark
 * systems before CSS loads.
 */
export function ThemeScript() {
  const code = `
(function () {
  try {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var root = document.documentElement;
    root.style.backgroundColor = dark ? 'rgb(9,10,14)' : 'rgb(248,250,252)';
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
