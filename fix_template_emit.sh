#!/bin/bash
for file in components/Settings/*.vue; do sed -i "" "s/@click=\"\$emit('"toggleSettings"', '/.click=\"\$emit('"toggle"', '/g" "$file"; echo "Updated $file"; done
