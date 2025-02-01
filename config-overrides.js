const webpack = require('webpack');

module.exports = function override(config) {
  // Adiciona os polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    util: require.resolve('util/'),
    url: require.resolve('url/'),
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/')
  };

  // Adiciona os plugins necessários
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ];

  return config;
}; 