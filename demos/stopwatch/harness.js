import { countProps } from 'htmelf';

// The page around the timer: a button that mounts and unmounts it, and a live
// readout of countProps(), which returns to 0 when the timer is unmounted.
export function setupHarness() {
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
}
