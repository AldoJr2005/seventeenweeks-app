#!/bin/bash

cd "$(dirname "$0")"

echo "======================================"
echo "17 WEEKS - iOS Build Setup"
echo "======================================"
echo ""

echo "Step 1: Installing npm dependencies..."
npm install

echo ""
echo "Step 2: Generating iOS native project..."
npx expo prebuild --platform ios --clean

echo ""
echo "Step 3: Installing CocoaPods dependencies..."
cd ios
arch -x86_64 pod install --repo-update
cd ..

echo ""
echo "Step 4: Opening Xcode..."
open ios/*.xcworkspace

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps in Xcode:"
echo "1. Select your Development Team in Signing & Capabilities"
echo "2. Connect your iPhone via USB"
echo "3. Select your iPhone as the build target"
echo "4. Click the Play button to build and run"
echo ""
echo "Note: Make sure your iPhone is registered in your Apple Developer account"
echo ""
