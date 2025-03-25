# Changelog

All notable changes to this project will be documented in this file.

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