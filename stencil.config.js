exports.config = {
  namespace: 'all',
  buildEs5: true,

  // Re-enable after https://github.com/ionic-team/stencil/issues/468 is sorted
  // out.
  serviceWorker: false,

  srcDir: 'web-components',

  // Directory that maps to the server’s /
  wwwDir: 'assets',
  generateWWW: true,
  // Since the wwwDir ('assets') is shared by Fractal, we can't delete it.
  emptyWWW: false,

  // Relative to wwwDir. Keeps our components compartmentalized in the Fleet
  // library.
  buildDir: 'web-components',

  // Because of https://github.com/ionic-team/stencil/issues/563 we don't use
  // the built-in index.html support, since if it gets written straight into the
  // assets/ directory then it replaces the Fractal home page. As a workaround,
  // we copy a different index.html file into web-components.
  //
  // It won't be pre-rendered, but that's fine.
  copy: [{ src: 'html', dest: 'web-components' }],

  plugins: [
    // We use PostCSS with autoprefixer to let us use flexbox in component CSS
    // without writing the prefixes ourselves.
    require('./lib/stencil/postcss-plugin')({
      plugins: [require('autoprefixer')],
    }),
  ],
};
