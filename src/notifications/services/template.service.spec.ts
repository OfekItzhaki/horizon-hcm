import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(() => {
    service = new TemplateService();
  });

  describe('substituteVariables', () => {
    it('should substitute single variable', () => {
      const result = service.substituteVariables('Hello {{name}}!', {
        name: 'John',
      });
      expect(result).toBe('Hello John!');
    });

    it('should substitute multiple variables', () => {
      const result = service.substituteVariables(
        'Payment of {{amount}} due on {{date}}',
        { amount: '$100', date: '2026-03-01' },
      );
      expect(result).toBe('Payment of $100 due on 2026-03-01');
    });

    it('should handle missing variables by keeping placeholder', () => {
      const result = service.substituteVariables('Hello {{name}}!', {});
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle null/undefined values', () => {
      const result = service.substituteVariables('Hello {{name}}!', {
        name: null,
      });
      expect(result).toBe('Hello !');
    });

    it('should convert numbers to strings', () => {
      const result = service.substituteVariables('Amount: {{amount}}', {
        amount: 100,
      });
      expect(result).toBe('Amount: 100');
    });
  });

  describe('extractVariables', () => {
    it('should extract variable names', () => {
      const variables = service.extractVariables(
        'Hello {{name}}, your balance is {{amount}}',
      );
      expect(variables).toEqual(['name', 'amount']);
    });

    it('should return empty array for template without variables', () => {
      const variables = service.extractVariables('Hello world');
      expect(variables).toEqual([]);
    });

    it('should handle empty template', () => {
      const variables = service.extractVariables('');
      expect(variables).toEqual([]);
    });
  });

  describe('validateVariables', () => {
    it('should validate all variables are provided', () => {
      const result = service.validateVariables('Hello {{name}}!', {
        name: 'John',
      });
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing variables', () => {
      const result = service.validateVariables(
        'Hello {{name}}, balance: {{amount}}',
        { name: 'John' },
      );
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['amount']);
    });
  });
});
