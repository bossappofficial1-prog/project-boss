const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");
const { getMainApplicationOrThrow } = AndroidConfig.Manifest;
const { addPermission } = require("@expo/config-plugins/build/android/Permissions");
const fs = require("fs");
const path = require("path");

const APP_UPDATER_FILE_PROVIDER_AUTHORITY = "${applicationId}.appupdater.fileprovider";
const PERMISSIONS = [
  "android.permission.REQUEST_INSTALL_PACKAGES",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
  "android.permission.POST_NOTIFICATIONS",
];

const withAppUpdater = (config) => {
  config = withAppUpdaterPermissions(config);
  config = withAppUpdaterFileProvider(config);
  config = withAppUpdaterFilePathsXml(config);
  return config;
};

function withAppUpdaterPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    for (const perm of PERMISSIONS) {
      addPermission(manifest, perm);
    }
    return config;
  });
}

function withAppUpdaterFileProvider(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);

    if (!mainApplication["provider"]) {
      mainApplication["provider"] = [];
    }

    const hasProvider = mainApplication["provider"].some(
      (p) =>
        p.$["android:name"] === "androidx.core.content.FileProvider"
    );

    if (!hasProvider) {
      mainApplication["provider"].push({
        $: {
          "android:name": "androidx.core.content.FileProvider",
          "android:authorities": APP_UPDATER_FILE_PROVIDER_AUTHORITY,
          "android:exported": "false",
          "android:grantUriPermissions": "true",
        },
        "meta-data": [
          {
            $: {
              "android:name": "android.support.FILE_PROVIDER_PATHS",
              "android:resource": "@xml/app_updater_file_paths",
            },
          },
        ],
      });
    }

    return config;
  });
}

function withAppUpdaterFilePathsXml(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      const filePath = path.join(xmlDir, "app_updater_file_paths.xml");
      fs.writeFileSync(
        filePath,
        `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="app_updates" path="app_updates/" />
</paths>
`
      );
      return config;
    },
  ]);
}

module.exports = withAppUpdater;
