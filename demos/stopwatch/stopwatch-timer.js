import { TinyBase } from 'tinybase-element';
import { formatTime } from './reducer.js';
import { createTicker } from './ticker.js';
import { handleShortcut } from './shortcuts.js';

// owns the interval and the keyboard shortcuts
export class StopwatchTimer extends TinyBase {
  static renderOnce = true;

  connectedCallback() {
    super.connectedCallback();
    const store = this.getStore();
    const toggle = this.querySelector('[data-toggle]');
    const toggleRunning = () => store.dispatch({ type: store.getState().running ? 'stop' : 'start' });
    const lap = () => store.dispatch({ type: 'lap' });

    // the ticker runs the interval; disconnect stops it, even if the timer is
    // removed from the page while it is running
    const ticker = createTicker(store);
    this.registerCleanup(ticker.stop);
    const sync = () => {
      toggle.textContent = store.getState().running ? 'Stop' : 'Start';
      ticker.sync();
    };
    this.watchStore(sync);
    sync(); // the store outlives this element, so it may already be running

    toggle.onclick = toggleRunning;
    this.querySelector('[data-lap]').onclick = lap;
    this.querySelector('[data-reset]').onclick = () => store.dispatch({ type: 'reset' });
    // document-level shortcuts: listen() removes them on disconnect
    this.listen(document, 'keydown', (event) => handleShortcut(event, { toggle: toggleRunning, lap }));
  }

  render() {
    const format = { format: formatTime };
    this.innerHTML = `
      <p class="clock"><stopwatch-display ${this.setProps(format)}></stopwatch-display></p>
      <button type="button" data-toggle>Start</button>
      <button type="button" data-lap>Lap</button>
      <button type="button" data-reset>Reset</button>
      <stopwatch-laps ${this.setProps(format)}></stopwatch-laps>`;
  }
}
