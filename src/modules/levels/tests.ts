import { Parser } from '../interpreter/parser';
import { Validator } from '../interpreter/validator';

export interface ExampleResult {
  success: boolean;
  steps: number;
  output?: unknown;
  error?: string;
}

export class ExampleRunner {
  execute(_levelId: string, code: string): ExampleResult {
    try {
      if (!code.trim()) {
        return { success: false, steps: 0, error: 'Kod bos' };
      }

      const parser = new Parser();
      const program = parser.parse(code);
      const validation = new Validator().validate(program);

      if (!validation.valid) {
        return { success: false, steps: 0, error: validation.errors.join('\n') };
      }

      return { success: true, steps: program.statements.length, output: program };
    } catch (error) {
      return {
        success: false,
        steps: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
