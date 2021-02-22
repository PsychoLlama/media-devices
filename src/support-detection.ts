/**
 * Not all browsers support media devices, and some restrict access for
 * insecure sites and private contexts. This is often reflected by removing
 * the `mediaDevices` API entirely.
 */
export function supportsMediaDevices() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices;
}

export function getMediaDevicesApi() {
  if (!supportsMediaDevices()) {
    throw new Error(`The media devices API isn't supported here.`);
  }

  return navigator.mediaDevices;
}
