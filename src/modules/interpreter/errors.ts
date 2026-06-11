// src/modules/interpreter/errors.ts
export class Errors {
  /** Format an array of error objects into a user‑friendly string. */
  static format(errors: any[]): string {
    if (!errors || errors.length === 0) return '';
    return errors.map(e => {
      if (typeof e === 'string') return e;
      if (e && typeof e === 'object' && e.message) return e.message;
      return String(e);
    }).join(' ');
  }

  /** Get a stack trace‑like string from an error (fallback to message). */
  static getStack(err: any): string {
    if (err && err.stack) return err.stack;
    if (err && err.message) return err.message;
    return 'No stack available';
  }

  /** Syntax error used by the parser. */
  static SyntaxError(message: string): Error {
    const err = new Error(message);
    err.name = 'SyntaxError';
    return err;
  }

  /** Validation error used by the validator. */
  static ValidationError(message: string): Error {
    const err = new Error(message);
    err.name = 'ValidationError';
    return err;
  }

  /** Runtime error used by the executor. */
  static RuntimeError(message: string): Error {
    const err = new Error(message);
    err.name = 'RuntimeError';
    return err;
  }
}