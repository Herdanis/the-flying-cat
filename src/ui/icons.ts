// ============================================
// Icons
// ============================================

function svg(inner: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
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

export function restart(): string {
  return svg('<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3v5h-5"/>');
}
