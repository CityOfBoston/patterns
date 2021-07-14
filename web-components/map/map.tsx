/* global: templayed */

import { Component, Element, Prop, State, Method, Listen } from '@stencil/core';

import { Feature, FeatureCollection, GeometryObject } from 'geojson';

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
  LatLngExpression,
  LocationEvent,
} from 'leaflet';

import { basemapLayer, tiledMapLayer, query as esriQuery } from 'esri-leaflet';
import {
  geosearch,
  geocodeServiceProvider,
  Results,
} from 'esri-leaflet-geocoder';

// This is our fork of Leaflet/Leaflet.markercluster to fix for module-based
// importing.
import { MarkerClusterGroup } from 'leaflet.markercluster';

// Has a global definition. Look, the code is 5 years old.
import 'templayed';
declare function templayed(str: string): (data: Object) => string;

// Run `gulp schema:map` to regenerate this .d.ts file from the JSON-schema
// definition.
import { CobMap10, Filter } from './map-1.0.schema';

import { findDefaultFilterValue } from './map-util';

type MapConfig = CobMap10;

// Absolute URLs to patterns.boston.gov below because relative URLs would be
// relative to whatever page was hosting the <cob-map> tag.

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
const LOCATION_MARKER_PANE_NAME = 'location';

/**
 * Icon for standard search result points.
 */
const WAYPOINT_ICON = new LeafletIcon({
  iconUrl: DEFAULT_ADDRESS_SEARCH_WAYPOINT_ICON_SRC,
  shadowUrl: undefined,

  iconSize: [35, 46], // size of the icon
  iconAnchor: [17, 46], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -46], // point from which the popup should open relative to the iconAnchor
});

/**
 * Icon for the browser’s location.
 */
const LOCATION_WAYPOINT_ICON = new LeafletIcon({
  iconUrl: DEFAULT_LOCATION_WAYPOINT_ICON_SRC,
  shadowUrl: undefined,

  iconSize: [35, 46], // size of the icon
  iconAnchor: [17, 46], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -46], // point from which the popup should open relative to the iconAnchor
});

/**
 * Layer configuration record that’s a child of LayerRecord. Derived from the
 * DataSource type in the schema.
 */
interface LayerConfig {
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

  /**
   * This is the function we get from compiling the Mustache template with
   * templayed.
   */
  popupTemplateCompiled?: null | ((params: Object) => string);
}

/**
 * Internal data structure used to bookkeep our layers. Contains the
 * configuration, the actual Leaflet layer(s), and values for
 * filters.
 */
interface LayerRecord {
  /**
   * The parent layer that's on the map. Is typically the same as featureslayer,
   * except in the case of icon clustering, when it will be a
   * MarkerClusterGroup.
   */
  mapLayer: LeafletGeoJSON | MarkerClusterGroup;

  /**
   * The layer that we add GeoJSON features to. Normally this is the same as
   * mapLayer (we add features to the layer that’s on the map) but in the case
   * of clustered icons we add features to a separate layer that gets adopted
   * and transformed by MarkerClusterGroup.
   */
  featuresLayer: LeafletGeoJSON;

  /**
   * Configuration of the layer’s display.
   */
  config: LayerConfig;

  /**
   * The values that the filters had the last time that we queried for data
   * (because filtering happens server-side, we have to re-query when the
   * filters change). We store these values so that when componentDidUpdate is
   * called we can tell in maybeUpdateLayers which layers have new filter values
   * (and need to be re-queried) and which can stay as-is.
   *
   * Values here are compared with the values in the UI, which are stored in
   * CobMap#filterValues.
   */
  lastFilterValues: { [id: string]: string };
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
  @Element() protected el: HTMLElement | undefined;

  @Prop({ context: 'isServer' })
  private isServer: boolean = false;

  /**
   * ID of the HTML element. Used to automatically open the map modal.
   */
  @Prop() id: string = '';

  /**
   * A JSON string or equivalent object that defines the map and layers.
   *
   * @see https://patterns.boston.gov/vendor/docson/#/web-components/map-1.0.schema.json
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

  /**
   * Title for the map. Shown on the collapse / expand header at mobile widths.
   *
   * Would call this "title" except that causes browsers to show a tooltip when
   * hovering over the map.
   */
  private heading: string = '';

  /**
   * Used on all of our HTML ID elements to make sure that they’re unique on the
   * page so that they don’t conflict with other maps. Important for associating
   * <label> elements with the filter <input> / <select> elements.
   */
  private readonly idSuffix = Math.random()
    .toString(36)
    .substring(2, 7);

  private showAddressSearch: boolean = false;
  private showLegend: boolean = false;

  private map: LeafletMap | null = null;

  /**
   * This in the HTML element that Leaflet / Esri generates for the address
   * search box. We hang on to it because we need to move it out of the Leaflet
   * control and into our own overlay element.
   */
  private addressSearchControlEl: HTMLElement | null = null;
  private addressSearchResultsFeatures: LeafletFeatureGroup | null = null;
  private addressSearchPopupLayerUid: String | null = null;
  private addressSearchZoomToResults: boolean = false;

  @State() private addressSearchFocused: boolean = false;
  /**
   * If true, we show a modal alert that the last address search had no results
   */
  @State() private showAddressNotFound: boolean = false;

  private instructionsHtml: string = '';

  @State() private layerRecords: LayerRecord[] = [];
  @State() private filters: Filter[] = [];

  /**
   * Maps a filter’s ID to its current value as shown in the UI.
   *
   * Changes to this State value trigger a componentDidUpdate, which leads to a
   * maybeUpdateLayers, which figures out which layers are currently being
   * displayed based on stale filter values and need to be refreshed.
   */
  @State() private filterValues: { [id: string]: string } = {};

  /**
   * Map from the "key" of a dynamic filter option (e.g. a filter showing food
   * truck names) to its current list of possible values.
   */
  @State() private filterDynamicOptions: { [key: string]: string[] } = {};

  /** Used to show the "current location" marker */
  private locationLayer: LeafletLayer | null = null;

  /**
   * Pulls the data we need out of the config to render the header and footer
   * HTML around the map. See mountOrUnmountLeafletMap for the bits that
   * interact with Leaflet.
   */
  componentWillLoad() {
    if (this.isServer) {
      // We don't want to mount Leaflet on the server, even though it does
      // serialize the generated elements, since Leaflet then won't start
      // up correctly when we hit the browser.
      return;
    }

    // Support for opening the map automatically if it loads up on the right
    // hash. Note we don’t do the inverse: if we’re not on the hash, we don’t
    // change modalVisible at all, so that if it was opened via an attribute we
    // don’t immediately close.
    if (this.id && window.location.hash === `#${this.id}`) {
      this.modalVisible = true;
    }

    const config = this.getConfig();

    // Safety / type check.
    if (!config || !config.maps || config.maps.length === 0) {
      return;
    }

    // We future-proofed the config by allowing for more than one map, but we
    // don’t actually support that.
    const mapConfig = config.maps[0];

    this.heading = mapConfig.title || '';
    this.instructionsHtml = mapConfig.instructionsHtml || '';
    this.showLegend = !!mapConfig.showLegend;

    this.filters = config.filters || [];

    if (mapConfig.addressSearch) {
      this.showAddressSearch = true;

      this.addressSearchZoomToResults =
        mapConfig.addressSearch.zoomToResult || false;

      this.addressSearchPopupLayerUid =
        mapConfig.addressSearch.autoPopupDataSourceUid || null;
    }
  }

  componentDidLoad() {
    if (this.isServer) {
      return;
    }

    // in IE 11, the DOM isn't available at the time that this method fires. So,
    // we wait a tick so that we can find the .cob-map-leaflet-container in
    // mountOrUnmountLeafletMap below.
    setTimeout(() => {
      this.mountOrUnmountLeafletMap();
    }, 0);
  }

  private mountOrUnmountLeafletMap() {
    const mapHidden = this.modalVisible === false;

    if (this.map && mapHidden) {
      this.map.remove();
      this.map = null;
    }

    if (this.map || mapHidden || !this.el) {
      // We either have the map already or we don't need one, so we’re all set.
      return;
    }

    const config = this.getConfig();

    if (!config || !config.maps || config.maps.length === 0) {
      return;
    }

    const mapConfig = config.maps[0];
    const mapContainerEl = this.el.querySelector<HTMLElement>(
      '.cob-map-leaflet-container'
    );

    if (!mapContainerEl) {
      throw new Error('.cob-map-leaflet-container not found');
    }

    this.map = new LeafletMap(mapContainerEl || this.el, {
      // If we need a zoom control we create it below so that we can put it in
      // the correct corner.
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
      this.updateVectorFeaturesForZoom();
    });

    if (mapConfig.showUserLocation) {
      // We put the location marker in its own Leaflet pane so that it stays
      // under all the other feature markers we might add.
      this.map.createPane(LOCATION_MARKER_PANE_NAME);
      this.map.on('locationfound', this.onLocationFound.bind(this) as any);
      this.map.locate();
    }

    if (mapConfig.showZoomControl) {
      Lcontrol.zoom({ position: 'bottomright' }).addTo(this.map);
    }

    if (this.showAddressSearch) {
      // If this.showAddressSearch is true we know that the addressSearch config
      // exists.
      const addressSearchConfig = mapConfig.addressSearch!;

      const customProvider =
        addressSearchConfig.geocoderUrl &&
        geocodeServiceProvider({
          url: addressSearchConfig.geocoderUrl,
        });

      const addressSearchControl = geosearch({
        providers: customProvider ? [customProvider] : undefined,
        // Shows the search box all the time
        expanded: true,
        placeholder:
          addressSearchConfig.placeholder || 'Search for an address…',
        collapseAfterResult: false,
        // We handle this based on the number of results
        zoomToResult: false,
        searchBounds: BOSTON_BOUNDS,
      });

      addressSearchControl.on('results', this.onAddressSearchResults as any);

      this.addressSearchResultsFeatures = new LeafletFeatureGroup().addTo(
        this.map
      );

      this.addressSearchControlEl = addressSearchControl.onAdd!(this.map)!;

      // We massage the auto-generated DOM to match our Fleet classes
      const inputEl = this.addressSearchControlEl.querySelector('input')!;
      inputEl.setAttribute('id', this.getSearchFieldInputId());
      inputEl.classList.add('sf-i-f');
      inputEl.classList.remove('leaflet-bar');
      inputEl.parentElement!.classList.add('sf-i');

      inputEl.addEventListener('focus', () => {
        this.addressSearchFocused = true;
        this.showAddressNotFound = false;
      });

      inputEl.addEventListener('blur', () => {
        this.addressSearchFocused = false;
      });

      const searchLabelEl = document.createElement('label');
      searchLabelEl.classList.add('sf-i-l', 'sr-only');
      const searchLabelTxt = document.createTextNode('Search');
      searchLabelEl.appendChild(searchLabelTxt);
      inputEl.parentElement!.insertBefore(searchLabelEl, inputEl.nextSibling);

      const searchIconEl = document.createElement('div');
      searchIconEl.classList.add('sf-i-b');
      inputEl.parentElement!.insertBefore(searchIconEl, inputEl.nextSibling);
    }

    const layerRecords: Array<LayerRecord> = [];

    (config.dataSources || []).forEach(
      ({ data, uid, legend, polygons, icons, popupHtmlTemplate }) => {
        if (!data) {
          return;
        }

        let legendSymbol: string | null = null;

        // We figure out how we want to display the legend based on how the
        // layer itself will render.
        if (icons) {
          legendSymbol = 'icon';
        } else if (polygons) {
          if (polygons.fill) {
            legendSymbol = 'polygon';
          } else {
            legendSymbol = 'line';
          }
        }

        // Forward compatibility check.
        if (data.type === 'arcgis') {
          layerRecords.push(
            this.addEsriLayerToMap({
              uid: uid!,
              url: `${data.service!}/${data.layer!}`,
              legendLabel: (legend && legend.label) || '',
              legendSymbol,
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

    // We have to re-assign this.layerRecords, which is declared as @State, so
    // that the component will re-render. Stencil does not track changes inside
    // of arrays the way that MobX does.
    this.layerRecords = layerRecords;

    this.maybeInsertAddressSearchControl();
  }

  componentDidUnload() {
    this.map && this.map.remove();
  }

  /**
   * Called when our props change, which could mean we got hidden or shown, or
   * filter values have changed.
   *
   * Our strategy is to let those UI changes just update props and state, and
   * then in here we figure out how to reconcile the Leaflet map and layers to
   * match.
   *
   * This is a consequence of Stencil working in a reactive way, but needing to
   * do imperitive changes for Leaflet.
   */
  componentDidUpdate() {
    this.mountOrUnmountLeafletMap();
    this.maybeInsertAddressSearchControl();
    this.maybeUpdateLayers();

    // Re-rendering can change the size of the map, for example from the overlay
    // hiding and showing. We wait 300ms so that any hide/show animations are
    // done.
    //
    // We don't want to pan because the overlay should feel like it's sliding
    // over the map, rather than the map expanding. Not panning keeps the top of
    // the map in the same place.
    setTimeout(() => {
      if (this.map) {
        // "as any" because our types don’t include the "pan" option documented
        // here: https://leafletjs.com/reference-1.3.2.html#map-invalidatesize
        this.map.invalidateSize({ pan: false } as any);
      }
    }, 300);
  }

  /**
   * Takes JSON out of either a "config" prop or a <script> child. We support
   * the former for integration with other components, and the latter for easier
   * HTML building.
   *
   * The prop/attribute takes precedence over the <script> but really just use
   * one.
   */
  private getConfig(): MapConfig | null {
    const configScript =
      this.el &&
      this.el.querySelector<HTMLScriptElement>('script[slot="config"]');

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
   * Shows the map in a full-window modal dialog. A better way to make the modal
   * appear on a web page is to link to #<id>, which will cause the map to
   * appear and leave a record in the browser history so that the back button
   * will close the map (rather than take the user to the page before).
   */
  @Method()
  show() {
    this.modalVisible = true;
  }

  /**
   * Hides the map’s modal
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
   * Toggles whether or not the map is visible.
   */
  @Method()
  toggle() {
    this.modalVisible = !this.modalVisible;
  }

  /**
   * Mouseover handler for features lets us put hover effects on polygon layers.
   */
  private onFeatureMouseOver(layerConfig: LayerConfig, ev: LeafletEvent) {
    const feature: LeafletLayer = ev.target;

    if (feature instanceof LeafletPath) {
      if (layerConfig.hoverColor) {
        const hoverStyle = this.makeFeatureHoverStyle(layerConfig);

        feature.setStyle(hoverStyle);
        feature.bringToFront();
      }
    }
  }

  /**
   * Handler to undo the styles from hovering.
   */
  private onFeatureMouseOut(layerConfig: LayerConfig, ev: LeafletEvent) {
    const feature: LeafletLayer = ev.target;

    // Resetting back to the feature’s default styles means we need to get the
    // layer that the feature is part of, and tell it to reset. We don't have a
    // convenient way to go from feature -> containing layer, so we just find
    // the LayerRecord that matches, since it has a reference to the layer.
    this.layerRecords.forEach(layerRecord => {
      if (layerRecord.config === layerConfig) {
        layerRecord.featuresLayer.resetStyle(feature);
      }
    });
  }

  private onLocationFound(location: LocationEvent) {
    if (!this.map) {
      return;
    }

    // Deletes the old location marker
    if (this.locationLayer) {
      this.locationLayer.remove();
    }

    this.locationLayer = new LeafletMarker(location.latlng, {
      icon: LOCATION_WAYPOINT_ICON,
      interactive: false,
      pane: LOCATION_MARKER_PANE_NAME,
    }).addTo(this.map);
  }

  /**
   * The DOM element for the address search input box is generated by a
   * Leaflet/Esri control, but we want it to be in a different place in the UI.
   * This function ensures that it’s in that new place
   * (ADDRESS_FIELD_HOLDER_CLASS). We have to call it after each update because
   * Stencil may have removed the children of the ADDRESS_FIELD_HOLDER_CLASS
   * element when it re-renders it.
   */
  private maybeInsertAddressSearchControl() {
    if (this.addressSearchControlEl && this.el) {
      const addressFieldHolder = this.el.querySelector<HTMLElement>(
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

  private closeMobileOverlay() {
    // If we're on mobile, the overlay was open to show the address search
    // field. We close it to keep it from obscuring the results.
    this.openOverlay = false;
  }

  private onOverlayChange = (ev: Event) => {
    this.openOverlay = (ev.target as HTMLInputElement).checked;
  };

  private onFilterChange = (ev: Event) => {
    const el: HTMLSelectElement | HTMLInputElement = ev.target as any;

    // We change all of this.filterValues so that Stencil sees the @State change
    // and calls componentDidUpdate, which is responsible for calling
    // maybeUpdateLayers, which re-queries any layers that need it.
    this.filterValues = {
      ...this.filterValues,
      [el.id]: el.value,
    };
  };

  /**
   * Called after an address search happens. Shows the results on the map and
   * zooms the map to contain them. If there’s only one result, and the
   * addressSearchPopupLayerUid configuration is set, it automatically opens the
   * popup associated with that layer for the search result’s latlng.
   */
  private onAddressSearchResults = (data: Results & LeafletEvent) => {
    if (data.results.length) {
      this.closeMobileOverlay();
    }

    if (!this.addressSearchResultsFeatures) {
      return;
    }

    this.addressSearchResultsFeatures.clearLayers();

    if (data.results.length === 0) {
      this.showAddressNotFound = true;
      return;
    } else {
      // It should have been cleared from before, but just in case let’s make
      // sure it’s gone.
      this.showAddressNotFound = false;
    }

    // We keep a copy of every marker we’ve made so we can bind to them and zoom
    // to them.
    const markers: LeafletMarker[] = [];

    // We add markers in reverse order probably so that the best match is on
    // top? I forget.
    for (let i = data.results.length - 1; i >= 0; i--) {
      const { latlng } = data.results[i];

      if (!latlng) {
        continue;
      }

      const marker = new LeafletMarker(latlng, {
        icon: WAYPOINT_ICON,
      });

      markers.push(marker);
      this.addressSearchResultsFeatures.addLayer(marker);
    }

    // This finds the layer record for the layer that we want to associate with
    // address search results. Clicking on the markers will open the popup for
    // this layer.
    const popupLayerRecord =
      this.addressSearchPopupLayerUid &&
      this.layerRecords.find(
        ({ config: { uid } }) => uid === this.addressSearchPopupLayerUid
      );

    if (popupLayerRecord) {
      // We bind to each marker individually rather than binding to the
      // FeatureGroup as a whole so that we can call openPopup on the Marker
      // instance itself if it’s the only result.
      markers.forEach(marker => {
        marker.bindPopup(() =>
          this.handleAddressSearchMarkerPopup(popupLayerRecord.config, marker)
        );
      });
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

  /**
   * Attached to bindPopup to return the popup HTML for when a feature needs it.
   *
   * For features, we already have the properties loaded from rendering the
   * feature, so we can render the popup content directly. This is unlike the
   * search result popups, which typically need to query the server to find a
   * matching feature in order to render the template.
   */
  private handleMapLayerPopup(
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

  /**
   * This is handling the user clicking on a marker placed as the result of an
   * address search. We don’t try to map the location to a feature from the
   * layer, but instead we show a loading indicator and then query the server
   * for the feature’s properties.
   */
  private handleAddressSearchMarkerPopup(
    layerConfig: LayerConfig,
    marker: LeafletMarker
  ) {
    this.closeMobileOverlay();

    // This query is async, so first we return a loading indicator, and then
    // when the results come back we change the popup's content and update it to
    // resize it and bring it into view.
    esriQuery({ url: layerConfig.url })
      .contains(marker)
      .run(
        (
          err: Error | null,
          featureCollection: FeatureCollection<GeometryObject> | null
        ) => {
          if (err || !featureCollection) {
            // eslint-disable-next-line no-console
            console.error(err);
            return;
          }

          if (!this.map) {
            return;
          }

          const feature = featureCollection.features[0];

          if (feature) {
            // We stop scrolling, since the update call below will need to move
            // the map, and it won’t do anything if the map is already moving.
            this.map.stop();

            marker.getPopup()!
              .setContent(
                this.renderPopupContent(
                  layerConfig,
                  feature.properties || {}
                ) || ''
              )
              // This brings the filled-out popup into view.
              .update();
          } else {
            // This is the case that the feature lookup for the address’s
            // lat/lng returned nothing, so we just close the popup.
            //
            // This is rare, so it’s better to have the happy path experience of
            // a loading popup appearing right after click than waiting for the
            // query to happen before deciding whether or not to show the popup.
            marker.closePopup();
          }
        }
      );

    return '<div class="p-a300 ta-c cob-popup-loading"></div>';
  }

  private renderPopupContent(
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

  /**
   * Used to change the style of vectors as we zoom. See #makeFeatureStyle for
   * an explanation of why zoom is important.
   */
  private updateVectorFeaturesForZoom() {
    const { map } = this;

    if (!map) {
      return;
    }

    const zoom = map.getZoom();

    this.layerRecords.forEach(({ featuresLayer, config }) => {
      featuresLayer.eachLayer(feature => {
        if (feature instanceof LeafletPath) {
          if (config.color) {
            feature.setStyle(this.makeFeatureStyle(config, zoom));
          }
        }
      });
    });
  }

  /**
   * Returns a PathOptions to control the display of a polygon feature based on
   * the configuration.
   *
   * Takes the map’s zoom level into account so that when we’re close polygon
   * lines can be translucent so you can read street names, but when you’re
   * zoomed out they should be opaque to avoid weird dark spots where they
   * overlap.
   */
  private makeFeatureStyle(
    { color, fill }: LayerConfig,
    zoom: number
  ): PathOptions {
    const zoomedIn = zoom >= 15;

    return {
      color: color || undefined,
      fill,
      weight: zoomedIn ? 5 : 3,
      opacity: zoomedIn ? 0.35 : 1,
    };
  }

  /**
   * Returns the path style that should apply when the mouse is hovered over a
   * polygon feature.
   */
  private makeFeatureHoverStyle({
    color,
    hoverColor,
    fill,
  }: LayerConfig): PathOptions {
    return {
      color: hoverColor || color || undefined,
      fill,
      weight: 4,
      opacity: 1,
    };
  }

  /**
   * Given the configuration of an Esri data source, makes a map layer for it
   * and fires the query to populate it with data.
   *
   * Updates the config to save the compiled popup template, if it exists.
   */
  private addEsriLayerToMap(config: LayerConfig): LayerRecord {
    const { map } = this;

    if (!map) {
      throw new Error('addEsriLayerToMap called with no map');
    }

    // We set the same layer options regardless of whether the layer is going to
    // have icon data or polygon data, since that’s really more of a function of
    // what type of features get returned.
    const layerOptions = {
      // If there’s a template for the popup we need to be clickable so we can
      // show it. If there’s no template, ignore clicks.
      interactive: !!config.popupTemplate,

      // We set the style at the parent layer options level to create the
      // default for new features. Calling setStyle() on a GeoJSON layer only
      // updates the current child feature layers, it doesn't have any effect on
      // this default.
      //
      // Current types require this to be a function, even though the code
      // supports a hash. Let's not rock the boat and just use a function.
      style: () => this.makeFeatureStyle(config, map.getZoom()),

      // Only relevant for point data sources rather than polygons.
      pointToLayer: (_, latlng: LatLngExpression) =>
        new LeafletMarker(latlng, {
          icon: new LeafletIcon({
            iconUrl: config.iconSrc || DEFAULT_ICON_SRC,
            iconSize: [30, 30],
          }),
        }),

      // Mouseover/mouseout hover styles are only relevant for polygons
      onEachFeature: (_, featureLayer: LeafletLayer) => {
        featureLayer.on({
          mouseover: ev => this.onFeatureMouseOver(config, ev),
          mouseout: ev => this.onFeatureMouseOut(config, ev),
        });
      },
    };

    // This layer starts out blank. It will get populated as a result of the
    // Esri query callback.
    const featuresLayer = new LeafletGeoJSON(undefined, layerOptions);

    // See the discussion in LayerRecord about mapLayer vs. featuresLayer.
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
    }

    const record: LayerRecord = {
      config,
      mapLayer,
      featuresLayer,

      // This can start as an empty object even though the filters typically
      // have default values because loadEsriLayer will initialize it with the
      // right default values.
      lastFilterValues: {},
    };

    this.loadEsriLayer(record);

    return record;
  }

  /**
   * Returns an ID for the filter that’s unique on the page, so we can use it as
   * an HTML ID attribute.
   */
  private makeFilterInputId(title: string) {
    return `cob-map-filter-${
      this.idSuffix
    }-${title!.toLocaleLowerCase().replace(/\s/g, '-')}`;
  }

  /**
   * Reloads any layers whose filter values have changed since the last time
   * they were queried.
   *
   * This method is called when there’s any update at all for the component, so
   * we need to determine which layers are actually stale relative to their
   * filter values.
   */
  private maybeUpdateLayers() {
    this.layerRecords.forEach(record => {
      const layerFilters = this.filters.filter(
        ({ dataSourceUid }) => dataSourceUid === record.config.uid
      );

      // We use "find" since we just need to know if there’s at least one filter
      // value that differs from the saved value, and it short-circuits after
      // finding one.
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
   *
   * Called to clear things out before we set the layer’s new content from a new
   * query.
   */
  private resetLayer({ featuresLayer, mapLayer }: LayerRecord) {
    mapLayer.closePopup();
    featuresLayer.clearLayers();

    if (mapLayer !== featuresLayer) {
      // MarkerClusterGroup only processes new icons on adding the layer.
      // There's no method to call to re-pull the child Markers from
      // featuresLayer now that addData has created them, so we clear it to.
      //
      // As features are added back into the featuresLayer, the
      // MarkerClusterGroup mapLayer will build its clustered UI based on them.
      mapLayer.clearLayers();
    }
  }

  /**
   * Queries a layer’s Esri endpoint for GeoJSON features and adds them in.
   *
   * Takes into account any filters that are applied on the layer.
   */
  private loadEsriLayer(record: LayerRecord) {
    const { config, featuresLayer, mapLayer } = record;

    // The list of all "WHERE" clauses we’re sending to Esri, based on the
    // filters.
    const allWhereClauses: string[] = [];

    // A map of filter IDs to the WHERE clauses that they power. We need to know
    // this for dynamic filters (whose values are based on the data) because we
    // need to exclude a filter’s WHERE clause from the query that tells us what
    // data should be in it.
    //
    // E.g., you need to remove "FOOD_TRUCK='Crêpes by Monica'" from the query
    // where you ask for which food truck names should appear in the popup, but
    // you still want to keep in "WEEKDAY=Monday"
    const whereClausesById: { [id: string]: string } = {};

    // This will become the lastFilterValues of the LayerRecord so we have a
    // record of what the filter values were for the last query.
    const filterValuesUsedInQuery: { [id: string]: string } = {};

    // List of all the filters that apply to this layer.
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

      filterValuesUsedInQuery[id] = value;

      let whereClause: string = '';

      // Back-lookup our current value into the filter’s "options" array so we
      // can find the "query" WHERE clause that should be applied for that
      // value.
      if (options) {
        for (let i = 0; i < options.length; ++i) {
          const opt = options[i];
          if (
            (!opt.type || opt.type === 'value') &&
            opt.value === value &&
            opt.query
          ) {
            whereClause = opt.query;
            break;
          }
        }
      }

      // Either no built-in query or the filter didn’t have an "options"
      // array.
      if (!whereClause) {
        // Passing value as the argument to the template here makes it replace
        // "{{.}}". We also escape single quotes so that they can be used in the
        // template to contain the value.
        whereClause = templayed(queryTemplate)(value.replace(/'/g, "''"));
      }

      allWhereClauses.push(whereClause);
      whereClausesById[id] = whereClause;
    });

    // We do this here to prevent looping and re-querying when
    // componentDidUpdate fires while the new query is still outstanding. This
    // assignment will cause the "maybeUpdateLayers" check to pass over this
    // layer (unless its filters do actually change). So even though the current
    // map display doesn’t reflect "lastFilterValues" at that point, it will
    // very soon once the query resolves.
    record.lastFilterValues = filterValuesUsedInQuery;

    // Reassignment so it triggers a @State change and re-renders filter values
    // (important for going from '' -> default values)
    this.filterValues = {
      ...this.filterValues,
      ...filterValuesUsedInQuery,
    };

    // Remove the contents of the layer we're about to load data into, as a way
    // to show that something is happening while we wait for the ESRI response
    // to come in. It’s a cheap "loading indicator" UI.
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
      .run(
        (
          err: Error | null,
          featureCollection: FeatureCollection<GeometryObject> | null
        ) => {
          if (err || !featureCollection) {
            throw err || new Error('Missing FeatureCollection');
          }

          // We clear a second time just before adding data in case there is an
          // overlapping query or something that added points since the reset we
          // did before the query.
          this.resetLayer(record);

          featuresLayer.addData(featureCollection);

          if (mapLayer !== featuresLayer) {
            // MarkerClusterLayer needs this to process the newly-added
            // features.
            mapLayer.addLayer(featuresLayer);
          }

          // We set this again to ensure that filterValues best reflects the state
          // of the map. Things could get a little askew if the user changes the
          // filters while a query is happening, if the queries come back
          // out-of-order. This ensures correctness when the dust settles.
          record.lastFilterValues = filterValuesUsedInQuery;

          // Also update the UI to match what's being displayed. Ideally this will
          // be a visual no-op.
          this.filterValues = {
            ...this.filterValues,
            ...filterValuesUsedInQuery,
          };
        }
      );

    // While the data is being queried to populate the layer with features, we
    // also have to update each filter that is dynamically loading its options.
    // For example, if we changed the day of the week, we want to re-query so we
    // only show the food trucks that arrive on that day.
    layerFilters.forEach(filterObj => {
      const id = this.makeFilterInputId(filterObj.title);

      (filterObj.options || []).forEach(opt => {
        if (opt.type !== 'dynamic') {
          return;
        }

        const { field, limitWithFilters } = opt;

        // ID is unique per filter, but a filter could have multiple dynamic
        // options, each on a different field, so we use a key to identify this
        // particular option.
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
        } else {
          whereClauses.push('1=1');
        }

        esriQuery({ url: config.url })
          .where(whereClauses.join(' AND '))
          .fields([field])
          .distinct()
          .run(
            (
              err: Error | null,
              featureCollection: FeatureCollection<GeometryObject> | null
            ) => {
              if (err || !featureCollection) {
                throw err || new Error('Missing FeatureCollection');
              }

              const values: string[] = featureCollection.features.map(
                ({ properties }) => properties && properties[field]
              );

              values.sort();

              // This assignment to a @State will re-render to update the list
              // of options in the dropdown.
              this.filterDynamicOptions = {
                ...this.filterDynamicOptions,
                [key]: values,
              };
            }
          );
      });
    });
  }

  private getSearchFieldInputId() {
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

            <div class="cob-map-leaflet-container">
              {this.showAddressNotFound && (
                <div class="cob-map-dialog">
                  <div class="cob-map-dialog-contents p-a500 br br-t400">
                    <h3 class="h3 tt-u">Couldn’t find address</h3>
                    <p class="t--reset">
                      Sorry, that search didn’t match any addresses in our
                      database.
                    </p>

                    <div class="ta-r m-t300">
                      <button
                        class="btn btn--sm btn--200"
                        onClick={() => (this.showAddressNotFound = false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

  /**
   * At mobile breakpoints, renders an icon that can be used to expand up the
   * controls drawer, which contains address search, filters, instructions, and
   * the legend.
   */
  private renderControlsToggle() {
    if (
      !this.instructionsHtml &&
      !this.showLegend &&
      !this.showAddressSearch &&
      this.filters.length === 0
    ) {
      // There are no controls to show, so no need for a toggle.
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

  private renderLegendIcon({ color, iconSrc, legendSymbol }: LayerConfig) {
    switch (legendSymbol) {
      case 'polygon':
        // Square with the stroke color and translucent fill color
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
        // Just a line with the stroke color
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

  private renderFilter({ title, type, options }: Filter) {
    const id = this.makeFilterInputId(title);

    switch (type) {
      case 'select': {
        // We keep track of whether we added an option that's selected. This
        // handles the case where other filters remove a dynamic filter’s
        // option. In that case we add it to the end of the select, but disable
        // it. That way it can still be shown, since it is reflected in the way
        // the layer is currently displayed.
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
                      // A "dynamic" option expands into the list of values that
                      // we retrieved from the server in #loadEsriLayer (and
                      // store in #filterDynamicOptions)
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
