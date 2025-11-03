# GitHub PR Check Monitor

A cross-browser extension for monitoring GitHub pull request checks. Get notified when checks fail or all checks complete successfully.

## Features

- 🔔 **Smart Notifications**: Receive browser notifications when:
  - Any PR check fails
  - All PR checks complete successfully
- 🎯 **One-Click Navigation**: Click the notification to focus the PR tab
- ⚡ **Automatic Monitoring**: Monitors PR pages automatically with 10-second polling
- 🌐 **Cross-Browser**: Works on both Chrome and Firefox

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the root directory of this extension

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the extension directory and select `manifest.json`

**Note**: In Firefox, temporary extensions are removed when you close the browser. For permanent installation, you'll need to package and sign the extension.

## How It Works

1. **Navigate to a PR**: Open any GitHub pull request (e.g., `https://github.com/owner/repo/pull/123`)
2. **Automatic Detection**: The extension automatically detects PR pages and starts monitoring
3. **Check Monitoring**: Every 10 seconds, the extension checks the status of PR checks
4. **Smart Notifications**: You'll receive a notification when:
   - ❌ A check fails (notification sent immediately)
   - ✅ All checks pass (notification sent once all complete)
5. **Quick Navigation**: Click the notification to instantly focus the PR tab

## Notifications

The extension sends only **one notification per state change** to avoid spam:

- **Check Failed**: "❌ PR Checks Failed - X check(s) failed in owner/repo#123"
- **All Passed**: "✅ All PR Checks Passed - All X check(s) passed in owner/repo#123"

## Development

### Build Icons

```bash
npm run build:icons
```

This generates icon files in multiple sizes (16x16, 48x48, 128x128) from `generated-icon.png`.

### Package Extension

```bash
npm run package
```

This creates a distributable ZIP file in the `dist/` directory.

### Project Structure

```
github-pr-monitor/
├── manifest.json         # Extension manifest (Manifest V3)
├── background.js         # Service worker for notifications
├── content.js           # Content script for PR monitoring
├── icons/               # Extension icons (generated)
├── scripts/             # Build scripts
│   ├── build-icons.js   # Icon generation script
│   └── package.js       # Packaging script
└── README.md            # This file
```

## Technical Details

- **Manifest Version**: V3 (for Chrome and Firefox compatibility)
- **Permissions**: 
  - `notifications`: Send browser notifications
  - `tabs`: Focus tabs when notifications are clicked
  - `storage`: Store notification state
- **Host Permissions**: `https://github.com/*/*`
- **Polling Interval**: 10 seconds

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Firefox (with browser_specific_settings for gecko)

## Privacy

This extension:
- ✅ Only monitors GitHub PR pages you visit
- ✅ Runs entirely in your browser (no external servers)
- ✅ Does not collect or transmit any data
- ✅ Does not require GitHub authentication

## License

MIT
