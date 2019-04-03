/* global fixture */
import { Selector, RequestMock } from 'testcafe';
import {
  componentPreviewUrl,
  CORS_ALLOW_HEADERS,
} from '../../../../lib/testcafe/helpers';
import ContactFormModel from './contact-form-model';

const contactForm = new ContactFormModel();

const submitMock = RequestMock()
  .onRequestTo('https://contactform.boston.gov/emails')
  .respond('ok', 200, CORS_ALLOW_HEADERS);

fixture('Contact Form')
  .page(componentPreviewUrl('contact_form'))
  .requestHooks(submitMock);

test('Submitting form with content', async t => {
  await contactForm.expectSubmitButtonEnabled(false);

  await t
    .typeText(contactForm.nameField, 'Jayn Doe')
    .typeText(contactForm.emailField, 'jayn@fake.com')
    .typeText(contactForm.messageField, 'This form works great!');
  await contactForm.expectSubmitButtonEnabled(true);

  await t.click(contactForm.submitButton);
  await contactForm.expectContainsText('Thank you for contacting us.');
});

test('Email address is checked for validity', async t => {
  await contactForm.expectSubmitButtonEnabled(false);

  await t
    .typeText(contactForm.nameField, 'Jayn Doe')
    .typeText(contactForm.emailField, 'jayn@')
    .typeText(contactForm.messageField, 'This form works great!');
  await contactForm.expectContainsText('Please enter a valid email address');
  await contactForm.expectSubmitButtonEnabled(false);
});

test('show() / hide() methods', async t => {
  await t.expect(contactForm.modal.exists).ok();

  await contactForm.root.hide();
  await t.expect(contactForm.modal.exists).notOk();

  await contactForm.root.show();
  await t.expect(contactForm.modal.exists).ok();
});
