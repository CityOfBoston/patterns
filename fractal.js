'use strict';

const stencil = require('@stencil/core/server');

/*
 * Require the Fractal module
 */
const fractal = (module.exports = require('@frctl/fractal').create());

/*
 * Give your project a title.
 */
fractal.set('project.title', 'Fleet');

/*
 * A place to build the project to
 */
fractal.web.set('builder.dest', __dirname + '/public');

/*
 * Tell Fractal where to look for components.
 */
fractal.set('components.path', 'components');

/*
 * Tell Fractal where to look for documentation pages.
 */
fractal.set('docs.path', 'docs');

/*
 * Tell the Fractal web preview plugin where to look for static assets.
 */
fractal.web.set('static.path', __dirname + '/assets');

/*
 * Tell the Fractal web preview plugin to use this template for previews.
 */
fractal.set('components.default.preview', '@preview');

/*
 * Configure the server
 */
fractal.web.set('server.sync', true);
fractal.web.set('server.syncOptions', {
  open: true,
  notify: true,
  https: true,
  middleware: function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
});

const hbs = require('@frctl/handlebars')({
  helpers: {
    filename_to_string: function(str) {
      return str.replace(/-/g, ' ').replace('.svg', '');
    },
  },
});

/*
  This code wraps the handlebars engine to include Stencil's web component
  prerendering. We do this so that Percy has real HTML to work from when it
  makes screenshots.

  This has to be done in this way rather than with Handlebars helpers
  because Handlebars does not support async helpers, and the prerendering
  process is async. (Happily, Fractal handles returning a Promise from the
  render method.)
*/
fractal.components.engine({
  register(source, app) {
    const hbsAdapter = hbs.register(source, app);
    const hbsRender = hbsAdapter.render.bind(hbsAdapter);

    return Object.assign(hbsAdapter, {
      render(path, str, context, meta) {
        const hbsPromise = hbsRender(path, str, context, meta);

        // We only prerender for the preview frame. Otherwise the "HTML" shown in
        // the Fractal UI will be the prerendered rather than showing the
        // <web-component> usage.
        if (context._self.name === 'preview') {
          const stencilConfig = stencil.loadConfig(__dirname);
          const stencilRenderer = new stencil.Renderer(stencilConfig);

          return hbsPromise.then(str =>
            stencilRenderer
              .hydrate({
                html: str,
              })
              .then(results => results.html)
          );
        } else {
          return hbsPromise;
        }
      },
    });
  },
});

const mandelbrot = require('@frctl/mandelbrot');

const fleetTheme = mandelbrot({
  skin: 'blue',
  panels: ['html', 'info', 'resources', 'notes'],
  scripts: ['https://cdn.polyfill.io/v2/polyfill.min.js', 'default'],
  styles: ['default', '/css/theme.css'],
});

fractal.web.theme(fleetTheme);
