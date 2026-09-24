import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Application from "expo-application";

export type AppVersionInfo = {
  /** Marketing version, e.g. 1.0.0 */
  version: string;
  /** Native build number (versionCode / buildNumber), e.g. 3 */
  build: string;
  /** Display string for UI, e.g. 1.0.0 (3) */
  display: string;
};

/**
 * App version for display.
 *
 * Primary source is the Expo app config (`app.json` → `expo.version`), which is
 * the single source of truth the release pipeline syncs. We intentionally do NOT
 * prefer `Application.nativeApplicationVersion`: in Expo Go that returns the Expo
 * Go host app's version (looks "real" but is wrong), and in a standalone build it
 * returns the native `versionName`. Using the config keeps both environments
 * consistent with whatever is set in `app.json`.
 */
export function getAppVersionInfo(): AppVersionInfo {
  const version =
    Constants.expoConfig?.version?.trim() ||
    Application.nativeApplicationVersion?.trim() ||
    "1.0.0";

  const build =
    Application.nativeBuildVersion?.trim() ||
    (Platform.OS === "android"
      ? String(Constants.expoConfig?.android?.versionCode ?? "")
      : String(Constants.expoConfig?.ios?.buildNumber ?? "")) ||
    "";

  const display =
    build && build !== version ? `${version} (${build})` : version;

  return { version, build, display };
}
