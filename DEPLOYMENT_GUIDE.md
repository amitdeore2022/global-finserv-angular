# Deployment Scripts

This directory contains automated deployment scripts for the Global Financial Services Angular application.

## Available Scripts

### 1. `deploy.ps1` (PowerShell - Recommended for Windows)
- **Platform**: Windows with PowerShell
- **Usage**: `.\deploy.ps1` or `powershell -ExecutionPolicy Bypass -File deploy.ps1`
- **Features**: Colored output, detailed error handling, automatic timestamp

### 2. `deploy.bat` (Batch File - Windows)
- **Platform**: Windows Command Prompt
- **Usage**: `deploy.bat` or double-click the file
- **Features**: Simple execution, pause on completion/error

### 3. `deploy.sh` (Shell Script - Linux/Mac)
- **Platform**: Linux/Mac/WSL
- **Usage**: `./deploy.sh`
- **Features**: Unix-style execution, emoji indicators

## What the Scripts Do

Each script performs the following operations in sequence:

1. **Development Build**: `ng build`
   - Builds the Angular application for development
   - Validates that the code compiles without errors

2. **Production Build**: `ng build --configuration production`
   - Builds the Angular application optimized for production
   - Includes minification, tree-shaking, and optimization

3. **Firebase Deployment**: `firebase deploy --only hosting`
   - Deploys the production build to Firebase hosting
   - Updates the live website with the latest changes

4. **Git Operations** (only if changes exist):
   - Adds all changes to git staging: `git add .`
   - Commits with timestamp: `git commit -m "Deploy: Build and deploy completed successfully - [timestamp]"`
   - Pushes to remote repository: `git push`

## Prerequisites

Before running these scripts, ensure you have:

1. **Node.js and npm** installed
2. **Angular CLI** installed: `npm install -g @angular/cli`
3. **Firebase CLI** installed: `npm install -g firebase-tools`
4. **Git** installed and configured
5. **Firebase project** configured in this directory
6. **Git repository** initialized and connected to remote

## Error Handling

- If any step fails, the script will stop execution and display an error message
- Git operations are only performed if all build and deployment steps succeed
- Git commit is only performed if there are actual changes to commit

## Usage Examples

### Windows PowerShell (Recommended)
```powershell
# Navigate to project directory
cd "e:\global-fin\global-finserv-angular"

# Run the deployment script
.\deploy.ps1
```

### Windows Command Prompt
```cmd
# Navigate to project directory
cd "e:\global-fin\global-finserv-angular"

# Run the deployment script
deploy.bat
```

### Linux/Mac/WSL
```bash
# Navigate to project directory
cd /path/to/global-finserv-angular

# Make script executable (first time only)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## Troubleshooting

### Common Issues

1. **Angular CLI not found**
   - Install: `npm install -g @angular/cli`

2. **Firebase CLI not found**
   - Install: `npm install -g firebase-tools`
   - Login: `firebase login`

3. **Build errors**
   - Check TypeScript errors in the code
   - Run `ng build` manually to see detailed errors

4. **Firebase deployment errors**
   - Ensure you're logged in: `firebase login`
   - Check Firebase project configuration: `firebase projects:list`

5. **Git errors**
   - Ensure git is configured: `git config --global user.name "Your Name"`
   - Ensure remote repository is set: `git remote -v`

6. **PowerShell execution policy (Windows)**
   - If script won't run, use: `powershell -ExecutionPolicy Bypass -File deploy.ps1`

## Manual Steps (if scripts fail)

If the automated script fails, you can run the commands manually:

```bash
# Build development
ng build

# Build production
ng build --configuration production

# Deploy to Firebase
firebase deploy --only hosting

# Git operations (if needed)
git add .
git commit -m "Deploy: Manual deployment - $(date)"
git push
```

## Notes

- The scripts include safety checks to prevent deployment of broken code
- Timestamps are automatically added to commit messages
- Scripts will skip git operations if there are no changes to commit
- Production build artifacts are stored in the `dist/` directory
- Firebase hosting configuration is read from `firebase.json`

## Support

For issues with these scripts, check:
1. Ensure all prerequisites are installed
2. Run commands manually to identify the failing step
3. Check the console output for specific error messages
4. Verify Firebase and Git configurations
