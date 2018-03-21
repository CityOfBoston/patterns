<img src="https://cloud.githubusercontent.com/assets/9234/19400090/8c20c53c-9222-11e6-937c-02bce55e5301.png" alt="City of Boston" width="150" />

This is the pattern library for the City of Boston. It's currently a work in progress, but we're adding to it every day. 

**This project contains the marks and trade dress of the City of Boston's digital properties and should not be reused without the express permission of the City of Boston.**

[![Build Status](https://travis-ci.org/CityOfBoston/patterns.svg?branch=develop)](https://travis-ci.org/CityOfBoston/patterns)
[![Greenkeeper badge](https://badges.greenkeeper.io/CityOfBoston/patterns.svg)](https://greenkeeper.io/)

## Installing

`npm install`

## Development

The pattern library is built using Stylus. We’re using PostCSS, Autoprefixer,
and Rucksack as well. When JavaScript is required for the CSS components, we’re
using plain JavaScript. All components should work without JavaScript as a
default.

Web components are developed in TypeScript using the
[Stencil](https://stenciljs.com/) tool for compilation, bundling, and polyfills.

To develop against the pattern library, you can run:

`npm run dev`

This will build the components and watch for changes, and start up a Fractal
server on https://localhost:3030/ to show the library.

Fractal uses a self-signed SSL certificate that is not trusted by browsers. If
you’re using Chrome, you can allow invalid local signatures from this config
setting: chrome://flags/#allow-insecure-localhost

All new features and changes need to work with our [supported
browsers](https://github.com/CityOfBoston/digital/wiki/Software-engineering-working-agreement#browsers-we-support).

## Testing

Fleet has 2 types of tests:
 - Unit tests, using [Jest](https://facebook.github.io/jest/)
 - Browser tests, using [TestCafe](https://testcafe.devexpress.com/)

During development, you can run `npm run jest.dev` to have Jest watch files and
re-run. 

To run the browser tests, start up your Fractal server with `npm run dev` and
then run `npm run testcafe.dev` to start up a remote TestCafe server. It will
print a URL that you can open in a web browser, and stay open to re-run tests
when they change. You can even open this URL in a VM or on another computer to
do testing in different browsers.

A prepush hook will run `npm run test`, which runs the Jest tests and also the
TestCafe tests using a headless Chrome browser.

## Check-in / Deployment

PRs should be made against the develop branch.

We have a Heroku pipeline that will automatically deploy per-PR instances of the
patterns library. Look in the PR messages for a link.

[Percy](https://percy.io/) will also run for all of the Fractal component pages,
so you can see if there are any breaking changes in the deploy.

In general, you should push to production immediately after merging the PR. To
do a production push, open a new PR from develop -> production and merge it. If
the change has significant visual changes, do visual browser testing before
merging.

The Travis job will automatically push to S3 and invalidate the CloudFront
cache.

## Reporting bugs

If you need to submit a bug report for the pattern library, please follow these guidelines. Following these guidelines helps us and the community better understand your report, reproduce the bug, and find related issues.

### Prior to submitting a bug

 * Verify that you are able to reproduce it repeatedly. Try multiple browsers, devices, etc. Also, try clearing your cache.
 * Perform a quick search of our [existing issues](https://github.com/CityOfBoston/patterns/issues) to see if it has been logged previously.

### Submitting a bug

 * Use a **clear and descriptive** title when creating your issue.
 * Include a bulleted list of steps to reproduce your issue.
 * Include the URL of the page that you're seeing the issue on.
 * Include screenshots if possible. Bonus points if you include an animated GIF of the issue.
 * Include details about your browser (which one, what version, using ad blockers?).
 * When filing your issue, assume that the recipient knows nothing about what you're talking about. There is no such thing as too many details when filing your issue.

### Bug report template

```
## Basic details

URL: [URL]

## Steps to reproduce

1. [FIRST]
2. [SECOND]
3. [THIRD]

## What I think should happen

[Describe your expected behavior here]

## What did happen

[Describe the actual behavior here]

## Browser details

Browser: [Enter browser]
Version: [Enter version]
Ad blocker: [Ad blocker?]

[SCREENSHOT]
```

## Code of Conduct

This project adheres to the [Contributor Covenant code of conduct](https://github.com/CityOfBoston/boston.gov/blob/develop/guides/01-code-of-conduct.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to <a href="mailto:digital@boston.gov">digital@boston.gov</a>.
