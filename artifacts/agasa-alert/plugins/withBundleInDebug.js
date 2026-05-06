/**
 * Plugin Expo : force le bundling JS dans les builds debug Android.
 *
 * PROBLÈME :
 * En Expo SDK 54, les builds debug Android sont configurés pour se connecter
 * à un serveur Metro dev (Expo Go). Le JS n'est PAS bundlé dans l'APK.
 * Résultat : l'APK standalone ne charge jamais le JS → écran de démarrage bloqué.
 *
 * SOLUTION :
 * `debuggableVariants = []` dans le bloc `react {}` de android/app/build.gradle
 * dit à React Native de bundler le JS pour TOUTES les variantes (debug + release).
 *
 * IMPORTANT – résolution de module pnpm :
 * Ce plugin est chargé dans deux contextes :
 *   1. `expo prebuild` : @expo/config-plugins est résolvable → on modifie build.gradle ✅
 *   2. Gradle tâche `expo-constants:createExpoConfig` : le contexte Node.js ne peut pas
 *      résoudre @expo/config-plugins depuis ce chemin. On retourne config inchangé ✅
 *      (build.gradle est déjà modifié depuis l'étape prebuild).
 */

let withAppBuildGradle = null;
try {
  withAppBuildGradle = require("@expo/config-plugins").withAppBuildGradle;
} catch (_e) {
  // Contexte Gradle : @expo/config-plugins n'est pas résolvable depuis ce chemin.
  // La modification de build.gradle a déjà été faite pendant expo prebuild.
}

module.exports = function withBundleInDebug(config) {
  if (!withAppBuildGradle) {
    return config;
  }

  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    if (contents.includes("debuggableVariants")) {
      // Déjà présent → forcer la liste vide
      contents = contents.replace(
        /debuggableVariants\s*=\s*\[[^\]]*\]/,
        "debuggableVariants = []"
      );
    } else if (/react\s*\{/.test(contents)) {
      // Ajouter dans le bloc react { }
      contents = contents.replace(
        /react\s*\{/,
        "react {\n        // Force JS bundling for all build types (including debug)\n        debuggableVariants = []"
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
