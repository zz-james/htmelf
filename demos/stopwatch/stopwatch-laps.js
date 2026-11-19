import { Htmelf } from 'htmelf';

export class StopwatchLaps extends Htmelf {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }

  render() {
    const { laps } = this.getStore().getState();
    this.innerHTML = `<ol>${laps.map((ms) => `<li>${this.props.format(ms)}</li>`).join('')}</ol>`;
  }
}
