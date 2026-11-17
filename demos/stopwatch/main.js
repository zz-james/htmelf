import { TinyBase, createStore, setAppStore, countProps } from 'tinybase-element';
import { stopwatchReducer, formatTime } from './reducer.js';

const store = createStore(stopwatchReducer);
setAppStore(store);

// --- <stopwatch-display> / <stopwatch-laps>: subscribe, render, clean up ----
class StopwatchDisplay extends TinyBase {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }
  render() {
    this.textContent = this.props.format(this.getStore().getState().elapsedMs);
  }
}
customElements.define('stopwatch-display', StopwatchDisplay);

class StopwatchLaps extends TinyBase {
  connectedCallback() {
    this.watchStore();
    super.connectedCallback();
  }
  render() {
    const { laps } = this.getStore().getState();
    this.innerHTML = `<ol>${laps.map((ms) => `<li>${this.props.format(ms)}</li>`).join('')}</ol>`;
  }
}
customElements.define('stopwatch-laps', StopwatchLaps);

// --- <stopwatch-timer>: owns the interval and the keyboard shortcuts --------
class StopwatchTimer extends TinyBase {
  static renderOnce = true;

  connectedCallback() {
    super.connectedCallback();
    const store = this.getStore();
    const toggle = this.querySelector('[data-toggle]');

    // keeps the Start/Stop label and the ticking interval in step with the store.
    // The interval is torn down by disconnect, even if the timer is removed
    // from the page while it is running.
    let interval;
    this.registerCleanup(() => clearInterval(interval));
    const sync = () => {
      const { running, elapsedMs } = store.getState();
      toggle.textContent = running ? 'Stop' : 'Start';
      if (running && !interval) {
        const startedAt = performance.now() - elapsedMs;
        interval = setInterval(
          () => store.dispatch({ type: 'tick', elapsedMs: performance.now() - startedAt }),
          30
        );
      } else if (!running && interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };
    this.watchStore(sync);
    sync(); // the store outlives this element, so it may already be running

    const toggleRunning = () => store.dispatch({ type: store.getState().running ? 'stop' : 'start' });
    toggle.onclick = toggleRunning;
    this.querySelector('[data-lap]').onclick = () => store.dispatch({ type: 'lap' });
    this.querySelector('[data-reset]').onclick = () => store.dispatch({ type: 'reset' });

    // document-level shortcuts: listen() removes them on disconnect
    this.listen(document, 'keydown', (event) => {
      if (event.target.closest?.('button, input')) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        toggleRunning();
      } else if (event.key === 'l') {
        store.dispatch({ type: 'lap' });
      }
    });
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
customElements.define('stopwatch-timer', StopwatchTimer);

// --- page harness: mount/unmount and a live leak readout --------------------
const slot = document.querySelector('#slot');
const readout = document.querySelector('#keys');
const mountButton = document.querySelector('#mount');
const showKeys = () => (readout.textContent = String(countProps()));

mountButton.onclick = () => {
  if (slot.firstElementChild) {
    slot.replaceChildren();
    mountButton.textContent = 'Mount';
  } else {
    slot.append(document.createElement('stopwatch-timer'));
    mountButton.textContent = 'Unmount';
  }
  showKeys();
};
slot.append(document.createElement('stopwatch-timer'));
showKeys();
