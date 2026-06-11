import type { ProgramNode, StatementNode } from './parser';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  stack?: string;
}

export interface ValidationOptions {
  availableCommands?: string[];
}

const SUPPORTED_COMMANDS = new Set([
  'move_forward',
  'move_left',
  'move_right',
  'move_up',
  'move_down',
  'turn_left',
  'turn_right',
  'pick_item',
  'repeat',
  'if_obstacle_ahead',
]);
const MAX_REPEAT_COUNT = 24;

export class Validator {
  validate(program: ProgramNode, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = [];

    for (const statement of program.statements) {
      this.validateStatement(statement, errors, options);
    }

    return {
      valid: errors.length === 0,
      errors,
      stack: errors.join('\n'),
    };
  }

  private validateStatement(statement: StatementNode, errors: string[], options: ValidationOptions): void {
    const available = options.availableCommands;

    if (statement.kind === 'repeat') {
      if (!SUPPORTED_COMMANDS.has('repeat')) {
        errors.push(`${statement.line}. satirda Tekrarla blogu desteklenmiyor.`);
      }
      if (available && !available.includes('repeat')) {
        errors.push(`${statement.line}. satirda Tekrarla blogu bu seviyede kullanilamaz.`);
      }
      if (!Number.isInteger(statement.times) || statement.times < 1 || statement.times > MAX_REPEAT_COUNT) {
        errors.push(`${statement.line}. satirda tekrar sayisi 1 ile ${MAX_REPEAT_COUNT} arasinda olmali.`);
      }
      this.validateStatement(statement.inner, errors, options);
      return;
    }

    if (statement.kind === 'condition') {
      const conditionCommand = statement.predicate === 'obstacle_ahead' ? 'if_obstacle_ahead' : 'if_else';
      if (available && !available.includes(conditionCommand)) {
        errors.push(`${statement.line}. satirda kosul blogu bu seviyede kullanilamaz.`);
      }
      this.validateStatement(statement.inner, errors, options);
      if (statement.fallback) this.validateStatement(statement.fallback, errors, options);
      return;
    }

    if (!SUPPORTED_COMMANDS.has(statement.name)) {
      errors.push(`${statement.line}. satirdaki komutu tanimiyorum: ${statement.name}`);
    }

    if (available && !available.includes(statement.name)) {
      errors.push(`${statement.line}. satirdaki ${statement.name} blogu bu seviyede kullanilamaz.`);
    }

    if (statement.name.startsWith('move_')) {
      const steps = statement.args[0] ?? 1;
      if (!Number.isInteger(steps) || steps < 1 || steps > 8) {
        errors.push(`${statement.line}. satirda hareket sayisi 1 ile 8 arasinda olmali.`);
      }
    }

    if (!statement.name.startsWith('move_') && statement.args.length > 0) {
      errors.push(`${statement.line}. satirda bu komut sayi almaz.`);
    }
  }
}
