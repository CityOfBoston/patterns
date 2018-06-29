import { ClientFunction, Selector } from 'testcafe';

// Generates a URL to the Fractal "preview" page, which is a rendering of just
// the component. (This is the same page that we run through Percy.)
export function componentPreviewUrl(component, variant = null) {
  const serverUrl =
    process.env.TEST_SERVER_URL ||
    `https://localhost:${process.env.FRACTAL_PORT || 3030}/`;

  // The "disable-browsersync" engages our custom "blacklist" to keep Fractal's
  // Browsersync from running (see fractal.js) since we definitely don't want
  // hot-reloading to happen in the middle of a test.
  return `${serverUrl}components/preview/${component}${
    variant ? `--${variant}` : ''
  }?disable-browsersync`;
}

// Selector that takes a query for a Stencil web component and returns it when
// it is up and running (based on the Stencil onComponentReady method).
// Especially important on IE11, which takes a bit for the component to be
// ready.
//
// The function here has to be synchronous, but TestCafe will call it repeatedly
// (until a timeout passes).
export const readyComponentSelector = Selector(query => {
  const componentEl = document.querySelector(query) as any;
  if (!componentEl.componentOnReady) {
    // Stencil has not loaded at all yet, so we can't set up our listener.
    return null;
  } else if (!componentEl.__isReady) {
    // This might cause multiple listeners, but they're idempotent so that's not
    // worth guarding against.
    componentEl.componentOnReady().then(() => {
      componentEl.__isReady = true;
    });
    return null;
  } else {
    return componentEl;
  }
});

// Headers that allow CORS requests. Necessary for nock-mocking of things like
// ArcGIS.
export const CORS_ALLOW_HEADERS = {
  'Access-Control-Allow-Origin': '*',
};
