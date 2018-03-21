import { Selector } from 'testcafe';
import { readyComponentSelector } from '../../../../lib/testcafe/helpers';

/* PageModel class to encapsulate Map component functionality. */
export default class MapModel {
  root = Selector(readyComponentSelector('cob-map'));
  leafletPopup = this.root.find('.leaflet-popup');

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
