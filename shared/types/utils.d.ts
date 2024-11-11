interface PortBridge {
  setPort(messagePort: MessagePort): void;
  invoke(methodName, ...args: any[]): Promise<unknown>;
  handle<F extends (...args: any[]) => any>(methodName, callback: F): void;
  on: (event: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
  once: (event: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
  off: (event: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
  emit: <D extends any[]>(eventName: string, ...args: D) => void;
}