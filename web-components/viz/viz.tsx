import { Component, Element, Prop } from '@stencil/core';

export interface VizConfig {
  vizId: string;
  title: string;
  description: string;
  dataSources: DataSourceConfig[];
  maps: MapConfig[];
}

export interface DataSourceConfig {
  uid: string;
  type: 'cob-arcgis';
  attributes: {
    service: string;
    layer: number;
  };
  icon: string;
  clusterIcons: boolean;
  polygonStyle: {
    name: string;
    color?: string | null;
    hoverColor?: string | null;
  };
  legendLabel: string;
  popover: string;
}

export interface MapConfig {
  uid: string;
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number | null;
  showZoomControl: boolean;
  showLegend: boolean;
  findUserLocation: boolean;
  searchForAddress: boolean;
  zoomToAddress: boolean;
  placeholderText?: string | null;
  addressSearchPopupDataSourceUid: string;
}

@Component({
  tag: 'cob-viz',
})
export class CobViz {
  @Element() el: HTMLElement;

  /**
   * A JSON string or equivalent object that defines the map and layers. The
   * schema for this config comes from VizWiz, so it won’t be documented here.
   *
   * Any attributes prefixed with `map-` will be passed on to the generated
   * `<cob-map>` component. _E.g._ `map-id` or `map-style`.
   */
  @Prop() config: string = '';

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
      console.error('Could not parse vizwiz JSON', e);
      throw e;
    }
  }

  // This function is used to pass all "map-" attributes from this element on to
  // the <cob-map> generated element.
  getMapProps() {
    const props: { [key: string]: any } = {};

    const attrs = this.el.attributes;

    for (let i = 0; i < attrs.length; ++i) {
      const attr = attrs.item(i);
      const name = attr.name.toString();
      const value = attr.value.toString();

      if (!name.match(/^map-/)) {
        continue;
      }

      const mapName = name.replace(/^map-/, '');

      let parsedValue;
      if (mapName === 'style') {
        // Style needs to be an Object of prop/values rather than a string.
        parsedValue = this.styleStringToObject(value);
      } else if (mapName.match(/^on/)) {
        // Event handlers need to be turned into JS functions now that we’re in
        // JSX land.
        parsedValue = new Function(value);
      } else {
        parsedValue = value;
      }

      props[mapName] = parsedValue;
    }

    return props;
  }

  styleStringToObject(styleStr: string) {
    // Use the DOM to parse our style attribute into something that the
    // renderer can consume.
    const styledEl = document.createElement('div');
    styledEl.setAttribute('style', styleStr);
    const style = styledEl.style;

    const styleObj = {};

    for (let i = 0; i < style.length; ++i) {
      const key = style.item(i);
      const value = style.getPropertyValue(key);

      // The key will actually be kebab-case, but the way the renderer sets
      // style that doesn't end up being a problem.
      styleObj[key] = value;
    }

    return styleObj;
  }

  render() {
    const config = this.getConfig();
    if (!config) {
      return null;
    }

    try {
      return (
        <div>
          {config.maps.map(map => (
            <cob-map
              heading={config.title}
              showLegend={map.showLegend}
              showZoomControl={map.showZoomControl}
              showAddressSearch={map.searchForAddress}
              addressSearchHeading=""
              addressSearchPlaceholder={map.placeholderText}
              addressSearchPopupLayerUid={map.addressSearchPopupDataSourceUid}
              zoom={map.zoom}
              {...this.getMapProps()}
            >
              {config.description && (
                <div slot="instructions" innerHTML={config.description} />
              )}

              {config.dataSources.map(
                ({
                  attributes: { layer, service },
                  icon,
                  legendLabel,
                  popover,
                  polygonStyle,
                  clusterIcons,
                }) => (
                  <cob-map-esri-layer
                    url={`${service}/${layer}`}
                    iconSrc={icon}
                    clusterIcons={clusterIcons}
                    popupTemplate={popover}
                    label={legendLabel}
                    color={polygonStyle.color}
                    hoverColor={polygonStyle.hoverColor}
                    fill
                  />
                )
              )}
            </cob-map>
          ))}
        </div>
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error configuring <cob-viz>', e);
      return null;
    }
  }
}
