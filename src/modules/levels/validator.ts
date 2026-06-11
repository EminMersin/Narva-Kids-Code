import { LevelSchema } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SchemaValidator {
  validate(level: unknown): ValidationResult {
    const result = LevelSchema.safeParse(level);
    return result.success
      ? { valid: true, errors: [] }
      : { valid: false, errors: result.error.issues };
  }
}
