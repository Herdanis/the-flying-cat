// ============================================
// Layout Helpers
// ============================================

import { asset } from './assets';

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

/** A dino portrait; `data-dino` lets the sheet crop it to the head in small slots. */
export function faceImg(key: string): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'face';
  img.src = asset('dinos', key);
  img.alt = '';
  img.draggable = false;
  img.dataset.dino = key;
  return img;
}
