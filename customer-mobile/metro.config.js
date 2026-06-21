const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

let config = getDefaultConfig(__dirname);

config = withNativeWind(config, { input: "./global.css" });

const { assetExts, sourceExts } = config.resolver;

config.resolver.assetExts = assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...sourceExts, "svg"];
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

config.resolver.extraNodeModules = {
  "@assets": path.resolve(__dirname, "assets"),
};

module.exports = config;
