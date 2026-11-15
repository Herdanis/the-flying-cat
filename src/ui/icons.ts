// ============================================
// Icons
// ============================================

function svg(inner: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// Filled silhouette: at a 13px tile the stroked version's outlines merge into a blob.
export function rocket(): string {
  return (
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">' +
    '<path d="M12 1.8 15.8 8.2v7.2H8.2V8.2z"/>' +
    '<path d="M8.2 10.8 4.4 16.4v3.2l3.8-3.6z"/>' +
    '<path d="M15.8 10.8 19.6 16.4v3.2l-3.8-3.6z"/>' +
    '<path d="M10 16.4 12 21.8l2-5.4z"/>' +
    '</svg>'
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
