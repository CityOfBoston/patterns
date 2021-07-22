import { Filter } from './map-1.0.schema';

/**
 * Given a Filter, finds the default value it should have when the page loads.
 *
 * This can be one of three possibilities based on how the Filter was
 * configured.
 *
 *  * A specifically-set default string value
 *  * A value that matches the current date / time against predicates
 *  * The first concrete (i.e. non-dynamic) option in the set
 *
 * Take a look at map-util.spec.ts for examples of what Filter objects tend to
 * look like.
 */
export function findDefaultFilterValue(filter: Filter): string {
  // A string value for "default" is just the default.
  if (typeof filter.default === 'string') {
    return filter.default;
  }

  // Otherwise the "default" property is an array of potential default values
  // paired with the date comparison against either the day of the week or 24
  // hour time. We return the first value that matches.
  if (filter.default) {
    const now = new Date();

    // TODO: (PhillipK) Rework test/method to use/convert to UTC,
    // these test currently fail on different timezones

    // We generate an array of information about the current date, which can be
    // used to set time-based defaults.
    const dateItems = {
      day: now.getDay(),
      '24hTime':
        `${now.getHours() < 10 ? '0' : ''}${now.getHours()}` +
        `${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`,
    };

    // The filtering ANDs together all defined predicates. E.g.: {value:
    // 'Breakfast', date: '24hTime', gte: '0600', lt: '1030'} will be kept if
    // the time is greater than 6:00 but less than 10:30.
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

    if (matches.length) {
      return matches[0].value;
    }
  }

  // We fall through to here if a specific default wasn’t given. We grab the
  // first "value" entry in the options, if there is one.
  if (filter.options) {
    // Skip over any "separator" or "dynamic" options to find the first one
    // that’s a concrete value.
    for (let i = 0; i < filter.options.length; ++i) {
      const opt = filter.options[i];

      // Not specifying a type defaults to value
      if (!opt.type || opt.type === 'value') {
        return opt.value;
      }
    }
  }

  return '';
}
