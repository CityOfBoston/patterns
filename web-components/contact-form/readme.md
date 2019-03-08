# cob-contact-form

Web component for a Contact Form modal dialog. POSTs an email to our
[contact form service](https://github.com/CityOfBoston/cob-contact) to
be sent to an internal feedback address.

Include this component just before the `</body>` closing tag on your page so
that it can cover the entire page when shown.

Will be hidden by default. Call the `show()` method to show it or add a
`visible` attribute.

```
<button onClick="document.getElementById('contactForm').show()">
  Feedback
</button>
```

<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                            | Type      | Default                                   |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------- |
| `action`         | `action`          | Defaults to `https://contactform.boston.gov/emails` but can be set for development testing.            | `string`  | `'https://contactform.boston.gov/emails'` |
| `defaultSubject` | `default-subject` | Pre-fills the subject field in the form.                                                               | `string`  | `''`                                      |
| `to`             | `to`              | Email address to send the form contents to. Defaults to **feedback@boston.gov**.                       | `string`  | `'feedback@boston.gov'`                   |
| `token`          | `token`           | HTTP Authorization header token. Needs to match an API token in the `contactform.boston.gov` database. | `string`  | `''`                                      |
| `visible`        | `visible`         | Whether or not the modal is shown. Defaults to hidden.                                                 | `boolean` | `false`                                   |


## Methods

### `hide() => void`

Hide the modal.

#### Returns

Type: `void`



### `show() => void`

Show the modal.

#### Returns

Type: `void`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
