// ============================================
// Layout Helpers
// ============================================

export function root(): HTMLElement {
  return document.querySelector<HTMLElement>('#app')!;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mount(node: HTMLElement): void {
  root().replaceChildren(node);
}

export function onViewportChange(fn: () => void): void {
  addEventListener('resize', fn);
  addEventListener('orientationchange', fn);
}

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playerColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  return [1, 2, 3, 4, 5, 6].map((n) => style.getPropertyValue(`--p${n}`).trim());
}
