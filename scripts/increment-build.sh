#!/bin/bash

# Script to increment build number for TestFlight
# Usage: ./scripts/increment-build.sh

set -e

PROJECT_FILE="ios/17WEEKS.xcodeproj/project.pbxproj"

if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Error: Project file not found. Run from project root."
    exit 1
fi

# Get current build number
CURRENT_BUILD=$(grep -A 1 "CURRENT_PROJECT_VERSION" "$PROJECT_FILE" | grep "CURRENT_PROJECT_VERSION" | head -1 | sed 's/.*= \(.*\);/\1/' | xargs)

if [ -z "$CURRENT_BUILD" ]; then
    echo "❌ Error: Could not find current build number"
    exit 1
fi

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))

echo "📦 Current Build Number: $CURRENT_BUILD"
echo "📦 New Build Number: $NEW_BUILD"
echo ""

# Confirm
read -p "Increment build number to $NEW_BUILD? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Update build number in project file (both Debug and Release)
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$PROJECT_FILE"

echo "✅ Build number updated to $NEW_BUILD"
echo ""
echo "Next steps:"
echo "1. Open Xcode: open ios/17WEEKS.xcworkspace"
echo "2. Product → Archive (select 'Any iOS Device')"
echo "3. Distribute App → App Store Connect → Upload"

