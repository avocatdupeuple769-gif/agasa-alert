/**
 * Plugin Expo : force le bundling JS dans les builds debug Android.
 *
 * STRATÉGIE DOUBLE :
 * 1. PATCH DIRECT : Lire et écrire android/app/build.gradle avec fs (sans system de mods)
 * 2. MOD REGISTERED : Enregistrer un mod via withAppBuildGradle comme filet de sécurité
 *
 * POURQUOI CETTE APPROCHE :
 * - Le système de mods Expo (config.mods.android.appBuildGradle) ne semble pas appliquer
 *   les modifications dans ce contexte pnpm workspace
 * - Le patch direct avec fs fonctionne car android/app/build.gradle est généré
 *   AVANT que les plugins soient appelés (expo prebuild génère d'abord les templates,
 *   puis appelle les plugins, puis applique les mods)
 */

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

function patchBuildGradle(buildGradlePath) {
  if (!fs.existsSync(buildGradlePath)) {
    console.log('[withBundleInDebug] android/app/build.gradle non trouvé à:', buildGradlePath);
    return false;
  }

  let contents = fs.readFileSync(buildGradlePath, 'utf8');

  if (contents.includes('debuggableVariants = []')) {
    console.log('[withBundleInDebug] Déjà patché, rien à faire.');
    return true;
  }

  if (contents.includes('debuggableVariants')) {
    contents = contents.replace(
      /debuggableVariants\s*=\s*\[[^\]]*\]/,
      'debuggableVariants = []'
    );
  } else if (/react\s*\{/.test(contents)) {
    contents = contents.replace(
      /react\s*\{/,
      'react {\n        // Force JS bundle dans les builds debug (pas de Metro standalone)\n        debuggableVariants = []'
    );
  } else {
    console.log('[withBundleInDebug] Bloc react{} non trouvé dans build.gradle!');
    console.log('[withBundleInDebug] Contenu (premiers 500 chars):', contents.substring(0, 500));
    return false;
  }

  fs.writeFileSync(buildGradlePath, contents, 'utf8');
  console.log('[withBundleInDebug] ✅ Patché android/app/build.gradle: debuggableVariants = []');
  return true;
}

module.exports = function withBundleInDebug(config) {
  // ── STRATÉGIE 1 : Patch direct du fichier ──────────────────────────────
  // config._internal.projectRoot est disponible pendant expo prebuild
  const projectRoot = config._internal?.projectRoot;

  if (projectRoot) {
    const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    patchBuildGradle(buildGradlePath);
  } else {
    // Fallback: chercher depuis le CWD
    const cwdPath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
    const altPath = path.join(process.cwd(), 'artifacts', 'agasa-alert', 'android', 'app', 'build.gradle');
    if (!patchBuildGradle(cwdPath)) {
      patchBuildGradle(altPath);
    }
  }

  // ── STRATÉGIE 2 : Mod enregistré (filet de sécurité) ──────────────────
  // Au cas où le system de mods applique les modifications APRÈS notre patch direct
  try {
    const cliPkgPath = require.resolve('@expo/cli/package.json');
    const cliRequire = createRequire(cliPkgPath);
    const { withAppBuildGradle } = cliRequire('@expo/config-plugins');

    return withAppBuildGradle(config, (cfg) => {
      let contents = cfg.modResults.contents;

      if (contents.includes('debuggableVariants = []')) {
        return cfg; // Déjà patché
      }

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
  } catch (e) {
    console.warn('[withBundleInDebug] withAppBuildGradle non disponible:', e.message);
    // Retourner config tel quel (le patch direct a déjà été appliqué)
    return config;
  }
};
