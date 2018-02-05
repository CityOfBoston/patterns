import { Component, Element, Method, Prop, State } from "@stencil/core";

@Component({
  tag: "cob-contact-form"
})
export class ContactForm {
  @Element() el: any;

  @Prop({ context: 'isServer' }) private isServer: boolean;

  @Prop() visible: boolean = false;
  @Prop() defaultSubject: string = "";
  @Prop() action: string = "https://contactform.boston.gov/emails";
  @Prop() token: string = "";
  @Prop() to: string = "feedback@boston.gov";

  @State() name: string = "";
  @State() email: string = "";
  @State() subject: string = "";
  @State() message: string = "";

  @State() loading: boolean = false;
  @State() success: boolean = false;
  @State() errorMessage: string | null = null;

  componentWillLoad() {
    this.subject = this.defaultSubject;
  }

  @Method()
  show() {
    this.el.visible = true;
  }

  @Method()
  hide() {
    this.el.visible = false;
  }

  handleNameInput(ev) {
    this.name = ev.target.value;
  }

  handleEmailInput(ev) {
    this.email = ev.target.value;
  }

  handleSubjectInput(ev) {
    this.subject = ev.target.value;
  }

  handleMessageInput(ev) {
    this.message = ev.target.value;
  }

  async submit(ev) {
    ev.preventDefault();

    const formEl = this.el.querySelector("form");

    if (!formEl) {
      return;
    }

    const { action, token } = this;
    const form = new FormData(formEl);

    this.loading = true;

    try {
      const resp = await fetch(action, {
        method: "POST",
        headers: new Headers({
          Authorization: `Token ${token}`
        }),
        body: form
      });
      if (resp.status === 200) {
        this.success = true;
      } else {
        if (resp.headers.get("content-type") === "application/json") {
          const json = await resp.json();
          console.log(json)
        } else {
          this.errorMessage = await resp.text();
        }
      }
    } catch (err) {
      this.errorMessage = err.toString();
    } finally {
      this.loading = false;
    }
  }

  render() {
    const { visible, success } = this;

    if (!visible) {
      return null;
    }

    return (
      <div class="md">
        <div class="md-c">
          <button
            class="md-cb"
            type="button"
            style={{ border: "none" }}
            onClick={() => this.hide()}
          >
            Close
          </button>

          <div class="mb-b p-a300 p-a600--xl">
            <div class="sh m-b500">
              <div class="sh-title">Contact Us</div>
            </div>

            {success ? this.renderSuccess() : this.renderForm()}
          </div>
        </div>
      </div>
    );
  }

  renderForm() {
    const { errorMessage, loading, name, subject, email, message, to } = this;

    const missing = !(name && subject && email && message);

    return (
      <div>
        <form
          action="javascript:void(0)"
          method="POST"
          onSubmit={ev => this.submit(ev)}
        >
          <input name="email[to_address]" type="hidden" value={to} />
          <input
            name="email[url]"
            type="hidden"
            value={this.isServer ? "" : window.location.toString()}
          />
          <input
            name="email[browser]"
            type="hidden"
            value={this.isServer ? "" : navigator.userAgent}
          />
          <div class="fs">
            <div class="fs-c">
              <div class="txt m-b300">
                <label htmlFor="CobContactForm-name" class="txt-l txt-l--mt000">
                  Full Name
                </label>
                <input
                  id="CobContactForm-name"
                  name="email[name]"
                  type="text"
                  class="txt-f txt-f--sm"
                  value={name}
                  onInput={ev => this.handleNameInput(ev)}
                />
              </div>
              <div class="txt m-b300">
                <label
                  htmlFor="CobContactForm-email"
                  class="txt-l txt-l--mt000"
                >
                  Email Address
                </label>
                <input
                  id="CobContactForm-email"
                  name="email[from_address]"
                  type="text"
                  placeholder="email@address.com"
                  class="txt-f txt-f--sm"
                  value={email}
                  onInput={ev => this.handleEmailInput(ev)}
                />
              </div>
              <div class="txt m-b300">
                <label
                  htmlFor="CobContactForm-subject"
                  class="txt-l txt-l--mt000"
                >
                  Subject
                </label>
                <input
                  id="CobContactForm-subject"
                  name="email[subject]"
                  type="text"
                  class="txt-f txt-f--sm"
                  value={subject}
                  onInput={ev => this.handleSubjectInput(ev)}
                />
              </div>
              <div class="txt m-b300">
                <label
                  htmlFor="CobContactForm-message"
                  class="txt-l txt-l--mt000"
                >
                  Message
                </label>
                <textarea
                  id="CobContactForm-message"
                  name="email[message]"
                  class="txt-f txt-f--sm"
                  value={message}
                  rows={10}
                  onInput={ev => this.handleMessageInput(ev)}
                />
              </div>
            </div>

            {errorMessage && (
              <p class="t--err">
                We couldn’t submit your feedback: {errorMessage}
              </p>
            )}

            <div class="bc bc--r p-t500">
              <button
                type="submit"
                class="btn btn--700"
                disabled={loading || missing}
              >
                Send Message
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  renderSuccess() {
    return (
      <div>
        <div class="t--intro m-v300">
          Thank you for contacting us. We appreciate your interest in the City.
        </div>

        <div class="t--intro m-v300">
          If you don’t hear from anyone within five business days, please
          contact BOS:311 at 3-1-1 or 617-635-4500.
        </div>
      </div>
    );
  }
}
