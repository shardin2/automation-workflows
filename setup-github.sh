#!/bin/bash

# Setup script for GitHub integration
# Run this after Xcode Command Line Tools installation is complete

set -e

REPO_NAME="automation-workflows"
# Get API key from environment or prompt user
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-YOUR_ANTHROPIC_API_KEY}"

echo "🚀 Setting up GitHub repository..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: n8n workflow documentation and Claude Code setup"
fi

# Create GitHub repository
echo "Creating GitHub repository..."
~/.local/bin/gh repo create "$REPO_NAME" --public --source=. --remote=origin --push || echo "Repository may already exist"

# Set ANTHROPIC_API_KEY secret
echo "Setting ANTHROPIC_API_KEY secret..."
echo "$ANTHROPIC_API_KEY" | ~/.local/bin/gh secret set ANTHROPIC_API_KEY --repo "shardin2/$REPO_NAME"

# Install Claude GitHub App
echo "📱 Install the Claude GitHub App:"
echo "   https://github.com/apps/claude"
echo "   Select your repository: shardin2/$REPO_NAME"

echo ""
echo "✅ Setup complete!"
echo "Repository: https://github.com/shardin2/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Install Claude GitHub App at https://github.com/apps/claude"
echo "2. Test by creating a PR and commenting '@claude review this'"