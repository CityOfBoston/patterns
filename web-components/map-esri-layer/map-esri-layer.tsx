import { Component, Event, Prop, EventEmitter } from '@stencil/core';

import { LayerConfig } from '../map/map';

@Component({
  tag: 'cob-map-esri-layer',
})
export class CobMapEsriLayer {
  @Prop() url: string;
  @Prop() title: string;
  @Prop() color: string = '';
  @Prop() hoverColor: string = '';

  @Event() cobMapEsriLayerConfig: EventEmitter;

  componentWillLoad() {
    this.emitConfig();
  }

  // This lifecycle event is the equivalent to @Watching all props
  componentWillUpdate() {
    this.emitConfig();
  }

  emitConfig() {
    const config: LayerConfig = {
      url: this.url,
      title: this.title,
      color: this.color,
      hoverColor: this.hoverColor,
    };

    this.cobMapEsriLayerConfig.emit(config);
  }
}
