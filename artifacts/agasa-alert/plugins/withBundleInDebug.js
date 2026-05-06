/**
 * Plugin Expo : force le bundling JS dans les builds debug Android.
 *
 * PROBLÈME RACINE :
 * En Expo SDK 54, `debuggableVariants = ["debug"]` (valeur par défaut).
 * Les builds debug attendent de se connecter à un serveur Metro dev.
 * => L'APK standalone n'exécute jamais de JS => écran bloqué.
 *
 * SOLUTION :
 * Ajouter `debuggableVariants = []` dans le bloc `react {}` de build.gradle.
 * Cela force Metro à bundler le JS pour TOUTES les variantes.
 *
 * IMPLÉMENTATION SANS require('@expo/config-plugins') :
 * Dans un workspace pnpm, @expo/config-plugins est une dépendance transitive
 * et n'est pas directement résolvable depuis le fichier plugin dans tous
 * les contextes (prebuild OK, Gradle task KO). On manipule config.mods directement,
 * ce qui est exactement ce que withAppBuildGradle() fait en interne.
 */

module.exports = function withBundleInDebug(config) {
  // Sauvegarder le mod précédent pour le chaînage
  const prevAndroid = (config.mods && config.mods.android) || {};
  const prevAppBuildGradle = prevAndroid.appBuildGradle || null;

  return {
    ...config,
    mods: {
      ...config.mods,
      android: {
        ...prevAndroid,
        appBuildGradle: async (props) => {
          // Appliquer le mod précédent en premier (chaînage)
          let result = props;
          if (prevAppBuildGradle) {
            result = await prevAppBuildGradle(result);
          }

          let contents = result.modResults.contents;

          if (contents.includes("debuggableVariants")) {
            // Déjà présent → forcer la liste vide
            contents = contents.replace(
              /debuggableVariants\s*=\s*\[[^\]]*\]/,
              "debuggableVariants = []"
            );
          } else if (/react\s*\{/.test(contents)) {
            // Ajouter comme première ligne dans le bloc react { }
            contents = contents.replace(
              /react\s*\{/,
              "react {\n        // Force JS bundle in all build types (no Metro dev server)\n        debuggableVariants = []"
            );
          }

          result.modResults.contents = contents;
          return result;
        },
      },
    },
  };
};
