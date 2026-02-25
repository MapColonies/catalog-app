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

  config.resolve.alias = {
    ...config.resolve.alias,
    'react-dnd': path.resolve(__dirname, './node_modules/react-dnd'),
    'react-dnd-html5-backend': path.resolve(
      __dirname,
      './node_modules/react-dnd-html5-backend'
    ),
  };

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

  return config;
};
