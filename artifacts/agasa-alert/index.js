/**
 * Point d'entrée React Native — s'exécute AVANT tout autre module,
 * y compris _layout.tsx et ses imports (supabase, etc.).
 *
 * POURQUOI CE FICHIER EXISTE :
 * Les imports ES modules sont résolus AVANT d'exécuter le corps du module.
 * Si @supabase/supabase-js plante à l'import dans _layout.tsx, le setTimeout
 * de secours dans _layout.tsx ne sera jamais atteint → splash écran bloqué.
 * En mettant le timeout ici, il s'exécute AVANT que expo-router/entry
 * (et donc _layout.tsx + supabase) ne soit chargé.
 */

// Étape 1 : sécuriser le splash screen IMMÉDIATEMENT
var SplashScreen = require("expo-splash-screen");
SplashScreen.preventAutoHideAsync().catch(function () {});

// Étape 2 : timeout de secours — masque le splash après 4 secondes
// même si React ou Supabase crashe complètement
setTimeout(function () {
  SplashScreen.hideAsync().catch(function () {});
}, 4000);

// Étape 3 : charger Expo Router (qui chargera _layout.tsx, supabase, etc.)
// Si quelque chose plante ici, le timeout ci-dessus survivra quand même
require("expo-router/entry");
