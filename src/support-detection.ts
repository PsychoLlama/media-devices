/**
 * Not all browsers support media devices, and some restrict access for
 * insecure sites and private contexts. This is often reflected by removing
 * the `mediaDevices` API entirely.
 */
export function supportsMediaDevices() {
  return !!navigator.mediaDevices;
}
