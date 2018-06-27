# cob-map

Web component for a Leaflet map and data from Esri. It accepts the configuration
block as an attribute or embedded `<script>` and generates a Leaflet map.

This component typechecks against the [JSON-Schema
files](https://cityofboston.github.io/vizwiz/#/jsonschema) from the vizwiz
repository. To update the types, run `npx gulp schema:vizwiz`. You may also have
to add to the list of URLs in the Gulpfile.

## Slots

#### config

Alternate way to define the JSON configuration from the `config` attribute that
avoids the need to HTML escape and put in the “config” attribute. Include a
`<script slot="config" type="application/json">` element whose text contents are
the JSON configuration. 

<!-- Auto Generated Below -->


## Properties

#### config

string

A JSON string or equivalent object that defines the map and layers. The
schema for this config comes from VizWiz, so it won’t be documented here.

Any attributes prefixed with `map-` will be passed on to the generated
`<cob-map>` component. _E.g._ `map-id` or `map-style`.


#### openOverlay

boolean

Test attribute to make the overlay open automatically at mobile widths.
Only used so that we can take Percy screenshots of the overlay.


## Attributes

#### config

string

A JSON string or equivalent object that defines the map and layers. The
schema for this config comes from VizWiz, so it won’t be documented here.

Any attributes prefixed with `map-` will be passed on to the generated
`<cob-map>` component. _E.g._ `map-id` or `map-style`.


#### open-overlay

boolean

Test attribute to make the overlay open automatically at mobile widths.
Only used so that we can take Percy screenshots of the overlay.



----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
