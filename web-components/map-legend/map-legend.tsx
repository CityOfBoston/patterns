import { Component, Listen, Prop, State, Element } from '@stencil/core';

import { LayerRecord, LayerConfig } from '../map/map';

@Component({
  tag: 'cob-map-legend',
  styleUrls: ['map-legend.css'],
})
export class CobMapLegend {
  @Element() el;

  @Prop() collapsedTitle: string = '';
  @Prop() open: boolean = false;

  @State() layerRecords: LayerRecord[] = [];

  // Used to keep our IDs distinct on the page
  idSuffix = Math.random()
    .toString(36)
    .substring(2, 7);

  @Listen('parent:cobMapLayerRecords')
  handleMapLayerRecords(ev) {
    this.layerRecords = ev.detail;
  }

  handleLabelMouseClick(ev: MouseEvent) {
    this.el.open = !this.el.open;
    ev.stopPropagation();
    ev.preventDefault();
  }

  // Keeps these from bubbling to the map.
  @Listen('mousedown')
  @Listen('mouseup')
  @Listen('mousemove')
  @Listen('pointerdown')
  @Listen('pointerup')
  @Listen('pointermove')
  @Listen('MSPointerDown')
  @Listen('MSPointerUp')
  @Listen('MSPointerMove')
  @Listen('click')
  @Listen('dblclick')
  @Listen('wheel')
  @Listen('mousewheel')
  stopPropagationToMap(ev: MouseEvent) {
    ev.stopPropagation();
  }

  render() {
    const inputId = `cob-map-legend-collapsible-${this.idSuffix}`;
    // During server rendering, this.open starts out as the empty string rather
    // than a boolean. We want to be correct for Percy rendering.
    //
    // Unfortunately the server rendering is not outputting the "checked"
    // attribute regardless.
    const open = this.open !== false;

    return (
      <div class="co">
        <input
          id={inputId}
          type="checkbox"
          class="co-f d-n"
          aria-hidden="true"
          checked={open}
        />
        <label
          htmlFor={inputId}
          class="co-t"
          onClick={this.handleLabelMouseClick.bind(this)}
        >
          {this.collapsedTitle}
        </label>

        <div class="co-b p-a300 b--w">
          <slot />

          <table class="m-t300">
            <tbody>
              {this.layerRecords.map(({ config }) => (
                <tr>
                  <td class="p-a100" style={{ width: '50px' }}>
                    {this.renderLegendIcon(config)}
                  </td>
                  <td class="t--subinfo">{config.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderLegendIcon({ color, icon }: LayerConfig) {
    if (icon) {
      return <img src={icon} width="50" />;
    } else {
      return (
        <div style={{ width: '50px', height: '3px', backgroundColor: color }} />
      );
    }
  }
}
