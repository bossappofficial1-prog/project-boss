const { withAndroidManifest, withStringsXml, AndroidConfig } = require("@expo/config-plugins");

const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } =
  AndroidConfig.Manifest;

const ASSET_STATEMENTS = [
  {
    $: { name: "asset_statements", translatable: "false" },
    _: '[{"include": "https://customer.bossapp.id/.well-known/assetlinks.json"}]',
  },
];

const withAndroidManifestAssetStatements = (config) => {
  return withAndroidManifest(config, (mod) => {
    const mainApplication = getMainApplicationOrThrow(mod.modResults);
    addMetaDataItemToMainApplication(
      mainApplication,
      "asset_statements",
      "@string/asset_statements",
      "resource",
    );
    return mod;
  });
};

const withStringsAssetStatements = (config) => {
  return withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      ASSET_STATEMENTS,
      mod.modResults,
    );
    return mod;
  });
};

const withAssetStatements = (config) => {
  config = withAndroidManifestAssetStatements(config);
  config = withStringsAssetStatements(config);
  return config;
};

module.exports = withAssetStatements;
