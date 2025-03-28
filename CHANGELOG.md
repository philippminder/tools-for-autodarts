# Changelog

All notable changes to this project will be documented in this file.

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

## [2.0.2] - 2025-03-25

### Added
- New sound triggers for player transitions and bot players:
  - `next_player`: Plays when switching to the next player (fallback if no player name sound exists)
  - `bot`: Plays when the player is a CPU/bot player
  - Support for player name sounds with spaces or underscores (e.g., `player_name` or `player name`)
- Enhanced ambient sound system with new triggers:
  - `ambient_gameon`: Plays at game start
  - `ambient_next_player`: Plays during player transitions
  - `ambient_bot`: Plays for CPU/bot players
  - Player-specific ambient sounds using format: `ambient_playername` or `ambient_player_name`

### Changed
- Enhanced sound management system:
  - Improved sound playback logic to differentiate between human and bot players
  - Added intelligent fallback mechanisms for player name sounds
  - Refined sound trigger handling for misses and special events
- Improved StreamingMode component:
  - Removed obsolete saveSettings function in favor of automatic settings updates
  - Enhanced coordinates and scoreboard settings with better x/y property handling
  - Improved initialization logic for configuration values
- Updated project version to 62 and marketing version to 2.0.2

### Fixed
- Enhanced sound fallback logic to only trigger for valid miss prefixes (numbers 1-20)
- Improved settings management in streaming mode (Issue #70)
- Fixed "Add" button visibility control in multiple components (Issue #72)
- Enhanced initialization logic for component settings

### Documentation
- Updated README.md with comprehensive sound trigger documentation
- Added detailed documentation for new player transition and bot player features

For changes prior to version 2.0.2, please refer to the git history. 