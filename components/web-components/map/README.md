Web component for a Leaflet map and data from Esri. Configured through a handful
of nested components.

## `<cob-map>` 

**latitude** / **longitude**: Position to center the map on to start. Will be
updated as the map is moved by the user. Changes to this will move the map.

**zoom**: Zoom level for the map. Will be updated as the map is zoomed. Changes
to this will zoom the map.

**showZoomControl**: Boolean attribute for whether to show zoom buttons in the
bottom right of the map.

**basemapUrl**: URL for an ArcGIS tiled layer basemap. Default to our custom
City of Boston basemap, layered over a generic Esri basemap.


## `<cob-map-esri-layer>`

These elements are added as children of `<cob-map>` to include layers of geo
features on the map. They take the following properties:

**url**: URL for an ArcGIS feature layer.

**title**: String to show on the legend for this layer.

**color**: For polygon layers, the color for the borders. (The fill will be a semi-transparent version of this color).

**hoverColor**: If set, the color to use for polygon borders if the mouse is hovered over them.

## `<cob-map-legend>`

Optionally added as a child of `<cob-map>` to include a legend of the layers
that appear on the map.

Its children are used as the main contents of the legend box, and the map legend
is appended below.

It takes the properties:

**collapsedTitle**: At lower breakpoints, the legend collapses into a togglable
header, and this title is used for it.

**open**: Defaults the legend to expanded at narrower breakpoints. Really only
useful for visual testing.