import { Filter } from './map-1.0.schema';

/**
 * Given a Filter, finds the default value it should have when the page loads.
 */
export function findDefaultFilterValue(filter: Filter): string {
  if (typeof filter.default === 'string') {
    return filter.default;
  }

  if (filter.default) {
    const now = new Date();

    // We generate an array of information about the current date, which can be
    // used to set time-based defaults.
    const dateItems = {
      day: now.getDay(),
      '24hTime':
        `${now.getHours() < 10 ? '0' : ''}${now.getHours()}` +
        `${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`,
    };

    // The filtering ANDs together all defined predicates.
    const matches = filter.default
      .filter(
        ({ date, eq }) =>
          typeof eq === 'undefined' || !!(date && dateItems[date] === eq)
      )
      .filter(
        ({ date, lt }) =>
          typeof lt === 'undefined' || !!(date && dateItems[date] < lt)
      )
      .filter(
        ({ date, lte }) =>
          typeof lte === 'undefined' || !!(date && dateItems[date] <= lte)
      )
      .filter(
        ({ date, gt }) =>
          typeof gt === 'undefined' || !!(date && dateItems[date] > gt)
      )
      .filter(
        ({ date, gte }) =>
          typeof gte === 'undefined' || !!(date && dateItems[date] >= gte)
      );

    const match = matches[0];

    if (match) {
      return match.value;
    }
  }

  // We fall through to here if none of the "default" cases match. We grab the
  // first "value" entry in the options, if there is one.
  if (filter.options) {
    const option = filter.options.find(
      opt => !opt.type || opt.type === 'value'
    );

    if (option && (!option.type || option.type === 'value')) {
      return option.value;
    }
  }

  return '';
}
