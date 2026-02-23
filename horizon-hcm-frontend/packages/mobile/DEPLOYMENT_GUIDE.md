# Mobile App Deployment Guide

Complete guide for deploying Horizon HCM mobile application to App Store and Google Play.

## Table of Contents

- [Prerequisites](#prerequisites)
- [iOS Deployment](#ios-deployment)
- [Android Deployment](#android-deployment)
- [App Store Metadata](#app-store-metadata)
- [Screenshots and Assets](#screenshots-and-assets)
- [Testing Before Submission](#testing-before-submission)
- [Submission Checklist](#submission-checklist)

## Prerequisites

### Required Accounts

1. **Expo Account** (free)
   - Sign up at https://expo.dev
   - Required for EAS Build

2. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Required for iOS deployment

3. **Google Play Developer Account** ($25 one-time)
   - Sign up at https://play.google.com/console
   - Required for Android deployment

### Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas --version
```

### Project Configuration

Ensure `app.json` and `eas.json` are properly configured (already done).

## iOS Deployment

### Step 1: Configure App Store Connect

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Fill in app information:
     - Platform: iOS
     - Name: Horizon HCM
     - Primary Language: English
     - Bundle ID: com.horizonhcm.mobile
     - SKU: horizon-hcm-mobile

2. **Configure App Information:**
   - Category: Business
   - Subcategory: Productivity
   - Content Rights: No
   - Age Rating: 4+

3. **Add App Privacy Details:**
   - Data Types Collected:
     - Contact Info (email, phone)
     - User Content (photos for maintenance requests)
     - Identifiers (user ID)
   - Data Usage:
     - App Functionality
     - Analytics (if enabled)
   - Data Linked to User: Yes
   - Data Used to Track User: No

### Step 2: Prepare App Metadata

Create the following content:

**App Name:** Horizon HCM

**Subtitle:** House Committee Management

**Description:**
```
Horizon HCM is a comprehensive house committee management application designed for building residents and committee members.

Features:
• View and pay invoices
• Submit maintenance requests with photos
• Participate in polls and voting
• Access announcements and notifications
• View financial reports
• Schedule and RSVP to meetings
• Access building documents
• Real-time chat with committee members

Perfect for:
• Building residents
• Committee members
• Property managers
• Apartment owners and tenants
```

**Keywords:**
```
house committee, building management, HOA, condo management, apartment, residents, maintenance, invoices, payments, announcements
```

**Support URL:** https://yourdomain.com/support

**Marketing URL:** https://yourdomain.com

**Privacy Policy URL:** https://yourdomain.com/privacy

### Step 3: Prepare Screenshots

Required screenshot sizes for iPhone:
- 6.7" Display (1290 x 2796 pixels) - iPhone 14 Pro Max
- 6.5" Display (1242 x 2688 pixels) - iPhone 11 Pro Max
- 5.5" Display (1242 x 2208 pixels) - iPhone 8 Plus

Required screenshot sizes for iPad:
- 12.9" Display (2048 x 2732 pixels) - iPad Pro 12.9"
- 11" Display (1668 x 2388 pixels) - iPad Pro 11"

Recommended screenshots:
1. Dashboard with stats
2. Invoice list
3. Payment screen
4. Maintenance request form
5. Announcements list
6. Chat screen
7. Financial reports
8. Settings screen

### Step 4: Build for iOS

```bash
cd packages/mobile

# Build for production
eas build --platform ios --profile production

# Wait for build to complete (15-30 minutes)
# Build will be available in Expo dashboard
```

### Step 5: Submit to App Store

**Option 1: Automatic Submission (Recommended)**

```bash
# Submit latest build
eas submit --platform ios --latest

# Follow prompts to select build and configure submission
```

**Option 2: Manual Submission**

1. Download IPA from Expo dashboard
2. Upload to App Store Connect using Transporter app
3. Select build in App Store Connect
4. Complete app information
5. Submit for review

### Step 6: App Review Process

1. **Review Time:** Typically 24-48 hours
2. **Common Rejection Reasons:**
   - Missing privacy policy
   - Incomplete app information
   - Crashes during review
   - Missing permissions descriptions

3. **If Rejected:**
   - Read rejection reason carefully
   - Fix issues
   - Resubmit

## Android Deployment

### Step 1: Configure Google Play Console

1. **Create App in Google Play Console:**
   - Go to https://play.google.com/console
   - Click "Create app"
   - Fill in app details:
     - App name: Horizon HCM
     - Default language: English
     - App or game: App
     - Free or paid: Free

2. **Set Up App:**
   - Complete store listing
   - Set up content rating
   - Select target audience
   - Complete privacy policy

### Step 2: Prepare Store Listing

**App Name:** Horizon HCM

**Short Description:**
```
House committee management for residents and committee members
```

**Full Description:**
```
Horizon HCM is a comprehensive house committee management application designed for building residents and committee members.

Features:
• View and pay invoices
• Submit maintenance requests with photos
• Participate in polls and voting
• Access announcements and notifications
• View financial reports
• Schedule and RSVP to meetings
• Access building documents
• Real-time chat with committee members

Perfect for:
• Building residents
• Committee members
• Property managers
• Apartment owners and tenants

Stay connected with your building community and manage all your house committee needs in one place.
```

**App Category:** Business

**Contact Details:**
- Email: support@yourdomain.com
- Phone: (optional)
- Website: https://yourdomain.com

**Privacy Policy:** https://yourdomain.com/privacy

### Step 3: Prepare Screenshots

Required screenshot sizes:
- Phone: 1080 x 1920 pixels (minimum 2 screenshots)
- 7" Tablet: 1200 x 1920 pixels (optional)
- 10" Tablet: 1600 x 2560 pixels (optional)

Recommended screenshots (same as iOS):
1. Dashboard with stats
2. Invoice list
3. Payment screen
4. Maintenance request form
5. Announcements list
6. Chat screen
7. Financial reports
8. Settings screen

### Step 4: Prepare Feature Graphic

Required:
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Content: App branding and key features

### Step 5: Content Rating

Complete the content rating questionnaire:
- Violence: None
- Sexual Content: None
- Profanity: None
- Controlled Substances: None
- Gambling: None
- User-Generated Content: Yes (chat, maintenance requests)

Expected Rating: Everyone

### Step 6: Build for Android

```bash
cd packages/mobile

# Build for production (AAB format)
eas build --platform android --profile production

# Wait for build to complete (15-30 minutes)
# Build will be available in Expo dashboard
```

### Step 7: Submit to Google Play

**Option 1: Automatic Submission (Recommended)**

```bash
# Submit latest build to internal testing track
eas submit --platform android --latest --track internal

# Or submit to production
eas submit --platform android --latest --track production
```

**Option 2: Manual Submission**

1. Download AAB from Expo dashboard
2. Go to Google Play Console
3. Navigate to "Release" → "Production"
4. Click "Create new release"
5. Upload AAB file
6. Complete release notes
7. Review and rollout

### Step 8: Testing Tracks

Google Play offers multiple testing tracks:

1. **Internal Testing:**
   - Up to 100 testers
   - Instant availability
   - No review required

2. **Closed Testing:**
   - Up to 100,000 testers
   - Available within hours
   - Minimal review

3. **Open Testing:**
   - Unlimited testers
   - Public listing
   - Full review process

4. **Production:**
   - All users
   - Full review process
   - Gradual rollout available

### Step 9: Review Process

1. **Review Time:** Typically 1-3 days
2. **Common Rejection Reasons:**
   - Missing privacy policy
   - Incomplete store listing
   - Crashes during review
   - Missing permissions declarations

3. **If Rejected:**
   - Read rejection reason carefully
   - Fix issues
   - Resubmit

## App Store Metadata

### App Icon

Requirements:
- Size: 1024 x 1024 pixels
- Format: PNG (no transparency)
- No rounded corners (applied automatically)
- No text or UI elements

### App Preview Video (Optional)

Requirements:
- Length: 15-30 seconds
- Format: MP4 or MOV
- Orientation: Portrait
- Content: Key features demonstration

### Promotional Text (iOS)

```
New in this version: Real-time chat, enhanced notifications, and improved performance!
```

### What's New (Release Notes)

```
Version 1.0.0

Initial release of Horizon HCM mobile app!

Features:
• Complete building management
• Invoice viewing and payment
• Maintenance request submission
• Real-time notifications
• Chat with committee members
• Financial reports
• Meeting scheduling
• Document access

We're excited to bring Horizon HCM to your mobile device!
```

## Screenshots and Assets

### Creating Screenshots

**Using iOS Simulator:**
```bash
# Start simulator
npm run ios

# Take screenshots
Cmd + S (saves to Desktop)
```

**Using Android Emulator:**
```bash
# Start emulator
npm run android

# Take screenshots
Camera icon in emulator toolbar
```

**Using Physical Devices:**
- iOS: Volume Up + Power button
- Android: Volume Down + Power button

### Screenshot Guidelines

1. **Show Real Content:**
   - Use realistic data
   - Show actual features
   - Avoid lorem ipsum

2. **Highlight Key Features:**
   - Dashboard overview
   - Payment flow
   - Maintenance requests
   - Chat functionality
   - Reports and analytics

3. **Use Consistent Branding:**
   - App colors
   - Professional appearance
   - Clear UI elements

4. **Add Captions (Optional):**
   - Brief feature descriptions
   - Value propositions
   - Call to action

## Testing Before Submission

### Pre-Submission Checklist

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test all core features
- [ ] Test authentication flow
- [ ] Test payment processing
- [ ] Test camera and photo upload
- [ ] Test push notifications
- [ ] Test biometric authentication
- [ ] Test offline behavior
- [ ] Test error handling
- [ ] Verify all links work
- [ ] Check for crashes
- [ ] Test on different screen sizes
- [ ] Test in different orientations
- [ ] Verify privacy policy is accessible
- [ ] Verify support contact is correct

### TestFlight (iOS)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios --latest
```

TestFlight allows up to 10,000 external testers.

### Internal Testing (Android)

```bash
# Build for internal testing
eas build --platform android --profile preview

# Submit to internal track
eas submit --platform android --latest --track internal
```

## Submission Checklist

### iOS Submission

- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] App information complete
- [ ] Screenshots uploaded (all required sizes)
- [ ] App icon uploaded
- [ ] Privacy policy URL provided
- [ ] Support URL provided
- [ ] App description written
- [ ] Keywords added
- [ ] Content rating completed
- [ ] Pricing and availability set
- [ ] Build uploaded and selected
- [ ] Export compliance answered
- [ ] Submitted for review

### Android Submission

- [ ] Google Play Developer account active
- [ ] App created in Play Console
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] App icon uploaded
- [ ] Privacy policy URL provided
- [ ] App description written
- [ ] Content rating completed
- [ ] Target audience selected
- [ ] Pricing and distribution set
- [ ] Build uploaded
- [ ] Release notes added
- [ ] Submitted for review

## Post-Submission

### Monitoring

1. **Check Review Status:**
   - iOS: App Store Connect
   - Android: Google Play Console

2. **Respond to Review Feedback:**
   - Check email for updates
   - Respond promptly to questions
   - Provide additional information if requested

3. **Track Metrics:**
   - Downloads
   - Ratings and reviews
   - Crash reports
   - User feedback

### Updates

To release updates:

```bash
# Update version in app.json
# iOS: Increment buildNumber
# Android: Increment versionCode

# Build new version
eas build --platform all --profile production

# Submit update
eas submit --platform all --latest
```

### Responding to Reviews

- Respond to user reviews promptly
- Thank users for positive feedback
- Address concerns in negative reviews
- Provide support contact for issues

## Troubleshooting

### Build Failures

1. Check build logs in Expo dashboard
2. Verify app.json configuration
3. Ensure all dependencies are compatible
4. Check for TypeScript errors

### Submission Rejections

1. Read rejection reason carefully
2. Fix all mentioned issues
3. Test thoroughly
4. Resubmit with explanation

### Common Issues

**iOS:**
- Missing privacy descriptions
- Crashes during review
- Incomplete app information
- Export compliance issues

**Android:**
- Missing privacy policy
- Incomplete store listing
- Crashes during review
- Permissions not declared

## Support Resources

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies:** https://play.google.com/about/developer-content-policy/

## Contact

For deployment assistance:
- Email: dev-team@yourdomain.com
- Slack: #mobile-deployment
- Documentation: See README.md
