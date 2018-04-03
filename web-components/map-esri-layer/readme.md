# cob-map-esri-layer

These elements are added as children of `<cob-map>` to include layers of geo
features on the map.

## Slots

#### popup

Alternate way to define the popup template from the `popup-template` attribute
that avoids the need to HTML escape tags and quotes. Include a `<script
slot="popup" type="text/mustache">` element whose text contents are a Mustache
template. 


<!-- Auto Generated Below -->


## Properties

#### clusterIcons

boolean

If the layer is showing icons, use the
[markercluster](https://github.com/CityOfBoston/Leaflet.markercluster)
Leaflet plugin to show nearby icons as a single dot until you zoom in.


#### color

string

For polygon layers, the color for the borders. (The fill will be a
semi-transparent version of this color).


#### fill

boolean

Boolean attribute. If set, regions will be filled in with the color
attribute at 20% opacity. Also causes the legend to show a box rather than
a straight line for this layer.


#### hoverColor

string

If set, the color to use for polygon borders if the mouse is hovered over
them.


#### iconSrc

string

URL to use as an icon for the layer’s features, and to show in the legend
for this layer.


#### label

string

String to show on the legend for this layer.


#### popupTemplate

string

A Mustache template to use to generate the contents of a Leaflet popup for
the layer’s features. Its context will be the feature’s properties. To
specify the template in a more editor-friendly way, use the `popup` slot
and a `<script>` tag.


#### uid

string

Identifier string for the layer. Must be unique within the map.


#### url

string

URL for an ArcGIS feature layer.


## Attributes

#### cluster-icons

boolean

If the layer is showing icons, use the
[markercluster](https://github.com/CityOfBoston/Leaflet.markercluster)
Leaflet plugin to show nearby icons as a single dot until you zoom in.


#### color

string

For polygon layers, the color for the borders. (The fill will be a
semi-transparent version of this color).


#### fill

boolean

Boolean attribute. If set, regions will be filled in with the color
attribute at 20% opacity. Also causes the legend to show a box rather than
a straight line for this layer.


#### hover-color

string

If set, the color to use for polygon borders if the mouse is hovered over
them.


#### icon-src

string

URL to use as an icon for the layer’s features, and to show in the legend
for this layer.


#### label

string

String to show on the legend for this layer.


#### popup-template

string

A Mustache template to use to generate the contents of a Leaflet popup for
the layer’s features. Its context will be the feature’s properties. To
specify the template in a more editor-friendly way, use the `popup` slot
and a `<script>` tag.


#### uid

string

Identifier string for the layer. Must be unique within the map.


#### url

string

URL for an ArcGIS feature layer.


## Events

#### cobMapEsriLayerConfig

Sent on load and when the configuration changes so that the parent
<cob-map> can update the layer’s contents or appearance.



----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
