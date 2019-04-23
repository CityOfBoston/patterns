import 'core-js/es6/symbol';
import { Component, Prop, Listen, Element } from '@stencil/core';
import * as Vega from 'vega-lib';
import * as VegaLite from 'vega-lite';
import vegaTooltip from 'vega-tooltip';

@Component({
  tag: 'cob-chart',
  styleUrl: 'chart.css',
})
export class CobChart {
  @Element() el;

  @Prop({ context: 'isServer' })
  private isServer: boolean = false;

  @Prop({ mutable: true })
  config: any;
  chartDiv: any;
  chartID: string = '';
  minWidth: number = 0;
  view: any;
  dataset: any;
  compiledSpec: any;
  selectField: string = '';
  selectOptions: any[] = [];
  // True if using VegaLite, false if using Vega.
  vegaLite: boolean = true;
  // True if using a selection, false if not.
  usingSelection: boolean = false;
  // Object defining the Vega signal used for selection.
  selectSignal: any = '';
  // When using VegaLite, we setup a "selection" when we want interaction
  // on the chart. When using Vega, we define a "signal". The VegaLite selection
  // eventually gets compiled to a Vega signal, but we grab name of the
  // VegaLite selection to manipulate it a touch before compiling.
  selectName: string = '';
  // Name of the Vega signal we use for selection. Either we define this value
  // in the config (if using Vega) or a VegaLite selection gets compiled to
  // a Vega signal.
  signalName: string = '';

  // We listen for a window resize and adjust the width of the chart if it happens
  @Listen('window:resize')
  setChartWidth() {
    // We use the chart div to set the width of the svg chart element and
    // subtract 10px from it to account for padding.
    const newWidth = this.el.getBoundingClientRect().width - 10;

    // We don't want our chart's width to be less than the minWidth,
    // so if the new wrapper div width is less than that, we set it
    // manually.
    this.view.width(newWidth >= this.minWidth ? newWidth : this.minWidth).run();

    // If we're using vega and we're specifically building a pie chart then
    // we want to make sure the width of the chart doesn't exceed the height
    // to prevent the pie from getting cut off.
    if (
      this.vegaLite == false &&
      this.config.marks.filter(item => item.type == 'arc').length >= 1
    ) {
      // In this case we have a max width which is the given height of the chart
      const maxWidth = this.config.height;
      this.view.width(newWidth >= maxWidth ? maxWidth : newWidth).run();
    }

    // With facet charts, the width and height of the chart refers to the width/height
    // of each facet, not the entire chart. As a result, if we're using columns, we
    // update the "child_width" and "child_height" signals to update the size of the chart.
    if (this.vegaLite == true && this.config.encoding.column) {
      /* The "width" in facet/grouped charts refers to the width of 
        each column in the chart, so we:
        1. calculate the number of columns in the chart
        2. get the width of the y-axis
        3. calculate the appropriate width for each column
      */

      // We need the number of unique values in the field, so we map over
      // the field in the dataset and put them into a Set which de-duplicates
      // for us. We use the 'size' method to get the number of columns.
      const field = this.config.encoding.column.field;
      const numColumns = new Set(this.dataset.map(item => item[field])).size;

      // We get the width of the y-axis so we can make sure the new
      // width has enough room for it.
      const yAxisElems = this.el.getElementsByClassName(
        'mark-group role-row-header row_header'
      );
      // If there is no yAxis, we set its width to 0.
      const yAxisWidth =
        yAxisElems.length > 0 ? yAxisElems[0].getBoundingClientRect().width : 0;

      // We get the width of the chart container to understand how much
      // room we have to work with.
      const containerDivWidth = this.el.getBoundingClientRect().width;

      // We calculate what the new width would be we also calculate what
      // what the smallest calculated width should be based on the minWidth
      // provided by the schema.
      // We multiply the number of columns by 15 to account for ~15px of padding
      // between each column and add it to the amount we're subtracting to account
      // for the y-axis.
      const calcWidth =
        (containerDivWidth - (yAxisWidth + numColumns * 15)) / numColumns;
      const calcMinWidth =
        (this.minWidth - (yAxisWidth + numColumns * 15)) / numColumns;

      // If the new calculated width is larger than the calculated min width,
      // we're good to go, if it is smaller, we use the calculated min width.
      const newWidth = Math.max(calcWidth, calcMinWidth);
      this.view.signal('child_width', newWidth);

      /* To make sure we have enough room for the legend at this new window size,
      we also calculate a new chart height by:
        1. finding the height of the legend
        2. subtracting the legend height from the total height provided in the schema
        3. updating the 'child_height' signal with the new height
      */
      const legend = this.el.querySelector('div .mark-group .role-legend');
      const legendHeight = legend.getBoundingClientRect().height;
      // We get the 'offset', or distance in px of the legend from the chart from the config.
      // If there is no offset set, the default is 18 according to the Vega-Lite docs.
      const offset = this.config.encoding.color.legend.offset
        ? this.config.encoding.color.legend.offset
        : 18;
      // The height we want the columns to be is the height of the entire chart minus the
      // height of the legend and the legend's offset.
      const calcHeight = this.config.height - legendHeight - offset;
      this.view.signal('child_height', calcHeight);

      /* Finally, we update the width and height of the svg element the chart is 
      sitting in to make sure the viewbox proportions stay the same and the chart
      sits nicely on the page.
      We do this by:
        1. getting the chart svg element
        2. setting the correct height of the chart svg
        3. setting the correct width of the chart svg
        4. updating the viewbox with our new numbers
      */
      const chartSVG = this.el.querySelector('svg');

      // The new height of the entire chart is the height set in the config plus
      // 50px of padding.
      const chartSvgHeight = this.config.height + 50;

      // If we're using the min width, we also use it to set the new svg width. If we're using
      // the calculated with, we use the width of the container div and subtract
      // 40px from it. We do this to account for 20px of padding we put around
      // the chart.
      const chartSvgWidth =
        calcWidth > calcMinWidth ? containerDivWidth : this.minWidth;

      // We set the width of the svg to our new width
      chartSVG.setAttribute('width', `${chartSvgWidth}`);
      chartSVG.setAttribute('height', `${chartSvgHeight}`);
      // We update the viewbox attribute as well so the chart fits nicely into the
      // svg element.
      chartSVG.setAttribute(
        'viewBox',
        `0 0 ${chartSvgWidth} ${chartSvgHeight}`
      );

      // After everything is calculated, we re-draw the view
      this.view.run();
    }
  }

  async componentWillLoad() {
    // We grab the config and set variables we'll use later
    this.config = this.getConfig();
    this.vegaLite = this.config.$schema.includes('vega-lite');
    // minWidth is a custom variable we've added into the "boston"
    // section of the vega schema. If it is not provided, we set it to 0.
    this.minWidth = this.config.boston.minWidth || 0;
    // We want to keep the ids for each chart unique so we add a suffix
    // of random letters/numbers.
    const idSuffix = Math.random()
      .toString(36)
      .substring(2, 7);
    this.chartID = `cob-chart-${idSuffix}`;

    // We check to see if we are using selections.
    // If we're using VegaLite, this is easy - we just
    // see if the selection section of the config is not null.
    if (this.vegaLite) {
      this.usingSelection = this.config.selection ? true : false;
    } else {
      // Things get a little more complicated with Vega because
      // signals can be more broadly used. We check to see if
      // we're using signals, and in the array of signals we look
      // for one we're binding to a select element.
      this.selectSignal = (this.config.signals || []).find(
        signal => signal.bind.input === 'select'
      );
      this.usingSelection = this.selectSignal ? true : false;
    }

    // We need to manipulate the config a little bit before creating
    // the view if we are using selections.
    if (this.usingSelection) {
      // Despite the steps being the same, manipulating the config
      // differs depending on whether we're using Vega or VegaLite.
      // In either case, we:
      // 1. Get the name of the signal/selection.
      // 2. Figure what field we're using in the selection.
      // 3. Clear the select options someone may have passed on as
      // we'll build these ourselves using the data.
      if (this.vegaLite) {
        // Currently, we only support using one selection on our charts,
        // so we know the select field we need will be in the first item
        // in the config's array of selections.
        this.selectName = Object.keys(this.config.selection)[0];
        this.selectField = this.config.selection[this.selectName].fields[0];
        this.signalName = `${this.selectName}_${this.selectField}`;
        this.config.selection[this.selectName].bind.options = [];
      } else {
        // Vega doesn't accept the name of a field as a parameter to the spec -
        // instead we define that in the "expr" (expression) parameter accompanying
        // the "filter" transform. So that we can populate the select options,
        // we add it to the spec ourselves and more easily grab it here.
        this.signalName = this.selectSignal.name;
        this.selectField = this.config.boston.selectField;
        this.selectSignal.bind.options = [];
      }
    }
    // After updating the config if necessary, we compile if to Vega if we're
    // using VegaLite and leave it as is if we're using Vega.
    this.compiledSpec = this.vegaLite
      ? VegaLite.compile(this.config).spec
      : this.config;

    // By default VegaLite adds an event listener to our selection that
    // fires when the chart is clicked after the spec is compiled. The click
    // sets the selection back to null, so the user's selection gets undone.

    // To get around this, we remove the event listener configuration
    // from the compiled Vega spec.
    this.selectSignal = (this.compiledSpec.signals || []).find(
      elem => elem.name === `${this.selectName}_${this.selectField}`
    );
    if (this.selectSignal) {
      delete this.selectSignal.on;
    }
  }

  componentDidLoad() {
    // We check to make sure we're not running componentDidLoad() on a server.
    if (this.isServer) {
      return;
    }

    // After updating the config and compiling if necessary, we initialize a
    // Vega view object.
    this.view = new Vega.View(Vega.parse(this.compiledSpec)).renderer('svg');

    // Once the component loads, we initialize the view.
    this.view.initialize(`#${this.chartID}`);

    // Attach tooltips to the chart.
    vegaTooltip(this.view);

    // We grab the div the chart is sitting it and hold onto it as
    // we'll use it in multiple places.
    this.chartDiv = document.getElementById(this.chartID)!;

    // If we're building a grouped bar chart, we need the dataset so
    // we know the number of columns when calculating the width of the chart.
    // If we're using a selection, we don't need to worry about this because
    // we'll grab the dataset for building the selection.
    if (!this.usingSelection && this.config.encoding.column) {
      this.view.runAsync().then(() => {
        this.dataset = this.view.data(this.config.data.name);
        this.setChartWidth();
      });
    } else if (this.usingSelection) {
      // If we are using selections, we build the dropdown.
      this.buildDropDownSelection();

      // We set the view the run, but wait to populate specific pieces
      // until after the data has loaded.
      this.view.runAsync().then(() => {
        // We grab the dataset we're charting. We do this here because
        // it allows us to use Vega transforms then use the transformed data
        // to populate our selections. It also means we don't have to
        // fetch our data twice - Vega does it once and we leverage it.
        this.dataset = this.vegaLite
          ? this.view.data(this.config.data.name)
          : // We grab the first dataset in the Vega array. This means we
            // currently only support using one dataset per chart when
            // using Vega.
            this.view.data(this.config.data[0].name);

        // We make a Set out of the field we're using for selections
        // to get an un-duplicated listed for dropdown options.
        const optionsSet = new Set(
          this.dataset.map(item => item[this.selectField])
        );
        // We use forEach and push as opposed to Array.from or the spread operator
        // because both are supported in IE 11 without polyfills.
        optionsSet.forEach(option => {
          this.selectOptions.push(option);
        });

        // We populate the options in the select element using the list.
        const selectElem = this.chartDiv.querySelector('select')!;
        this.selectOptions.map(elem => {
          const option = document.createElement('option');
          option.text = elem;
          option.value = elem;
          selectElem.add(option);
        });

        // Everytime the selection changes, we want to make sure the the
        // chart still fits nicely on the page and that the chart updates.
        // We add an event listener to the select box that re-renders the
        // chart with the new selection and updates the size.
        selectElem.addEventListener('change', (e: any) => {
          this.view.signal(this.signalName, e.target.value).run();
          this.setChartWidth();
        });

        // Lastly, we update the chart on this first run with the currently
        // selected value and set the chart width accordingly.
        selectElem.value =
          this.config.boston.defaultSelection || this.selectOptions[0];
        const selected = selectElem.selectedIndex;
        this.view.signal(this.signalName, this.selectOptions[selected]).run();
        this.setChartWidth();
      });
    } else {
      // If none of the above situations are true, we simply set the chart
      // width so that it fits nicely on the page.
      this.setChartWidth();
    }
    // On load, Vega creates the chart svg and a div for any associated selections.
    // We want to wrap just the chart svg it creates inside of a div so we can control
    // horizontal scrolling for only the chart and not any elements around or below.
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'cob-chart-wrapper';
    // Get the chart svg element and its parent node
    const chartSVG = this.el.querySelector('svg');
    const svgParent = chartSVG.parentNode;
    // Update the children of the parent node
    svgParent.replaceChild(chartWrapper, chartSVG);
    chartWrapper.appendChild(chartSVG);
  }

  componentDidUnload() {
    // Once the component comes off the page, we clean up the view.
    if (this.view) {
      this.view.finalize();
    }
  }

  // We custom build the dropdown selection to adhere to our styles and branding by
  // maniupulating the div Vega creates for selections.
  // This currently supports only one selection that is a dropdown/select element.
  buildDropDownSelection() {
    // We create a div for the blue drop down arrow and assign it the
    // proper classes from Fleet.
    const selectArrow = document.createElement('div');
    selectArrow.className = 'sel-c sel-c--thin';

    // We grab the parent element we'll append the arrow to and add it.
    const selectParent = this.chartDiv.querySelector('.vega-bind')!;
    selectParent.appendChild(selectArrow);
    // Move the select element up above the chart.
    this.chartDiv.insertBefore(selectParent, this.chartDiv.firstChild);

    // Grab the select element and append it to the arrow div.
    const selectElem = this.chartDiv.querySelector('select')!;
    selectElem.className = 'sel-f sel-f--thin';
    selectArrow.appendChild(selectElem);

    // Update the classes for the select label
    const selectLabel = this.chartDiv.querySelector('.vega-bind-name')!;
    selectLabel.className = 'sel-l sel-l--thin';
  }

  /**
   * Takes JSON out of either a "config" prop or a <script> child. We support
   * the former for integration with other components, and the latter for easier
   * HTML building.
   */
  getConfig(): any | null {
    // Get JSON from web component config slot
    // The JSON config schema comes from Vega/VegaLite (https://vega.github.io/vega/)
    const configScript = this.el.querySelector('script[slot="config"]');

    try {
      if (this.config) {
        return JSON.parse(this.config);
      } else if (configScript) {
        return JSON.parse(configScript.innerHTML);
      } else {
        return null;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Could not parse config JSON', e);
      throw e;
    }
  }

  render() {
    return <div class="cob-chart" id={this.chartID} />;
  }
}
