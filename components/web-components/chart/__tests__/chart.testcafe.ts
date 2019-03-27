import * as nock from 'nock';
import { componentPreviewUrl } from '../../../../lib/testcafe/helpers';
import ChartModel from './chart-model';
import { Selector } from 'testcafe';

let s3Scope: nock.Scope;

// For testing purposes, we intercept calls to S3 the charts are
// going to make for data and instead return a static csv file.
async function nockSetup() {
  s3Scope = nock('https://s3.amazonaws.com')
    .persist()
    .get('/public-budget-data/test-data/testData-BarCharts.csv')
    .query(true)
    .replyWithFile(200, __dirname + '/testData-BarCharts.csv', {
      'Content-Type': 'text/csv',
      'Access-Control-Allow-Origin': '*',
    });
}

async function nockTeardown() {
  s3Scope.persist(false);
}

// Use the default fractal chart (a bar chart) for our first fixture.
fixture('Chart')
  .page(componentPreviewUrl('chart', 'default'))
  .before(nockSetup)
  .after(nockTeardown);

const chart = new ChartModel();

test('Correct number of bars are drawn', async t => {
  const bars = chart.getBars();
  await bars;
  // Check to make sure there are 16 bars.
  await t.expect(bars.count).eql(16);
});

test('Tooltip appears on hover', async t => {
  // Select which bar we will hover over.
  const barToHover = chart.getBars(5);
  await t.hover(barToHover);

  // We check to make sure the tooltip has a class of
  // 'visible' after we hover over it. If it does, the
  // function returns true.
  const tooltip = chart.tooltipAppears();
  await t.expect(tooltip).eql(true);
});

// We use a chart with a selection on it as our second fixture.
fixture('Chart with Select')
  .page(componentPreviewUrl('chart', 'barchartselect'))
  .before(nockSetup)
  .after(nockTeardown);

const chartSelect = new ChartModel();

test('Select options are populated', async t => {
  const selectOptions = chartSelect.getSelectOptions();
  await selectOptions;

  // Check to make sure there are 16 options
  await t.expect(selectOptions.count).eql(16);
});

// Make sure the chart changes when a dropdown option is selected
test('Chart updates when an item in drop down is selected', async t => {
  // Currently, our charts only support having one select option,
  // so we find and return the one 'select' element within cob-chart.
  const selectElem = Selector('select');
  const optionElems = chart.getSelectOptions();

  await t
    .click(selectElem)
    .click(optionElems.withText('Education'))
    .expect(selectElem.value)
    .eql('Education');

  // After selecting an item from the dropdown, we get the number of
  // bars on the chart again.
  const bars = chartSelect.getBars();
  await bars;
  // Check to make sure there are now 2 bars.
  await t.expect(bars.count).eql(2);
});
