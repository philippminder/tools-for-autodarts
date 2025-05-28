import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get the latest release info from GitHub
async function getLatestReleaseInfo() {
  try {
    const response = await fetch('https://api.github.com/repos/creazy231/tools-for-autodarts/releases/latest');
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    const releaseData = await response.json();
    
    // Find the iOS IPA asset
    const ipaAsset = releaseData.assets.find(asset => asset.name === 'autodarts-tools-ios.ipa');
    
    if (!ipaAsset) {
      throw new Error('autodarts-tools-ios.ipa not found in latest release assets');
    }
    
    return {
      size: ipaAsset.size,
      downloadUrl: ipaAsset.browser_download_url,
      version: releaseData.tag_name
    };
  } catch (error) {
    console.warn(`Could not fetch release info from GitHub: ${error.message}`);
    return null;
  }
}

// Main execution function
async function main() {
  // Get version from command line argument or package.json
  const version = process.argv[2] || JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
  const isPrerelease = process.argv[3] === 'true';

  console.log(`Updating AltStore source for version: ${version}`);
  console.log(`Is prerelease: ${isPrerelease}`);

  // Read the current source file
  const sourceFilePath = path.join(__dirname, '..', 'Autodarts_Tools_Source.json');

  if (!fs.existsSync(sourceFilePath)) {
    console.error('Autodarts_Tools_Source.json not found');
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));

  // Get current date in ISO format
  const currentDate = new Date().toISOString();

  // Find the app in the source
  const appIndex = sourceData.apps.findIndex(app => app.bundleIdentifier === 'com.boltapi.autodarts-tools');

  if (appIndex === -1) {
    console.error('App not found in source file');
    process.exit(1);
  }

  // Get IPA size from GitHub release
  let ipaSize = 31400000; // Default size
  let downloadUrl = "https://github.com/creazy231/tools-for-autodarts/releases/latest/download/autodarts-tools-ios.ipa";

  console.log('Fetching latest release info from GitHub...');
  const releaseInfo = await getLatestReleaseInfo();

  if (releaseInfo) {
    ipaSize = releaseInfo.size;
    downloadUrl = releaseInfo.downloadUrl;
    console.log(`Found IPA in latest release with size: ${ipaSize} bytes`);
    console.log(`Download URL: ${downloadUrl}`);
  } else {
    console.warn('Could not fetch release info, using default values');
  }

  // Check if this version already exists
  const existingVersionIndex = sourceData.apps[appIndex].versions.findIndex(v => v.version === version);

  if (existingVersionIndex !== -1) {
    console.log(`Version ${version} already exists, updating it...`);
    // Update existing version
    sourceData.apps[appIndex].versions[existingVersionIndex] = {
      ...sourceData.apps[appIndex].versions[existingVersionIndex],
      date: currentDate,
      size: ipaSize,
      buildVersion: version
    };
  } else {
    // Add new version to the beginning of the versions array
    const newVersion = {
      version: version,
      date: currentDate,
      localizedDescription: null,
      downloadURL: downloadUrl,
      size: ipaSize,
      buildVersion: version,
      minOSVersion: "15.6"
    };

    // Insert new version at the beginning
    sourceData.apps[appIndex].versions.unshift(newVersion);
    console.log(`Added new version ${version}`);
  }

  // Keep only the last 5 versions to avoid the file getting too large
  sourceData.apps[appIndex].versions = sourceData.apps[appIndex].versions.slice(0, 5);

  // Create news entry
  const newsTitle = isPrerelease ? 
    `Tools for Autodarts ${version} (Pre-release) Available!` : 
    `Tools for Autodarts ${version} Available!`;

  const newsCaption = isPrerelease ?
    `Pre-release version ${version} is now available with the latest features and improvements.` :
    `Version ${version} is now available with new features and improvements.`;

  // Check if news entry for this version already exists
  const existingNewsIndex = sourceData.news.findIndex(news => 
    news.title.includes(version) || news.identifier.includes(version.replace(/\./g, '_'))
  );

  if (existingNewsIndex === -1) {
    const newNewsEntry = {
      title: newsTitle,
      identifier: `news_${version.replace(/\./g, '_')}_${Date.now()}`,
      caption: newsCaption,
      date: currentDate,
      tintColor: "#6156e2",
      notify: !isPrerelease, // Don't notify for pre-releases
      url: "https://github.com/creazy231/tools-for-autodarts",
      appID: "com.boltapi.autodarts-tools"
    };

    // Add news entry to the beginning
    sourceData.news.unshift(newNewsEntry);
    console.log(`Added news entry for version ${version}`);
  } else {
    console.log(`News entry for version ${version} already exists, skipping...`);
  }

  // Keep only the last 10 news entries
  sourceData.news = sourceData.news.slice(0, 10);

  // Write the updated source file
  try {
    fs.writeFileSync(sourceFilePath, JSON.stringify(sourceData, null, 2));
    console.log(`Successfully updated AltStore source with version ${version}`);
    console.log(`File size: ${ipaSize} bytes`);
  } catch (error) {
    console.error(`Failed to write source file: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Script failed: ${error.message}`);
  process.exit(1);
}); 