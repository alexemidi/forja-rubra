/**
 * Declarações de ambiente e módulos externos sem @types dedicado.
 */

declare module 'jsdom' {
  export class VirtualConsole {
    on(event: string, callback: (...args: any[]) => void): this;
  }
  export class JSDOM {
    window: Window & typeof globalThis & Record<string, any>;
    constructor(html?: string, options?: Record<string, any>);
    static fromURL(url: string, options?: Record<string, any>): Promise<JSDOM>;
  }
}
