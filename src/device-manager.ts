import EventEmitter from 'events';
import enumerateDevices, { DeviceInfo } from './enumerate-devices';
import { getMediaDevicesApi } from './support-detection';
import getUserMedia from './get-user-media';

/**
 * Monitors the set of devices for changes and calculates convenient diffs
 * between updates. Steps are taken to handle cross-browser quirks and
 * attempts graceful integration with browser fingerprinting countermeasures.
 */
export default class DeviceManager extends EventEmitter {
  _knownDevices: Array<DeviceInfo> = [];

  constructor() {
    super();

    // Listen for changes at the OS level. If the device list changes and
    // someone's around to see it, refresh the device list. Refreshing has
    // a side effect of performing a diff and telling all subscribers about
    // the change.
    getMediaDevicesApi().addEventListener('devicechange', () => {
      if (this.listenerCount('devicechange')) {
        return this.enumerateDevices();
      }

      return Promise.resolve();
    });
  }

  /**
   * Request a live media stream from audio and/or video devices. Streams are
   * configurable through constraints.
   * See: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */
  async getUserMedia(constraints: MediaStreamConstraints) {
    const stream = await getUserMedia(constraints);

    // The browser considers us trusted after the first approved GUM query and
    // allows access to more information in the device list, which is an
    // implicit device change event. Refresh to update the cache.
    //
    // We do this for every GUM request because some browsers only allow
    // access to the subset of devices you've been approved for. While
    // reasonable from a security perspective, it means we're never sure if
    // the cache is stale.
    this.enumerateDevices();

    return stream;
  }

  /**
   * Ask the user to share their screen. Resolves with a media stream carrying
   * video, and potentially audio from the application window.
   * See: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
   */
  async getDisplayMedia(
    constraints?: MediaStreamConstraints
  ): Promise<MediaStream> {
    return getMediaDevicesApi().getDisplayMedia(constraints);
  }

  /**
   * Lists every available hardware device, including microphones, cameras,
   * and speakers (depending on browser support). May contain redacted
   * information depending on application permissions.
   */
  async enumerateDevices(): Promise<Array<DeviceInfo>> {
    const devices = await enumerateDevices();
    this._checkForDeviceChanges(devices);

    return devices;
  }

  /**
   * Returns an object containing every media constraint supported by the
   * browser.
   * See: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getSupportedConstraints
   */
  getSupportedConstraints(): MediaTrackSupportedConstraints {
    return getMediaDevicesApi().getSupportedConstraints();
  }

  _checkForDeviceChanges(newDevices: Array<DeviceInfo>) {
    const oldDevices = this._knownDevices;
    this._knownDevices = newDevices; // Replace the old devices.

    const changes: Array<DeviceChange> = this._calculateDeviceDiff(
      newDevices,
      oldDevices
    );

    if (changes.length) {
      this.emit('devicechange', changes, newDevices);
    }
  }

  /**
   * Note: The device enumeration API may return null values for device IDs
   * and labels. To avoid creating erroneous "Device Added" notifications,
   * a best effort should be made to detect when devices are identical.
   *
   * Order is significant. Preferred devices are listed first, which helps
   * correlate devices from permissioned requests with unpermissioned
   * requests.
   */
  _calculateDeviceDiff(
    newDevices: Array<DeviceInfo>,
    oldDevices: Array<DeviceInfo>
  ): Array<DeviceChange> {
    const removals = oldDevices.slice();
    const updates: Array<DeviceChange> = [];

    // If a "new" device exists in the list of old devices, then it obviously
    // wasn't just added and clearly we haven't removed it either. It's the
    // same device.
    const additions = newDevices.filter(newDevice => {
      const oldDeviceIndex = removals.findIndex(oldDevice => {
        return isIdenticalDevice(newDevice, oldDevice);
      });

      // Note: Nasty state mutation hides here.
      // Maps/Sets are out of the question due to poor TS support. Plus IDs
      // are far too unreliable in this context. Iteration and splice() are
      // ugly and gross, but they work.
      if (oldDeviceIndex > -1) {
        const [oldDevice] = removals.splice(oldDeviceIndex, 1);

        if (newDevice.label !== oldDevice.label) {
          const update: DeviceUpdateEvent = {
            type: DeviceChangeType.Update,
            newInfo: newDevice,
            oldInfo: oldDevice,
          };

          updates.push(update);
        }
      }

      // Only count it as an "addition" if we couldn't find the same device in
      // the older set.
      return oldDeviceIndex === -1;
    });

    return [
      ...updates,

      // A device was just removed.
      ...removals.map(device => {
        return { type: DeviceChangeType.Remove, device } as DeviceRemoveEvent;
      }),

      // A device was just plugged in.
      ...additions.map(device => {
        return { type: DeviceChangeType.Add, device } as DeviceAddEvent;
      }),
    ];
  }
}

/**
 * Due to fingerprinting countermeasures, the device ID might be an empty
 * string. We have to resort to vague comparisons. After the first successful
 * `getUserMedia(...)` query, the device ID for all related device kinds
 * should be revealed. In that case the new device will have an ID but the old
 * device won't. It should be safe to assume the inverse never happens.
 *
 * Note: Chromium browsers take a private stance by hiding your extra devices.
 * Even if you have a hundred cameras plugged in, until that first GUM query,
 * you'll only see the preferred one. Same for microphones and output devices.
 */
function isIdenticalDevice(newDevice: DeviceInfo, oldDevice: DeviceInfo) {
  if (oldDevice.deviceId) {
    return newDevice.deviceId === oldDevice.deviceId;
  }

  // These are the only credible fields we have to go on. It may yield a false
  // positive if you're changing devices before the first GUM query, but since
  // the lists are ordered by priority, that should be unlikely. It's
  // certainly preferable to "new device" false positives.
  function toCrudeId(device: DeviceInfo) {
    return `${device.kind}:${device.groupId}`;
  }

  return toCrudeId(newDevice) === toCrudeId(oldDevice);
}

type DeviceChange = DeviceAddEvent | DeviceRemoveEvent | DeviceUpdateEvent;

interface DeviceAddEvent {
  type: DeviceChangeType.Add;
  device: DeviceInfo;
}

interface DeviceRemoveEvent {
  type: DeviceChangeType.Remove;
  device: DeviceInfo;
}

interface DeviceUpdateEvent {
  type: DeviceChangeType.Update;
  newInfo: DeviceInfo;
  oldInfo: DeviceInfo;
}

export enum DeviceChangeType {
  Add = 'add',
  Remove = 'remove',
  Update = 'update',
}

declare global {
  interface MediaDevices {
    getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  }
}
