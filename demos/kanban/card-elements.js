// One <kanban-card> element per card id, created on first use and reused
// after, so moving a card in the board moves the same element (and keeps its
// local state) instead of rebuilding it. `getPropsKey()` gives the shared
// props key every new card is given; it is a function because the board gets a
// fresh key each time it connects, while this map outlives a reconnect.
export function createCardElements(getPropsKey) {
  const elements = new Map();

  const get = (id) => {
    if (!elements.has(id)) {
      const element = document.createElement('kanban-card');
      element.setAttribute('card-id', id);
      element.setAttribute('key', getPropsKey());
      elements.set(id, element);
    }
    return elements.get(id);
  };

  // remove the elements of every card whose id is not in `keepIds`
  const prune = (keepIds) => {
    elements.forEach((element, id) => {
      if (!keepIds.has(id)) {
        element.remove();
        elements.delete(id);
      }
    });
  };

  return { get, prune, size: () => elements.size };
}
