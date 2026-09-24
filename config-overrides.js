const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  //do stuff with the webpack config...

  config.resolve.fallback = {
    url: require.resolve('url'),
    assert: require.resolve('assert'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    buffer: require.resolve('buffer'),
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
  };

  // @frillab/copc-adapter ships its WASM asset loaders using a Vite-only `?url&no-inline`
  // import convention combined with `import.meta.url`, which Webpack can't resolve to a real
  // browser URL. These aliases + NormalModuleReplacementPlugin below redirect the adapter's
  // asset-loader files to local shims that work under Webpack. See
  // src/shims/copc-wasm-asset.shim.js for the full explanation.
  const copcAdapterDistDir = path.resolve(__dirname, './node_modules/@frillab/copc-adapter/dist');

  config.resolve.alias = {
    ...config.resolve.alias,
    'react-dnd': path.resolve(__dirname, './node_modules/react-dnd'),
    'react-dnd-html5-backend': path.resolve(__dirname, './node_modules/react-dnd-html5-backend'),
    '__copc-wasm-binary__': path.join(copcAdapterDistDir, 'copc_wasm.wasm'),
    '__laz-perf-wasm-binary__': path.join(copcAdapterDistDir, 'laz-perf.wasm'),
  };

  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /copcWasmAsset\.js$/,
      path.resolve(__dirname, './src/shims/copc-wasm-asset.shim.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /lazPerfAsset\.js$/,
      path.resolve(__dirname, './src/shims/laz-perf-asset.shim.js')
    )
  );

  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });

  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Critical dependency: Accessing import\.meta directly is unsupported/,
  ];

  return config;
};
