/**
 * This is an autogenerated file created by the Stencil build process.
 * It contains typing information for all components that exist in this project
 * and imports for stencil collections that might be configured in your stencil.config.js file
 */


declare global {
  interface HTMLStencilElement extends HTMLElement {
    componentOnReady(): Promise<this>;
    componentOnReady(done: (ele?: this) => void): void;
  }
}



import {
  ContactForm as CobContactForm
} from './contact-form/contact-form';

declare global {
  interface HTMLCobContactFormElement extends CobContactForm, HTMLStencilElement {
  }
  var HTMLCobContactFormElement: {
    prototype: HTMLCobContactFormElement;
    new (): HTMLCobContactFormElement;
  };
  interface HTMLElementTagNameMap {
    "cob-contact-form": HTMLCobContactFormElement;
  }
  interface ElementTagNameMap {
    "cob-contact-form": HTMLCobContactFormElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "cob-contact-form": JSXElements.CobContactFormAttributes;
    }
  }
  namespace JSXElements {
    export interface CobContactFormAttributes extends HTMLAttributes {
      action?: string;
      defaultSubject?: string;
      to?: string;
      token?: string;
      visible?: boolean;
    }
  }
}


import {
  CobMapEsriLayer as CobMapEsriLayer
} from './map-esri-layer/map-esri-layer';

declare global {
  interface HTMLCobMapEsriLayerElement extends CobMapEsriLayer, HTMLStencilElement {
  }
  var HTMLCobMapEsriLayerElement: {
    prototype: HTMLCobMapEsriLayerElement;
    new (): HTMLCobMapEsriLayerElement;
  };
  interface HTMLElementTagNameMap {
    "cob-map-esri-layer": HTMLCobMapEsriLayerElement;
  }
  interface ElementTagNameMap {
    "cob-map-esri-layer": HTMLCobMapEsriLayerElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "cob-map-esri-layer": JSXElements.CobMapEsriLayerAttributes;
    }
  }
  namespace JSXElements {
    export interface CobMapEsriLayerAttributes extends HTMLAttributes {
      color?: string;
      fill?: boolean;
      hoverColor?: string;
      iconSrc?: string;
      label?: string;
      popupTemplate?: string;
      url?: string;
    }
  }
}


import {
  CobMap as CobMap
} from './map/map';

declare global {
  interface HTMLCobMapElement extends CobMap, HTMLStencilElement {
  }
  var HTMLCobMapElement: {
    prototype: HTMLCobMapElement;
    new (): HTMLCobMapElement;
  };
  interface HTMLElementTagNameMap {
    "cob-map": HTMLCobMapElement;
  }
  interface ElementTagNameMap {
    "cob-map": HTMLCobMapElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "cob-map": JSXElements.CobMapAttributes;
    }
  }
  namespace JSXElements {
    export interface CobMapAttributes extends HTMLAttributes {
      addressSearchHeading?: string;
      addressSearchPlaceholder?: string;
      basemapUrl?: string;
      heading?: string;
      latitude?: number;
      longitude?: number;
      openOverlay?: boolean;
      showAddressSearch?: boolean;
      showLegend?: boolean;
      showZoomControl?: boolean;
      zoom?: number;
    }
  }
}

declare global { namespace JSX { interface StencilJSX {} } }
