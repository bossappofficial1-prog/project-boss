const fs = require("fs");
const path = require("path");
const {
  setGoogleServicesFile,
  getGoogleServicesFilePath,
} = require("@expo/config-plugins/build/android/GoogleServices");
const { withDangerousMod } = require("@expo/config-plugins");

module.exports = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const googleServicesFile = getGoogleServicesFilePath(config);

      // 1. Copy google-services.json
      if (googleServicesFile) {
        await setGoogleServicesFile(config, projectRoot);
        console.log("[google-services] Copied to android/app/");
      }

      // 2. Modify root build.gradle — add classpath
      const rootGradle = path.join(projectRoot, "android", "build.gradle");
      let rootContents = fs.readFileSync(rootGradle, "utf8");
      const classPathStr = "com.google.gms:google-services:4.4.1";
      if (!rootContents.includes(classPathStr)) {
        rootContents = rootContents.replace(
          /dependencies\s*\{/,
          `dependencies {\n        classpath '${classPathStr}'`
        );
        fs.writeFileSync(rootGradle, rootContents);
        console.log("[google-services] Added classpath to build.gradle");
      }

      // 3. Modify app build.gradle — add release signing config + apply plugin
      const appGradle = path.join(projectRoot, "android", "app", "build.gradle");
      let appContents = fs.readFileSync(appGradle, "utf8");

      // Add release signing config (from env vars, local credentials.json, or defaults)
      let localCreds = {};
      try {
        const credsPath = path.join(projectRoot, "credentials.json");
        if (fs.existsSync(credsPath)) {
          const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
          if (creds.android && creds.android.keystore) {
            localCreds = creds.android.keystore;
            // Resolve path relative to android/app/ directory
            if (localCreds.keystorePath && !path.isAbsolute(localCreds.keystorePath)) {
              localCreds.keystorePath = path.join("../../", localCreds.keystorePath);
            }
          }
        }
      } catch (e) {
        console.warn("[google-services] Failed to parse credentials.json:", e);
      }

      const keystorePath = process.env.ANDROID_KEYSTORE_PATH
        || localCreds.keystorePath
        || "../../credentials/android/production-release.keystore";
      const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD
        || localCreds.keystorePassword
        || "";
      const keyAlias = process.env.ANDROID_KEY_ALIAS
        || localCreds.keyAlias
        || "";
      const keyPassword = process.env.ANDROID_KEY_PASSWORD
        || localCreds.keyPassword
        || "";

      if (keystorePassword && !appContents.includes("signingConfigs.release")) {
        // Insert release signing config INSIDE signingConfigs block
        // Find closing } of signingConfigs block, insert release before it
        appContents = appContents.replace(
          /(signingConfigs\s*\{[\s\S]*?)(^\s*\})/m,
          `$1    release {\n        storeFile file('${keystorePath}')\n        storePassword '${keystorePassword}'\n        keyAlias '${keyAlias}'\n        keyPassword '${keyPassword}'\n    }\n$2`
        );
        // Change release build type to use release signing config
        appContents = appContents.replace(
          /(^\s+release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/m,
          "$1signingConfig signingConfigs.release"
        );
        console.log("[google-services] Added release signing config");
      }

      // Add google-services plugin
      const pluginStr = "com.google.gms.google-services";
      if (!appContents.includes(pluginStr)) {
        appContents += `\napply plugin: '${pluginStr}'`;
        console.log("[google-services] Added google-services plugin");
      }

      fs.writeFileSync(appGradle, appContents);

      return config;
    },
  ]);
};
