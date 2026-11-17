import { TinyBase } from 'tinybase-element';

export class StopwatchDisplay extends TinyBase {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }

  render() {
    this.textContent = this.props.format(this.getStore().getState().elapsedMs);
  }
}
