# @cityofboston/web-components

This is a set of web component custom elements that are part of the City of
Boston’s [Fleet pattern library](https://patterns.boston.gov/).

This package uses [Stencil](https://stenciljs.com/) to build and run the
components.

## Using the Components

To use these components on a page, you’ll need to load the collection bundle
script:

```
<script src="https://patterns.boston.gov/web-components/all.js"></script>
```

This script will polyfill web component support when necessary.

You will also need Fleet’s CSS on the page to style the components correctly:

```
<!--[if !IE]><!-->
<link rel="stylesheet" type="text/css" href="https://patterns.boston.gov/css/public.css" />
<!--<![endif]-->
<!--[if lt IE 10]>
  <link media="all" rel="stylesheet" href="https://patterns.boston.gov/css/ie.css">
<![endif]-->
```

For documentation about the individual components and their attributes, see the
Fleet documentation at: https://patterns.boston.gov/

## Development

The Stencil build is automatically included in the `npm run dev` script from the
top level patterns. You can add web components to the Fractal component pages.

Additionally, the `web-components/index.html` file is served by Fractal at
https://localhost:3000/web-components/ if you want a lighter-weight playground
for testing the components.
