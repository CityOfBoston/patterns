import { Component, Element, Prop } from '@stencil/core';

// Run `gulp schema:vizwiz` to regenerate these files.
import { VizWizV00 } from '../types/viz-0.0.schema';
import { VizWizV10 } from '../types/viz-1.0.schema';

type VizConfig = VizWizV00 | VizWizV10;

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

  isV1(config: VizConfig): config is VizWizV10 {
    const version = (config as VizWizV10).version;
    return version && version.startsWith('1.');
  }

  render() {
    const config = this.getConfig();
    if (!config) {
      return null;
    }

    try {
      if (this.isV1(config)) {
        return this.renderV1(config);
      } else {
        return this.renderV0(config);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error configuring <cob-viz>', e);
      return null;
    }
  }

  renderV0(config: VizWizV00) {
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
  }

  renderV1(config: VizWizV10) {
    return (
      <div>
        {config.maps.map(map => {
          const { addressSearch } = map;
          const addresSearchProps = addressSearch
            ? {
                showAddressSearch: true,
                addressSearchHeading: addressSearch.title,
                addressSearchPlaceholder: addressSearch.placeholder,
                addressSearchPopupLayerUid:
                  addressSearch.autoPopupDataSourceUid,
              }
            : {
                showAddressSearch: false,
              };
          return (
            <cob-map
              heading={map.title}
              showLegend={map.showLegend}
              showZoomControl={map.showZoomControl}
              zoom={map.zoom}
              {...addresSearchProps}
              {...this.getMapProps()}
            >
              {map.instructionsHtml && (
                <div slot="instructions" innerHTML={map.instructionsHtml} />
              )}

              {config.dataSources.map(dataSource => {
                const {
                  data,
                  icons,
                  popupHtmlTemplate,
                  legend,
                  polygons,
                } = dataSource;
                switch (data.type) {
                  // TODO(finh): change "default" once data.type is correctly
                  // set. (See CityOfBoston/vizwiz#37)
                  case 'arcgis':
                  default:
                    return (
                      <cob-map-esri-layer
                        url={`${data.service}/${data.layer}`}
                        iconSrc={icons && icons.markerUrl}
                        clusterIcons={icons && icons.cluster}
                        popupTemplate={popupHtmlTemplate}
                        label={legend && legend.label}
                        color={polygons && polygons.color}
                        hoverColor={polygons && polygons.hoverColor}
                        fill={legend && legend.symbol === 'polygon'}
                      />
                    );
                }
              })}
            </cob-map>
          );
        })}
      </div>
    );
  }
}
