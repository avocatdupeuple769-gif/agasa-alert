/**
 * Plugin Expo : force le bundling JS dans les builds debug Android.
 *
 * PROBLÈME : En Expo SDK 54, `debuggableVariants = ["debug"]` par défaut.
 * Les builds debug se connectent à Metro dev server au lieu de bundler JS.
 * => APK standalone bloqué sur l'écran de démarrage.
 *
 * SOLUTION : Ajouter `debuggableVariants = []` dans le bloc react{} de build.gradle.
 *
 * RÉSOLUTION MODULE :
 * @expo/config-plugins n'est pas une dépendance directe (pnpm strict mode).
 * On le résout via @expo/cli (dépendance directe) grâce à createRequire().
 * En fallback : manipulation inline de config.mods (même chose, sans require externe).
 */

const { createRequire } = require('module');

function getConfigPlugins() {
  try {
    // @expo/cli EST une dépendance directe → sa résolution fonctionne
    // @expo/cli dépend de @expo/config-plugins → accessible via son contexte
    const cliPkgPath = require.resolve('@expo/cli/package.json');
    const cliRequire = createRequire(cliPkgPath);
    return cliRequire('@expo/config-plugins');
  } catch (_e) {
    return null;
  }
}

module.exports = function withBundleInDebug(config) {
  const configPlugins = getConfigPlugins();

  if (configPlugins && configPlugins.withAppBuildGradle) {
    // Approche principale : utiliser withAppBuildGradle via @expo/cli
    return configPlugins.withAppBuildGradle(config, (cfg) => {
      let contents = cfg.modResults.contents;

      if (contents.includes('debuggableVariants')) {
        contents = contents.replace(
          /debuggableVariants\s*=\s*\[[^\]]*\]/,
          'debuggableVariants = []'
        );
      } else if (/react\s*\{/.test(contents)) {
        contents = contents.replace(
          /react\s*\{/,
          'react {\n        debuggableVariants = []'
        );
      }

      cfg.modResults.contents = contents;
      return cfg;
    });
  }

  // Fallback : manipulation directe de config.mods (équivalent sans require externe)
  const prevAndroid = (config.mods && config.mods.android) || {};
  const prev = prevAndroid.appBuildGradle || null;

  return {
    ...config,
    mods: {
      ...config.mods,
      android: {
        ...prevAndroid,
        appBuildGradle: async (props) => {
          if (prev) props = await prev(props);

          let contents = props.modResults.contents;
          if (contents.includes('debuggableVariants')) {
            contents = contents.replace(
              /debuggableVariants\s*=\s*\[[^\]]*\]/,
              'debuggableVariants = []'
            );
          } else if (/react\s*\{/.test(contents)) {
            contents = contents.replace(
              /react\s*\{/,
              'react {\n        debuggableVariants = []'
            );
          }

          props.modResults.contents = contents;
          return props;
        },
      },
    },
  };
};
