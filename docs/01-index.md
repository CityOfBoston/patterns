---
title: City of Boston Patterns
---

This is the pattern library for the City of Boston. It's currently a work in progress, but we're adding to it every day.

## Running

To get up running, install the Fractal command line tool. This can be done with:

`npm i -g @frctl/fractal`

Once the repository has been cloned, you can build the components with:

`gulp`

After building the components, you can run `fractal start --watch` to get a server running. You should be able to visit `http://localhost:3000` in your browser and view the pattern library.

## Development

The pattern library is built using Stylus. We're using PostCSS, Autoprefixer, and Rucksack as well. When Javascript is required, we're using plain javascript. All components should work without javascript as a default.

To develop against the pattern library, you can run:

`gulp`

This will build the components and watch for changes. Run `fractal start --watch` in another window to keep a server running.
