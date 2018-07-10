'use strict';

const path = require('path');
const fs = require('fs');
const stencil = require('@stencil/core/server');
const Handlebars = require('handlebars');

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
  snippetOptions: {
    blacklist: ['**/*?disable-browsersync'],
  },
  middleware: function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
});

fractal.web.set('server.port', process.env.PORT || 3030);

const hbs = require('@frctl/handlebars')({
  helpers: {
    filename_to_string: function(str) {
      return str.replace(/-/g, ' ').replace('.svg', '');
    },
    // Stencil helps us maintain docs in the source directories for the
    // components. This helper is here so that the Fractal component "Notes" can
    // import those README files so that they appear in the Fractal UI.
    //
    // For example, to pull in the documentation for <cob-viz>, use
    // {{stencil_readme viz}}
    stencil_readme: function(componentName) {
      const relativeDocPath = path.join(
        'web-components',
        componentName,
        'readme.md'
      );

      const docPath = path.join(__dirname, relativeDocPath);

      if (fs.existsSync(docPath)) {
        const readmeMd = fs.readFileSync(docPath, 'utf-8');

        // SafeString keeps Handlebars from escaping HTML and
        // particularly backticks (`). We want the readme.md to
        // be inserted as-is so that it gets marked down correctly.
        return new Handlebars.SafeString(readmeMd);
      } else {
        return `**stencil_readme:** _${relativeDocPath} not found_\n`;
      }
    },
  },
});

fractal.docs.engine(hbs);

/*
  This code wraps the handlebars engine to include Stencil's web component
  prerendering. We do this so that Percy has real HTML to work from when it
  makes screenshots.

  This has to be done in this way rather than with Handlebars helpers because
  Handlebars does not support async helpers, and the prerendering process is
  async. (Happily, Fractal handles returning a Promise from the render method.)

  We only use globalStencilRenderer when doing building exports. Otherwise we
  make one renderer per request so that it picks up code changes.
*/
let globalStencilRenderer = null;

fractal.components.engine({
  register(source, app) {
    const hbsAdapter = hbs.register(source, app);
    const hbsRender = hbsAdapter.render.bind(hbsAdapter);

    return Object.assign(hbsAdapter, {
      render(path, str, context, meta) {
        const hbsPromise = hbsRender(path, str, context, meta);

        // We only prerender for the preview frame. Otherwise the "HTML" shown
        // in the Fractal UI will be the prerendered rather than showing the
        // <web-component> usage.
        //
        // We absoutely need the prerendering for TestCafe because it inlines
        // the loader script. The result is that a "data-resources-url"
        // attribute on the <script> tag points to an absolute path. Without
        // that, a resourcesUrl is calculated that includes a hostname as well
        // (which will be either the Fractal server or the static files server).
        //
        // When it’s just a path, component JavaScript (which is lazy-loaded)
        // will get loaded through the TestCafe proxy. Going through the
        // TestCafe proxy prevents the browser from stumbling over CORS and
        // self-signed HTTPS certificates.
        //
        // This comes up in browsers that natively support "import" (Chrome and
        // Safari as of this writing) since TestCafe’s Hammerhead library is
        // unable to shim its proxy-rewrite into "import" the way it does for
        // XHR.
        if (context._self.name === 'preview') {
          let stencilRenderer;
          if (globalStencilRenderer) {
            stencilRenderer = globalStencilRenderer;
          } else {
            const stencilConfig = stencil.loadConfig(__dirname);
            stencilRenderer = new stencil.Renderer(stencilConfig);
          }

          return hbsPromise.then(str =>
            stencilRenderer.hydrate({ html: str }).then(({ html }) => {
              if (!globalStencilRenderer) {
                stencilRenderer.destroy();
              }

              return html;
            })
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

// Hooks in to the fractal build behavior to shut down the globalStencilRenderer.
// Otherwise its worker child processes keep this process alive.
fractal.web.on('builder:created', builder => {
  const stencilConfig = stencil.loadConfig(__dirname);
  globalStencilRenderer = new stencil.Renderer(stencilConfig);

  builder.on('end', () => {
    globalStencilRenderer.destroy();
  });

  builder.on('error', () => {
    globalStencilRenderer.destroy();
  });
});
