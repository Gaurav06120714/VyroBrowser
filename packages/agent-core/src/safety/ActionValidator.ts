import type { BrowserAction, ActionType } from '@vyro/shared-types';

const REQUIRED_FIELDS: Partial<Record<ActionType, string[]>> = {
  click: ['selector'],
  type: ['selector', 'value'],
  navigate: ['url'],
  select: ['selector'],
  hover: ['selector'],
  scroll: [],
  screenshot: [],
  extract: [],
  wait: ['selector'],
  key_press: ['key'],
  drag_drop: ['selector'],
  upload: ['selector', 'value'],
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ActionValidator {
  validate(action: BrowserAction): ValidationResult {
    const errors: string[] = [];

    if (!action.type) {
      errors.push('Action type is required');
      return { valid: false, errors };
    }

    if (!action.description) {
      errors.push('Action description is required');
    }

    const required = REQUIRED_FIELDS[action.type] ?? [];
    for (const field of required) {
      if (!action[field as keyof BrowserAction]) {
        errors.push(`Field "${field}" is required for action type "${action.type}"`);
      }
    }

    if (action.type === 'navigate' && action.url) {
      try {
        new URL(action.url);
      } catch {
        
        try {
          new URL(`https://${action.url}`);
          
          action.url = `https://${action.url}`;
        } catch {
          errors.push(`Invalid URL: ${action.url}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  sanitize(action: BrowserAction): BrowserAction {
    const sanitized = { ...action };

    if (sanitized.url && !sanitized.url.startsWith('http')) {
      sanitized.url = `https://${sanitized.url}`;
    }

    if (sanitized.value && sanitized.value.length > 10000) {
      sanitized.value = sanitized.value.slice(0, 10000);
    }

    return sanitized;
  }
}
