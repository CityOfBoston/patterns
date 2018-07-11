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
import { geosearch } from 'esri-leaflet-geocoder';

// This is our fork of Leaflet/Leaflet.markercluster to fix for module-based
// importing.
import { MarkerClusterGroup } from 'leaflet.markercluster';

// Has a global definition. Look, the code is 5 years old.
import 'templayed';
declare function templayed(string): (Object) => string;

// Run `gulp schema:vizwiz` to regenerate these files.
import { VizWizV10 } from '../types/viz-1.0.schema';

export type VizConfig = VizWizV10;

const DEFAULT_BASEMAP_URL =
  'https://awsgeo.boston.gov/arcgis/rest/services/Basemaps/BostonCityBasemap_WM/MapServer';

const DEFAULT_ICON_SRC =
  'https://patterns.boston.gov/images/global/icons/mapping/waypoint-charles-blue.svg';

const DEFAULT_ADDRESS_SEARCH_WAYPOINT_ICON_SRC =
  'https://patterns.boston.gov/images/global/icons/mapping/waypoint-freedom-red.svg';

const BOSTON_BOUNDS = LlatLngBounds(
  LlatLng(42.170274, -71.348648),
  LlatLng(42.456141, -70.818901)
);

const DEFAULT_LATITUDE = 42.3240812;
const DEFAULT_LONGITUDE = -71.0844068;
const DEFAULT_ZOOM = 14;

const ADDRESS_FIELD_HOLDER_CLASS = 'cob-address-search-field-container';

const WAYPOINT_ICON = new LeafletIcon({
  iconUrl: DEFAULT_ADDRESS_SEARCH_WAYPOINT_ICON_SRC,
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
   * If true, the map starts hidden and, when shown, appears in a full-screen
   * modal dialog.
   *
   * Note: On the server, this may be the empty string when true, so we need to
   * check against `!== false` to test it.
   */
  @Prop() modal: boolean = false;

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
    const mapHidden = this.modal !== false && this.modalVisible === false;

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

    if (mapConfig.showZoomControl) {
      const zoomControl = Lcontrol.zoom({
        position: 'bottomright',
      });
      zoomControl.addTo(this.map);
    }

    if (this.showAddressSearch) {
      const addressSearchControl = geosearch({
        expanded: true,
        placeholder:
          (mapConfig.addressSearch && mapConfig.addressSearch.placeholder) ||
          'Search for an address…',
        collapseAfterResult: false,
        zoomToResult: false,
        searchBounds: BOSTON_BOUNDS,
      });

      addressSearchControl.on(
        'results',
        this.onAddressSearchResults.bind(this)
      );

      this.addressSearchResultsFeatures = new LeafletFeatureGroup().addTo(
        this.map
      );

      this.addressSearchControlEl = addressSearchControl.onAdd!(this.map);

      // We massage the auto-generated DOM to match our Fleet classes
      const inputEl = this.addressSearchControlEl.querySelector('input')!;
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
  }

  /**
   * Takes JSON out of either a "config" prop or a <script> child. We support
   * the former for integration with other components, and the latter for easier
   * HTML building.
   */
  getConfig(): VizConfig | null {
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
      history.replaceState(null, undefined, ' ');
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
    const feature: LeafletLayer = ev.target;

    if (feature instanceof LeafletPath) {
      if (config.hoverColor) {
        feature.setStyle(this.makeFeatureHoverStyle(config));
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

  onAddressSearchResults(data) {
    if (data.results.length) {
      // If we're on mobile, the overlay was open to show the address search
      // field. We close it to keep it from obscuring the results.
      this.openOverlay = false;
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

    if (markers.length === 1 && popupLayerRecord) {
      // Opening the popup will bring it into view automatically.
      markers[0].openPopup();
    } else if (markers.length > 0 && this.addressSearchZoomToResults) {
      this.map!.fitBounds(this.addressSearchResultsFeatures.getBounds());
    }
  }

  handleMapLayerPopup(
    config: LayerConfig,
    featureLayer: GeoJSONFeatureLayer
  ): string | null {
    const { feature } = featureLayer;
    if (feature.type !== 'Feature') {
      return null;
    }

    return this.renderPopupContent(config, feature.properties || {});
  }

  handleAddressSearchMarkerPopup(
    layerConfig: LayerConfig,
    marker: LeafletMarker
  ) {
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

        const feature = featureCollection.features[0];

        if (feature) {
          // We stop scrolling, since the update call below will need to move
          // the map, and it won’t do anything if the map already moving.
          this.map!.stop();

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

  makeFeatureStyle({ color, fill }: LayerConfig): PathOptions {
    return {
      color: color || undefined,
      fill,
      weight: 3,
    };
  }

  makeFeatureHoverStyle({ color, hoverColor, fill }: LayerConfig): PathOptions {
    return {
      color: hoverColor || color || undefined,
      fill,
      weight: 4,
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
      style: () => this.makeFeatureStyle(config),
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
          // featuresLayer now that addData has created them, so we clear it all
          // and add again.
          mapLayer.clearLayers();
          mapLayer.addLayer(featuresLayer);
        }
      });

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

    return { config, mapLayer, featuresLayer };
  }

  handleLegendLabelMouseClick(ev: MouseEvent) {
    this.openOverlay = !this.openOverlay;
    ev.stopPropagation();
    ev.preventDefault();
  }

  getSearchFieldInputId() {
    return `cob-map-address-search-field-${this.idSuffix}`;
  }

  render() {
    if (this.modal !== false) {
      return this.renderModal();
    } else {
      return this.renderInline();
    }
  }

  renderModal() {
    if (this.modalVisible === false) {
      return null;
    }

    return (
      <div class="md md--fw">
        <div class="md-c">
          <div class="cob-map-modal-contents">
            <div class="cob-map-modal-title">
              <div class="sh sh--sm p-a300" style={{ borderBottom: 'none' }}>
                <h2 class="sh-title">{this.heading}</h2>
              </div>

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
              {this.instructionsHtml && (
                <div class="p-a300" innerHTML={this.instructionsHtml} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderInline() {
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
            {this.instructionsHtml && <div innerHTML={this.instructionsHtml} />}

            {this.showAddressSearch && (
              <div class="sf sf--md m-v500">
                <label class="sf-l">{this.addressSearchHeading}</label>
                <div class={`${ADDRESS_FIELD_HOLDER_CLASS} m-v100`} />
              </div>
            )}

            {this.showLegend && (
              <div class="g cob-legend-table">
                {this.layerRecords
                  .filter(
                    ({ config }) => config.legendSymbol && config.legendLabel
                  )
                  .map(({ config }) => (
                    <div
                      class={`${
                        this.layerRecords.length === 1 ? 'g--12' : 'g--6'
                      } cob-legend-table-row m-b200`}
                    >
                      <div class="cob-legend-table-icon">
                        {this.renderLegendIcon(config)}
                      </div>

                      <div class="t--subinfo cob-legend-table-label">
                        {config.legendLabel}
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
}
