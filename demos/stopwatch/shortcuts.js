// Keyboard shortcuts for the stopwatch: Space toggles, L records a lap. Keys
// pressed on a button or input are left alone, so activating a focused button
// or typing does not also trigger a shortcut.
export function handleShortcut(event, { toggle, lap }) {
  if (event.target.closest?.('button, input')) {
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    toggle();
  } else if (event.key === 'l') {
    lap();
  }
}
