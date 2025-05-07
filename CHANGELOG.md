# Changelog

All notable changes to this project will be documented in this file.

## [2.1.10] - 2025-05-05

### Added
- Added color customization feature to allow players to change game appearance
  - Set match background color for a personalized gaming environment
- Added support for point ranges as animation triggers, e.g. 0-60
- Added validation for "Triggers" according to the rules in the README
- Added QR Code feature that automatically displays the lobby QR code for easily sharing with other players

### Fixed
- Fixed issue where sound effects were playing twice during gameplay
- Fixed broken sorting of gifs

### Thanks
- Thanks to @boemjay for contributing the animation improvements
- Thanks to @WilliamLundqvist for the background color customization feature

## [2.1.9] - 2025-05-05

### Added
- Added lobby sound effects to play audio cues when players join or leave lobbies
  - Added `ambient_lobby_in` sound played when a player joins the lobby
  - Added `ambient_lobby_out` sound played when a player leaves the lobby

## [2.1.8] - 2025-04-28

### Added
- Added Enhanced Scoring Display feature that enhances dart throw displays with larger numbers and scoring notation
  - Shows dart notation (S/D/T, BULL) beneath point values
  - Includes smooth animations when scores update during matches
  - Originally contributed by @LeSiiN

### Changed
- Improved Streaming Mode component to use reactive image-based board display instead of DOM manipulation
- Enhanced board display in Streaming Mode to use the same image watcher mechanism as Zoom feature
- Added fallback board image for better reliability

### Fixed
- Fixed potential rendering issues in Streaming Mode by removing direct DOM queries for SVG elements
- Improved stability of the board display in Streaming Mode

## [2.1.7] - 2025-04-16

### Changed
- Enhanced Discord webhooks with live update support when enabled

### Fixed
- Fixed keyboard shortcut conflicts in QuickCorrection feature to only prevent default behavior for numpad keys
- Fixed Automatic Next Leg feature to properly advance game progression
- Adjusted Caller and Sound FX features to prevent playing sounds from old matches
- Fixed issue with sounds and other features becoming inactive after completing one match

## [2.1.3] - 2025-04-09

### Added
- Added "Zoom On" filter for the Darts Zoom feature that allows controlling which throws to display:
  - "Everyone" option shows zoom view for all players
  - "Opponents" option only shows zoom view when opponents are throwing
- Added reset positions button to the Streaming Mode settings to allow users to reset board and scoreboard positions and scales

### Changed
- Improved sound order in Caller and Sound FX to play player name/bot sounds before "game on" announcement
- Updated wxt package to 0.20
- Enhanced Audio Unlock Mechanism and Updated Silent Audio Format
- Refactored Game Data Processing and Updated Ring Styles Logic
- Updated button styling and icon for the reset positions functionality in Streaming Mode

### Removed
- Removed Friends List feature as there is now an official friends list feature available

### Fixed
- Fixed selection of segments in QuickCorrection feature
- Fixed issue where next-player-on-take-out-stuck feature wasn't working in fullscreen mode
- Added fullscreen event detection to ensure proper feature functionality in all screen modes

## [2.0.11] - 2025-04-4

### Added
- Added Quick Correction feature that allows easy correction of misrecognized dart throws
  - Intuitive grid-based interface showing dart board segments
  - Numpad keyboard shortcuts for fast corrections
  - Color-coded buttons matching dart board segments
  - Direct selection for MISS, 25, or BULL throws
  - Smart positioning relative to the thrown dart

### Fixed
- Fixed Streaming Mode scoreboard position by automatically adjusting Y position when more than 2 players are in the game

## [2.0.10] - 2025-04-1

### Added
- Added keyboard shortcuts ('Y' to accept, 'N' to decline) for responding to lobby invitations

### Fixed
- Fixed Discord webhooks permissions issue that was preventing proper webhook execution
- Fixed a bug where match features did not apply after the first match when following a board

## [2.0.9] - 2025-04-1

### Fixed
- Fixed team lobby issue where the host player was continuously removed, preventing them from rejoining after removal
- Fixed an error in Firefox when adding friends or updating recent players list which caused the list not getting saved
- Improved serialization of player objects to prevent reactive objects from being passed to browser messaging

## [2.0.8] - 2025-04-1

### Added
- Added Darts Zoom feature that displays magnified views of dart throws
  - Configurable position (bottom-right, bottom-left, or center)
  - View mode toggle between live camera feed and static board image
  - Adjustable zoom level (1x-6x)
  - Visual indicator showing exact dart landing position
- Enhanced match visualization with zoomed dart views for better gameplay analysis

## [2.0.6] - 2025-04-01

### Added
- Implemented Lobby Invitation System for easier game coordination
- Enhanced Sound FX Logic with dual audio channels for improved sound experience
- Added Socket.IO integration for real-time communication

### Changed
- Replaced button with AppToggle component in Animations settings for improved UI interaction
- Updated Socket Server URL Configuration in Background Script
- Enhanced UI components with improved notification features
- Refactored socket management for better performance
- Updated sound playback logic for enhanced game mode handling

### Fixed
- Various UI improvements and bug fixes across components

## [2.0.5] - 2025-03-27

### Added
- Added ZIP file support for sound imports, making it easier to import multiple sound files at once
- Added bot throw sound effect to enhance gameplay audio feedback
- Enhanced sound playback logic for match and player-specific sounds

### Changed
- Updated UI components for improved consistency and user experience:
  - Refactored settings components to use AppButton and AppToggle
  - Enhanced modal components styling
  - Improved layout and button semantics in PageConfig
  - Fixed spacing in average stats display
- Updated external links and enhanced sound import instructions
- Changed error logging in winner-animation from console.error to console.warn for non-critical issues
- Refined sound playback logic for ambient sounds
- Excluded "Bull-off" variant from game data processing

### Fixed
- Fixed NextPlayerOnTakeoutStuck component logic
- Improved type safety in background chunk declaration

## [2.0.4] - 2025-03-26

### Changed
- Enhanced sound playback logic:
  - Simplified sound playback in game data processing to play points sound consistently regardless of player count
  - Refined cricket scoring sound logic to prevent playing score sounds when the score hasn't changed since the last round
  - Improved score handling for non-final throws in cricket matches
- Updated Animations component:
  - Removed debug logging from drag-and-drop initialization
  - Maintained existing drag-and-drop functionality for improved user experience

### Fixed
- Fixed issue where points sound wouldn't play consistently (Issue #82)
- Fixed score sound playing incorrectly during cricket matches (Issue #83)

## [2.0.3] - 2025-03-25

### Added
- Implemented Automatic Fullscreen feature that enables fullscreen mode during matches for a more immersive experience
- Added sound queue management system to prevent duplicate sound playback, improving the audio experience

### Changed
- Enhanced Animations component:
  - Added conditional rendering for the "Add Animation" button
  - Updated drag-and-drop functionality using the info section as the drag handle
  - Implemented notification system for animation order updates
  - Changed animation adding method to place new items at the beginning of the list
- Updated sound playback logic to prepend 's' to current score for consistent audio feedback
- Updated project version to 63 and marketing version to 2.0.3

### Removed
- Removed Disable Takeout Recognition feature and its associated logic
- Deleted unused Automatic Fullscreen image and cleaned up component references

### Fixed
- Fixed issue with redundant sound triggers during gameplay (Issue #78)
- Fixed UI issue with Automatic Fullscreen component (Issue #77)