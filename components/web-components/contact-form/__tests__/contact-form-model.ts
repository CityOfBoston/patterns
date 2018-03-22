import { Selector, t, ClientFunction } from 'testcafe';
import { readyComponentSelector } from '../../../../lib/testcafe/helpers';

interface ContactFormSelector extends Selector {
  show(): Promise<any>;
  hide(): Promise<any>;
}

/* PageModel class to encapsulate Contact Form component functionality. */
export default class ContactFormModel {
  root = Selector(readyComponentSelector('cob-contact-form')).addCustomMethods({
    // TODO(finh): Type this with the Stencil components types once we can
    // provide a custom tsconfig.json to TestCafe to get it to recognize .tsx
    // files. See DevExpress/testcafe#1845
    show: (el: any) => el.show(),
    hide: (el: any) => el.hide(),
  }) as ContactFormSelector;

  modal = this.root.find('.md');
  nameField = this.root.find('#CobContactForm-name');
  emailField = this.root.find('#CobContactForm-email');
  messageField = this.root.find('#CobContactForm-message');
  submitButton = this.root.find('button[type=submit]');

  expectSubmitButtonEnabled(enabled: boolean) {
    return t
      .expect(this.submitButton.getAttribute('disabled'))
      .eql(enabled ? undefined : '');
  }

  expectContainsText(text: string) {
    return t.expect(this.root.textContent).contains(text);
  }

  expectModalVisible(visible: boolean) {
    return t.expect(this.modal.exists).eql(visible);
  }
}
