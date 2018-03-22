/* global fixture */
import { Selector } from 'testcafe';
import {
  componentPreviewUrl,
  CORS_ALLOW_HEADERS,
} from '../../../../lib/testcafe/helpers';
import * as nock from 'nock';
import MapModel from './map-model';

const SNOW_PARKING_JSON = require('./snow-parking.json');
const CITY_COUNCIL_JSON = require('./city-council.json');

function layerUrl(locator, layer) {
  return `/sFnw0xNflSi8J0uh/arcgis/rest/services/${locator}/FeatureServer/${layer}/query`;
}

let arcGisScope: nock.Scope;

fixture('Map')
  .page(componentPreviewUrl('map', 'default'))
  .before(async () => {
    arcGisScope = nock('https://services.arcgis.com')
      .persist()
      .get(layerUrl('SnowParking', 0))
      .query(true)
      .reply(200, SNOW_PARKING_JSON, CORS_ALLOW_HEADERS)
      .get(layerUrl('City_Council_Districts', 0))
      .query(true)
      .reply(200, CITY_COUNCIL_JSON, CORS_ALLOW_HEADERS);
  })
  .after(async () => {
    arcGisScope.persist(false);
  });

// We keep everything consistent as lowercase because IE11 forces lowercase.
const DISTRICT_DEFAULT_COLOR = '#0c2639';
const DISTRICT_HOVER_COLOR = '#fb4d42';
const DISTRICT_GREEN_COLOR = '#00ff00';

const PARKING_ICON = '/images/global/icons/mapping/parking.svg';

const map = new MapModel();

test('Districts are drawn and hover', async t => {
  const defaultPolygons = map.interactivePolygonsByColor(
    DISTRICT_DEFAULT_COLOR
  );
  const hoverPolygons = map.interactivePolygonsByColor(DISTRICT_HOVER_COLOR);

  await defaultPolygons.exists;
  // There are 9 city council districts
  await t.expect(defaultPolygons.count).eql(9);

  // This district should be visible and the pointer won't be obscured by a
  // marker.
  await t.hover(defaultPolygons.nth(2));
  await t.expect(defaultPolygons.count).eql(8);
  await t.expect(hoverPolygons.count).eql(1);
});

test('Changing <cob-map-esri-layer> dynamically changes layer color', async t => {
  const districtLayerConfig = map.esriLayerConfigByLabel(
    'Boston City Council Districts'
  );

  await t
    .expect(districtLayerConfig.getAttribute('color'))
    .eql(DISTRICT_DEFAULT_COLOR);
  await t
    .expect(map.interactivePolygonsByColor(DISTRICT_GREEN_COLOR).exists)
    .notOk();

  await t.eval(
    () => {
      const councilDataSourceEl = districtLayerConfig() as any;
      councilDataSourceEl.color = DISTRICT_GREEN_COLOR;
    },
    {
      dependencies: { districtLayerConfig, DISTRICT_GREEN_COLOR },
    }
  );

  await t
    .expect(map.interactivePolygonsByColor(DISTRICT_GREEN_COLOR).exists)
    .ok();
});

test('Clicking parking marker shows popup', async t => {
  // Switch pages so that the overlay can't obscure clicking on the marker.
  await t.navigateTo(componentPreviewUrl('map', 'no-overlay'));

  // The first point in the fixture is 100 Clarendon St.
  await t.click(map.markersByIcon(PARKING_ICON));
  await t.expect(map.leafletPopup.innerText).contains(
    // This is special intro text for the 100 Clarendon garage.
    'You must show proof of your residency in the Back Bay, South End, or Bay Village.'
  );
});
