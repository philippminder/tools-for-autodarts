#!/bin/bash
# Add settingChange emit to watch functions in all components
for file in components/Settings/*.vue; do sed -i "" "/await updateConfigIfChanged/a\  emit(\"settingChange\", config.value);" "$file"; echo "Updated $file"; done
echo "All files updated successfully!"
