/*
 * Replacement for @frillab/copc-adapter's dist/lazPerfAsset.js — see
 * copc-wasm-asset.shim.js for the full explanation of why this is needed.
 */
import wasmAssetPath from '__laz-perf-wasm-binary__';

const wasmAssetUrl = new URL(wasmAssetPath, window.location.origin).toString();

export default wasmAssetUrl;
