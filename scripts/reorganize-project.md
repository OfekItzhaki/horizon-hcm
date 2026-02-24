# Project Reorganization Guide

## ⚠️ IMPORTANT: Read Before Proceeding

This reorganization will move files around significantly. Make sure you:
1. Commit all current changes to git
2. Have backups
3. Close all running processes (backend, frontend)
4. Close your IDE/editor

## Manual Steps Required

Due to the complexity of moving the entire backend to a subfolder, this needs to be done carefully:

### Step 1: Create New Structure

```bash
# Create new directories
mkdir backend
mkdir mobile-app
mkdir web-app
mkdir shared
```

### Step 2: Move Backend Files

```bash
# Move backend files to backend/
# Everything EXCEPT horizon-hcm-frontend/
mv src backend/
mv prisma backend/
mv node_modules backend/
mv dist backend/
mv scripts backend/
mv logs backend/
mv certs backend/
mv .env backend/
mv .env.* backend/
mv .eslintrc.js backend/
mv .prettierrc backend/
mv .gitignore backend/.gitignore-backend
mv .husky backend/
mv docker-compose.yml backend/
mv firebase-service-account.json backend/
mv nest-cli.json backend/
mv package.json backend/
mv package-lock.json backend/
mv tsconfig.json backend/
mv test-auth.http backend/
mv verify-setup.js backend/
```

### Step 3: Move Frontend Files

```bash
# Move frontend packages
mv horizon-hcm-frontend/packages/mobile/* mobile-app/
mv horizon-hcm-frontend/packages/web/* web-app/
mv horizon-hcm-frontend/packages/shared/* shared/

# Move frontend docs
mv horizon-hcm-frontend/ARCHITECTURE.md web-app/
mv horizon-hcm-frontend/DEPLOYMENT.md web-app/
mv horizon-hcm-frontend/ENV_VARIABLES.md web-app/
mv horizon-hcm-frontend/COMPLETION_SUMMARY.md web-app/
mv horizon-hcm-frontend/PROJECT_STATUS.md web-app/
mv horizon-hcm-frontend/TROUBLESHOOTING.md web-app/

# Move frontend config
mv horizon-hcm-frontend/.eslintrc.js web-app/
mv horizon-hcm-frontend/.prettierrc web-app/
mv horizon-hcm-frontend/.gitignore web-app/.gitignore-web
mv horizon-hcm-frontend/package.json web-app/
mv horizon-hcm-frontend/tsconfig.json web-app/
```

### Step 4: Move Documentation

```bash
# Keep docs at root
# docs/ already exists with backend docs
```

### Step 5: Create Root Files

Create new root-level files:
- README.md (project overview)
- .gitignore (combined)
- package.json (workspace root)

### Step 6: Update Import Paths

After moving, you'll need to update:
- Backend: No changes needed (self-contained)
- Web app: Update imports from `@horizon-hcm/shared` to `../shared`
- Mobile app: Update imports from `@horizon-hcm/shared` to `../shared`
- Shared: No changes needed

### Step 7: Update Configuration Files

- Update backend/.env paths
- Update web-app/package.json workspace references
- Update mobile-app/package.json workspace references
- Update shared/package.json

## Automated Script (Use with Caution)

I can create a PowerShell script to automate this, but it's risky. Would you prefer:
1. Manual step-by-step (safer, you control each step)
2. Automated script (faster, but riskier)

## Recommendation

Given the complexity, I recommend:
1. Create a new branch in git: `git checkout -b reorganize-structure`
2. Follow manual steps above
3. Test everything works
4. Commit if successful
5. Merge to main

This way you can easily revert if something goes wrong.

Would you like me to:
A) Create the automated PowerShell script
B) Guide you through manual steps one by one
C) Create a new git branch and start the reorganization
