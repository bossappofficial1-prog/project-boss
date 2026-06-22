const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Expo config plugin to add ABI splits targeting arm64-v8a only.
 * This reduces APK size by ~50% by excluding x86, x86_64, and armeabi-v7a.
 */
const withAbiSplit = (config) => {
  return withAppBuildGradle(config, (mod) => {
    const contents = mod.modResults.contents;

    // Skip if already patched
    if (contents.includes("abiFilters \"arm64-v8a\"")) {
      return mod;
    }

    // Insert ndk abiFilters inside defaultConfig block
    mod.modResults.contents = contents.replace(
      /defaultConfig\s*\{([^}]*)\}/s,
      (match) => {
        return match.replace(
          /(\s*buildConfigField[^\n]*\n)/,
          `$1\n        ndk {\n            abiFilters "arm64-v8a"\n        }\n`
        );
      }
    );

    // Insert splits block after defaultConfig closing brace
    const splitsBlock = `
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a"
            universalApk false
        }
    }
`;

    mod.modResults.contents = mod.modResults.contents.replace(
      /signingConfigs\s*\{/,
      `${splitsBlock}\n    signingConfigs {`
    );

    return mod;
  });
};

module.exports = withAbiSplit;
