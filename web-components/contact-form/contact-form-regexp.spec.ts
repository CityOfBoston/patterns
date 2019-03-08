import { EMAIL_REGEXP } from './contact-form-regexp';

describe('email regexp', () => {
  it('matches a boston.gov address', () => {
    expect(EMAIL_REGEXP.exec('registry@boston.gov')).toBeTruthy();
  });

  it('matches a complicated Gmail address', () => {
    expect(EMAIL_REGEXP.exec('not.real.address+fake@gmail.com')).toBeTruthy();
  });

  it('matches multiple subdomains', () => {
    expect(EMAIL_REGEXP.exec('address@not-real.co.uk')).toBeTruthy();
  });

  it('doesn’t match just a TLD', () => {
    expect(EMAIL_REGEXP.exec('email@site')).toBeFalsy();
  });
});
