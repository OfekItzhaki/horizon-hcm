# Database Seed API

## Overview

The Horizon HCM backend now includes API endpoints to seed and unseed the database with sample data for testing and development purposes.

## Endpoints

### POST /seed
Seeds the database with sample data.

**URL**: `http://localhost:3001/seed`  
**Method**: `POST`  
**Auth**: None required

**Response**:
```json
{
  "message": "Database seeded successfully",
  "details": {
    "users": 4,
    "profiles": 4,
    "buildings": 1,
    "apartments": 2,
    "invoices": 1,
    "announcements": 1,
    "maintenanceRequests": 1,
    "meetings": 1,
    "polls": 1,
    "notificationTemplates": 3,
    "credentials": {
      "admin": {
        "email": "admin@horizon.com",
        "password": "Password123!"
      },
      "committee": {
        "email": "committee@horizon.com",
        "password": "Password123!"
      },
      "owner": {
        "email": "owner@horizon.com",
        "password": "Password123!"
      },
      "tenant": {
        "email": "tenant@horizon.com",
        "password": "Password123!"
      }
    }
  }
}
```

### DELETE /seed
Removes all data from the database.

**URL**: `http://localhost:3001/seed`  
**Method**: `DELETE`  
**Auth**: None required

**Response**:
```json
{
  "message": "Database unseeded successfully",
  "details": {
    "deletedUsers": 4,
    "deletedProfiles": 4,
    "deletedBuildings": 1,
    "deletedApartments": 2,
    "deletedInvoices": 1,
    "deletedAnnouncements": 1,
    "deletedMaintenanceRequests": 1,
    "deletedMeetings": 1,
    "deletedPolls": 1
  }
}
```

## Sample Data

### Users
The seed creates 4 test users with different roles:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@horizon.com | Password123! | System administrator |
| Committee Member | committee@horizon.com | Password123! | Building committee chairman |
| Owner | owner@horizon.com | Password123! | Apartment owner |
| Tenant | tenant@horizon.com | Password123! | Apartment tenant |

### Building
- **Name**: Sunrise Towers
- **Address**: 123 Main Street, Tel Aviv, Israel
- **Total Apartments**: 20

### Apartments
1. **Apartment 101**
   - Floor: 1
   - Size: 85.5 sqm
   - Bedrooms: 3
   - Bathrooms: 2
   - Owner: John Owner

2. **Apartment 102**
   - Floor: 1
   - Size: 95.0 sqm
   - Bedrooms: 4
   - Bathrooms: 2
   - Tenant: Jane Tenant

### Other Data
- 1 Invoice (Monthly maintenance fee)
- 1 Announcement (Welcome message)
- 1 Maintenance Request (Leaking faucet)
- 1 Meeting (Annual General Meeting)
- 1 Poll (Solar panels installation)
- 3 Notification Templates

## Usage Examples

### Using cURL

**Seed the database**:
```bash
curl -X POST http://localhost:3001/seed
```

**Unseed the database**:
```bash
curl -X DELETE http://localhost:3001/seed
```

### Using PowerShell

**Seed the database**:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/seed"
```

**Unseed the database**:
```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:3001/seed"
```

### Using Swagger UI

1. Open http://localhost:3001/api/docs
2. Navigate to the "Seed" section
3. Click on the endpoint you want to test
4. Click "Try it out"
5. Click "Execute"

## Testing Workflow

### 1. Seed the Database
```bash
curl -X POST http://localhost:3001/seed
```

### 2. Test the Application
- Login with any of the test users
- Explore the features
- Create/modify data
- Test different user roles

### 3. Reset the Database
```bash
# Remove all data
curl -X DELETE http://localhost:3001/seed

# Seed again with fresh data
curl -X POST http://localhost:3001/seed
```

## Important Notes

### Safety
- ⚠️ **The unseed endpoint deletes ALL data from the database**
- Use with caution in development environments
- Never use in production!

### Idempotency
- The seed endpoint is idempotent (safe to run multiple times)
- It uses `upsert` operations, so existing data won't be duplicated
- Running seed multiple times will update existing records

### Dependencies
- Requires PostgreSQL database to be running
- Requires Prisma migrations to be applied
- Uses bcrypt for password hashing

## Development Tips

### Quick Reset
Create a script to quickly reset your database:

**reset-db.sh** (Linux/Mac):
```bash
#!/bin/bash
curl -X DELETE http://localhost:3001/seed
curl -X POST http://localhost:3001/seed
echo "Database reset complete!"
```

**reset-db.ps1** (Windows):
```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:3001/seed"
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/seed"
Write-Host "Database reset complete!"
```

### Testing Different Scenarios
```bash
# Scenario 1: Fresh start
curl -X DELETE http://localhost:3001/seed
curl -X POST http://localhost:3001/seed

# Scenario 2: Test with existing data
# (Just run seed without unseed first)
curl -X POST http://localhost:3001/seed

# Scenario 3: Clean slate
curl -X DELETE http://localhost:3001/seed
```

## API Documentation

Full API documentation is available in Swagger UI:
- **URL**: http://localhost:3001/api/docs
- **Section**: Seed
- **Endpoints**: POST /seed, DELETE /seed

## Troubleshooting

### "Cannot connect to database"
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is configured correctly

### "Prisma schema not found"
**Solution**: Run `npm run prisma:generate` in the backend folder

### "Foreign key constraint failed"
**Solution**: Run unseed first to clear all data, then seed again

### "Unique constraint failed"
**Solution**: The data already exists. Either:
- Run unseed first to clear existing data
- Or ignore the error (upsert will update existing records)

## Future Enhancements

Potential improvements for the seed API:

- [ ] Add authentication/authorization to seed endpoints
- [ ] Support for custom seed data via request body
- [ ] Seed specific entities only (e.g., only users, only buildings)
- [ ] Import seed data from JSON/CSV files
- [ ] Export current data as seed file
- [ ] Seed data for different scenarios (small, medium, large datasets)
- [ ] Seed data with realistic fake data using Faker.js

## Related Documentation

- `START_PROJECT.md` - How to start the backend
- `PROJECT_STATUS.md` - Current project status
- `backend/README.md` - Backend documentation
- Swagger UI: http://localhost:3001/api/docs

---

**Last Updated**: February 27, 2026
