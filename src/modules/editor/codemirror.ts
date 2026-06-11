export interface CodeMirrorOptions {
  initialValue?: string;
  lineNumbers?: boolean;
  theme?: string;
}

export class CodeMirror {
  private value: string;
  private listeners: Array<(content: string) => void> = [];

  constructor(private containerId: string, options: CodeMirrorOptions = {}) {
    this.value = options.initialValue || '';
  }

  getValue(): string {
    return this.value;
  }

  setValue(content: string): void {
    this.value = content;
    this.listeners.forEach((listener) => listener(content));
  }

  onChange(callback: (content: string) => void): void {
    this.listeners.push(callback);
  }

  destroy(): void {
    this.listeners = [];
  }

  getContainerId(): string {
    return this.containerId;
  }
}
