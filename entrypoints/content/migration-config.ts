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
        if (!config.friendsList || !config.friendsList.friends || !config.friendsList.recentPlayers) {
          config.friendsList = {
            ...defaultConfig.friendsList,
          };
        }
        break;
    }

    await AutodartsToolsConfig.setValue(config);
    currentConfigVersion++;
  }

  console.log("Autodarts Tools: Migration config done");
}
