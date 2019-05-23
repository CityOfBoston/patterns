# cob-map

Web component for a Leaflet map and data from Esri. The map is rendered
full-screen as a modal, with a close box that hides it (since embedded maps that
trap mouse wheel scrolls and stuff are a painful UX).

The map is by default hidden. You can show it with the `show()` method, but a
better way is to make an `<a>` tag that links the user to the `#<id>` fragment.
If a `<cob-map>` is on the page and configured with that `id` attribute, it will
appear. This use of fragments means that after the modal appears full-screen, if
the user clicks the back button it will just close the map.

Configure it with either a the `config` attribute or a child `<script
slot="config" type="application/json">`. The config format is defined by a
JSON-Schema file. See the
[documentation](/vendor/docson/#/web-components/map-1.0.schema.json) generated
from that file. (Note: the map does not update if the config is changed
dynamically.)

This component typechecks by converting the JSON-Schema to TypeScript. To update
the type definitions, run `npx gulp schema:map`.

## Slots

#### config

Alternate way to define the JSON configuration from the `config` attribute that
avoids the need to HTML escape and put in the “config” attribute. Include a
`<script slot="config" type="application/json">` element whose text contents are
the JSON configuration. 

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                                                                             | Type      | Default |
| -------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `config`       | `config`        | A JSON string or equivalent object that defines the map and layers.                                                                     | `string`  | `''`    |
| `id`           | `id`            | ID of the HTML element. Used to automatically open the map modal.                                                                       | `string`  | `''`    |
| `modalVisible` | `modal-visible` | Change to true to make the modal appear.                                                                                                | `boolean` | `false` |
| `openOverlay`  | `open-overlay`  | Test attribute to make the overlay open automatically at mobile widths. Only used so that we can take Percy screenshots of the overlay. | `boolean` | `false` |


## Methods

### `hide() => void`

Hides the map’s modal

#### Returns

Type: `void`



### `show() => void`

Shows the map in a full-window modal dialog. A better way to make the modal
appear on a web page is to link to #<id>, which will cause the map to
appear and leave a record in the browser history so that the back button
will close the map (rather than take the user to the page before).

#### Returns

Type: `void`



### `toggle() => void`

Toggles whether or not the map is visible.

#### Returns

Type: `void`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
