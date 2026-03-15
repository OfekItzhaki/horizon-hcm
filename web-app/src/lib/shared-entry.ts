// Web-app specific entry point for @horizon-hcm/shared
// Omits shared stores to prevent conflicts with web-app's own stores

export * from '../../../shared/src/types';
export * from '../../../shared/src/schemas';
export * from '../../../shared/src/api';
export * from '../../../shared/src/utils';
export * from '../../../shared/src/constants';
// NOTE: shared/src/store is intentionally excluded — web-app uses its own stores
