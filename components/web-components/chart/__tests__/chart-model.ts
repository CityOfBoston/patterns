import { Selector } from 'testcafe';
import { readyComponentSelector } from '../../../../lib/testcafe/helpers';

export default class ChartModel {
  root = Selector(readyComponentSelector('cob-chart'));

  getBars(index: number = null) {
    // Returns all the reactangle mark elements (bars) if there is no
    // input, or the nth element if there is an input.
    return index == null
      ? this.root.find('g.mark-rect.role-mark').child()
      : this.root.find('g.mark-rect.role-mark').child(index);
  }

  tooltipAppears() {
    // The div for the tooltips is created outside of the cob-chart
    // element, so we create a new selector for it.
    const tooltip = Selector('#vg-tooltip-element');
    return tooltip.hasClass('visible');
  }

  getSelectOptions() {
    // Currently, our charts only support having one select option,
    // so we find and return all 'option' elements within cob-chart.
    return this.root.find('option');
  }
}
