import { Selector } from 'testcafe';
import { readyComponentSelector } from '../../../../lib/testcafe/helpers';

interface MapSelector extends Selector {
  zoom: Promise<any>;
  latitude: Promise<any>;
  longitude: Promise<any>;
}

/* PageModel class to encapsulate Map component functionality. */
export default class MapModel {
  root = Selector(readyComponentSelector('cob-map')).addCustomDOMProperties({
    // TODO(finh): Type this with the Stencil components types once we can
    // provide a custom tsconfig.json to TestCafe to get it to recognize .tsx
    // files. See DevExpress/testcafe#1845
    zoom: (el: any) => el.zoom,
    latitude: (el: any) => el.latitude,
    longitude: (el: any) => el.longitude,
  }) as MapSelector;
  leafletPopup = this.root.find('.leaflet-popup');
  zoomInButton = this.root.find('.leaflet-control-zoom-in');

  interactivePolygonsByColor(color: string) {
    return this.root.find(
      // Edge requires 'STROKE', IE 11 requires 'stroke'
      `path.leaflet-interactive[stroke="${color}"], path.leaflet-interactive[STROKE="${color}"]`
    );
  }

  // We select with the src-hammerhead-stored-value because the actual src has
  // been re-written to include the host.
  markersByIcon(icon: string) {
    return this.root.find(
      `img.leaflet-marker-icon[src-hammerhead-stored-value="${icon}"]`
    );
  }

  esriLayerConfigByLabel(label: string) {
    return this.root.find(`cob-map-esri-layer[label="${label}"]`);
  }
}
