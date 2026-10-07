import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Sync --range-pct CSS variable on all range inputs so the filled-track
// gradient in index.css reflects the current thumb position.
function syncRangePct(el: HTMLInputElement) {
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value);
  const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
  el.style.setProperty('--range-pct', `${pct}%`);
}

// Override value property setter for HTMLInputElement so programmatic changes
// (such as React state updates from preset button clicks) immediately update --range-pct.
const rangeDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
if (rangeDescriptor && rangeDescriptor.set) {
  const originalSet = rangeDescriptor.set;
  Object.defineProperty(HTMLInputElement.prototype, 'value', {
    set(val: string | number) {
      originalSet.call(this, val);
      if (this.type === 'range') {
        syncRangePct(this);
      }
    },
  });
}

document.addEventListener('input', (e) => {
  if ((e.target as HTMLElement).matches('input[type="range"]')) {
    syncRangePct(e.target as HTMLInputElement);
  }
});

document.addEventListener('change', (e) => {
  if ((e.target as HTMLElement).matches('input[type="range"]')) {
    syncRangePct(e.target as HTMLInputElement);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(syncRangePct);
});

// Also patch after React renders via MutationObserver (without data-rangeSynced guard)
const mo = new MutationObserver(() => {
  document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(syncRangePct);
});
mo.observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


