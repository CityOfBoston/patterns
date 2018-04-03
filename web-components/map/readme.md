# cob-map

Web component for a Leaflet map and data from Esri. Configured through a handful
of nested components.

## Slots

#### instructions

If included, placed in the overlay above address search and the legend.

<!-- Auto Generated Below -->


## Properties

#### addressSearchHeading

string

Header to show above the address search box. Defaults to “Address search”


#### addressSearchPlaceholder

string

String to use as the placeholder in the address search box (if visible).
Defaults to “Search for an address…”


#### addressSearchPopupLayerUid



If provided, clicking on the search result markers from an address search
will open this layer’s popup. If there’s only one search result, the popup
will be opened automatically.


#### basemapUrl

string

URL for an ArcGIS tiled layer basemap. Default to our custom City of Boston
basemap, layered over a generic Esri basemap.


#### heading

string

Title for the map. Shown on the collapse / expand header at mobile widths.


#### latitude

number

Position to center the map on to start. Will be updated as the map is moved
by the user. Changes to this will move the map.


#### longitude

number

Position to center the map on to start. Will be updated as the map is moved
by the user. Changes to this will move the map.


#### openOverlay

boolean

Test attribute to make the overlay open automatically at mobile widths.
Only used so that we can take Percy screenshots of the overlay.


#### showAddressSearch

boolean

Boolean attribute for whether to put a search box for addresses in the
overlay.


#### showLegend

boolean

Boolean attribute for whether to put a map legend in the overlay.


#### showZoomControl

boolean

Boolean attribute for whether to show zoom buttons in the bottom right of
the map.


#### zoom

number

Zoom level for the map. Will be updated as the map is zoomed. Changes to
this will zoom the map.


## Attributes

#### address-search-heading

string

Header to show above the address search box. Defaults to “Address search”


#### address-search-placeholder

string

String to use as the placeholder in the address search box (if visible).
Defaults to “Search for an address…”


#### address-search-popup-layer-uid



If provided, clicking on the search result markers from an address search
will open this layer’s popup. If there’s only one search result, the popup
will be opened automatically.


#### basemap-url

string

URL for an ArcGIS tiled layer basemap. Default to our custom City of Boston
basemap, layered over a generic Esri basemap.


#### heading

string

Title for the map. Shown on the collapse / expand header at mobile widths.


#### latitude

number

Position to center the map on to start. Will be updated as the map is moved
by the user. Changes to this will move the map.


#### longitude

number

Position to center the map on to start. Will be updated as the map is moved
by the user. Changes to this will move the map.


#### open-overlay

boolean

Test attribute to make the overlay open automatically at mobile widths.
Only used so that we can take Percy screenshots of the overlay.


#### show-address-search

boolean

Boolean attribute for whether to put a search box for addresses in the
overlay.


#### show-legend

boolean

Boolean attribute for whether to put a map legend in the overlay.


#### show-zoom-control

boolean

Boolean attribute for whether to show zoom buttons in the bottom right of
the map.


#### zoom

number

Zoom level for the map. Will be updated as the map is zoomed. Changes to
this will zoom the map.



----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
