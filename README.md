<p align="center">
  <img src="assets/autodarts-tools-logo.png" alt="Tools for Autodarts Logo" width="200">
</p>

<h1 align="center">
Tools for Autodarts
</h1>

<p align="center"><img src="https://img.shields.io/github/actions/workflow/status/creazy231/tools-for-autodarts/release.yml" alt="GitHub Actions Workflow Status">&nbsp;<img src="https://img.shields.io/github/package-json/v/creazy231/tools-for-autodarts" alt="GitHub package.json version">&nbsp;<a href="https://github.com/creazy231/tools-for-autodarts/releases"><img src="https://img.shields.io/github/v/release/creazy231/tools-for-autodarts" alt="GitHub Release"></a></p>

<p align="center"><a href="https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh"><img src="https://img.shields.io/chrome-web-store/v/oolfddhehmbpdnlmoljmllcdggmkgihh?logo=google-chrome&logoColor=%23FFFFFF&label=Chrome" alt="Chrome Web Store Version"></a>&nbsp;<a href="https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts"><img src="https://img.shields.io/amo/v/tools-for-autodarts?logo=firefox&logoColor=%23FFFFFF&label=Firefox" alt="Mozilla Add-on Version"></a>&nbsp;<a href="https://apps.apple.com/de/app/tools-for-autodarts/id6479754594"><img src="https://img.shields.io/itunes/v/6479754594?logo=apple&label=MacOS%20%26%20iOS" alt="Apple App Store Version"></a></p>

<p align="center"><a href="https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh"><img src="https://img.shields.io/chrome-web-store/users/oolfddhehmbpdnlmoljmllcdggmkgihh?logo=google-chrome&logoColor=%23FFFFFF&label=Chrome%20Users" alt="Chrome Web Store Users"></a>&nbsp;<a href="https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts"><img src="https://img.shields.io/amo/users/tools-for-autodarts?logo=firefox&logoColor=%23FFFFFF&label=Firefox%20Users&color=4c1" alt="Mozilla Add-on Users"></a></p>

<hr>

> [!CAUTION]
> **Tools for Autodarts** is developed by the community and is not an integral part of the official Autodarts platform.

## 📋 Overview

Tools for Autodarts is a browser extension that enhances your gaming experience on [autodarts.io](https://autodarts.io). It adds numerous quality-of-life features, customization options, and advanced functionality to make your Autodarts experience more enjoyable and personalized.

## 💾 Installation

### 🌐 Browser Extensions
- [Chrome Web Store](https://chromewebstore.google.com/detail/tools-for-autodarts/oolfddhehmbpdnlmoljmllcdggmkgihh)
- [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/tools-for-autodarts)
- [MacOS & iOS App Store](https://apps.apple.com/de/app/tools-for-autodarts/id6479754594)

## ✨ Features

### 🚪 Lobby Enhancements
- **Auto-Start**: Automatically starts the game 3 seconds after a player joins the lobby
- **Discord Webhook Integration**: Sends invitation links for private lobbies to your Discord server
- **Shuffle Players**: Randomly reorder players in the lobby
- **Extended Recent Players List**: Increase the number of recent local players beyond the default limit of 5
- **Team Lobby Mode**: Removes initial player and auto-selects board for team games

### 🎨 Match Customization
- **Color Customization**: Change the colors of dart throws and scores
- **Streaming Mode**: Includes green screen support, board visualization, and thrown darts display
- **Virtual Board Surround**: Adds a customizable surround to the dartboard
- **Hide Menu**: Provides more space for the game view
- **Adjustable UI Elements**: Modify the size of legs, sets, and match information
- **Larger Player Names**: Increase the font size of player names for better visibility during matches

### 🎮 Gameplay Features
- **Takeout Visualization**: Visual notification when takeout is in progress
- **Disable Takeout Recognition**: Requires manual confirmation after takeout
- **Automatic Next Player**: Switches to the next player after a configurable delay when takeout is stuck
- **Automatic Next Leg/Set**: Automatically advances to the next leg or set after takeout
- **Smaller Font for Inactive Players**: Reduces the font size of scores for players not currently throwing
- **External Boards Support**: Easily follow games on external boards
- **Fancy Gameshot Animation**: Celebratory animation when a player wins
- **Animations**: Display custom animations for special events like 180s, bulls, busts, and leg wins during gameplay

### 🔊 Audio Features
- **Caller**: Voice announcements for scores
- **Custom Sounds**: Various sound effects for different game events
- **Sound Upload**: Add your own custom sounds for personalized feedback

### 🎬 Animations

The Animations feature allows you to display custom GIF animations for special events during gameplay:

#### Configuration
- **Delay**: Set how long to wait before showing the animation (in seconds)
- **Duration**: Set how long the animation should display (in seconds)
- **Object Fit**: Choose between 'cover' (fill screen) or 'contain' (maintain aspect ratio)

#### Supported Triggers
Animations can be triggered by various game events using these tags:

- **Points**: `0` to `180` (total points scored in a turn)
- **Singles**: `s0` to `s20` and `25` (single segments, `25` for bull)
- **Doubles**: `d1` to `d20` (double segments, `bull` for bullseye)
- **Triples**: `t1` to `t20` (triple segments)
- **Special Events**:
  - `bull`: When a player hits the bullseye
  - `miss`: When a dart misses the board
  - `bust`: When a player busts (scores more than needed)
  - `winner`: When a player wins the game

#### Combination Tags
You can also use combination tags to trigger animations based on specific dart throw combinations. Format: `[first dart]_[second dart]_[third dart]`

Example: `s20_s5_d20` would trigger when a player throws single 20, then single 5, then double 20.

You can add multiple triggers for the same animation by entering each trigger on a new line in the animation settings.

> [!NOTE]  
> If you assign the same trigger to multiple animations, the system will randomly select one of the matching animations to play each time the trigger occurs. This allows for variety in your gameplay experience.

### 🔄 Utility Features
- **Settings Import/Export**: Transfer your configuration between devices or create backups
- **Clipboard Support**: Copy and paste settings for easy sharing

## ⚙️ Configuration

The extension provides a comprehensive settings panel where you can configure all features according to your preferences:

- Enable/disable individual features
- Customize colors and appearance
- Set timing for automatic actions
- Configure Discord webhook integration
- Adjust sound settings and upload custom sounds
- Customize streaming mode settings

### 📤 Settings Import/Export

The extension allows you to easily transfer your settings between devices or create backups:

- **Export Settings**: Download your current configuration as a file
- **Import Settings**: Load settings from a previously exported file
- **Copy to Clipboard**: Copy your settings to the clipboard for easy sharing
- **Paste from Clipboard**: Apply settings that were copied from another installation
- **Reset Settings**: Restore all settings to their default values through the Danger Zone section

This makes it simple to:
- Back up your perfect configuration
- Share your setup with friends
- Transfer settings between browsers or devices
- Restore settings after reinstalling the extension
- Start fresh with default settings when needed

## 👨‍💻 Development

This project is built using:
- Vue.js 3
- TypeScript
- Tailwind CSS
- WXT (Web Extension Toolbox)

### 🚀 Getting Started

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an issue if you have ideas for improvements or have found a bug.

Feel free to fork and make a Pull Request to this plugin project. All the input is warmly welcome!

## ⭐️ Show your support
Give a star if this project helped you.

<a href="https://ko-fi.com/creazy231">
  <img width="270px" src="https://storage.ko-fi.com/cdn/brandasset/kofi_button_stroke.png" alt="Support me on Ko-fi">
</a>

## 👏 Credits

🎯 [Autodarts](https://autodarts.io) - The original platform this extension enhances<br>
🎨 Benjamin Zehentner (Discord: ben_1987) - Creator of the Tools for Autodarts logo

## 📄 License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](LICENSE) - see the [LICENSE](LICENSE) file for details.

Under this license:
- **Attribution** — You must give appropriate credit, provide a link to this project, and indicate if changes were made.
- **NonCommercial** — You may not use this project for commercial purposes or monetary compensation.
