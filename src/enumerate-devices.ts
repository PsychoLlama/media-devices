/**
 * A normalization layer over `MediaDevices.enumerateDevices()`:
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
 *
 * The API is fraught with cross-browser quirks and fingerprinting blocks.
 * This interface seeks to normalize some of those quirks and make the
 * security tradeoffs obvious.
 */
export default async function enumerateDevices(): Promise<Array<DeviceInfo>> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(isPhysicalDevice).map(normalizeDeviceInfo);
}

/**
 * Chromium does this really annoying thing where it duplicates preferred
 * devices by substituting the ID with "default". No other browser does this,
 * and preferred devices are already represented by list order.
 *
 * Since those meta-devices don't add relevant information and risk confusing
 * device UIs, I simply remove them.
 */
function isPhysicalDevice(device: MediaDeviceInfo) {
  return device.deviceId !== 'default';
}

// Make nullable fields explicit.
function normalizeDeviceInfo(device: MediaDeviceInfo): DeviceInfo {
  return {
    label: device.label || null,
    kind: device.kind as DeviceKind,
    deviceId: device.deviceId || null,
    groupId: device.groupId,
  };
}

export interface DeviceInfo {
  /**
   * The device list is obfuscated until you gain elevated permissions.
   * Browsers will use an empty string for the device label until the first
   * successful `getUserMedia(...)` request.
   */
  label: null | string;

  /**
   * A unique identifier persistent across sessions. Note: In Chromium
   * browsers, this can be unset if you haven't received permission for the
   * media resource yet.
   */
  deviceId: null | string;

  /**
   * A unique identifier grouping one or more devices together. Two devices
   * with the same group ID symbolise that both devices belong to the same
   * hardware, e.g. a webcam with an integrated microphone.
   */
  groupId: string;

  /**
   * Declares the type of media provided. This covers microphones, cameras,
   * and speakers.
   */
  kind: DeviceKind;
}

export enum DeviceKind {
  VideoInput = 'videoinput',
  AudioInput = 'audioinput',
  AudioOutput = 'audiooutput',
}
