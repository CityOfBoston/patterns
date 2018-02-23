import { Component, Element, Event, Prop, EventEmitter } from '@stencil/core';

import { LayerConfig } from '../map/map';

@Component({
  tag: 'cob-map-esri-layer',
})
export class CobMapEsriLayer {
  @Element() el: HTMLElement;

  @Prop() url: string;
  @Prop() label: string;
  @Prop() color: string = '';
  @Prop() hoverColor: string = '';
  @Prop() iconSrc: string = '';
  @Prop() fill: boolean = false;
  @Prop() clusterIcons: boolean = false;

  // We allow either a string attribute or a nested <script> tag to define the
  // template for popups. The attribute is more correct and better for DOM
  // generation, but the <script> is supported for easier human-editing (since
  // the attribute version requires much escaping for <>s).
  @Prop() popupTemplate: string = '';

  @Event() cobMapEsriLayerConfig: EventEmitter;

  componentWillLoad() {
    this.emitConfig();
  }

  // This lifecycle event is the equivalent to @Watching all props
  componentWillUpdate() {
    this.emitConfig();
  }

  emitConfig() {
    const popupScript = this.el.querySelector('script[slot=popup]');

    const config: LayerConfig = {
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
