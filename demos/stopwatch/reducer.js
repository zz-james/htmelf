export const initialState = { running: false, elapsedMs: 0, laps: [] };

export function stopwatchReducer(state = initialState, action) {
  switch (action.type) {
    case 'start':
      return { ...state, running: true };
    case 'stop':
      return { ...state, running: false };
    case 'tick':
      return { ...state, elapsedMs: action.elapsedMs };
    case 'lap':
      return { ...state, laps: [...state.laps, state.elapsedMs] };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

export function formatTime(ms) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}.${pad(Math.floor((ms % 1000) / 10))}`;
}
