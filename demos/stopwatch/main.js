import { createStore, setAppStore } from 'tinybase-element';
import { stopwatchReducer } from './reducer.js';
import { StopwatchDisplay } from './stopwatch-display.js';
import { StopwatchLaps } from './stopwatch-laps.js';
import { StopwatchTimer } from './stopwatch-timer.js';
import { setupHarness } from './harness.js';

setAppStore(createStore(stopwatchReducer));
customElements.define('stopwatch-display', StopwatchDisplay);
customElements.define('stopwatch-laps', StopwatchLaps);
customElements.define('stopwatch-timer', StopwatchTimer);
setupHarness();
