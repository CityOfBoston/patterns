import { render } from '@stencil/core/testing';
const escapeHtml = require('escape-html');
import { CobViz, VizConfig } from './viz';

const MAP_CONFIG: VizConfig = {
  vizId: '123456',
  title: 'What is my title',
  description: 'This is a description',
  dataSources: [
    {
      uid: 'SomeRandomValue',
      type: 'cob-arcgis',
      icon:
        'https://patterns.boston.gov/images/global/icons/mapping/bathroom.svg',
      clusterIcons: true,
      polygonStyle: {
        name: 'default',
        color: '#0C2639',
        hoverColor: '#FB4D42',
      },
      popover: '<p>I am a popover</p>',
      attributes: {
        service:
          'https://services.arcgis.com/sFnw0xNflSi8J0uh/ArcGIS/rest/services/food_trucks_schedule/FeatureServer',
        layer: 0,
      },
      legendLabel: 'I am a legend!',
    },
  ],
  maps: [
    {
      uid: 'ZWVVViN3h1eZf0Ssnlsa8',
      latitude: 42.347316,
      longitude: -71.065227,
      zoom: 12,
      showZoomControl: true,
      showLegend: true,
      findUserLocation: true,
      searchForAddress: true,
      zoomToAddress: true,
      placeholderText: 'Search for an address...',
      addressSearchPopupDataSourceUid: 'SomeRandomValue',
    },
  ],
};

function makeJsonAttribute(obj) {
  return escapeHtml(JSON.stringify(obj));
}

it('configures from a JSON string attribute', async () => {
  const vizEl = await render({
    components: [CobViz],
    html: `<cob-viz config="${makeJsonAttribute(MAP_CONFIG)}"></cob-viz>`,
  });

  const mapEl = vizEl.querySelector('cob-map');
  const instructions = mapEl.querySelector('[slot=instructions]');

  expect(mapEl.getAttribute('heading')).toEqual(MAP_CONFIG.title);
  expect(instructions.innerHTML).toEqual(MAP_CONFIG.description);
});

it('configures from an internal <script> tag', async () => {
  const vizEl = await render({
    components: [CobViz],
    html: `<cob-viz>
      <script slot="config" type="application/json">
        ${JSON.stringify(MAP_CONFIG, null, 2)}
      </script>
    </cob-viz>`,
  });

  const mapEl = vizEl.querySelector('cob-map');
  const instructions = mapEl.querySelector('[slot=instructions]');

  expect(mapEl.getAttribute('heading')).toEqual(MAP_CONFIG.title);
  expect(instructions.innerHTML).toEqual(MAP_CONFIG.description);
});

it('passes map-* attributes to the <cob-map> element', async () => {
  const vizEl = await render({
    components: [CobViz],
    html: `<cob-viz
      config="${makeJsonAttribute(MAP_CONFIG)}"
      map-id="myMap"
      map-style="background-color: green"
      map-onclick="return 'click';"></cob-viz>`,
  });

  const mapEl = vizEl.querySelector('cob-map');
  expect(mapEl.id).toEqual('myMap');
  expect(mapEl.style.backgroundColor).toEqual('green');
  expect(mapEl.onclick()).toEqual('click');
});
