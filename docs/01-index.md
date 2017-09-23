---
title: Overview
---

<div class="intro">This is the pattern library for the City of Boston. It's currently a work in progress, but we're adding to it every day. Currently, it powers much of Boston.gov and all of Boston's 311 web portal.</div>

## Getting Started

To get started with Crispus, you'll need to add the styles. This can be done with:

```
<!--[if !IE]><!-->
<link rel="stylesheet" type="text/css" href="https://patterns.boston.gov/crispus/css/public.css" />
<!--<![endif]-->
<!--[if lt IE 10]>
  <link media="all" rel="stylesheet" href="https://patterns.boston.gov/crispus/css/ie.css">
<![endif]-->
```

This will give you all of the fonts that you need as well as all Crispus stylings.

### Scripts

While we strive for no required javascript, there are a few places where it is necessary. Some components like the nav and video use inline scripts. If integrating those, make sure to include those scripts (for now).

Other components can have their scripts included with:

```
<script src="https://patterns.boston.gov/crispus/scripts/all.js"></script>
```

### Application Wrapper

Boston.gov also provides a prebuilt header / footer layout for use with your applications. This can be used from:

```
https://www.boston.gov/api/v1/layouts/app
```

This template needs to be used in a dynamic manner. For example, during an application's build process, the layout could be downloaded and applied to the application. An exmaple of this can be reviewed on [Boston's 311 website code](https://github.com/CityOfBoston/311/blob/526a034b980113d374ff3e7a47fe2bb6e8cfccba/scripts/fetch-templates.js).

The benefit of adding this into an application is that it will more seamlessly fit within the Boston.gov ecosystem and automatically includes Crispus.
