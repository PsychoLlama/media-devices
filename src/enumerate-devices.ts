export default async function enumerateDevices(): Promise<Array<DeviceInfo>> {
  const devices = await navigator.mediaDevices.enumerateDevices();

  return devices.map<DeviceInfo>(device => {
    return {
      label: device.label || null,
      deviceId: device.deviceId || null,
      groupId: device.groupId,
      kind: device.kind as DeviceKind,
    };
  });
}

interface DeviceInfo {
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
