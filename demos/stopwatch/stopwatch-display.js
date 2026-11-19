import { Htmelf } from 'htmelf';

export class StopwatchDisplay extends Htmelf {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }

  render() {
    this.textContent = this.props.format(this.getStore().getState().elapsedMs);
  }
}
