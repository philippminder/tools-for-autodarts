import fs from "node:fs";
import path from "node:path";

// Get version from package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

console.log(`Updating Xcode project to version ${version}`);

// Read the Xcode project file
const pbxprojPath = path.join(__dirname, "..", "Tools for Autodarts", "Tools for Autodarts.xcodeproj", "project.pbxproj");
let pbxprojContent = fs.readFileSync(pbxprojPath, "utf-8");

// Update all MARKETING_VERSION entries
const marketingVersionRegex = /MARKETING_VERSION = [^;]+;/g;
pbxprojContent = pbxprojContent.replace(marketingVersionRegex, `MARKETING_VERSION = ${version};`);

// Write back the updated content
fs.writeFileSync(pbxprojPath, pbxprojContent);

console.log(`✅ Updated Xcode project MARKETING_VERSION to ${version}`);
