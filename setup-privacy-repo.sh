#!/bin/bash

# Quick script to set up privacy policy for GitHub Pages
# Usage: ./setup-privacy-repo.sh YOUR_GITHUB_USERNAME

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub username"
    echo "Usage: ./setup-privacy-repo.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="17weeks-privacy"
PRIVACY_FILE="privacy-policy-template.html"

echo "🚀 Setting up privacy policy repository..."
echo ""

# Check if privacy policy file exists
if [ ! -f "$PRIVACY_FILE" ]; then
    echo "❌ Error: $PRIVACY_FILE not found"
    echo "Make sure you're in the project root directory"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📁 Creating repository structure..."
cp "$OLDPWD/$PRIVACY_FILE" index.html

echo "📝 Initializing git repository..."
git init
git add index.html
git commit -m "Add 17 WEEKS privacy policy"

echo ""
echo "✅ Repository ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to: https://github.com/new"
echo "   - Name: $REPO_NAME"
echo "   - Make it PUBLIC (required for free GitHub Pages)"
echo "   - Don't initialize with README"
echo ""
echo "2. Push to GitHub:"
echo "   cd $TEMP_DIR"
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to repository Settings → Pages"
echo "   - Source: branch 'main', folder '/ (root)'"
echo "   - Save"
echo ""
echo "4. Your privacy policy URL will be:"
echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""
echo "💡 Files are in: $TEMP_DIR"
echo "   You can delete this folder after pushing to GitHub"

