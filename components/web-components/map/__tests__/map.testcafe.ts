import { Selector, ClientFunction, RequestMock } from 'testcafe';

import {
  componentPreviewUrl,
  CORS_ALLOW_HEADERS,
  matchWithAnyQuery,
} from '../../../../lib/testcafe/helpers';

import MapModel from './map-model';

const SNOW_PARKING_JSON = require('./snow-parking.json');
const CITY_COUNCIL_JSON = require('./city-council.json');

function layerMatcher(locator: string, layer: number) {
  return matchWithAnyQuery(
    `https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/${locator}/FeatureServer/${layer}/query`
  );
}

// For testing purposes, we intercept calls to S3 the charts are
const arcgisMock = RequestMock()
  .onRequestTo(layerMatcher('SnowParking', 0))
  .respond(SNOW_PARKING_JSON, 200, CORS_ALLOW_HEADERS)
  .onRequestTo(layerMatcher('City_Council_Districts', 0))
  .respond(CITY_COUNCIL_JSON, 200, CORS_ALLOW_HEADERS);

fixture('Map')
  .page(componentPreviewUrl('map', 'default'))
  .requestHooks(arcgisMock);

// We keep everything consistent as lowercase because IE11 forces lowercase.
const DISTRICT_DEFAULT_COLOR = '#0c2639';
const DISTRICT_HOVER_COLOR = '#fb4d42';

const PARKING_ICON = '/images/global/icons/mapping/parking.svg';

const map = new MapModel();

test('Districts are drawn and hover', async t => {
  const defaultPolygons = map.interactivePolygonsByColor(
    DISTRICT_DEFAULT_COLOR
  );
  const hoverPolygons = map.interactivePolygonsByColor(DISTRICT_HOVER_COLOR);

  await defaultPolygons();
  // There are 9 city council districts
  await t.expect(defaultPolygons.count).eql(9);

  // This district should be visible and the pointer won't be obscured by a
  // marker.
  await t.hover(defaultPolygons.nth(2));
  await t.expect(defaultPolygons.count).eql(8);
  await t.expect(hoverPolygons.count).eql(1);
});

test('Clicking parking marker shows popup', async t => {
  // The first point in the fixture is 100 Clarendon St.
  await t.click(map.markersByIcon(PARKING_ICON));
  await t.expect(map.leafletPopup.innerText).contains(
    // This is special intro text for the 100 Clarendon garage.
    'You must show proof of your residency in the Back Bay, South End, or Bay Village.'
  );
});

fixture('Map Modal')
  .page(componentPreviewUrl('map', 'modal-closed'))
  .requestHooks(arcgisMock);

test('Showing and hiding with buttons and window history', async t => {
  const goBack = ClientFunction(() => window.history.back());
  const goForward = ClientFunction(() => window.history.forward());

  // Ensures that the page loads before we start messing with history. Otherwise
  // Edge will click "back" right off of the page.
  await map.root();

  await t.click(Selector('a.btn'));
  await t.expect(map.leafletMap.exists).ok();

  await goBack();
  await t.expect(map.leafletMap.exists).notOk();

  await goForward();
  await t.expect(map.leafletMap.exists).ok();

  await t.click(map.modalCloseButton);
  await t.expect(map.leafletMap.exists).notOk();

  // Regression to ensure that the close button clears out the hash, otherwise
  // pressing the button won't cause a hashchange event.
  await t.click(Selector('a.btn'));
  await t.expect(map.leafletMap.exists).ok();
});
