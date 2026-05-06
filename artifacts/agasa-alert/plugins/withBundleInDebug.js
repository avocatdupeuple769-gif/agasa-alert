/**
 * Plugin Expo : force le bundling JS dans les builds debug.
 *
 * POURQUOI CE PLUGIN :
 * Par défaut, Expo SDK 54 configure les builds Android debug pour se connecter
 * à un serveur Metro (Expo Go / développement). Le JS n'est PAS bundlé dans l'APK.
 * Résultat : l'APK installé seul sur un téléphone ne charge jamais le JS et
 * l'écran de démarrage reste bloqué indéfiniment.
 *
 * La propriété `debuggableVariants = []` dans le bloc `react {}` de build.gradle
 * indique à React Native de bundler le JS pour TOUTES les variantes (y compris debug).
 *
 * Ref : https://reactnative.dev/docs/gradle-configuration-android#debuggablevariants
 */

const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withBundleInDebug(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    if (contents.includes("debuggableVariants")) {
      // Déjà présent → s'assurer que c'est une liste vide
      contents = contents.replace(
        /debuggableVariants\s*=\s*\[[^\]]*\]/,
        "debuggableVariants = []"
      );
    } else if (/react\s*\{/.test(contents)) {
      // Ajouter comme première ligne dans le bloc react { }
      contents = contents.replace(
        /react\s*\{/,
        "react {\n        // Force JS bundling in debug builds (standalone APK)\n        debuggableVariants = []"
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
