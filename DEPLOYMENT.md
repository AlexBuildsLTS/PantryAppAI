# 🚀 Pantry Pal Deployment Guide

Complete guide for deploying Pantry Pal to iOS App Store and Google Play Store.

## 📋 Prerequisites

### General Requirements
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/eas-cli`
- Git repository with your code

### iOS Requirements
- Apple Developer Account ($99/year)
- Mac computer with Xcode installed
- iOS device for testing (recommended)

### Android Requirements
- Google Play Console Account ($25 one-time)
- Android device for testing (recommended)

---

## 🍎 iOS App Store Deployment

### Step 1: Apple Developer Setup
1. Sign up for [Apple Developer Program](https://developer.apple.com/programs/)
2. Create App ID in Apple Developer Console
3. Generate certificates and provisioning profiles

### Step 2: Configure Project
```bash
# Login to Expo
eas login

# Initialize EAS in your project
eas build:configure
```

### Step 3: Update app.json
```json
{
  "expo": {
    "name": "Pantry Pal",
    "slug": "pantry-pal",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.pantrypal",
      "buildNumber": "1"
    }
  }
}
```

### Step 4: Build for iOS
```bash
# Create production build
eas build --platform ios --profile production

# This will take 10-20 minutes
# You'll get a download link when complete
```

### Step 5: Submit to App Store
```bash
# Submit directly (recommended)
eas submit --platform ios

# Follow prompts to enter Apple ID credentials
```

### Step 6: App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app with same bundle identifier
3. Upload screenshots and metadata
4. Submit for review

---

## 🤖 Google Play Store Deployment

### Step 1: Google Play Console Setup
1. Sign up for [Google Play Console](https://play.google.com/console) ($25)
2. Create new application
3. Complete store listing

### Step 2: Configure Android Build
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.pantrypal",
      "versionCode": 1
    }
  }
}
```

### Step 3: Build for Android
```bash
# Create production build
eas build --platform android --profile production

# Download .aab file when ready
```

### Step 4: Submit to Play Store
```bash
# Submit directly
eas submit --platform android

# Or upload manually to Play Console
```

---

## 📱 App Store Requirements

### iOS Screenshots Required
- iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796
- iPhone 6.5" (iPhone 14 Plus): 1242 x 2688
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208
- iPad 12.9" (iPad Pro): 2048 x 2732
- iPad 11" (iPad Air): 1668 x 2388

### Android Screenshots Required
- Phone: 1080 x 1920 (minimum)
- 7" Tablet: 1200 x 1920
- 10" Tablet: 1600 x 2560

### App Icons
- iOS: 1024 x 1024 PNG
- Android: 512 x 512 PNG

---

## 🔧 Build Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 🚨 Common Issues & Solutions

### iOS Build Fails
```bash
# Clear cache and retry
eas build:cancel
eas build --platform ios --clear-cache
```

### Android Keystore Issues
```bash
# Generate new keystore
eas credentials
# Select "Generate new keystore"
```

### App Rejected
- Check App Store Review Guidelines
- Ensure all required permissions are explained
- Test on physical devices
- Provide test account if needed

---

## ✅ Pre-Submission Checklist

### iOS
- [ ] App tested on physical iOS device
- [ ] All required screenshots uploaded
- [ ] Privacy policy URL provided
- [ ] App description and keywords optimized
- [ ] Age rating completed
- [ ] Pricing and availability set

### Android
- [ ] App tested on physical Android device
- [ ] Feature graphic uploaded (1024 x 500)
- [ ] Content rating completed
- [ ] Privacy policy URL provided
- [ ] Store listing optimized
- [ ] Release notes written

---

## 📊 Post-Launch

### Monitoring
- Set up crash reporting (Sentry)
- Monitor app store reviews
- Track download and usage analytics
- Monitor performance metrics

### Updates
```bash
# Increment version numbers
# iOS: buildNumber in app.json
# Android: versionCode in app.json

# Build and submit updates
eas build --platform all
eas submit --platform all
```

---

## 🆘 Support

If you encounter issues:
1. Check [Expo Documentation](https://docs.expo.dev)
2. Search [Expo Forums](https://forums.expo.dev)
3. Create issue in project repository
4. Contact support@pantrypal.com

---

**🎉 Congratulations! Your app is now live on the app stores!**