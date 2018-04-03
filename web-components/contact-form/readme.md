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

#### action

string

Defaults to `https://contactform.boston.gov/emails` but can be set for
development testing.


#### defaultSubject

string

Pre-fills the subject field in the form.


#### to

string

Email address to send the form contents to. Defaults to
**feedback@boston.gov**.


#### token

string

HTTP Authorization header token. Needs to match an API token in the
`contactform.boston.gov` database.


#### visible

boolean

Whether or not the modal is shown. Defaults to hidden.


## Attributes

#### action

string

Defaults to `https://contactform.boston.gov/emails` but can be set for
development testing.


#### default-subject

string

Pre-fills the subject field in the form.


#### to

string

Email address to send the form contents to. Defaults to
**feedback@boston.gov**.


#### token

string

HTTP Authorization header token. Needs to match an API token in the
`contactform.boston.gov` database.


#### visible

boolean

Whether or not the modal is shown. Defaults to hidden.


## Methods

#### hide()

Hide the modal.


#### show()

Show the modal.



----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
