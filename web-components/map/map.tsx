/* global: templayed */

import { Component, Element, Prop, State, Method, Listen } from '@stencil/core';

import { Feature, FeatureCollection } from 'geojson';

import {
  control as Lcontrol,
  latLng as LlatLng,
  latLngBounds as LlatLngBounds,
  FeatureGroup as LeafletFeatureGroup,
  GeoJSON as LeafletGeoJSON,
  Icon as LeafletIcon,
  Layer as LeafletLayer,
  LeafletEvent,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Path as LeafletPath,
  PathOptions,
  LayerGroup,
} from 'leaflet';

import { basemapLayer, tiledMapLayer, query as esriQuery } from 'esri-leaflet';
import { geosearch, geocodeServiceProvider } from 'esri-leaflet-geocoder';

// This is our fork of Leaflet/Leaflet.markercluster to fix for module-based
// importing.
import { MarkerClusterGroup } from 'leaflet.markercluster';

// Has a global definition. Look, the code is 5 years old.
import 'templayed';
declare function templayed(string): (Object) => string;

// Run `gulp schema:map` to regenerate these files.
import { CobMap10, Filter } from './map-1.0.schema';

export type MapConfig = CobMap10;

const DEFAULT_BASEMAP_URL =
  'https://awsgeo.boston.gov/arcgis/rest/services/Basemaps/BostonCityBasemap_WM/MapServer';

const DEFAULT_ICON_SRC =
  'https://patterns.boston.gov/images/global/icons/mapping/waypoint-charles-blue.svg';

const DEFAULT_ADDRESS_SEARCH_WAYPOINT_ICON_SRC =
  'https://patterns.boston.gov/images/global/icons/mapping/waypoint-freedom-red.svg';

const DEFAULT_LOCATION_WAYPOINT_ICON_SRC =
  'https://patterns.boston.gov/images/global/icons/mapping/waypoint-optimistic-blue.svg';

const HORIZONTAL_LINE = '───────────';

const BOSTON_BOUNDS = LlatLngBounds(
  LlatLng(42.170274, -71.348648),
  LlatLng(42.456141, -70.818901)
);

const DEFAULT_LATITUDE = 42.3240812;
const DEFAULT_LONGITUDE = -71.0844068;
const DEFAULT_ZOOM = 14;

const ADDRESS_FIELD_HOLDER_CLASS = 'cob-address-search-field-container';
const LOCATION_MARKER_PANE = 'location';

const WAYPOINT_ICON = new LeafletIcon({
  iconUrl: DEFAULT_ADDRESS_SEARCH_WAYPOINT_ICON_SRC,
  shadowUrl: undefined,

  iconSize: [35, 46], // size of the icon
  iconAnchor: [17, 46], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -46], // point from which the popup should open relative to the iconAnchor
});

const LOCATION_WAYPOINT_ICON = new LeafletIcon({
  iconUrl: DEFAULT_LOCATION_WAYPOINT_ICON_SRC,
  shadowUrl: undefined,

  iconSize: [35, 46], // size of the icon
  iconAnchor: [17, 46], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -46], // point from which the popup should open relative to the iconAnchor
});

export interface LayerConfig {
  uid: string;
  url: string;
  legendLabel: string;
  legendSymbol: string | null;
  color: string | null | undefined;
  hoverColor: string | null | undefined;
  fill: boolean;
  iconSrc: string | null | undefined;
  clusterIcons: boolean;
  popupTemplate: string | null | undefined;
  popupTemplateCompiled?: null | ((params: Object) => string);
}

interface LayerRecord {
  // The parent layer that's on the map. Will usually be featureLayer, except in
  // the case of icon clustering, when it will be a MarkerClusterGroup.
  mapLayer: LeafletGeoJSON | MarkerClusterGroup;
  featuresLayer: LeafletGeoJSON;
  config: LayerConfig;
  // We keep track of what the filters were when we last requested the data for
  // this layer, so we know whether or not we need to re-query.
  lastFilterValues: { [id: string]: string };
}

// The Leaflet GeoJSON layer adds a "feature" property on to the layers that it
// creates. We use this interface to typecheck that. In reality, the layers will
// be instances of Path subclasses or Markers.
interface GeoJSONFeatureLayer extends LeafletLayer {
  feature: Feature<any> | FeatureCollection<any>;
}

/**
 * Given a Filter, finds the default value it should have when the page loads.
 */
export function findDefaultFilterValue(filter: Filter): string {
  if (typeof filter.default === 'string') {
    return filter.default;
  }

  if (filter.default) {
    const now = new Date();

    // We generate an array of information about the current date, which can be
    // used to set time-based defaults.
    const dateItems = {
      day: now.getDay(),
      '24hTime':
        `${now.getHours() < 10 ? '0' : ''}${now.getHours()}` +
        `${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`,
    };

    // The filtering ANDs together all defined predicates.
    const matches = filter.default
      .filter(
        ({ date, eq }) =>
          typeof eq === 'undefined' || !!(date && dateItems[date] === eq)
      )
      .filter(
        ({ date, lt }) =>
          typeof lt === 'undefined' || !!(date && dateItems[date] < lt)
      )
      .filter(
        ({ date, lte }) =>
          typeof lte === 'undefined' || !!(date && dateItems[date] <= lte)
      )
      .filter(
        ({ date, gt }) =>
          typeof gt === 'undefined' || !!(date && dateItems[date] > gt)
      )
      .filter(
        ({ date, gte }) =>
          typeof gte === 'undefined' || !!(date && dateItems[date] >= gte)
      );

    const match = matches[0];

    if (match) {
      return match.value;
    }
  }

  // We fall through to here if none of the "default" cases match. We grab the
  // first "value" entry in the options, if there is one.
  if (filter.options) {
    const option = filter.options.find(
      opt => !opt.type || opt.type === 'value'
    );

    if (option && (!option.type || option.type === 'value')) {
      return option.value;
    }
  }

  return '';
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
  private isServer: boolean = false;

  /**
   * ID of the HTML element. Used to automatically open the map modal.
   */
  @Prop() id: string = '';

  /**
   * A JSON string or equivalent object that defines the map and layers. The
   * schema for this config comes from VizWiz, so it won’t be documented here.
   *
   * Any attributes prefixed with `map-` will be passed on to the generated
   * `<cob-map>` component. _E.g._ `map-id` or `map-style`.
   */
  @Prop() config: string = '';

  /**
   * Test attribute to make the overlay open automatically at mobile widths.
   * Only used so that we can take Percy screenshots of the overlay.
   */
  @Prop({ mutable: true })
  openOverlay: boolean = false;

  /**
   * Change to true to make the modal appear.
   */
  @Prop({ mutable: true })
  modalVisible: boolean = false;

  // Would call this "title" except that causes browsers to show a tooltip when
  // hovering over the map.
  /**
   * Title for the map. Shown on the collapse / expand header at mobile widths.
   */
  heading: string = '';

  // Used to keep our IDs distinct on the page
  idSuffix = Math.random()
    .toString(36)
    .substring(2, 7);

  showAddressSearch: boolean = false;
  showLegend: boolean = false;

  map: LeafletMap | null = null;
  // We keep a reference to the DOM element for the search control because we
  // want to move it into our overlay, rather than have it as an Esri control.
  addressSearchControlEl: HTMLElement | null = null;
  addressSearchResultsFeatures: LeafletFeatureGroup | null = null;
  addressSearchHeading: String = 'Address search';
  addressSearchPopupLayerUid: String | null = null;
  addressSearchZoomToResults: boolean = false;
  @State() addressSearchFocused: boolean = false;

  instructionsHtml: string = '';

  @State() layerRecords: LayerRecord[] = [];

  @State() filters: Filter[] = [];
  /** This a map from the filter’s ID to its current value. */
  @State() filterValues: { [id: string]: string } = {};
  /** Map from the "key" of dynamic filter values (a combination of the filter
   * ID and the field being loaded) to a list of values. */
  @State() filterDynamicOptions: { [key: string]: string[] } = {};

  locationLayer: LeafletLayer | null = null;

  componentWillLoad() {
    if (this.isServer) {
      // We don't want to mount Leaflet on the server, even though it does
      // serialize the generated elements, since Leaflet then won't start
      // up correctly when we hit the browser.
      return;
    }

    // Support for opening the map automatically if it loads up on the right
    // hash. Note we don’t do the inverse: if we’re not on the hash, we don’t
    // change modalVisible at all, so that if it was set via an attribute it
    // won’t get overridden.
    if (this.id && window.location.hash === `#${this.id}`) {
      this.modalVisible = true;
    }

    const config = this.getConfig();
    if (!config || !config.maps || config.maps.length === 0) {
      return;
    }

    const mapConfig = config.maps[0];

    this.heading = mapConfig.title || '';
    this.instructionsHtml = mapConfig.instructionsHtml || '';

    this.filters = config.filters || [];

    if (mapConfig.addressSearch) {
      this.showAddressSearch = true;
      this.addressSearchZoomToResults =
        mapConfig.addressSearch.zoomToResult || false;
      this.addressSearchPopupLayerUid =
        mapConfig.addressSearch.autoPopupDataSourceUid || null;

      if (mapConfig.addressSearch.title != null) {
        this.addressSearchHeading = mapConfig.addressSearch.title;
      }
    }
    this.showLegend = !!mapConfig.showLegend;
  }

  componentDidLoad() {
    if (this.isServer) {
      return;
    }

    // in IE 11, the DOM isn't available at the time that this method fires. So,
    // we wait a tick so that we can find the .cob-map-leaflet-container in
    // maybeMountMap below.
    setTimeout(() => {
      this.maybeMountMap();
    }, 0);
  }

  maybeMountMap() {
    const mapHidden = this.modalVisible === false;

    if (this.map && mapHidden) {
      this.map.remove();
      this.map = null;
      return;
    } else if (this.map || mapHidden) {
      return;
    }

    const config = this.getConfig();
    if (!config || !config.maps || config.maps.length === 0) {
      return;
    }

    const mapConfig = config.maps[0];
    // Used in the modal version. The inline version just binds to ourselves.
    const mapContainerEl = this.el.querySelector('.cob-map-leaflet-container');

    this.map = new LeafletMap(mapContainerEl || this.el, {
      zoomControl: false,
      // 11 really shows the Greater Boston area well, no need to zoom to show
      // all of New England or the world.
      minZoom: 11,
      // This the max we have for the "Gray" Esri map, so we don't allow
      // zooming in any further, even though the Boston map supports it.
      maxZoom: 16,
    })
      .setView(
        [
          mapConfig.latitude != null ? mapConfig.latitude : DEFAULT_LATITUDE,
          mapConfig.longitude != null ? mapConfig.longitude : DEFAULT_LONGITUDE,
        ],
        mapConfig.zoom || DEFAULT_ZOOM
      )
      // Boston basemap only includes Boston, so we layer over Esri's "Gray"
      // basemap.
      .addLayer(basemapLayer('Gray'))
      .addLayer(tiledMapLayer({ url: DEFAULT_BASEMAP_URL }));

    this.map.on('zoom', () => {
      if (this.map) {
        this.updateVectorFeaturesForZoom(this.map.getZoom());
      }
    });

    if (mapConfig.showUserLocation) {
      // We put the location marker in its own Leaflet pane so that it stays
      // under all the other feature markers we might add.
      this.map.createPane(LOCATION_MARKER_PANE);
      this.map.on('locationfound', this.onLocationFound.bind(this));
      this.map.locate();
    }

    if (mapConfig.showZoomControl) {
      const zoomControl = Lcontrol.zoom({
        position: 'bottomright',
      });
      zoomControl.addTo(this.map);
    }

    if (this.showAddressSearch) {
      const addressSearchControl = geosearch({
        providers:
          mapConfig.addressSearch && mapConfig.addressSearch.geocoderUrl
            ? [
                geocodeServiceProvider({
                  url: mapConfig.addressSearch.geocoderUrl,
                }),
              ]
            : undefined,
        expanded: true,
        placeholder:
          (mapConfig.addressSearch && mapConfig.addressSearch.placeholder) ||
          'Search for an address…',
        collapseAfterResult: false,
        zoomToResult: false,
        searchBounds: BOSTON_BOUNDS,
      });

      addressSearchControl.on('results', this.onAddressSearchResults);

      this.addressSearchResultsFeatures = new LeafletFeatureGroup().addTo(
        this.map
      );

      const addressSearchControlEl = (this.addressSearchControlEl = addressSearchControl.onAdd!(
        this.map
      ));

      // We massage the auto-generated DOM to match our Fleet classes
      const inputEl = addressSearchControlEl.querySelector('input')!;
      inputEl.setAttribute('id', this.getSearchFieldInputId());
      inputEl.classList.add('sf-i-f');
      inputEl.classList.remove('leaflet-bar');
      inputEl.parentElement!.classList.add('sf-i');
      inputEl.addEventListener(
        'focus',
        () => (this.addressSearchFocused = true)
      );
      inputEl.addEventListener(
        'blur',
        () => (this.addressSearchFocused = false)
      );

      const searchIconEl = document.createElement('div');
      searchIconEl.classList.add('sf-i-b');
      inputEl.parentElement!.insertBefore(searchIconEl, inputEl.nextSibling);
    }

    const newLayerRecords: Array<LayerRecord> = [];

    (config.dataSources || []).map(
      ({ data, uid, legend, polygons, icons, popupHtmlTemplate }) => {
        if (!data) {
          return;
        }

        if (data.type === 'arcgis') {
          newLayerRecords.push(
            this.addEsriLayerToMap({
              uid: uid!,
              url: `${data.service!}/${data.layer!}`,
              legendLabel: (legend && legend.label) || '',
              legendSymbol:
                (icons && 'icon') ||
                (polygons && polygons.fill && 'polygon') ||
                (polygons && 'line') ||
                null,
              color: polygons ? polygons.color : null,
              hoverColor: polygons ? polygons.hoverColor : null,
              fill: (polygons && polygons.fill) || false,
              iconSrc: icons ? icons.markerUrl : null,
              clusterIcons: (icons && icons.cluster) || false,
              popupTemplate: popupHtmlTemplate,
            })
          );
        }
      }
    );

    this.layerRecords = newLayerRecords;

    this.maybeInsertAddressSearchControl();
  }

  componentDidUnload() {
    this.map && this.map.remove();
  }

  componentDidUpdate() {
    this.maybeMountMap();
    this.maybeInsertAddressSearchControl();
    this.maybeUpdateLayers();

    // Re-rendering can change the size of the map, for example from the
    // overlay hiding and showing. We wait 300ms so that any hide/show
    // animations are done.
    //
    // We don't want to pan because the overlay should feel like it's sliding
    // over the map.
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize({ pan: false } as any);
      }
    }, 300);
  }

  /**
   * Takes JSON out of either a "config" prop or a <script> child. We support
   * the former for integration with other components, and the latter for easier
   * HTML building.
   */
  getConfig(): MapConfig | null {
    const configScript = this.el.querySelector('script[slot="config"]');

    try {
      if (this.config) {
        return JSON.parse(this.config);
      } else if (configScript) {
        return JSON.parse(configScript.innerHTML);
      } else {
        return null;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Could not parse config JSON', e);
      throw e;
    }
  }

  @Listen('window:hashchange')
  onHashChange() {
    if (this.id) {
      if (window.location.hash === `#${this.id}`) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  /**
   * Shows the modal, if the map is in modal mode.
   */
  @Method()
  show() {
    this.modalVisible = true;
  }

  /**
   * Hides the modal, if the map is in modal mode.
   */
  @Method()
  hide() {
    this.modalVisible = false;

    // This clears out an existing hash if one exists. Otherwise we'd be closed
    // but unable to get a hashchange event to re-open.
    if (this.id && window.location.hash === `#${this.id}`) {
      history.replaceState(null, undefined as any, ' ');
    }
  }

  /**
   * If the map is in modal mode, toggles whether or not it’s visible.
   */
  @Method()
  toggle() {
    this.modalVisible = !this.modalVisible;
  }

  onFeatureMouseOver(config: LayerConfig, ev: LeafletEvent) {
    const { map } = this;
    if (!map) {
      return;
    }

    const feature: LeafletLayer = ev.target;

    if (feature instanceof LeafletPath) {
      if (config.hoverColor) {
        feature.setStyle(this.makeFeatureHoverStyle(config, map.getZoom()));
        feature.bringToFront();
      }
    }
  }

  onFeatureMouseOut(config: LayerConfig, ev: LeafletEvent) {
    const layerRecord = this.layerRecords.find(({ config: c }) => c === config);

    if (layerRecord) {
      const feature: LeafletLayer = ev.target;
      layerRecord.featuresLayer.resetStyle(feature);
    }
  }

  onLocationFound(location) {
    if (!this.map) {
      return;
    }

    if (this.locationLayer) {
      this.locationLayer.remove();
    }

    this.locationLayer = new LeafletMarker(location.latlng, {
      icon: LOCATION_WAYPOINT_ICON,
      interactive: false,
      pane: LOCATION_MARKER_PANE,
    }).addTo(this.map);
  }

  maybeInsertAddressSearchControl() {
    // If we're showing the search control we need to add it again to the page
    // after a re-render.
    if (this.addressSearchControlEl) {
      const addressFieldHolder = this.el.querySelector(
        `.${ADDRESS_FIELD_HOLDER_CLASS}`
      );

      if (
        addressFieldHolder &&
        !addressFieldHolder.contains(this.addressSearchControlEl)
      ) {
        addressFieldHolder.appendChild(this.addressSearchControlEl);
      }
    }
  }

  closeMobileOverlay() {
    // If we're on mobile, the overlay was open to show the address search
    // field. We close it to keep it from obscuring the results.
    this.openOverlay = false;
  }

  onOverlayChange = ev => {
    this.openOverlay = (ev.target as HTMLInputElement).checked;
  };

  onFilterChange = ev => {
    const el: HTMLSelectElement | HTMLInputElement = ev.target;

    this.filterValues = {
      ...this.filterValues,
      [el.id]: el.value,
    };
  };

  onAddressSearchResults = data => {
    if (data.results.length) {
      this.closeMobileOverlay();
    }

    if (!this.addressSearchResultsFeatures) {
      return;
    }

    this.addressSearchResultsFeatures.clearLayers();

    const markers: LeafletMarker[] = [];

    for (var i = data.results.length - 1; i >= 0; i--) {
      const marker = new LeafletMarker(data.results[i].latlng, {
        icon: WAYPOINT_ICON,
      });

      markers.push(marker);
      this.addressSearchResultsFeatures.addLayer(marker);
    }

    const popupLayerRecord =
      this.addressSearchPopupLayerUid &&
      this.layerRecords.find(
        ({ config: { uid } }) => uid === this.addressSearchPopupLayerUid
      );

    if (popupLayerRecord) {
      // We bind to each marker individually rather than binding to the
      // FeatureGroup as a whole so that we can call openPopup on the Marker
      // instance itself.
      markers.forEach(marker => {
        marker.bindPopup(() =>
          this.handleAddressSearchMarkerPopup(popupLayerRecord.config, marker)
        );
      });
    } else {
      this.addressSearchResultsFeatures.unbindPopup();
    }

    if (!this.map) {
      return;
    }

    if (markers.length === 1 && popupLayerRecord) {
      if (this.addressSearchZoomToResults) {
        this.map.setView(markers[0].getLatLng(), 13);
      }
      // Opening the popup will bring it into view automatically.
      markers[0].openPopup();
    } else if (markers.length > 0 && this.addressSearchZoomToResults) {
      this.map.fitBounds(this.addressSearchResultsFeatures.getBounds());
    }
  };

  handleMapLayerPopup(
    config: LayerConfig,
    featureLayer: GeoJSONFeatureLayer
  ): string | null {
    const { feature } = featureLayer;
    if (feature.type !== 'Feature') {
      return null;
    }

    this.closeMobileOverlay();

    return this.renderPopupContent(config, feature.properties || {});
  }

  handleAddressSearchMarkerPopup(
    layerConfig: LayerConfig,
    marker: LeafletMarker
  ) {
    this.closeMobileOverlay();

    // When a marker is placed on the map we don't have any feature information
    // for it, so we need to query Esri for the properties we need to render the
    // popup.
    //
    // This query is async, so first we return a loading indicator, and then
    // when the results come back we change the popup's content and update it to
    // resize it and bring it into view.
    esriQuery({ url: layerConfig.url })
      .contains(marker)
      .run((err, featureCollection) => {
        if (err) {
          // eslint-disable-next-line
          console.error(err);
          return;
        }

        if (!this.map) {
          return;
        }

        const feature = featureCollection.features[0];

        if (feature) {
          // We stop scrolling, since the update call below will need to move
          // the map, and it won’t do anything if the map already moving.
          this.map.stop();

          marker.getPopup()!
            .setContent(
              this.renderPopupContent(layerConfig, feature.properties) || ''
            )
            // This brings the filled-out popup into view.
            .update();
        } else {
          marker.closePopup();
        }
      });

    return '<div class="p-a300 ta-c cob-popup-loading"></div>';
  }

  renderPopupContent(
    config: LayerConfig,
    properties: { [key: string]: any }
  ): string | null {
    if (!config.popupTemplateCompiled) {
      return '';
    }

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

  // We change the style of the vectors as we zoom so that when they're close
  // you can still see through to street names, but when they're far away
  // they're opaque so you don't get weird dark spots where they overlap.
  updateVectorFeaturesForZoom(_zoom: number) {
    const { map } = this;
    if (!map) {
      return;
    }

    this.layerRecords.forEach(({ featuresLayer, config }) => {
      featuresLayer.eachLayer(layer => {
        if (layer instanceof LeafletPath) {
          if (config.color) {
            layer.setStyle(this.makeFeatureStyle(config, map.getZoom()));
          }
        }
      });
    });
  }

  makeFeatureStyle({ color, fill }: LayerConfig, zoom: number): PathOptions {
    const zoomedIn = zoom >= 15;

    return {
      color: color || undefined,
      fill,
      weight: zoomedIn ? 5 : 3,
      opacity: zoomedIn ? 0.35 : 1,
    };
  }

  makeFeatureHoverStyle(
    { color, hoverColor, fill }: LayerConfig,
    _zoom: number
  ): PathOptions {
    return {
      color: hoverColor || color || undefined,
      fill,
      weight: 4,
      opacity: 1,
    };
  }

  addEsriLayerToMap(config: LayerConfig): LayerRecord {
    const layerOptions = {
      interactive: !!config.popupTemplate,
      // We set the style at the options level to create the default for new
      // features. Calling setStyle() on a GeoJSON layer only updates the
      // current child feature layers, it doesn't have any effect on this
      // default.
      //
      // Current types require this to be a function, even though the code
      // supports a hash. Let's not rock the boat and just use a function.
      style: () =>
        this.map ? this.makeFeatureStyle(config, this.map.getZoom()) : {},
      pointToLayer: (_, latlng) =>
        new LeafletMarker(latlng, {
          icon: new LeafletIcon({
            iconUrl: config.iconSrc || DEFAULT_ICON_SRC,
            iconSize: [30, 30],
          }),
        }),
      onEachFeature: (_, featureLayer: LeafletLayer) => {
        featureLayer.on({
          mouseover: ev => this.onFeatureMouseOver(config, ev),
          mouseout: ev => this.onFeatureMouseOut(config, ev),
        });
      },
    };

    // We create a blank GeoJSON layer just so we have it. Data will be added
    // after it’s loaded from Esri.
    const featuresLayer = new LeafletGeoJSON(undefined, layerOptions);

    const mapLayer: LayerGroup = (config.clusterIcons
      ? new MarkerClusterGroup().addLayer(featuresLayer)
      : featuresLayer
    ).addTo(this.map);

    if (config.popupTemplate) {
      config.popupTemplateCompiled = templayed(config.popupTemplate);
      // Since the MarkerClusterLayer works by pulling the layers out of their
      // original parent (featureLayer) into itself (mapLayer), we need to bind
      // to the map layer rather than the feature layer. For non-clustered
      // icons, mapLayer and featureLayer are the same.
      mapLayer.bindPopup(
        layer =>
          this.handleMapLayerPopup(config, layer as GeoJSONFeatureLayer) || ''
      );
    } else {
      config.popupTemplateCompiled = null;
      mapLayer.unbindPopup();
    }

    const record: LayerRecord = {
      config,
      mapLayer,
      featuresLayer,
      // This can start as an empty object because loadEsriLayer will initialize
      // it with the right default values.
      lastFilterValues: {},
    };

    this.loadEsriLayer(record);

    return record;
  }

  /**
   * Returns an ID for the filter that’s unique on the page, so we can use it as
   * an HTML ID attribute.
   */
  makeFilterInputId(title) {
    return `cob-map-filter-${
      this.idSuffix
    }-${title!.toLocaleLowerCase().replace(/\s/g, '-')}`;
  }

  /**
   * Reloads any layers whose filter values have changed.
   */
  maybeUpdateLayers() {
    this.layerRecords.forEach(record => {
      const layerFilters = this.filters.filter(
        ({ dataSourceUid }) => dataSourceUid === record.config.uid
      );

      const firstChangedFilter = layerFilters.find(({ title }) => {
        const id = this.makeFilterInputId(title);
        return this.filterValues[id] !== record.lastFilterValues[id];
      });

      if (firstChangedFilter) {
        this.loadEsriLayer(record);
      }
    });
  }

  /**
   * Removes all content from the layers associated with the record, and closes
   * any popups as well.
   */
  resetLayer({ featuresLayer, mapLayer }: LayerRecord) {
    mapLayer.closePopup();
    featuresLayer.clearLayers();

    if (mapLayer !== featuresLayer) {
      // MarkerClusterGroup only processes new icons on adding the layer.
      // There's no method to call to re-pull the child Markers from
      // featuresLayer now that addData has created them, so we clear it all
      // and add again.
      mapLayer.clearLayers();
    }
  }

  loadEsriLayer(record: LayerRecord) {
    const { config, featuresLayer, mapLayer } = record;
    const allWhereClauses: string[] = [];
    // We keep a map of what where clauses are associated with what filter IDs
    // so that when we load dynamic field values we keep ourselves from
    // filtering on the filter's own current value.
    const whereClausesById: { [id: string]: string } = {};

    // We track the new values we're filtering by so we can update the record.
    const newFilterValues: { [id: string]: string } = {};

    const layerFilters = this.filters.filter(
      ({ dataSourceUid }) => dataSourceUid === config.uid
    );

    layerFilters.forEach(filter => {
      const { title, options, queryTemplate } = filter;

      const id = this.makeFilterInputId(title);
      let value = this.filterValues[id];

      if (!value) {
        value = findDefaultFilterValue(filter);
      }

      let whereClause;

      // Look up the element in the options array that matches our current
      // value, so we can use its "query" attribute, if it has one.
      const optionForValue = (options || []).find(
        opt =>
          !!(
            (!opt.type || opt.type === 'value') &&
            opt.value === value &&
            opt.query
          )
      );

      if (optionForValue) {
        // the `find` filtered this down, so just use any to avoid having to
        // repeat the type guards.
        whereClause = (optionForValue as any).query;
      }

      // Either no built-in query or the filter didn’t have an "options"
      // array.
      if (!whereClause) {
        // Passing value here makes it replace "{{.}}" in the template.
        whereClause = templayed(queryTemplate)(value.replace(/'/g, "''"));
      }

      newFilterValues[id] = value;
      allWhereClauses.push(whereClause);
      whereClausesById[id] = whereClause;
    });

    // We do this here to reduce the chance of multiple unnecessary loads of a
    // layer if componentDidUpdate gets called while a query is still
    // outstanding.
    record.lastFilterValues = newFilterValues;
    this.filterValues = {
      ...this.filterValues,
      ...newFilterValues,
    };

    // Remove the layer we're about to load, as a way to show that something is
    // happening while we wait for the ESRI response to come in.
    this.resetLayer(record);

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
      .where(allWhereClauses.length > 0 ? allWhereClauses.join(' AND ') : '1=1')
      .run((err, featureCollection) => {
        if (err) {
          throw err;
        }

        // We clear a second time just before adding data in case there is an
        // overlapping query or something that added points since the reset we
        // did before the query.
        this.resetLayer(record);

        featuresLayer.addData(featureCollection);

        if (mapLayer !== featuresLayer) {
          mapLayer.addLayer(featuresLayer);
        }

        // We set this again to ensure that filterValues best reflects the state
        // of the map. Things could get a little askew if the user changes the
        // filters while a query is happening, if the queries come back
        // out-of-order. This ensures correctness when the dust settles.
        record.lastFilterValues = newFilterValues;

        // Also update the UI to match what's being displayed. Ideally this will
        // be a visual no-op.
        this.filterValues = {
          ...this.filterValues,
          ...newFilterValues,
        };
      });

    // Now we have to find each filter that is dynamically loading its options
    // so that we can update its choices based on any new filter values.
    layerFilters.forEach(filterObj => {
      const id = this.makeFilterInputId(filterObj.title);

      // Slightly inefficient because we'll make a request for each filter
      // option individually, rather than collapsing queries. For now we assume
      // that there won't be very many filters all pulling dynamically from the
      // same layer.
      (filterObj.options || []).forEach(opt => {
        if (opt.type !== 'dynamic') {
          return;
        }

        const { field, limitWithFilters } = opt;
        const key = `${id}-${field}`;

        // If we don't want to filter the dynamic options by the other filters,
        // then only run the query if we don’t have a cached version.
        if (this.filterDynamicOptions[key] && !limitWithFilters) {
          return;
        }

        const whereClauses: string[] = [];

        if (limitWithFilters) {
          // We want to generate a list of query clauses for everything that's
          // not this particular filter. "for-in" loop since we don't want to
          // rely on an Object.values polyfill.
          for (let clauseId in whereClausesById) {
            if (clauseId !== id) {
              whereClauses.push(whereClausesById[clauseId]);
            }
          }
        }

        esriQuery({ url: config.url })
          .where(whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1')
          .fields([field])
          .distinct()
          .run((err, featureCollection) => {
            if (err) {
              throw err;
            }

            const values: string[] = featureCollection.features.map(
              ({ properties }) => properties[field]
            );

            values.sort();

            this.filterDynamicOptions = {
              ...this.filterDynamicOptions,
              [key]: values,
            };
          });
      });
    });
  }

  getSearchFieldInputId() {
    return `cob-map-address-search-field-${this.idSuffix}`;
  }

  render() {
    if (this.modalVisible === false) {
      return null;
    }

    return (
      <div class="md md--fw">
        <div class="md-c">
          <input
            type="checkbox"
            class="cob-map-controls-checkbox"
            id={`cob-map-controls-checkbox-${this.idSuffix}`}
            aria-hidden
            checked={this.openOverlay}
            onChange={this.onOverlayChange}
          />
          <div class="cob-map-modal-contents">
            <div class="cob-map-modal-title">
              <label
                class="cob-map-modal-header p-a300"
                htmlFor={`cob-map-controls-checkbox-${this.idSuffix}`}
              >
                <div class="sh sh--sm">
                  <h2 class="sh-title">{this.heading}</h2>
                  {this.renderControlsToggle()}
                </div>
              </label>

              {this.showAddressSearch && (
                <div
                  class="p-a300"
                  style={{ paddingTop: '0', paddingBottom: '0' }}
                >
                  <div class="sf sf--md">
                    <div
                      class={`${ADDRESS_FIELD_HOLDER_CLASS} m-v100 ${
                        this.addressSearchFocused ? 'focused' : ''
                      }`}
                    />
                  </div>
                </div>
              )}

              <button class="md-cb" type="button" onClick={() => this.hide()}>
                Hide Map
              </button>
            </div>
            <div class="cob-map-leaflet-container" />
            <div class="cob-map-modal-controls">
              {this.filters.length > 0 && (
                <div class={`cob-map-modal-filters  p-a300`}>
                  {this.filters.map(filter => this.renderFilter(filter))}
                </div>
              )}

              {this.instructionsHtml && (
                <div
                  class="cob-map-modal-instructions p-a300"
                  innerHTML={this.instructionsHtml}
                />
              )}

              {this.showLegend && (
                <div
                  class={`cob-map-modal-legend ${
                    !this.instructionsHtml && this.filters.length === 0
                      ? 'cob-map-modal-legend-fill'
                      : ''
                  }`}
                >
                  <div class="cob-map-modal-legend-cell-container">
                    {this.layerRecords
                      .filter(
                        ({ config }) =>
                          config.legendSymbol && config.legendLabel
                      )
                      .map(({ config }) => (
                        <div class="cob-map-modal-legend-cell">
                          <div class="cob-map-modal-legend-icon">
                            {this.renderLegendIcon(config)}
                          </div>

                          <div class="cob-map-modal-legend-label">
                            {config.legendLabel}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderControlsToggle() {
    if (
      !this.instructionsHtml &&
      !this.showLegend &&
      !this.showAddressSearch &&
      this.filters.length === 0
    ) {
      return null;
    }

    return (
      <div class="cob-map-controls-toggle">
        {/* Our standard blue disclosure arrow. */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 8.5 18 25">
          <path
            fill="#288be4"
            d="M16 21L.5 33.2c-.6.5-1.5.4-2.2-.2-.5-.6-.4-1.6.2-2l12.6-10-12.6-10c-.6-.5-.7-1.5-.2-2s1.5-.7 2.2-.2L16 21z"
          />
        </svg>
      </div>
    );
  }

  renderLegendIcon({ color, iconSrc, legendSymbol }: LayerConfig) {
    switch (legendSymbol) {
      case 'polygon':
        return (
          <div
            style={{
              margin: '4px',
              border: '3px',
              borderStyle: 'solid',
              borderColor: color!,
            }}
          >
            <div
              style={{
                background: color!,
                opacity: '0.2',
                width: '36px',
                height: '36px',
              }}
            />
          </div>
        );
      case 'line':
        return (
          <div
            style={{
              width: '50px',
              height: '3px',
              marginTop: '23px',
              marginBottom: '24px',
              backgroundColor: color!,
            }}
          />
        );
      case 'icon':
        return <img src={iconSrc || DEFAULT_ICON_SRC} width="50" height="50" />;
      default:
        return null;
    }
  }

  renderFilter({ title, type, options }: Filter) {
    const id = this.makeFilterInputId(title);

    switch (type) {
      case 'select': {
        // We keep track of whether we added an option that's selected. This
        // handles the case where other filters remove a dynamic filter’s
        // option. In that case we add it to the end of the select, but disable
        // it.
        let addedSelectedOption = false;

        return (
          <div class="sel cob-map-modal-filter">
            <label htmlFor={id} class="sel-l sel-l--mt000">
              {title}
            </label>
            <div class="sel-c sel-c--thin">
              <select id={id} class="sel-f" onChange={this.onFilterChange}>
                {(options || []).map(opt => {
                  switch (opt.type) {
                    case undefined:
                    case 'value': {
                      const { title, value } = opt;
                      const selected = value === this.filterValues[id];

                      if (selected) {
                        addedSelectedOption = true;
                      }

                      return (
                        <option value={value || ''} selected={selected}>
                          {title}
                        </option>
                      );
                    }

                    case 'dynamic': {
                      const { field } = opt;
                      const key = `${id}-${field}`;

                      return (this.filterDynamicOptions[key] || []).map(val => {
                        const selected = val === this.filterValues[id];
                        if (selected) {
                          addedSelectedOption = true;
                        }

                        return (
                          <option key={val} value={val} selected={selected}>
                            {val}
                          </option>
                        );
                      });
                    }

                    case 'separator':
                      return <option disabled>{HORIZONTAL_LINE}</option>;

                    default:
                      return null;
                  }
                })}

                {!addedSelectedOption && [
                  <option disabled>{HORIZONTAL_LINE}</option>,
                  <option selected disabled>
                    {this.filterValues[id]}
                  </option>,
                ]}
              </select>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  }
}
