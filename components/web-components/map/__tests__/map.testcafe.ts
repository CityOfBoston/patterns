/* global fixture */
import { Selector, ClientFunction } from 'testcafe';
import {
  componentPreviewUrl,
  CORS_ALLOW_HEADERS,
} from '../../../../lib/testcafe/helpers';
import * as nock from 'nock';
import MapModel from './map-model';

const SNOW_PARKING_JSON = require('./snow-parking.json');
const CITY_COUNCIL_JSON = require('./city-council.json');

// These need to match the URLs exactly, including case. Without that the
// network requests will hang.
function layerUrl(locator, layer) {
  return `/sFnw0xNflSi8J0uh/arcgis/rest/services/${locator}/FeatureServer/${layer}/query`;
}

let arcGisScope: nock.Scope;

async function nockSetup() {
  arcGisScope = nock('https://services.arcgis.com')
    .persist()
    .get(layerUrl('SnowParking', 0))
    .query(true)
    .reply(200, SNOW_PARKING_JSON, CORS_ALLOW_HEADERS)
    .get(layerUrl('City_Council_Districts', 0))
    .query(true)
    .reply(200, CITY_COUNCIL_JSON, CORS_ALLOW_HEADERS);
}
async function nockTeardown() {
  arcGisScope.persist(false);
}

fixture('Map')
  .page(componentPreviewUrl('map', 'default'))
  .before(nockSetup)
  .after(nockTeardown);

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

// We don't want an overlay so that we don't need to worry about it obscuring
// the marker we're trying to click on.
fixture('Map Popup')
  .page(componentPreviewUrl('map', 'no-overlay'))
  .before(nockSetup)
  .after(nockTeardown);

test('Clicking parking marker shows popup', async t => {
  // The first point in the fixture is 100 Clarendon St.
  await t.click(map.markersByIcon(PARKING_ICON));
  await t.expect(map.leafletPopup.innerText).contains(
    // This is special intro text for the 100 Clarendon garage.
    'You must show proof of your residency in the Back Bay, South End, or Bay Village.'
  );
});

fixture('Map Modal')
  .page(componentPreviewUrl('map', 'modal-toggle'))
  .before(nockSetup)
  .after(nockTeardown);

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
