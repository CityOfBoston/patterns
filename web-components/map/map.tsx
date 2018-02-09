import {
  Component,
  Element,
  Listen,
  Event,
  EventEmitter,
  Prop,
  Watch,
} from '@stencil/core';

import L from 'leaflet';
// awkward way to make the types come out right, since @types/esri-leaflet
// attaches its "esri" namespace directly to the "leaflet" module.
import esri from 'esri-leaflet/dist/esri-leaflet';
L.esri = esri;

import * as geojson from 'geojson';

const DEFAULT_BASEMAP_URL =
  'https://awsgeo.boston.gov/arcgis/rest/services/Basemaps/BostonCityBasemap_WM/MapServer';

export interface LayerConfig {
  url: string;
  title: string;
  color: string;
  hoverColor?: string;
  icon?: string;
}

export interface LayerRecord {
  layer: L.esri.FeatureLayer;
  config: LayerConfig;
}

@Component({
  tag: 'cob-map',
  styleUrls: ['map.css', '../../node_modules/leaflet/dist/leaflet.css'],
})
export class CobMap {
  @Element() el: HTMLElement;

  @Prop({ context: 'isServer' })
  private isServer: boolean;

  @Prop() latitude: number = 42.357004;
  @Prop() longitude: number = -71.062309;
  @Prop() zoom: number = 14;
  @Prop() showZoomControl: boolean = false;
  @Prop() basemapUrl: string = DEFAULT_BASEMAP_URL;

  // Emitted when layers are added or their configurations change so that e.g.
  // the legend can be updated to match what's on the map.
  @Event() cobMapLayerRecords: EventEmitter;

  map: L.Map;
  zoomControl: L.Control;

  // Used to distinguish between map moves that come from the UI and those that
  // come from someone external changing our attributes. Keeps us from
  // redundantly (and often mistakenly) updating the map when it's already
  // updated.
  mapMoveInProgress: boolean;

  // We keep track of element -> layer info in this map so that if a config
  // child element's values update we can modify the layer.
  layerRecordsByElement: Map<HTMLElement, LayerRecord> = new Map();

  componentWillLoad() {
    if (this.isServer) {
      // We don't want to mount Leaflet on the server, even though it does
      // serialize the generated elements, since Leaflet then won't start
      // up correctly when we hit the browser.
      return;
    }

    this.map = L.map(this.el, {
      zoomControl: false,
    })
      .setView([this.latitude, this.longitude], this.zoom)
      // Boston basemap only includes Boston, so we layer over Esri's "Gray"
      // basemap.
      .addLayer(L.esri.basemapLayer('Gray'))
      .addLayer(L.esri.tiledMapLayer({ url: this.basemapUrl }));

    this.zoomControl = L.control.zoom({
      position: 'bottomright',
    });

    this.map.on({
      moveend: this.handleMapPositionChangeEnd.bind(this),
      zoomend: this.handleMapPositionChangeEnd.bind(this),
    });

    this.updateZoomControl();
  }

  componentDidLoad() {
    this.map.invalidateSize();
  }

  componentDidUnload() {
    this.map.remove();
    this.layerRecordsByElement = new Map();
  }

  @Listen('cobMapEsriLayerConfig')
  handleChildEsriDataConfig(ev) {
    ev.stopPropagation();
    this.addEsriLayer(ev.target, ev.detail);
  }

  onEachFeature(
    configElement: HTMLElement,
    feature: geojson.Feature<any>,
    featureLayer: L.Layer
  ) {
    if (
      feature.geometry.type === 'Polygon' ||
      feature.geometry.type === 'MultiPolygon'
    ) {
      // We pass the configElement in so that the latest config can
      // be looked up when the event fires.
      featureLayer.on({
        mouseover: this.onPolygonMouseover.bind(this, configElement),
        mouseout: this.onPolygonMouseout.bind(this, configElement),
      });
    }
  }

  onPolygonMouseover(configElement: HTMLElement, ev: L.LeafletEvent) {
    const layerRecord = this.layerRecordsByElement.get(configElement);
    if (!layerRecord) {
      return;
    }

    const feature: L.Polygon = ev.target;
    const { config } = layerRecord;

    if (config.hoverColor) {
      feature.setStyle(this.makePolygonHoverStyle(config));
      feature.bringToFront();
    }
  }

  onPolygonMouseout(target: HTMLElement, ev: L.LeafletEvent) {
    const layerRecord = this.layerRecordsByElement.get(target);
    if (!layerRecord) {
      return;
    }

    const feature: L.Polygon = ev.target;
    const { config } = layerRecord;

    if (config.hoverColor) {
      feature.setStyle(this.makePolygonStyle(config));
    }
  }

  makePolygonStyle(config: LayerConfig) {
    return {
      color: config.color,
      weight: 3,
    };
  }

  makePolygonHoverStyle(config: LayerConfig) {
    return {
      color: config.hoverColor,
      weight: 4,
    };
  }

  updateLayerConfig(record: LayerRecord, config: LayerConfig) {
    record.config = config;

    record.layer.setStyle(this.makePolygonStyle(config));
  }

  addEsriLayer(target: HTMLElement, config: LayerConfig) {
    const { url } = config;

    const layerRecord = this.layerRecordsByElement.get(target);

    if (layerRecord) {
      if (layerRecord.config.url === url) {
        // If URL is the same then we can just update the style.
        this.updateLayerConfig(layerRecord, config);

        return;
      } else {
        // If URL is different we need a new layer, so remove this and fall
        // through to the new layer case.
        layerRecord.layer.remove();
      }
    }

    const layer = L.esri
      .featureLayer({
        url,
        onEachFeature: this.onEachFeature.bind(this, target),
      })
      .addTo(this.map);

    const newLayerRecord = { layer, config };
    this.updateLayerConfig(newLayerRecord, config);

    this.layerRecordsByElement.set(target, newLayerRecord);

    // Allows the legend to update for the new layers
    this.cobMapLayerRecords.emit(
      Array.from(this.layerRecordsByElement).map(([_, record]) => record)
    );
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

  @Watch('longitude')
  @Watch('latitude')
  @Watch('zoom')
  updatePosition() {
    if (!this.mapMoveInProgress) {
      this.map.setView([this.latitude, this.longitude], this.zoom);
    }
  }

  @Watch('showZoomControl')
  updateZoomControl() {
    if (this.showZoomControl) {
      this.zoomControl.addTo(this.map);
    } else {
      this.zoomControl.remove();
    }
  }
}
