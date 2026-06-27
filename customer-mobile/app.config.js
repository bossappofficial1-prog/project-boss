module.exports = ({ config }) => {
  const APP_ENV = process.env.APP_ENV || 'development';
  const IS_DEV = APP_ENV === 'development';
  const IS_PREVIEW = APP_ENV === 'preview';

  const name = IS_DEV ? 'BossApp (Debug)' : IS_PREVIEW ? 'BossApp (Preview)' : 'BossApp';
  const bundleIdentifier = IS_DEV 
    ? 'id.bossapp.customer.debug' 
    : IS_PREVIEW 
      ? 'id.bossapp.customer.preview' 
      : 'id.bossapp.customer';

  const googleServicesFile = IS_DEV
    ? './credentials/android/google-services-debug.json'
    : './credentials/android/google-services-release.json';

  return {
    ...config,
    name,
    ios: {
      ...config.ios,
      bundleIdentifier,
    },
    android: {
      ...config.android,
      package: bundleIdentifier,
      googleServicesFile,
    },
    plugins: [
      ...(config.plugins || []),
      "./plugins/with-google-services",
    ],
  };
};
