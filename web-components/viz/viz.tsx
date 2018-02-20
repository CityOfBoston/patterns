import { Component, Element, Prop } from '@stencil/core';

/*

{
  "vizId": "123456",
  "title": "What is my title",
  "description": "This is a description",
  "data_sources": [
  {
      "uid": "SomeRandomValue",
      "type": "cob-arcgis",
      "icon": "https://patterns.boston.gov/icons/Bathrooms@3x.png",
      "cluster_icons": true,
      "polygon_style":
      {
          "name": "default",
          "color": "#0C2639",
          "hover_color": "#FB4D42"
      },
      "popover": "<p>I am a popover</p>",
      "attributes":
      {
          "service": "https://services.arcgis.com/sFnw0xNflSi8J0uh/ArcGIS/rest/services/food_trucks_schedule/FeatureServer",
          "layer": 0
      },
      "legend_label": "I am a legend!"
  }],
  "maps": [
  {
      "uid": "ZWVVViN3h1eZf0Ssnlsa8",
      "latitude": "42.347316",
      "longitude": "-71.065227",
      "zoom": "12",
      "showZoomControl": true,
      "showLegend": true,
      "findUserLocation": true,
      "searchForAddress": true,
      "zoomToAddress": true,
      "placeholderText": "Search for an address...",
      "showDataLayer": "SomeRandomValue"
  }]
}

*/

export interface VizConfig {
  vizId: string;
  title: string;
  description: string;
  data_sources: DataSourceConfig[];
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
  cluster_icons: boolean;
  polygon_style: {
    name: string;
    color?: string | null;
    hover_color?: string | null;
  };
  legend_label: string;
  popover: string;
}

export interface MapConfig {
  uid: string;
  latitude?: string | null;
  longitude?: string | null;
  zoom?: string | null;
  showZoomControl: boolean;
  showLegend: boolean;
  findUserLocation: boolean;
  searchForAddress: boolean;
  zoomToAddress: boolean;
  placeholderText?: string | null;
  showDataLayer: string;
}

@Component({
  tag: 'cob-viz',
})
export class CobViz {
  @Element() el: HTMLElement;

  @Prop() config: string = '';

  getConfig(): VizConfig | null {
    const configScript = this.el.querySelector('script[slot=config]');

    if (this.config) {
      return JSON.parse(this.config);
    } else if (configScript) {
      return JSON.parse(configScript.innerHTML);
    } else {
      return null;
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

    return (
      <div>
        {config.maps.map(map => (
          <cob-map
            heading={config.title}
            showLegend={map.showLegend}
            showZoomControl={map.showZoomControl}
            showAddressSearch={map.searchForAddress}
            addressSearchPlaceholder={map.placeholderText}
            {...this.getMapProps()}
          >
            {config.description && (
              <div slot="instructions">{config.description}</div>
            )}

            {config.data_sources.map(
              ({
                attributes: { layer, service },
                icon,
                legend_label,
                popover,
                polygon_style,
              }) => (
                <cob-map-esri-layer
                  url={`${service}/${layer}`}
                  iconSrc={icon}
                  popupTemplate={popover}
                  label={legend_label}
                  color={polygon_style.color}
                  hoverColor={polygon_style.hover_color}
                />
              )
            )}
          </cob-map>
        ))}
      </div>
    );
  }
}
