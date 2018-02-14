exports.config = {
  srcDir: 'web-components',

  namespace: 'all',
  buildEs5: true,

  // Re-enable after https://github.com/ionic-team/stencil/issues/468 is sorted
  // out.
  serviceWorker: false,

  // URL where we want our components, index.html, and sw.js to live
  publicPath: '/web-components/all/',
  // Directory that maps to the public path.
  wwwDir: 'assets/web-components/',
  // We want the components to be built directly into /web-components/
  buildDir: '.',

  plugins: [
    // We use PostCSS with autoprefixer to let us use flexbox in component CSS
    // without writing the prefixes ourselves.
    require('./lib/stencil/postcss-plugin')({
      plugins: [require('autoprefixer')],
    }),
  ],
};
