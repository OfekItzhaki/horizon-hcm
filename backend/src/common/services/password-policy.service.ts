import { Injectable } from '@nestjs/common';

export interface PasswordStrength {
  score: number; // 0-100
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  isValid: boolean;
}

@Injectable()
export class PasswordPolicyService {
  private readonly MIN_LENGTH = 12;
  private readonly REQUIRE_UPPERCASE = true;
  private readonly REQUIRE_LOWERCASE = true;
  private readonly REQUIRE_NUMBERS = true;
  private readonly REQUIRE_SPECIAL = true;

  // Common weak passwords
  private readonly COMMON_PASSWORDS = [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    'superman',
  ];

  /**
   * Validate password against policy
   */
  validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score += 20;
    }

    // Check for uppercase letters
    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    // Check for lowercase letters
    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    // Check for numbers
    if (this.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
      score += 15;
    }

    // Check for special characters
    if (this.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 15;
    }

    // Check for common passwords
    if (this.isCommonPassword(password)) {
      feedback.push('Password is too common. Please choose a more unique password');
      score = Math.max(0, score - 30);
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid using repeated characters (e.g., "aaa", "111")');
      score = Math.max(0, score - 10);
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      feedback.push('Avoid using sequential characters (e.g., "abc", "123")');
      score = Math.max(0, score - 10);
    }

    // Bonus points for length
    if (password.length >= 16) {
      score += 10;
    }
    if (password.length >= 20) {
      score += 10;
    }

    // Determine strength
    let strength: PasswordStrength['strength'];
    if (score >= 90) {
      strength = 'very-strong';
    } else if (score >= 70) {
      strength = 'strong';
    } else if (score >= 50) {
      strength = 'good';
    } else if (score >= 30) {
      strength = 'fair';
    } else {
      strength = 'weak';
    }

    const isValid = feedback.length === 0;

    if (isValid && strength === 'weak') {
      feedback.push('Password meets minimum requirements but is weak. Consider making it stronger.');
    }

    return {
      score,
      strength,
      feedback,
      isValid,
    };
  }

  /**
   * Check if password is in common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.COMMON_PASSWORDS.some((common) =>
      lowerPassword.includes(common),
    );
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i < sequence.length - 2; i++) {
        const substr = sequence.substring(i, i + 3);
        if (lowerPassword.includes(substr)) {
          return true;
        }
        // Check reverse
        const reversed = substr.split('').reverse().join('');
        if (lowerPassword.includes(reversed)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate password strength indicator for UI
   */
  getStrengthIndicator(strength: PasswordStrength['strength']): {
    color: string;
    label: string;
    percentage: number;
  } {
    switch (strength) {
      case 'very-strong':
        return { color: 'green', label: 'Very Strong', percentage: 100 };
      case 'strong':
        return { color: 'lightgreen', label: 'Strong', percentage: 80 };
      case 'good':
        return { color: 'yellow', label: 'Good', percentage: 60 };
      case 'fair':
        return { color: 'orange', label: 'Fair', percentage: 40 };
      case 'weak':
        return { color: 'red', label: 'Weak', percentage: 20 };
    }
  }
}
