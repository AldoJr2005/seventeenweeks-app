#!/bin/bash

# Script to prepare Xcode project for TestFlight
# This script helps verify and prepare your project settings

set -e

echo "🚀 Preparing 17 WEEKS for TestFlight..."
echo ""

# Check if we're in the right directory
if [ ! -f "ios/17WEEKS.xcodeproj/project.pbxproj" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check current settings
echo "📋 Current Project Settings:"
echo "----------------------------"

BUNDLE_ID=$(grep -A 1 "PRODUCT_BUNDLE_IDENTIFIER" ios/17WEEKS.xcodeproj/project.pbxproj | grep "com.seventeenweeks" | head -1 | sed 's/.*= \(.*\);/\1/' | xargs)
VERSION=$(grep -A 1 "MARKETING_VERSION" ios/17WEEKS.xcodeproj/project.pbxproj | grep "MARKETING_VERSION" | head -1 | sed 's/.*= \(.*\);/\1/' | xargs)
BUILD=$(grep -A 1 "CURRENT_PROJECT_VERSION" ios/17WEEKS.xcodeproj/project.pbxproj | grep "CURRENT_PROJECT_VERSION" | head -1 | sed 's/.*= \(.*\);/\1/' | xargs)

echo "Bundle Identifier: $BUNDLE_ID"
echo "Version: $VERSION"
echo "Build Number: $BUILD"
echo ""

# Verify settings
echo "✅ Verification:"
echo "----------------"

if [[ "$BUNDLE_ID" == *"seventeenweeks"* ]]; then
    echo "✅ Bundle ID is set: $BUNDLE_ID"
else
    echo "❌ Bundle ID needs to be set"
fi

if [ ! -z "$VERSION" ]; then
    echo "✅ Version is set: $VERSION"
else
    echo "❌ Version needs to be set"
fi

if [ ! -z "$BUILD" ]; then
    echo "✅ Build number is set: $BUILD"
else
    echo "❌ Build number needs to be set"
fi

echo ""
echo "📝 Next Steps (Manual):"
echo "----------------------"
echo "1. Open Xcode: open ios/17WEEKS.xcworkspace"
echo "2. Verify Signing & Capabilities:"
echo "   - Select project '17WEEKS' → Target '17WEEKS' → Signing & Capabilities"
echo "   - Ensure 'Automatically manage signing' is checked"
echo "   - Select your Team"
echo "3. Create Privacy Policy (see privacy-policy-template.html)"
echo "4. Archive: Product → Archive (select 'Any iOS Device' first)"
echo "5. Upload: Distribute App → App Store Connect → Upload"
echo ""
echo "📚 See QUICK_START_TESTFLIGHT.md for detailed instructions"
echo ""

