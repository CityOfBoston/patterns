'use strict';

/*
 * Require the Fractal module
 */
 const fractal = module.exports = require('@frctl/fractal').create();

/*
 * Give your project a title.
 */
fractal.set('project.title', 'City of Boston');

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
fractal.web.set('static.path', __dirname + '/public');

/*
 * Tell the Fractal web preview plugin to use this template for previews.
 */
fractal.set('components.default.preview', '@preview');

// Define a theme
const Truth = require('@frctl/mandelbrot')({
  "skin": "white",
  "styles": [
    "default",
    "/theme/css.css"
  ]
});

// specify a directory to hold the theme override templates
Truth.addLoadPath(__dirname + '/theme');

fractal.web.theme(Truth);
