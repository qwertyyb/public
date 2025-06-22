export interface PortBridge {
  setPort(messagePort: MessagePort): void;
  invoke<D extends any>(methodName, ...args: any[]): Promise<D>;
  handle<F extends (...args: any[]) => any>(methodName, callback: F): void;
  on: (event: string | symbol, listener: (...args: any[]) => void) => void;
  once: (event: string | symbol, listener: (...args: any[]) => void) => void;
  off: (event: string | symbol, listener: (...args: any[]) => void) => void;
  emit: <D extends any[]>(eventName: string, ...args: D) => void;
}