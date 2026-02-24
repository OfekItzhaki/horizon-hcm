import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { handleAPIError, retryRequest } from './client';

// Don't mock axios - test utility functions only

// Property 8: Error Response Structure
describe('API Client - Error Handling', () => {
  it('should handle axios errors with response', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' },
        },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const error = handleAPIError(axiosError);

    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should handle axios errors without response', () => {
    const axiosError = {
      isAxiosError: true,
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const error = handleAPIError(axiosError);

    expect(error.status).toBe(500);
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('An unexpected error occurred');
  });

  it('should handle network errors', () => {
    const networkError = new Error('Network failed');

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const error = handleAPIError(networkError);

    expect(error.status).toBe(500);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toBe('Network error occurred. Please check your connection.');
  });

  it('should preserve error details from API', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          code: 'DUPLICATE_ENTRY',
          message: 'Email already exists',
          details: {
            field: 'email',
            value: 'test@example.com',
          },
        },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const error = handleAPIError(axiosError);

    expect(error.details).toEqual({
      field: 'email',
      value: 'test@example.com',
    });
  });
});

// Property 9: Request Retry with Exponential Backoff
describe('API Client - Retry Logic', () => {
  it('should retry failed requests up to max retries', async () => {
    let attempts = 0;
    const requestFn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Server error');
      }
      return 'success';
    });

    const result = await retryRequest(requestFn, 3, 10);

    expect(result).toBe('success');
    expect(requestFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 4xx client errors', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Bad request' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const requestFn = vi.fn(async () => {
      throw axiosError;
    });

    await expect(retryRequest(requestFn, 3, 10)).rejects.toEqual(axiosError);
    expect(requestFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx server errors', async () => {
    let attempts = 0;
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const requestFn = vi.fn(async () => {
      attempts++;
      if (attempts < 2) {
        throw axiosError;
      }
      return 'success';
    });

    const result = await retryRequest(requestFn, 3, 10);

    expect(result).toBe('success');
    expect(requestFn).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('Persistent error');
    const requestFn = vi.fn(async () => {
      throw error;
    });

    await expect(retryRequest(requestFn, 2, 10)).rejects.toThrow('Persistent error');
    expect(requestFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should succeed on first attempt if no error', async () => {
    const requestFn = vi.fn(async () => 'immediate success');

    const result = await retryRequest(requestFn, 3, 10);

    expect(result).toBe('immediate success');
    expect(requestFn).toHaveBeenCalledTimes(1);
  });
});
