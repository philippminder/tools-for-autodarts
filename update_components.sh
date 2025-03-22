#!/bin/bash
# Update all feature components to use toggle and settingChange instead of toggleSettings
for file in components/Settings/*.vue; do sed -i "" "s/@toggleSettings/@toggle/g" "$file"; sed -i "" "s/\$emit(\"toggleSettings\"/\$emit(\"toggle\"/g" "$file"; sed -i "" "s/defineEmits(\[ \"toggleSettings\" \])/defineEmits(\[ \"toggle\", \"settingChange\" \])/g" "$file"; sed -i "" "s/emit(\"toggleSettings\"/emit(\"toggle\"/g" "$file"; sed -i "" "/const activeSettings = useStorage(\"adt:active-settings\"/d" "$file"; echo "Updated $file"; done
echo "All files updated successfully!"
