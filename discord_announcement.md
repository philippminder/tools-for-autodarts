# :dart: Tools for Autodarts v2.1.21 Released! :dart:

### :new: New Features
- **Enhanced WLED Triggers**: Added new trigger support for match/gameshot with throw name specificity
  - New `matchshot+[throwName]` trigger (e.g., `matchshot+bull`, `matchshot+d20`) - triggers when winning the entire match with a specific throw
  - New `gameshot+[throwName]` trigger (e.g., `gameshot+d10`, `gameshot+t20`) - triggers when winning a game/leg with a specific throw
  - Enables more precise lighting control for winning throws with specific dart segments

### :bug: Bug Fixes
- **Firefox Compatibility**: Fixed WLED effect fetching issue in Firefox browsers
  - Added CORS handling to ensure WLED effects work correctly in Firefox

Please report any bugs in
:flag_de: https://discord.com/channels/802528604067201055/1255293632110530612/1255293632110530612
:flag_gb: https://discord.com/channels/802528604067201055/1255293651756650616/1255293651756650616
or on GitHub: <https://github.com/creazy231/tools-for-autodarts/issues>

_Updates getting rolled out right now. Keep an eye on the [GitHub](https://github.com/creazy231/tools-for-autodarts/tree/main?tab=readme-ov-file#tools-for-autodarts) page for the status of each browser_