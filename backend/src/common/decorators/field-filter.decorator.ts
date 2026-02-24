import { SetMetadata } from '@nestjs/common';

export const FIELD_FILTER_KEY = 'fieldFilter';

/**
 * Decorator to enable field filtering on an endpoint
 * Usage: @FieldFilter() on controller methods
 * 
 * Clients can then use ?fields=id,name,email to get only specific fields
 */
export const FieldFilter = () => SetMetadata(FIELD_FILTER_KEY, true);
