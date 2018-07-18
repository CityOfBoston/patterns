import * as MockDate from 'mockdate';

import { Filter } from './map-1.0.schema';
import { findDefaultFilterValue } from './map';

const DEFAULT_FILTER: Filter = {
  dataSourceUid: '1',
  title: 'Filter',
  type: 'select',
  queryTemplate: '1=1',
};

describe('findDefaultFilterValue', () => {
  beforeEach(() => {
    MockDate.set('2018-07-17T16:02:33+00:00', 240);
  });

  afterEach(() => {
    MockDate.reset(0);
  });

  it('defaults to the first option', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { title: 'First', value: '1' },
          { title: 'Second', value: '2' },
        ],
      })
    ).toEqual('1');
  });

  it('ignores the separator', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { type: 'separator' },
          { title: 'First', value: '1' },
          { title: 'Second', value: '2' },
        ],
      })
    ).toEqual('1');
  });

  it('can use a non-logic default', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { title: 'First', value: '1' },
          { title: 'Second', value: '2' },
        ],
        default: [{ value: '2' }],
      })
    ).toEqual('2');
  });

  it('can use the day of the week', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { title: 'Monday', value: 'Monday' },
          { title: 'Tuesday', value: 'Tuesday' },
        ],
        default: [
          { date: 'day', eq: 0, value: 'Sunday' },
          { date: 'day', eq: 1, value: 'Monday' },
          { date: 'day', eq: 2, value: 'Tuesday' },
        ],
      })
    ).toEqual('Tuesday');
  });

  it('can use the time', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { title: 'Breakfast', value: 'Breakfast' },
          { title: 'Lunch', value: 'Lunch' },
          { title: 'Dinner', value: 'Dinner' },
        ],
        default: [
          { date: '24hTime', gte: '0700', lt: '1030', value: 'Breakfast' },
          { date: '24hTime', gte: '1030', lt: '1500', value: 'Lunch' },
          { date: '24hTime', gte: '1500', lt: '2000', value: 'Dinner' },
        ],
      })
    ).toEqual('Lunch');
  });

  it('falls back to the first if no logic matches', () => {
    expect(
      findDefaultFilterValue({
        ...DEFAULT_FILTER,
        options: [
          { title: 'Any', value: 'Any', query: '1=1' },
          { type: 'separator' },
          { title: 'Breakfast', value: 'Breakfast' },
          { title: 'Lunch', value: 'Lunch' },
          { title: 'Dinner', value: 'Dinner' },
        ],
        default: [
          { date: '24hTime', gte: '0700', lt: '1030', value: 'Breakfast' },
          { date: '24hTime', gte: '1500', lt: '2000', value: 'Dinner' },
        ],
      })
    ).toEqual('Any');
  });
});
