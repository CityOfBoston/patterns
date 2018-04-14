import { Component, Element, Event, Prop, EventEmitter } from '@stencil/core';

import { LayerConfig } from '../map/map';

@Component({
  tag: 'cob-map-esri-layer',
})
export class CobMapEsriLayer {
  @Element() el: HTMLElement;

  /** Identifier string for the layer. Must be unique within the map. */
  @Prop() uid: string = '';
  /** URL for an ArcGIS feature layer. */
  @Prop() url: string;
  /** String to show on the legend for this layer. */
  @Prop() label: string;

  /**
   * For polygon layers, the color for the borders. (The fill will be a
   * semi-transparent version of this color).
   */
  @Prop() color: string = '';

  /**
   * If set, the color to use for polygon borders if the mouse is hovered over
   * them.
   */
  @Prop() hoverColor: string = '';

  /**
   * Boolean attribute. If set, regions will be filled in with the color
   * attribute at 20% opacity. Also causes the legend to show a box rather than
   * a straight line for this layer.
   */
  @Prop() fill: boolean = false;

  /**
   *  URL to use as an icon for the layer’s features, and to show in the legend
   *  for this layer.
   */
  @Prop() iconSrc: string = '';

  /**
   * If the layer is showing icons, use the
   * [markercluster](https://github.com/CityOfBoston/Leaflet.markercluster)
   * Leaflet plugin to show nearby icons as a single dot until you zoom in.
   */
  @Prop() clusterIcons: boolean = false;

  /**
   * A Mustache template to use to generate the contents of a Leaflet popup for
   * the layer’s features. Its context will be the feature’s properties. To
   * specify the template in a more editor-friendly way, use the `popup` slot
   * and a `<script>` tag.
   */
  @Prop() popupTemplate: string = '';

  /**
   * Sent on load and when the configuration changes so that the parent
   * <cob-map> can update the layer’s contents or appearance.
   */
  @Event() cobMapEsriLayerConfig: EventEmitter;

  componentWillLoad() {
    this.emitConfig();
  }

  // This lifecycle event is the equivalent to @Watching all props
  componentDidUpdate() {
    this.emitConfig();
  }

  emitConfig() {
    const popupScript = this.el.querySelector('script[slot=popup]');

    const config: LayerConfig = {
      uid: this.uid,
      url: this.url,
      label: this.label,
      color: this.color,
      hoverColor: this.hoverColor,
      fill: this.fill,
      iconSrc: this.iconSrc,
      clusterIcons: this.clusterIcons,
      popupTemplate:
        this.popupTemplate || (popupScript && popupScript.innerHTML),
    };

    this.cobMapEsriLayerConfig.emit(config);
  }
}
