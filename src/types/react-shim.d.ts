declare namespace React {
  type ReactNode = unknown;
  type MouseEventHandler<T = unknown> = (event: unknown) => void;
  type ChangeEvent<T = unknown> = { target: T };
  type FormEvent<T = unknown> = { preventDefault(): void; target: T };
  type InputHTMLAttributes<T = unknown> = Record<string, unknown>;
  type SelectHTMLAttributes<T = unknown> = Record<string, unknown> & { children?: ReactNode };
  type FC<P = object> = (props: P) => ReactNode;
}

declare module 'react' {
  export = React;
  export const useState: <T>(initial: T | (() => T)) => [T, (value: T | ((previous: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: unknown[]) => void;
  export const useMemo: <T>(factory: () => T, deps?: unknown[]) => T;
  export type ReactNode = React.ReactNode;
}

declare namespace JSX {
  interface IntrinsicAttributes {
    key?: unknown;
  }
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module '*.css';
declare module '*.svg' {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}
declare var require: any;
