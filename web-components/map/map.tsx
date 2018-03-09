/* global: templayed */

import { Component, Element, Listen, Prop, State, Watch } from '@stencil/core';

import { Feature, FeatureCollection } from 'geojson';

import {
  control as Lcontrol,
  latLng as LlatLng,
  latLngBounds as LlatLngBounds,
  Control as LeafletControl,
  GeoJSON as LeafletGeoJSON,
  Icon as LeafletIcon,
  Layer as LeafletLayer,
  LayerGroup as LeafletLayerGroup,
  LeafletEvent,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Path as LeafletPath,
} from 'leaflet';

import { basemapLayer, tiledMapLayer, query as esriQuery } from 'esri-leaflet';

import { geosearch, GeosearchControl } from 'esri-leaflet-geocoder';

// This is our fork of Leaflet/Leaflet.markercluster to fix for module-based
// importing.
import { MarkerClusterGroup } from 'leaflet.markercluster';

// Has a global definition. Look, the code is 5 years old.
import 'templayed';
declare function templayed(string): (Object) => string;

const DEFAULT_BASEMAP_URL =
  'https://awsgeo.boston.gov/arcgis/rest/services/Basemaps/BostonCityBasemap_WM/MapServer';

const BOSTON_BOUNDS = LlatLngBounds(
  LlatLng(42.170274, -71.348648),
  LlatLng(42.456141, -70.818901)
);

const WAYPOINT_ICON = new LeafletIcon({
  iconUrl: '/images/global/icons/mapping/waypoint-freedom-red.svg',
  shadowUrl: null,

  iconSize: [35, 46], // size of the icon
  iconAnchor: [17, 46], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
});

export interface LayerConfig {
  url: string;
  label: string;
  color?: string;
  hoverColor?: string;
  fill?: boolean;
  iconSrc?: string;
  clusterIcons?: boolean;
  popupTemplate?: string;
  popupTemplateCompiled?: (Object) => string;
}

interface LayerRecord {
  // The parent layer that's on the map. Will usually be featureLayer, except in
  // the case of icon clustering, when it will be a MarkerClusterGroup.
  mapLayer: LeafletGeoJSON | MarkerClusterGroup;
  featuresLayer: LeafletGeoJSON;
  config: LayerConfig;
}

// The Leaflet GeoJSON layer adds a "feature" property on to the layers that it
// creates. We use this interface to typecheck that. In reality, the layers will
// be instances of Path subclasses or Markers.
interface GeoJSONFeatureLayer extends LeafletLayer {
  feature: Feature<any> | FeatureCollection<any>;
}

@Component({
  tag: 'cob-map',
  styleUrls: [
    'map.css',
    '../../node_modules/leaflet/dist/leaflet.css',
    '../../node_modules/leaflet.markercluster/dist/MarkerCluster.css',
  ],
})
export class CobMap {
  @Element() el;

  @Prop({ context: 'isServer' })
  private isServer: boolean;

  // Would call this "title" except that causes browsers to show a tooltip when
  // hovering over the map.
  @Prop() heading: string;
  @Prop() latitude: number = 42.357004;
  @Prop() longitude: number = -71.062309;
  @Prop() zoom: number = 14;
  @Prop() showZoomControl: boolean = false;
  @Prop() showLegend: boolean = false;
  @Prop() showAddressSearch: boolean = false;
  @Prop() addressSearchHeading: string = 'Address search';
  @Prop() addressSearchPlaceholder: string = 'Search for an address…';
  @Prop() basemapUrl: string = DEFAULT_BASEMAP_URL;

  @Prop() openOverlay: boolean = false;

  // Used to keep our IDs distinct on the page
  idSuffix = Math.random()
    .toString(36)
    .substring(2, 7);

  map: LeafletMap;
  zoomControl: LeafletControl;
  addressSearchControl: GeosearchControl;
  // We keep a reference to the DOM element for the search control because we
  // want to move it into our overlay, rather than have it as an Esri control.
  addressSearchControlEl: HTMLElement | null;
  addressSearchResultsLayers: LeafletLayerGroup;

  // Used to distinguish between map moves that come from the UI and those that
  // come from someone external changing our attributes. Keeps us from
  // redundantly (and often mistakenly) updating the map when it's already
  // updated.
  mapMoveInProgress: boolean;

  // We keep track of element -> layer info in this map so that if a config
  // child element's values update we can modify the layer.
  layerRecordsByConfigElement: Map<HTMLElement, LayerRecord> = new Map();
  // Configs are copied into this State to trigger re-rendering.
  @State() layerConfigs: LayerConfig[] = [];

  componentWillLoad() {
    if (this.isServer) {
      // We don't want to mount Leaflet on the server, even though it does
      // serialize the generated elements, since Leaflet then won't start
      // up correctly when we hit the browser.
      return;
    }

    this.map = new LeafletMap(this.el, {
      zoomControl: false,
      // 11 really shows the Greater Boston area well, no need to zoom to show
      // all of New England or the world.
      minZoom: 11,
      // This the max we have for the "Gray" Esri map, so we don't allow
      // zooming in any further, even though the Boston map supports it.
      maxZoom: 16,
    })
      .setView([this.latitude, this.longitude], this.zoom)
      // Boston basemap only includes Boston, so we layer over Esri's "Gray"
      // basemap.
      .addLayer(basemapLayer('Gray'))
      .addLayer(tiledMapLayer({ url: this.basemapUrl }));

    this.zoomControl = Lcontrol.zoom({
      position: 'bottomright',
    });

    this.addressSearchControl = geosearch({
      expanded: true,
      placeholder: this.addressSearchPlaceholder,
      collapseAfterResult: false,
      zoomToResult: true,
      searchBounds: BOSTON_BOUNDS,
    });

    (this.addressSearchControl as any).on(
      'results',
      this.onAddressSearchResults.bind(this)
    );

    this.addressSearchResultsLayers = new LeafletLayerGroup().addTo(this.map);

    this.map.on({
      moveend: this.handleMapPositionChangeEnd.bind(this),
      zoomend: this.handleMapPositionChangeEnd.bind(this),
    });

    this.updateControls();
  }

  componentDidLoad() {
    this.map.invalidateSize();
  }

  componentDidUnload() {
    this.map.remove();
    this.layerRecordsByConfigElement = new Map();
  }

  componentDidUpdate() {
    // If we're showing the search control we need to add it again to the page
    // after a re-render.
    if (this.addressSearchControlEl) {
      this.el
        .querySelector('.cob-address-search-field-container')
        .appendChild(this.addressSearchControlEl);
    }
  }

  @Listen('cobMapEsriLayerConfig')
  onChildEsriDataConfig(ev) {
    ev.stopPropagation();
    this.addEsriLayer(ev.target, ev.detail);
  }

  onFeatureMouseOver(configElement: HTMLElement, ev: LeafletEvent) {
    const layerRecord = this.layerRecordsByConfigElement.get(configElement);
    if (!layerRecord) {
      return;
    }

    const feature: LeafletLayer = ev.target;
    const { config } = layerRecord;

    if (feature instanceof LeafletPath) {
      if (config.hoverColor) {
        feature.setStyle(this.makeFeatureHoverStyle(config));
        feature.bringToFront();
      }
    }
  }

  onFeatureMouseOut(configElement: HTMLElement, ev: LeafletEvent) {
    const layerRecord = this.layerRecordsByConfigElement.get(configElement);
    if (!layerRecord) {
      return;
    }

    const feature: LeafletLayer = ev.target;
    layerRecord.featuresLayer.resetStyle(feature);
  }

  onAddressSearchResults(data) {
    this.addressSearchResultsLayers.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
      this.addressSearchResultsLayers.addLayer(
        new LeafletMarker(data.results[i].latlng, {
          icon: WAYPOINT_ICON,
        })
      );
    }
  }

  makePopupContent(
    configElement: HTMLElement,
    featureLayer: GeoJSONFeatureLayer
  ): string | null {
    const layerRecord = this.layerRecordsByConfigElement.get(configElement);
    if (!layerRecord) {
      return null;
    }

    const { config } = layerRecord;
    if (!config.popupTemplateCompiled) {
      return null;
    }

    const { feature } = featureLayer;
    if (feature.type !== 'Feature') {
      return null;
    }

    const { properties } = feature;

    // We trim the property values down because some Esri values are a string
    // with spaces, and we want those to be falsey (an empty string) for
    // template conditionals.
    const trimmedProperties = {};
    Object.keys(properties).forEach(key => {
      const val = properties[key];
      trimmedProperties[key] = typeof val === 'string' ? val.trim() : val;
    });

    return config.popupTemplateCompiled(trimmedProperties);
  }

  makeFeatureStyle({ color, fill }: LayerConfig) {
    return {
      color,
      fill,
      weight: 3,
    };
  }

  makeFeatureHoverStyle({ color, hoverColor, fill }: LayerConfig) {
    return {
      color: hoverColor || color,
      fill,
      weight: 4,
    };
  }

  addEsriLayer(configElement: HTMLElement, config: LayerConfig) {
    const layerRecord = this.layerRecordsByConfigElement.get(configElement);

    if (layerRecord) {
      layerRecord.mapLayer.remove();
    }

    const layerOptions = {
      interactive: !!config.popupTemplate,
      // We set the style at the options level to create the default for new
      // features. Calling setStyle() on a GeoJSON layer only updates the
      // current child feature layers, it doesn't have any effect on this
      // default.
      //
      // Current types require this to be a function, even though the code
      // supports a hash. Let's not rock the boat and just use a function.
      style: () => this.makeFeatureStyle(config),
      pointToLayer: config.iconSrc
        ? (_, latlng) =>
            new LeafletMarker(latlng, {
              icon: new LeafletIcon({
                iconUrl: config.iconSrc,
                iconSize: [30, 30],
              }),
            })
        : undefined,
      onEachFeature: (_, featureLayer: LeafletLayer) => {
        featureLayer.on({
          mouseover: this.onFeatureMouseOver.bind(this, configElement),
          mouseout: this.onFeatureMouseOut.bind(this, configElement),
        });
      },
    };

    // We create a blank GeoJSON layer just so we have it. Data will be added
    // after it’s loaded from Esri.
    const featuresLayer = new LeafletGeoJSON(null, layerOptions);

    const mapLayer = (config.clusterIcons
      ? new MarkerClusterGroup().addLayer(featuresLayer)
      : featuresLayer
    ).addTo(this.map);

    // We manually run an Esri Query rather than using the built-in
    // FeatureLayer, which queries automatically. FeatureLayer has the advantage
    // of only loading features that fit within the map’s current view, but the
    // downside of not being immediately compatible with MarkerClusterGroup (due
    // to how it adds layers). Since our geo data is all limited to the Boston
    // metro area, querying just on the map location is not a useful
    // optimization, so we use GeoJSON directly, which is compatible with
    // MarkerClusterGroup.
    //
    // If limiting by the map’s view is valuable, it will require some massaging
    // of the FeatureLayer implementation to add its layers to the
    // MarkerClusterGroup rather than the map directly.
    esriQuery({ url: config.url })
      .where('1=1')
      .run((err, featureCollection) => {
        if (err) {
          throw err;
        }

        featuresLayer.addData(featureCollection);

        if (mapLayer !== featuresLayer) {
          // MarkerClusterGroup only processes new icons on adding the layer.
          // There's no method to call to re-pull the child Markers from
          // featuresLayer now that addData has created them.
          mapLayer.clearLayers();
          mapLayer.addLayer(featuresLayer);
        }
      });

    if (config.popupTemplate) {
      config.popupTemplateCompiled = templayed(config.popupTemplate);
      // Since the MarkerClusterLayer works by pulling the layers out of their
      // original parent, we need to bind to the map layer rather than the
      // feature layer.
      mapLayer.bindPopup(this.makePopupContent.bind(this, configElement));
    } else {
      config.popupTemplateCompiled = null;
      mapLayer.unbindPopup();
    }

    const newLayerRecord = { mapLayer, featuresLayer, config };

    this.layerRecordsByConfigElement.set(configElement, newLayerRecord);
    this.updateLayerConfigState();
  }

  updateLayerConfigState() {
    const layerConfigs = [];
    this.layerRecordsByConfigElement.forEach(({ config }) =>
      layerConfigs.push(config)
    );
    this.layerConfigs = layerConfigs;
  }

  // Handler to keep our attributes up-to-date with map movements from the UI.
  handleMapPositionChangeEnd() {
    this.mapMoveInProgress = true;

    const { lat, lng } = this.map.getCenter();
    this.el.setAttribute('latitude', lat.toString());
    this.el.setAttribute('longitude', lng.toString());
    this.el.setAttribute('zoom', this.map.getZoom().toString());

    this.mapMoveInProgress = false;
  }

  handleLegendLabelMouseClick(ev: MouseEvent) {
    this.el.openOverlay = !this.el.openOverlay;
    ev.stopPropagation();
    ev.preventDefault();
  }

  @Watch('longitude')
  @Watch('latitude')
  @Watch('zoom')
  updatePosition() {
    if (!this.mapMoveInProgress) {
      this.map.setView([this.latitude, this.longitude], this.zoom);
    }
  }

  @Watch('showZoomControl')
  @Watch('showAddressSearch')
  updateControls() {
    if (this.showZoomControl) {
      this.zoomControl.addTo(this.map);
    } else {
      this.zoomControl.remove();
    }

    if (this.showAddressSearch) {
      this.addressSearchControlEl = this.addressSearchControl.onAdd(this.map);

      // We massage the auto-generated DOM to match our Fleet classes
      const inputEl = this.addressSearchControlEl.querySelector('input');
      inputEl.setAttribute('id', this.getSearchFieldInputId());
      inputEl.classList.add('sf-i-f');
      inputEl.classList.remove('leaflet-bar');
      inputEl.parentElement.classList.add('sf-i');

      const searchIconEl = document.createElement('div');
      searchIconEl.classList.add('sf-i-b');
      inputEl.parentElement.insertBefore(searchIconEl, inputEl.nextSibling);
    } else {
      this.addressSearchControl.remove();
      this.addressSearchControlEl = null;
    }
  }

  getSearchFieldInputId() {
    return `cob-map-address-search-field-${this.idSuffix}`;
  }

  render() {
    // During server rendering, boolean attributes start out as the empty string
    // rather than a true.
    const openOverlay = this.openOverlay !== false;

    const toggleInputId = `cob-map-overlay-collapsible-${this.idSuffix}`;

    return (
      <div class="cob-overlay">
        <div class="co">
          <input
            id={toggleInputId}
            type="checkbox"
            class="co-f d-n"
            aria-hidden="true"
            checked={openOverlay}
          />
          <label
            htmlFor={toggleInputId}
            class="co-t"
            onClick={this.handleLegendLabelMouseClick.bind(this)}
          >
            {this.heading}
          </label>

          <div class="co-b b--w cob-overlay-content">
            <slot name="instructions" />

            {this.showAddressSearch && (
              <div class="sf sf--md m-v500">
                <label class="sf-l">{this.addressSearchHeading}</label>
                <div class="cob-address-search-field-container m-v100" />
              </div>
            )}

            {this.showLegend && (
              <div class="g cob-legend-table">
                {this.layerConfigs.map(config => (
                  <div
                    class={`${
                      this.layerConfigs.length === 1 ? 'g--12' : 'g--6'
                    } cob-legend-table-row m-b200`}
                  >
                    <div class="cob-legend-table-icon">
                      {this.renderLegendIcon(config)}
                    </div>
                    <div class="t--subinfo cob-legend-table-label">
                      {config.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderLegendIcon({ fill, color, iconSrc }: LayerConfig) {
    if (iconSrc) {
      return <img src={iconSrc} width="50" height="50" />;
    } else if (fill) {
      return (
        <div
          style={{
            margin: '4px',
            border: '3px',
            borderStyle: 'solid',
            borderColor: color,
          }}
        >
          <div
            style={{
              background: color,
              opacity: '0.2',
              width: '36px',
              height: '36px',
            }}
          />
        </div>
      );
    } else {
      return (
        <div
          style={{
            width: '50px',
            height: '3px',
            marginTop: '23px',
            marginBottom: '24px',
            backgroundColor: color,
          }}
        />
      );
    }
  }
}
