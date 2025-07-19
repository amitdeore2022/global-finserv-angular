#!/bin/bash

# Global Financial Services - Build and Deploy Script
# This script builds the Angular app, deploys to Firebase, and commits changes to git

echo "=== Global Financial Services - Build & Deploy Script ==="
echo "Starting build and deployment process..."
echo ""

# Function to check if last command was successful
check_success() {
    if [ $? -ne 0 ]; then
        echo "ERROR: $1 failed!"
        echo "Exiting script due to error."
        exit 1
    else
        echo "SUCCESS: $1 completed successfully!"
        echo ""
    fi
}

# Step 1: Development Build
echo "Step 1: Building Angular app (development)..."
ng build
check_success "Development build"

# Step 2: Production Build
echo "Step 2: Building Angular app (production)..."
ng build --configuration production
check_success "Production build"

# Step 3: Firebase Deploy
echo "Step 3: Deploying to Firebase hosting..."
firebase deploy --only hosting
check_success "Firebase deployment"

# Step 4: Git Operations
echo "Step 4: Committing changes to git..."

# Check if there are any changes to commit
if [ -n "$(git status --porcelain)" ]; then
    echo "Changes detected. Adding all files to git..."
    git add .
    check_success "Git add"
    
    # Get current date and time for commit message
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    commit_message="Deploy: Build and deploy completed successfully - $timestamp"
    
    echo "Committing with message: $commit_message"
    git commit -m "$commit_message"
    check_success "Git commit"
    
    echo "Pushing changes to remote repository..."
    
    # Check if upstream is set, if not set it
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    upstream=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null)
    
    if [ -z "$upstream" ]; then
        echo "Setting upstream for branch: $current_branch"
        git push --set-upstream origin "$current_branch"
        check_success "Git push with upstream setup"
    else
        git push
        check_success "Git push"
    fi
else
    echo "No changes detected in git. Skipping commit."
fi

# Success message
echo ""
echo "SUCCESS! All operations completed successfully!"
echo "- Development build completed"
echo "- Production build completed"
echo "- Firebase deployment completed"
echo "- Git operations completed"
echo ""
echo "Your application has been successfully built, deployed, and committed to git!"
echo "=== Deployment Complete ==="
