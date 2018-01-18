<img src="https://cloud.githubusercontent.com/assets/9234/19400090/8c20c53c-9222-11e6-937c-02bce55e5301.png" alt="City of Boston" width="150" />

This is the pattern library for the City of Boston. It's currently a work in progress, but we're adding to it every day. 

**This project contains the marks and trade dress of the City of Boston's digital properties and should not be reused without the express permission of the City of Boston.**

[![Build Status](https://travis-ci.org/CityOfBoston/patterns.svg?branch=develop)](https://travis-ci.org/CityOfBoston/patterns)
[![Greenkeeper badge](https://badges.greenkeeper.io/CityOfBoston/patterns.svg)](https://greenkeeper.io/)

## Installing

We recommend using [`yarn`](https://yarnpkg.com/en/). Run `yarn` to install dependencies.

## Running

Once the repository has been cloned, you can build the components with:

`yarn gulp build`

After building the components, you can run `yarn fractal -- start --watch` to get a server running. You should be able to visit `http://localhost:3000` in your browser and view the pattern library.

## Development

The pattern library is built using Stylus. We're using PostCSS, Autoprefixer, and Rucksack as well. When Javascript is required, we're using plain javascript. All components should work without javascript as a default.

To develop against the pattern library, you can run:

`yarn gulp`

This will build the components and watch for changes. Run `yarn fractal -- start --watch` in another window to keep a server running.

## Check-in / Deployment

PRs should be made against the develop branch. To do a deploy, force-push the
develop branch on to the production branch. Force-push prevents production from
accidentally getting changes that aren’t in develop.

## Reporting bugs

If you need to submit a bug report for the pattern library, please follow these guidelines. Following these guidelines helps us and the community better understand your report, reproduce the bug, and find related issues.

### Prior to submitting a bug

 * Verify that you are able to reproduce it repeatedly. Try multiple browsers, devices, etc. Also, try clearing your cache.
 * Perform a quick search of our [existing issues](https://github.com/CityOfBoston/cob-patterns/issues) to see if it has been logged previously.

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
