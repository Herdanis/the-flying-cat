// ============================================
// Start Order
// ============================================

export interface RollRow {
  seat: number;
  value: number;
  round: number;
}

export interface RollOff {
  order: number[];
  rolls: RollRow[];
}

/** Everyone rolls; each tied group re-rolls among itself and keeps its earned place. */
export function rollOff(count: number, dice: () => number): RollOff {
  const rolls: RollRow[] = [];
  const values: number[] = [];
  const throwFor = (seat: number, round: number): void => {
    values[seat] = dice();
    rolls.push({ seat, value: values[seat], round });
  };

  const seats = Array.from({ length: count }, (_, seat) => seat);
  for (const seat of seats) throwFor(seat, 1);

  const byValue = (a: number, b: number): number => values[b] - values[a] || a - b;
  const order = [...seats].sort(byValue);

  // Sorted, so a tie group is one run. The first round fixes the groups: nothing
  // outside a group moves, even when a re-rolled number matches a neighbour.
  let start = 0;
  while (start < order.length) {
    let end = start + 1;
    while (end < order.length && values[order[end]] === values[order[start]]) end++;

    if (end - start > 1) {
      const group = order.slice(start, end).sort((a, b) => a - b);
      for (let round = 2; ; round++) {
        for (const seat of group) throwFor(seat, round);
        group.sort(byValue);
        if (new Set(group.map((seat) => values[seat])).size === group.length) break;
      }
      order.splice(start, end - start, ...group);
    }

    start = end;
  }

  return { order, rolls };
}
