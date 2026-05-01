# GitHub Setup and Deployment Guide

## Quick Start

### Step 1: Initialize Git (if not already done)

```bash
cd water_station_node_new

# Initialize git if needed
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Water Station Node.js API with Aiven MySQL"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click **New repository**
3. Name: `water-station-api` or similar
4. Description: "Water Station Management System API"
5. Choose **Public** or **Private**
6. Click **Create repository**

### Step 3: Push to GitHub

```bash
# Add remote URL (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/water-station-api.git

# Rename branch to main if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 4: Configure GitHub Secrets (for CI/CD)

These secrets allow GitHub Actions to deploy your code:

1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name | Value | Example |
|-----------|-------|---------|
| AIVEN_DB_HOST | Your Aiven MySQL host | `my-service.a.aivencloud.com` |
| AIVEN_DB_USER | Aiven database user | `avnadmin` |
| AIVEN_DB_PASSWORD | Aiven database password | Your secure password |
| JWT_SECRET | Your JWT secret key | `super-secret-key-32-chars-min` |
| PAYMONGO_SECRET_KEY | PayMongo API key | `pk_live_...` |

## Branching Strategy

### Recommended Git Flow

```
main (production)
  ↑
develop (staging)
  ↑
feature branches (development)
```

### Creating Feature Branches

```bash
# Create and switch to new branch
git checkout -b feature/add-customer-dashboard

# Make changes...
git add .
git commit -m "feat: add customer dashboard"
git push origin feature/add-customer-dashboard

# Create Pull Request on GitHub
# After review and merge, delete the branch
```

## Deployment Workflow

### GitHub Actions CI/CD

The `.github/workflows/test.yml` file automatically:

1. **On every push to main/develop**:
   - Installs dependencies
   - Runs linting
   - Runs tests
   - ✅ If all pass, deploys to production

2. **On Pull Requests**:
   - Runs all checks
   - Prevents merge if checks fail

### View GitHub Actions Status

1. Go to repository → **Actions** tab
2. See all workflow runs
3. Click run to see detailed logs

## Continuous Integration Setup

### Add Pre-commit Hooks (optional)

```bash
# Install husky
npm install husky --save-dev
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run lint"

# Now linting runs before every commit
git add .
git commit -m "test"  # Linting runs automatically!
```

## GitHub Issues & Project Management

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug in the API
---

### Description
[Describe the bug]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Node version: 
- Database: Aiven MySQL
- OS: 
```

### Project Board

1. Go to repository → **Projects** → **New project**
2. Select **Table** or **Board** view
3. Create columns: **Backlog**, **In Progress**, **In Review**, **Done**
4. Link issues to cards

## Code Review Guidelines

### Pull Request Checklist

```markdown
## PR Checklist
- [ ] Code follows project style guide
- [ ] Tests pass locally (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Database migrations are included
- [ ] Documentation updated
- [ ] Tested with real Aiven MySQL (if DB changes)

## Changes
- Describe what was changed
- Link related issues
```

### Requesting Review

1. Push branch to GitHub
2. Create Pull Request
3. Add description and checklist
4. Request reviewers
5. Wait for approval
6. Merge when ready

## Deployment Pipeline

### Local → GitHub → Aiven

```
Local Machine
    ↓ (git push)
GitHub Repository
    ↓ (GitHub Actions)
Tests Pass
    ↓
Deploy to Aiven App Platform
    ↓
Production API Running
```

## Environment Secrets

### Production Environment

1. Create `.env.production` (locally, never commit)
2. GitHub Actions uses repository secrets
3. Aiven app platform uses config variables

### Example Production Values

```
NODE_ENV=production
AIVEN_DB_HOST=prod-mysql.a.aivencloud.com
JWT_SECRET=<your-production-secret>
PAYMONGO_SECRET_KEY=<production-key>
```

## Monitoring & Logging

### GitHub Status Checks

- ✅ Tests pass
- ✅ Lint passes
- ✅ Build succeeds
- ✅ Deployment succeeds

View status on:
- Commit page in GitHub
- Pull Request status checks

### Aiven Service Monitoring

1. Aiven Console → Your MySQL Service
2. **Metrics** tab: CPU, Memory, Connections
3. **Logs** tab: Database activity
4. Set up alerts for anomalies

## Troubleshooting

### Push Rejected

```bash
# Pull latest changes
git pull origin main

# Resolve conflicts if any
git add .
git commit -m "Merge remote changes"

# Try push again
git push origin main
```

### GitHub Actions Failing

1. Go to repository → **Actions**
2. Click failed workflow
3. View logs under "Run tests"
4. Common issues:
   - Dependencies not installed
   - Secrets not set correctly
   - Database connection failed

### Reset to Previous Commit

```bash
# View commit history
git log --oneline

# Revert specific commit
git revert <commit-hash>

# Or reset (careful!)
git reset --hard <commit-hash>
git push origin main --force
```

## Best Practices

✅ **DO:**
- Write meaningful commit messages
- Create feature branches
- Use pull requests for review
- Keep commits atomic and focused
- Test locally before pushing

❌ **DON'T:**
- Commit `.env` files
- Force push to main
- Commit large files (> 100MB)
- Skip tests or linting
- Use `git push --force` on shared branches

## Resources

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://github.github.com/training-kit/)
- [GitHub Actions](https://github.com/features/actions)
- [Conventional Commits](https://www.conventionalcommits.org)

---

For Aiven setup, see [AIVEN_SETUP.md](AIVEN_SETUP.md)
For API documentation, see [README.md](README.md)
