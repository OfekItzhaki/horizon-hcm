# Pre-Commit Hooks Documentation

## Overview

This project uses **Husky** and **lint-staged** to automatically run quality checks before each commit. This ensures code quality and prevents broken code from entering the repository.

## What Runs Automatically

When you run `git commit`, the following checks run automatically on **staged files only**:

### 1. Code Formatting (Prettier)
- **Command**: `prettier --write`
- **Purpose**: Automatically formats code to match project style
- **Files**: All `.ts` and `.tsx` files in `src/`
- **Result**: Files are formatted and re-staged automatically

### 2. Linting (ESLint)
- **Command**: `eslint --fix`
- **Purpose**: Checks code quality and auto-fixes issues
- **Files**: All `.ts` and `.tsx` files in `src/`
- **Result**: Fixable issues are corrected automatically
- **Failure**: Commit is blocked if unfixable errors exist

### 3. Testing (Jest)
- **Command**: `jest --bail --findRelatedTests --passWithNoTests`
- **Purpose**: Runs tests related to changed files
- **Files**: Tests related to modified `.ts` and `.tsx` files
- **Flags**:
  - `--bail`: Stop on first test failure
  - `--findRelatedTests`: Only run tests for changed files
  - `--passWithNoTests`: Don't fail if no tests found
- **Result**: Commit is blocked if any test fails

## Benefits

### Immediate Feedback
- Catch errors **before** they reach CI/CD
- Fix issues while context is fresh
- Faster development cycle

### Consistent Code Quality
- All code is formatted consistently
- Linting rules enforced automatically
- Tests run before code is committed

### Reduced CI/CD Failures
- Fewer pipeline failures
- Faster builds (fewer retries)
- Less time wasted on broken builds

### Team Productivity
- No manual formatting needed
- No "forgot to run tests" mistakes
- Cleaner git history

## How It Works

```
┌─────────────────┐
│  git commit     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Husky Hook     │  (.husky/pre-commit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  lint-staged    │  (package.json config)
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│  Prettier       │              │  ESLint         │
│  (format)       │              │  (lint + fix)   │
└────────┬────────┘              └────────┬────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │  Jest           │
                │  (test)         │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Commit Success │  ✅
                └─────────────────┘
```

## Configuration

### Husky Configuration
Location: `.husky/pre-commit`

```bash
npx lint-staged
```

### lint-staged Configuration
Location: `package.json`

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "jest --bail --findRelatedTests --passWithNoTests"
  ]
}
```

## Common Scenarios

### Scenario 1: All Checks Pass ✅

```bash
$ git commit -m "feat: add new feature"

✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ src/**/*.{ts,tsx}
    ✔ prettier --write
    ✔ eslint --fix
    ✔ jest --bail --findRelatedTests --passWithNoTests
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...

[main abc1234] feat: add new feature
 2 files changed, 50 insertions(+)
```

### Scenario 2: Linting Errors (Auto-Fixed) ✅

```bash
$ git commit -m "fix: resolve bug"

✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ src/**/*.{ts,tsx}
    ✔ prettier --write (2 files formatted)
    ✔ eslint --fix (3 issues fixed)
    ✔ jest --bail --findRelatedTests --passWithNoTests
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...

[main def5678] fix: resolve bug
 3 files changed, 25 insertions(+), 10 deletions(-)
```

### Scenario 3: Test Failure ❌

```bash
$ git commit -m "feat: add feature"

✔ Preparing lint-staged...
✖ Running tasks for staged files...
  ✖ src/**/*.{ts,tsx}
    ✔ prettier --write
    ✔ eslint --fix
    ✖ jest --bail --findRelatedTests --passWithNoTests
      
      FAIL src/users/users.service.spec.ts
        ● UserService › should create user
        
          Expected: 201
          Received: 400
          
      Tests: 1 failed, 5 passed, 6 total

✖ lint-staged failed due to a git error.
```

**Solution**: Fix the failing test before committing.

### Scenario 4: Unfixable Linting Error ❌

```bash
$ git commit -m "feat: add feature"

✔ Preparing lint-staged...
✖ Running tasks for staged files...
  ✖ src/**/*.{ts,tsx}
    ✔ prettier --write
    ✖ eslint --fix
      
      src/users/users.controller.ts
        15:10  error  'userId' is defined but never used  @typescript-eslint/no-unused-vars
        
      ✖ 1 problem (1 error, 0 warnings)

✖ lint-staged failed due to a git error.
```

**Solution**: Fix the linting error manually before committing.

## Bypassing Pre-Commit Hooks

### When to Bypass
- **Emergency hotfixes** (use with extreme caution)
- **Work-in-progress commits** (not recommended)
- **Known issues** that will be fixed in next commit

### How to Bypass

```bash
git commit --no-verify -m "WIP: work in progress"
```

⚠️ **Warning**: Bypassing hooks should be rare. The CI/CD pipeline will still catch issues.

## Troubleshooting

### Issue: Hooks Not Running

**Symptom**: Commits succeed without running checks

**Solution**:
```bash
# Reinstall Husky hooks
npm run prepare

# Verify .husky/pre-commit exists
ls -la .husky/

# Check if file is executable (Linux/Mac)
chmod +x .husky/pre-commit
```

### Issue: "husky - command not found"

**Symptom**: Error when committing

**Solution**:
```bash
# Reinstall dependencies
npm install

# Run prepare script
npm run prepare
```

### Issue: Tests Taking Too Long

**Symptom**: Pre-commit hook is slow

**Solution**:
- The `--findRelatedTests` flag ensures only relevant tests run
- If still slow, consider splitting large test files
- Use `--no-verify` for WIP commits (not recommended for final commits)

### Issue: False Positive Test Failures

**Symptom**: Tests fail in pre-commit but pass when run manually

**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests manually to verify
npm test

# If tests pass, try committing again
git commit -m "your message"
```

## Manual Testing

To manually run what the pre-commit hook does:

```bash
# Format code
npm run format

# Lint and auto-fix
npm run lint

# Run all tests
npm test

# Or run tests for specific files
npm test -- src/users/users.service.spec.ts
```

## Best Practices

### 1. Commit Often
- Small, focused commits are faster to check
- Easier to identify issues
- Better git history

### 2. Run Tests Before Staging
```bash
# Run tests first
npm test

# Then stage and commit
git add .
git commit -m "feat: add feature"
```

### 3. Use Conventional Commits
```bash
# Good
git commit -m "feat(users): add user creation"
git commit -m "fix(auth): resolve token expiry"

# Bad
git commit -m "changes"
git commit -m "fixed stuff"
```

### 4. Don't Bypass Unless Necessary
- Pre-commit hooks catch issues early
- Bypassing defeats the purpose
- CI/CD will catch issues anyway (but slower)

### 5. Keep Hooks Fast
- Only run checks on staged files (already configured)
- Use `--findRelatedTests` for tests (already configured)
- Don't add slow operations to pre-commit

## Performance

### Current Configuration Performance

| Check | Time (typical) | Files Checked |
|-------|----------------|---------------|
| Prettier | ~1-2s | Staged files only |
| ESLint | ~2-3s | Staged files only |
| Jest | ~3-5s | Related tests only |
| **Total** | **~6-10s** | **Staged files only** |

### Optimization Tips

1. **Stage fewer files**: Commit more frequently with smaller changesets
2. **Use `--no-verify` for WIP**: Only for work-in-progress (not final commits)
3. **Run tests manually first**: Catch failures before committing
4. **Keep test files small**: Easier to run and maintain

## Integration with CI/CD

Pre-commit hooks are the **first line of defense**. The full CI/CD pipeline provides additional checks:

```
┌─────────────────┐
│  Pre-Commit     │  ← Fastest feedback (6-10s)
│  (Local)        │    Staged files only
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI/CD Pipeline │  ← Comprehensive checks (2-5 min)
│  (GitHub)       │    All files, all tests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deployment     │  ← Production deployment
└─────────────────┘
```

## Customization

### Adding More Checks

Edit `package.json`:

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "jest --bail --findRelatedTests --passWithNoTests"
  ],
  "*.md": [
    "prettier --write"
  ],
  "*.json": [
    "prettier --write"
  ]
}
```

### Removing Checks

To disable tests in pre-commit (not recommended):

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [THE_HORIZON_STANDARD.md](../../docs/THE_HORIZON_STANDARD.md)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Summary

Pre-commit hooks ensure code quality by automatically running checks before each commit. This catches issues early, maintains consistency, and reduces CI/CD failures. The hooks are fast (6-10s) because they only check staged files and related tests.

**Remember**: Pre-commit hooks are your friend, not an obstacle. They save time by catching issues early! 🚀

