Web component for a Contact Form modal dialog.

Will be hidden by default. Call the `show()` method to show it or add a
`visible` attribute.

```
<button onClick="document.getElementById('contactForm').show()">
  Feedback
</button>
```

`<cob-contact-form>` takes the following properties:

**token**: HTTP Authorization header token. Needs to match an API token in the `contactform.boston.gov` database.

**action**: Defaults to `https://contactform.boston.gov/emails` but can be set for development testing.

**defaultSubject**: Pre-fills the subject field in the form.

**to**: Email address to send the form contents to. Defaults to **feedback@boston.gov**.
