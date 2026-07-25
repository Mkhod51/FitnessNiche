import { registerSW } from 'virtual:pwa-register';

export function setupPwa() {
  registerSW({ immediate: true });
}
