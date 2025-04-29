import { AutodartsToolsConfig, defaultConfig } from "@/utils/storage";

export async function migrationConfig() {
  const config = await AutodartsToolsConfig.getValue();
  if (!config) return;

  const currentConfigVersion = config.version;
  await migrateConfig(currentConfigVersion).catch(console.error);
}

async function migrateConfig(currentConfigVersion: number) {
  console.log("Autodarts Tools: Migrating config...");

  const config = await AutodartsToolsConfig.getValue();

  while (currentConfigVersion < defaultConfig.version) {
    switch (currentConfigVersion) {
      case 1:
        // Migration from version 1 to version 2
        config.version = 2;
        // friendsList removed
        break;
      case 2:
        // Migration from version 2 to version 3
        config.version = 3;
        if (!config.zoom || !config.zoom.position) {
          config.zoom = {
            ...defaultConfig.zoom,
          };
        }
        break;
      case 3:
        // Migration from version 3 to version 4
        config.version = 4;
        if (!config.quickCorrection) {
          config.quickCorrection = {
            ...defaultConfig.quickCorrection,
          };
        }
        break;
      case 4:
        // Migration from version 4 to version 5
        config.version = 5;
        if (config.zoom && !config.zoom.zoomOn) {
          config.zoom.zoomOn = "everyone";
        }
        break;
      case 5:
        // Migration from version 5 to version 6
        config.version = 6;
        break;
      case 6:
        // Migration from version 6 to version 7
        config.version = 7;
        if (config.discord && config.discord.autoStartAfterTimer && !config.discord.autoStartAfterTimer.stream) {
          config.discord.autoStartAfterTimer.stream = false;
          config.discord.autoStartAfterTimer.messageId = "";
          config.discord.autoStartAfterTimer.matchId = "";
        }
        break;
      case 7:
        // Migration from version 7 to version 8
        config.version = 8;
        if (!config.enhancedScoringDisplay) {
          config.enhancedScoringDisplay = {
            enabled: false,
          };
        }
        break;
      case 8:
        // Migration from version 8 to version 9
        config.version = 9;
        if (config.zoom.showMarker === undefined) {
          config.zoom.showMarker = true;
        }
        break;
      case 9:
        // Migration from version 9 to version 10
        config.version = 10;
        if (config.colors && !config.colors.matchBackground) {
          config.colors.matchBackground = defaultConfig.colors.matchBackground;
        }
        break;

    }

    await AutodartsToolsConfig.setValue(config);
    currentConfigVersion++;
  }

  console.log("Autodarts Tools: Migration config done");
}