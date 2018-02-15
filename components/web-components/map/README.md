Web component for a Leaflet map and data from Esri. Configured through a handful
of nested components.

## `<cob-map>` 

### Attributes

**title**: Title for the map. Shown on the collapse / expand header at mobile
widths.

**latitude** / **longitude**: Position to center the map on to start. Will be
updated as the map is moved by the user. Changes to this will move the map.

**zoom**: Zoom level for the map. Will be updated as the map is zoomed. Changes
to this will zoom the map.

**show-zoom-control**: Boolean attribute for whether to show zoom buttons in the
bottom right of the map.

**show-legend**: Boolean attribute for whether to put a map legend in the
overlay.

**show-address-search**: Boolean attribute for whether to put a search box for
addresses in the overlay.

**address-search-placeholder**: String to use as the placeholder in the address
search box (if visible). Defaults to “Search for an address…”

**basemap-url**: URL for an ArcGIS tiled layer basemap. Default to our custom
City of Boston basemap, layered over a generic Esri basemap.

**open-overlay**: Test attribute to make the overlay open automatically at
mobile widths. Only used so that we can take Percy screenshots of the overlay.

### Slots

**instructions**: If included, placed in the overlay above address search and
the legend.

## `<cob-map-esri-layer>`

These elements are added as children of `<cob-map>` to include layers of geo
features on the map. They take the following properties:

**url**: URL for an ArcGIS feature layer.

**title**: String to show on the legend for this layer.

**icon-src**: URL to use as an icon for the layer’s features, and to show in the
legend for this layer.

**color**: For polygon layers, the color for the borders. (The fill will be a
semi-transparent version of this color).

**hover-color**: If set, the color to use for polygon borders if the mouse is hovered over them.
