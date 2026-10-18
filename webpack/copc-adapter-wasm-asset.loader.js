/*
 * Webpack loader for @frillab/copc-adapter's `dist/*Asset.js` WASM URL modules.
 *
 * Each of those files is `import url from './<name>.wasm?url&no-inline'; export default url;`,
 * a Vite-only convention, and the adapter then does `new URL(url, import.meta.url)`. Under
 * Webpack `import.meta.url` is the build machine's filesystem path (`file:///C:/...`), so the
 * resulting URL cannot be fetched by the browser.
 *
 * This loader drops the Vite query so Webpack emits the binary through its normal asset
 * pipeline, and exports an already-absolute URL. `new URL(absolute, anyBase)` ignores the
 * base, which makes the broken `import.meta.url` irrelevant.
 *
 * It rewrites whatever `*Asset.js` files the installed adapter ships, so new or renamed WASM
 * binaries keep working without further configuration.
 */
const VITE_ASSET_QUERY = /\?url&no-inline/g;
const DEFAULT_EXPORT = /export default (\w+);/;

module.exports = function copcAdapterWasmAssetLoader(source) {
  const withoutViteQuery = source.replace(VITE_ASSET_QUERY, '');

  if (!DEFAULT_EXPORT.test(withoutViteQuery)) {
    throw new Error(
      `copc-adapter-wasm-asset.loader: unexpected asset module shape in ${this.resourcePath}; ` +
        'the adapter changed how it exposes its WASM URLs, so this loader needs updating.'
    );
  }

  return withoutViteQuery.replace(
    DEFAULT_EXPORT,
    'export default new URL($1, window.location.origin).toString();'
  );
};
