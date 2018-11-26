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

  @Prop({ mutable: true })
  config: any;
  chartID: string = '';
  minWidth: number = 0;
  view: any;
  dataset: any;
  selectField: string = '';
  selectOptions: any;
  vegaLite: boolean = true;
  chartDiv: any;

  // We listen for a window resize and adjust the width of the chart if it happens
  @Listen('window:resize')
  setChartWidth() {
    // We use the chart div to set the width of the svg chart element and
    // subtract 50px from it to account for padding.
    const newWidth = this.el.getBoundingClientRect().width - 50;

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
    if (
      this.vegaLite == true &&
      typeof this.config.encoding.column !== 'undefined'
    ) {
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
      const containerDivWidth = this.el.getBoundingClientRect().width - 40;

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
      const calcHeight = this.config.height - legendHeight;
      this.view.signal('child_height', calcHeight);

      /* Finally, we update the width and height of the svg element the chart is 
      sitting in to make sure the viewbox proportions stay the same and the chart
      sits nicely on the page.
      We do this by:
        1. getting the chart svg element
        2. grabbing its height
        3. setting the correct width of the chart svg
        4. updating the viewbox with our new numbers
      */
      const chartSVG = this.el.querySelector('svg');

      const chartSvgHeight = chartSVG.getBoundingClientRect().height;
      // If we're using the min width, we also use it to set the new svg width. If we're using
      // the calculated with, we use the width of the container div and subtract
      // 40px from it. We do this to account for 20px of padding we put around
      // the chart.
      const chartSvgWidth =
        calcWidth > calcMinWidth ? containerDivWidth : this.minWidth;

      // We set the width of the svg to our new width
      chartSVG.setAttribute('width', `${chartSvgWidth}`);
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
    let compiledSpec;

    // We check to see if the chart uses interactive selections.  If yes,
    // we manipulate the config before compiling.
    if (typeof this.config.selection === 'undefined') {
      // Currently, we don't support selections on charts we build with
      // Vega (pie charts), and we only compile the spec if we're using VegaLite.
      compiledSpec = this.vegaLite
        ? VegaLite.compile(this.config).spec
        : this.config;
    } else {
      // If we are using a selection, we hold onto the field we're
      // using for it so we can populate the select options later.
      this.selectField = this.config.selection.select.fields[0];

      // We clear the location in the config where someone could pass
      // select options as we'll build them ourselves using the data.
      this.config.selection.select.bind.options = [];

      // After updating the config, we compile it to Vega and parse it
      compiledSpec = VegaLite.compile(this.config).spec;

      /* By default Vega adds an event listener to our selection that
          fires when the chart is clicked. The click sets the selection
          back to null, so the user's selection gets undone.

          To get around this, we remove the event listener configuration
          from the compiled Vega spec.
        */
      const selectSignal = compiledSpec.signals.find(
        elem => elem.name === `select_${this.selectField}`
      );
      delete selectSignal.on;
    }
    // After updating the config and compiling if necessary, we initialize a
    // Vega view object.
    this.view = new Vega.View(Vega.parse(compiledSpec)).renderer('svg');
  }

  componentDidLoad() {
    // Once the component loads, we initialize the view.
    this.view.initialize(`#${this.chartID}`);

    // Attach tooltips to the chart.
    vegaTooltip(this.view);

    // We grab the div the chart is sitting it and hold onto it as
    // we'll use it in multiple places.
    this.chartDiv = document.getElementById(this.chartID)!;

    if (this.config.selection) {
      // If we are using selections, we build the dropdown.
      this.buildDropDownSelection();

      // We set the view the run, but wait to populate specific pieces
      // until after the data has loaded.
      this.view.runAsync().then(() => {
        // We grab the dataset we're charting. We do this here because
        // it allows us to use Vega transforms then use the transformed data
        // to populate our selections. It also means we don't have to
        // fetch our data twice - Vega does it once and we leverage it.
        this.dataset = this.view.data(this.config.data.name);
        // We use the dataset to get our list of dropdown options.
        this.selectOptions = Array.from(
          new Set(this.dataset.map(item => item[this.selectField]))
        ).sort();
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
        const selectionName = Object.keys(this.config.selection)[0];
        const signalName = `${selectionName}_${this.selectField}`;
        // We add an event listener to the select box that re-renders the
        // chart with the new selection and updates the size.
        selectElem.addEventListener('change', (e: any) => {
          this.view.signal(signalName, e.target.value).run();
          this.setChartWidth();
        });

        // Lastly, we update the chart on this first run with the currently
        // selected value and set the chart width accordingly.
        const selected = selectElem.selectedIndex;
        this.view.signal(signalName, this.selectOptions[selected]).run();
        this.setChartWidth();
      });
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
    // Lastly, we set the chart width on load so we can
    // make sure it fits nicely into the page.
    this.setChartWidth();
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

    // Set the default selection if given
    selectElem.value =
      this.config.boston.defaultSelection || this.selectOptions[0];

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
