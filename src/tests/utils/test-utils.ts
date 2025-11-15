// Función que simula vi.runAllTimersAsync() sin fake timers
export async function flushPromises(): Promise<void> {
  // Vaciar la cola de microtasks múltiples veces como hace vi.runAllTimersAsync
  await new Promise(resolve => setTimeout(resolve, 0));
}

export function resetDOM() {
  document.body.innerHTML = '<div id="root"></div>';
}
