// Silence logs in production builds
if (!__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.info = () => {};
  // Keep warnings and errors or silence as desired
  // console.warn = () => {};
  // console.error = () => {};
}

import "expo-router/entry";
