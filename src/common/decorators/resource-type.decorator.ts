import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set resource type metadata for ResourceOwnerGuard
 * 
 * @param resourceType - The type of resource (e.g., 'MaintenanceRequest', 'Announcement', 'Document')
 * 
 * @example
 * ```typescript
 * @Patch(':id')
 * @UseGuards(ResourceOwnerGuard)
 * @ResourceType('MaintenanceRequest')
 * async updateMaintenanceRequest(@Param('id') id: string, @Body() dto: UpdateDto) {
 *   // ...
 * }
 * ```
 */
export const ResourceType = (resourceType: string) =>
  SetMetadata('resourceType', resourceType);
