// What a drop event asks for: move card `id` to `column`. Returns null unless
// the drop names a column and a card that is in the state, so a stray drop
// (text from elsewhere, an empty payload) never reaches the store. Card id 0
// is a valid id, which is why the payload is checked as text, not as a number.
export function readDrop(event, cards) {
  const column = event.target.closest('[data-column]')?.dataset.column;
  const payload = event.dataTransfer.getData('text/plain');
  const id = Number(payload);
  if (!column || payload === '' || !Number.isInteger(id) || !(id in cards)) {
    return null;
  }
  return { id, column };
}
