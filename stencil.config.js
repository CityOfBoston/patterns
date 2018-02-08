exports.config = {
  srcDir: 'web-components',

  namespace: 'all',
  bundles: [{ components: ['cob-contact-form'] }],

  // URL where we want our components, index.html, and sw.js to live
  publicPath: '/web-components/',
  // Directory that maps to the public path.
  wwwDir: 'assets/web-components/',
  // We want the components to be built directly into /web-components/
  buildDir: '.',
};
