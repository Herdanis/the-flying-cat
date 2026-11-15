// ============================================
// Icons
// ============================================

function svg(inner: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

export function rocket(): string {
  return svg(
    '<path d="M12 2 8 8h8z"/>' +
      '<path d="M9 8v6h6V8"/>' +
      '<path d="M9 10.5 6.5 14v3.5L9 15"/>' +
      '<path d="M15 10.5 17.5 14v3.5L15 15"/>',
  );
}

export function hole(): string {
  return svg(
    '<circle cx="11" cy="11" r="7"/>' +
      '<circle cx="11" cy="11" r="3"/>' +
      '<path d="M18.4 13.5a7 7 0 0 1-9.4 6"/>',
  );
}

export function star(): string {
  return svg(
    '<path d="M12 3l2.6 6.2 6.4.6-4.8 4.3 1.4 6.3L12 17.2l-5.6 3.2 1.4-6.3L3 9.8l6.4-.6z"/>',
  );
}

export function speaker(muted: boolean): string {
  const slash = muted ? '<path d="M3 3l18 18"/>' : '';
  return svg(
    '<path d="M4 9h3l5-4v14l-5-4H4z"/>' +
      '<path d="M16 9.5a4 4 0 0 1 0 5"/>' +
      '<path d="M18.5 7a8 8 0 0 1 0 10"/>' +
      slash,
  );
}
