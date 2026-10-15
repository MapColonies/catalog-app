/*
 * Replacement for @frillab/copc-adapter's dist/copcWasmAsset.js.
 *
 * The original file is `import wasmAssetUrl from './copc_wasm.wasm?url&no-inline';` — a
 * Vite-only convention. The adapter then does `new URL(wasmAssetUrl, import.meta.url)` to
 * get an absolute URL. Under Webpack, `import.meta.url` doesn't resolve to a real browser
 * URL (it bakes in the build machine's filesystem path as a `file://` string instead), so
 * that combination produces an unfetchable `file:///C:/...` URL.
 *
 * `new URL(x, base)` ignores `base` entirely when `x` is already an absolute URL, so this
 * shim sidesteps the broken `import.meta.url` by resolving to an absolute URL itself, using
 * Webpack's own (working) asset emission for the .wasm file — see config-overrides.js for
 * the resolve.alias / NormalModuleReplacementPlugin wiring that redirects the adapter's
 * import of `copcWasmAsset.js` to this file.
 */
import wasmAssetPath from '__copc-wasm-binary__';

const wasmAssetUrl = new URL(wasmAssetPath, window.location.origin).toString();

export default wasmAssetUrl;
