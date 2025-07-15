# Git Workflow Guide for Global Financial Services

## 🎯 Repository Setup Complete!

Your project is now under version control with Git. This will help you avoid issues like we faced today and manage your code safely.

## 📋 Current Status
- ✅ Git repository initialized
- ✅ Initial commit created with all files
- ✅ Version tag v1.0.0 created for stable state
- ✅ Working directory clean

## 🚀 Essential Git Commands for Daily Use

### Before Making Changes
```bash
# Check current status
git status

# Create a new branch for features
git checkout -b feature/new-feature-name

# Or create a backup branch before major changes
git checkout -b backup/before-pdf-changes
```

### While Making Changes
```bash
# Check what files changed
git status

# See exactly what changed
git diff

# Add specific files
git add src/app/component-name.ts
git add src/app/component-name.html

# Or add all changes
git add .
```

### Committing Changes
```bash
# Commit with descriptive message
git commit -m "Add: PDF invoice view functionality"
git commit -m "Fix: Responsive design issues at 100% zoom"
git commit -m "Remove: PDF view modal due to layout issues"

# Or commit all tracked files at once
git commit -am "Update: Customer management improvements"
```

### Viewing History
```bash
# See commit history
git log --oneline

# See detailed history
git log

# See changes in a specific commit
git show commit-hash
```

## 🛡️ Safety Commands (Avoiding Today's Issue)

### Before Major Changes
```bash
# Create a backup branch
git checkout -b backup/before-major-changes
git checkout master  # Return to main branch

# Or create a tag for current state
git tag -a v1.1.0 -m "Stable state before PDF changes"
```

### If You Need to Undo Changes
```bash
# Undo unstaged changes to specific file
git checkout -- src/app/component.ts

# Undo all unstaged changes
git checkout -- .

# Undo last commit (but keep changes)
git reset --soft HEAD~1

# Undo last commit and discard changes (CAREFUL!)
git reset --hard HEAD~1

# Go back to a specific commit
git reset --hard commit-hash

# Go back to a tagged version
git reset --hard v1.0.0
```

### Creating Restore Points
```bash
# Create a tag before experimental changes
git tag -a experimental-start -m "Before trying PDF modal"

# Later, if needed, return to this point
git reset --hard experimental-start
```

## 🏷️ Version Tags
- `v1.0.0` - Current stable version with complete functionality
  - Customer management ✅
  - Invoice creation ✅
  - PDF generation ✅
  - WhatsApp sharing ✅
  - Dashboard with revenue analytics ✅

## 📁 Project Structure Protection
Always commit these important files:
- `src/app/pages/dashboard/` - Main dashboard component
- `src/app/services/` - All service files
- `src/app/pages/login/` - Authentication
- `package.json` - Dependencies
- `angular.json` - Angular configuration

## 🔄 Recommended Workflow

1. **Before starting work:**
   ```bash
   git status
   git checkout -b feature/new-feature
   ```

2. **During development:**
   ```bash
   git add .
   git commit -m "WIP: Working on new feature"
   ```

3. **Before major changes:**
   ```bash
   git tag -a backup-$(date +%Y%m%d) -m "Backup before changes"
   ```

4. **When feature is complete:**
   ```bash
   git checkout master
   git merge feature/new-feature
   git tag -a v1.1.0 -m "New feature completed"
   ```

## 🚨 Emergency Recovery
If you ever need to quickly restore to working state:
```bash
git reset --hard v1.0.0
```

## 📤 Setting Up Remote Repository (GitHub/GitLab)
When you're ready to backup to cloud:
```bash
# Add remote repository
git remote add origin https://github.com/yourusername/global-finserv-angular.git

# Push to remote
git push -u origin master
git push origin --tags
```

---
**Remember**: Commit early, commit often! It's better to have many small commits than lose work.
