# Tools for Autodarts

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/creazy231/tools-for-autodarts/release.yml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/creazy231/tools-for-autodarts)
[![GitHub Release](https://img.shields.io/github/v/release/creazy231/tools-for-autodarts)](https://github.com/creazy231/tools-for-autodarts/releases)


[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/oolfddhehmbpdnlmoljmllcdggmkgihh?logo=google-chrome&logoColor=%23FFFFFF&label=Chrome)](https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/tools-for-autodarts?logo=firefox&logoColor=%23FFFFFF&label=Firefox)](https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts)
[![](https://img.shields.io/itunes/v/6479754594?logo=apple&label=MacOS%20%26%20iOS
)](https://apps.apple.com/de/app/tools-for-autodarts/id6479754594)

[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/oolfddhehmbpdnlmoljmllcdggmkgihh?logo=google-chrome&logoColor=%23FFFFFF&label=Chrome%20Users)](https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/tools-for-autodarts?logo=firefox&logoColor=%23FFFFFF&label=Firefox%20Users&color=4c1)](https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts)

> [!CAUTION]
> **Tools for Autodarts** is developed by the community and is not an integral part of the official Autodarts platform.

## Overview

Tools for Autodarts is a browser extension that enhances your gaming experience on [autodarts.io](https://autodarts.io). It adds numerous quality-of-life features, customization options, and advanced functionality to make your Autodarts experience more enjoyable and personalized.

## Installation

### Browser Extensions
- [Chrome Web Store](https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh)
- [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts)

### Native Apps
- [MacOS & iOS App Store](https://apps.apple.com/de/app/tools-for-autodarts/id6479754594)

## Features

### Lobby Enhancements
- **Auto-Start**: Automatically starts the game 3 seconds after a player joins the lobby
- **Discord Webhook Integration**: Sends invitation links for private lobbies to your Discord server
- **Shuffle Players**: Randomly reorder players in the lobby
- **Extended Recent Players List**: Increase the number of recent local players beyond the default limit of 5
- **Team Lobby Mode**: Removes initial player and auto-selects board for team games

### Match Customization
- **Color Customization**: Change the colors of dart throws and scores
- **Streaming Mode**: Includes green screen support, board visualization, and thrown darts display
- **Virtual Board Surround**: Adds a customizable surround to the dartboard
- **Hide Menu**: Provides more space for the game view
- **Adjustable UI Elements**: Modify the size of legs, sets, and match information

### Gameplay Features
- **Takeout Visualization**: Visual notification when takeout is in progress
- **Disable Takeout Recognition**: Requires manual confirmation after takeout
- **Automatic Next Player**: Switches to the next player after a configurable delay when takeout is stuck
- **Automatic Next Leg/Set**: Automatically advances to the next leg or set after takeout
- **Smaller Font for Inactive Players**: Reduces the font size of scores for players not currently throwing
- **External Boards Support**: Easily follow games on external boards
- **Fancy Gameshot Animation**: Celebratory animation when a player wins

### Audio Features
- **Caller**: Voice announcements for scores
- **Custom Sounds**: Various sound effects for different game events
- **Sound Upload**: Add your own custom sounds for personalized feedback

## Configuration

The extension provides a comprehensive settings panel where you can configure all features according to your preferences:

- Enable/disable individual features
- Customize colors and appearance
- Set timing for automatic actions
- Configure Discord webhook integration
- Adjust sound settings and upload custom sounds
- Customize streaming mode settings

## Development

This project is built using:
- Vue.js 3
- TypeScript
- Tailwind CSS
- WXT (Web Extension Toolbox)

### Getting Started

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Build for Firefox
yarn build:firefox

# Create distribution zip
yarn zip
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an issue if you have ideas for improvements or have found a bug.

## ⭐️ Show your support
Give a star if this project helped you.

<a href="https://ko-fi.com/creazy231">
  <img width="270px" src="https://storage.ko-fi.com/cdn/brandasset/kofi_button_stroke.png" alt="Support me on Ko-fi">
</a>

## Credits

🎯 [Autodarts](https://autodarts.io) - The original platform this extension enhances

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
