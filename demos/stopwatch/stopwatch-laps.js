import { TinyBase } from 'tinybase-element';

export class StopwatchLaps extends TinyBase {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }

  render() {
    const { laps } = this.getStore().getState();
    this.innerHTML = `<ol>${laps.map((ms) => `<li>${this.props.format(ms)}</li>`).join('')}</ol>`;
  }
}
