# GitHub PR Check Monitor - Browser Extension

## Overview
A cross-browser extension (Chrome/Firefox) that monitors GitHub pull request checks and sends desktop notifications when checks fail or all checks complete successfully. Clicking the notification focuses the PR tab.

## Project Status
✅ **Completed** - Ready for testing and installation

## Recent Changes
- **2025-11-03**: Initial implementation complete
  - Created Manifest V3 configuration for cross-browser support
  - Implemented content script with DOM monitoring for PR checks
  - Built background service worker for notifications and tab focusing
  - Set up build system with icon generation and packaging
  - Added comprehensive README with installation instructions

## Project Architecture

### Extension Components
- **manifest.json**: Manifest V3 configuration with permissions for notifications, tabs, and storage
- **content.js**: Content script that runs on GitHub PR pages, detects check status changes, polls every 10 seconds
- **background.js**: Service worker that handles notifications and tab focusing when notifications are clicked
- **icons/**: Extension icons in 16x16, 48x48, and 128x128 sizes (generated from source)

### Build System
- **Node.js + npm**: Build toolchain
- **sharp**: Image resizing library for generating icons
- **scripts/build-icons.js**: Generates icon files from source image
- **scripts/package.js**: Creates distributable ZIP file

### Key Features
1. Automatic detection of GitHub PR pages
2. Polling-based monitoring (10-second interval)
3. Smart notifications (one per state change):
   - ❌ When any check fails
   - ✅ When all checks complete successfully
4. Click-to-focus: Clicking notification brings you to the PR tab
5. Multi-DOM support: Handles different GitHub UI variants

### Installation Methods
- **Chrome**: Load unpacked from chrome://extensions
- **Firefox**: Load temporary add-on from about:debugging

### Workflow
- **build**: Runs `npm run package` to generate icons and create dist/github-pr-monitor.zip

## Technical Notes
- Uses Manifest V3 for modern browser compatibility
- Includes Firefox-specific `browser_specific_settings` for gecko
- Monitors DOM mutations to detect GitHub's PJAX navigation
- Stores notification state to prevent duplicates
- Gracefully handles closed tabs and missing tab references

## Dependencies
- **Runtime**: None (runs in browser)
- **Development**: 
  - Node.js 20
  - sharp (image processing)
  - zip (system package for packaging)

## File Structure
```
github-pr-monitor/
├── manifest.json          # Extension manifest
├── background.js          # Notification service worker
├── content.js            # PR monitoring script
├── icons/                # Generated extension icons
├── scripts/              # Build scripts
│   ├── build-icons.js    # Icon generation
│   └── package.js        # ZIP packaging
├── dist/                 # Build output (gitignored)
├── generated-icon.png    # Source icon file
├── package.json          # npm configuration
├── README.md             # User documentation
└── replit.md            # This file
```

## Testing Recommendations
1. Test on live GitHub PRs with real CI checks
2. Verify both failure and success notification paths
3. Test tab focusing behavior across different scenarios
4. Verify Firefox Manifest V3 compatibility
5. Check DOM selectors against current GitHub UI

## Future Enhancements (Not Implemented)
- Configurable polling interval via options page
- Badge icon showing check status
- Popup UI for monitoring multiple PRs
- Sound notifications (optional)
- Manual refresh button
