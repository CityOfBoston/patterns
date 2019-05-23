/* eslint no-dupe-class-members: 0 */

// Type definitions for esri-leaflet-geocoder 2.2
// Project: https://github.com/Esri/esri-leaflet-geocoder
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4

// Copied into patterns library by finh to remove the "L.esri" wrapper module
// since we’re importing Leaflet as a module rather than <script>ing it on to
// the page and letting it attach to L.esri.

declare module 'esri-leaflet-geocoder' {
  import * as L from 'leaflet';
  import * as Esri from 'esri-leaflet';

  type GeosearchConstructor = new (options?: GeosearchObject) => Geosearch;
  type Geosearch = GeosearchControl & L.Evented;

  interface GeosearchControl extends L.Control {
    clear(): this;
    clearSuggestions(): this;
    disable(): this;
    enable(): this;
  }

  function geosearch(options?: GeosearchObject): Geosearch;

  interface GeosearchObject {
    position?: L.ControlPosition;
    zoomToResult?: boolean;
    useMapBounds?: boolean | number;
    collapseAfterResult?: boolean;
    expanded?: boolean;
    allowMultipleResults?: boolean;
    providers?: GeosearchProvider[];
    placeholder?: string;
    title?: string;
    searchBounds?: L.LatLngBoundsExpression | null;
  }

  class GeocodeService extends Esri.Service {
    constructor(options?: GeocodeServiceOptions);
    geocode(): Geocode;
    suggest(): Suggest;
    reverse(): ReverseGeocode;
  }

  function geocodeService(options?: GeocodeServiceOptions): GeocodeService;

  interface GeocodeServiceOptions extends Esri.ServiceOptions {
    supportsSuggest?: boolean;
  }

  class Geocode extends Esri.Task {
    constructor(options?: Esri.TaskOptions | Esri.Service);
    text(text: string): this;
    address(text: string): this;
    neighborhood(text: string): this;
    city(text: string): this;
    subregion(text: string): this;
    region(text: string): this;
    postal(text: string): this;
    country(text: string): this;
    category(text: string): this;
    within(bounds: L.LatLngBoundsExpression): this;
    nearby(latlng: L.LatLngExpression, distance: number): this;
    run(
      callback: (
        error: any | undefined,
        results: { results: any[] },
        response: any
      ) => void,
      context?: any
    ): this;
  }

  function geocode(options?: Esri.TaskOptions | Esri.Service): Geocode;

  class Suggest extends Esri.Task {
    constructor(options?: Esri.TaskOptions | Esri.Service);
    text(text: string): this;
    category(text: string): this;
    within(bounds: L.LatLngBoundsExpression): this;
    nearby(latlng: L.LatLngExpression, distance: number): this;
    run(
      callback: (error: any | undefined, results: any, response: any) => void,
      context?: any
    ): this;
  }

  function suggest(options?: Esri.TaskOptions | Esri.Service): Suggest;

  class ReverseGeocode extends Esri.Task {
    constructor(options?: Esri.TaskOptions | Esri.Service);
    latlng(latlng: L.LatLngExpression): this;
    distance(distance: number): this;
    language(language: string): this;
    run(
      callback: (
        error: any | undefined,
        results: { latlng: L.LatLng; address: string },
        response: any
      ) => void,
      context?: any
    ): this;
  }

  function reverseGeocode(
    options?: Esri.TaskOptions | Esri.Service
  ): ReverseGeocode;

  interface GeosearchProvider {
    suggestions(
      text: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Task;
    results(
      text: string,
      key: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Task;
  }
  type GeosearchCallback = (error: any | undefined, results: any) => void;

  interface BaseProviderOptions {
    label?: string;
    maxResults?: number;
    attribution?: string;
    token?: string | null;
  }

  class ArcgisOnlineProvider extends GeocodeService
    implements GeosearchProvider {
    constructor(options?: ArcgisOnlineProviderOptions);
    suggestions(
      text: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Suggest;
    results(
      text: string,
      key: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Geocode;
  }

  function arcgisOnlineProvider(
    options?: ArcgisOnlineProviderOptions
  ): ArcgisOnlineProvider;

  interface ArcgisOnlineProviderOptions extends BaseProviderOptions {
    countries?: string | string[];
    categories?: string | string[];
    forStorage?: boolean;
  }

  class GeocodeServiceProvider extends GeocodeService
    implements GeosearchProvider {
    constructor(options?: GeocodeServiceProviderOptions);
    suggestions(
      text: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Suggest;
    results(
      text: string,
      key: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Geocode;
  }

  function geocodeServiceProvider(
    options?: GeocodeServiceProviderOptions
  ): GeocodeServiceProvider;

  interface GeocodeServiceProviderOptions extends BaseProviderOptions {
    url: string;
  }

  class FeatureLayerProvider extends Esri.FeatureLayerService
    implements GeosearchProvider {
    constructor(options?: FeatureLayerProviderOptions);
    suggestions(
      text: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Query;
    results(
      text: string,
      key: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Query;
  }

  function featureLayerProvider(
    options?: FeatureLayerProviderOptions
  ): FeatureLayerProvider;

  interface FeatureLayerProviderOptions extends BaseProviderOptions {
    url: string;
    searchFields?: string | string[];
    bufferRadius?: number;
    formatSuggestion?(featureInformation: any): string;
  }

  class MapServiceProvider extends Esri.MapService
    implements GeosearchProvider {
    constructor(options?: MapServiceProviderOptions);
    suggestions(
      text: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Find;
    results(
      text: string,
      key: string,
      bounds: L.LatLngBoundsExpression | undefined | null,
      callback: GeosearchCallback
    ): Esri.Query | Esri.Find;
  }

  function mapServiceProvider(
    options?: MapServiceProviderOptions
  ): MapServiceProvider;

  interface MapServiceProviderOptions extends BaseProviderOptions {
    url: string;
    searchFields: string | string[];
    layers: number | number[];
    bufferRadius: number | number[];
    formatSuggestion(featureInformation: any): string;
  }

  interface ResultObject {
    text?: string;
    bounds?: L.LatLngBoundsExpression;
    latlng?: L.LatLngExpression;
    properties?: any;
    geojson?: L.GeoJSON;
    [key: string]: any;
  }

  interface Results {
    bounds: L.LatLngBoundsExpression;
    latlng: L.LatLngExpression;
    results: ResultObject[];
  }
}
