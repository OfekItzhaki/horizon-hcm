# Script to fix Prisma model and relation names in TypeScript files
# 
# IMPORTANT: This script is now DEPRECATED and should NOT be used.
# All fixes have been applied manually with the correct understanding:
# - Prisma keeps model names EXACTLY as defined in schema (no singularization, no camelCase conversion)
# - Relation field names in include clauses must match the EXACT relation field names from schema
# - Property access on included relations must use the EXACT relation field names from schema
#
# This script is kept for reference only.

Write-Host "=========================================="
Write-Host "WARNING: This script is DEPRECATED"
Write-Host "=========================================="
Write-Host ""
Write-Host "All Prisma naming fixes have been applied manually."
Write-Host "The codebase now correctly uses:"
Write-Host "  - Model accessors as defined in schema (e.g., prisma.messages, prisma.apartments)"
Write-Host "  - Relation names as defined in schema (e.g., buildings, apartments, user_profiles)"
Write-Host ""
Write-Host "If you need to make changes, please:"
Write-Host "  1. Check the Prisma schema (prisma/schema.prisma) for exact names"
Write-Host "  2. Use model names EXACTLY as defined (plural, snake_case, etc.)"
Write-Host "  3. Use relation field names EXACTLY as defined in the schema"
Write-Host ""
Write-Host "Do NOT run this script as it contains incorrect conversion logic."
Write-Host "=========================================="
