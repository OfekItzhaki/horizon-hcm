import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
  /**
   * Substitute variables in template string
   * Variables are in format: {{variableName}}
   * 
   * @param template - Template string with variables
   * @param variables - Object with variable values
   * @returns Processed string with variables replaced
   * 
   * @example
   * substituteVariables('Hello {{name}}!', { name: 'John' })
   * // Returns: 'Hello John!'
   */
  substituteVariables(
    template: string,
    variables: Record<string, any>,
  ): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      // Check if variable exists in provided variables
      if (variableName in variables) {
        const value = variables[variableName];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert to string
        return String(value);
      }
      
      // If variable not found, keep the placeholder
      return match;
    });
  }

  /**
   * Extract variable names from template
   * 
   * @param template - Template string
   * @returns Array of variable names
   * 
   * @example
   * extractVariables('Hello {{name}}, your balance is {{amount}}')
   * // Returns: ['name', 'amount']
   */
  extractVariables(template: string): string[] {
    if (!template) return [];

    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];

    return matches.map((match) => match.replace(/\{\{|\}\}/g, ''));
  }

  /**
   * Validate that all required variables are provided
   * 
   * @param template - Template string
   * @param variables - Object with variable values
   * @returns Object with validation result and missing variables
   */
  validateVariables(
    template: string,
    variables: Record<string, any>,
  ): { valid: boolean; missing: string[] } {
    const requiredVariables = this.extractVariables(template);
    const providedVariables = Object.keys(variables);

    const missing = requiredVariables.filter(
      (varName) => !providedVariables.includes(varName),
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}
