import enumerateDevices, { DeviceInfo } from './enumerate-devices';

/**
 * Monitors the set of devices for changes and calculates convenient diffs
 * between updates. Steps are taken to handle cross-browser quirks and
 * attempts graceful integration with browser fingerprinting countermeasures.
 */
export default class DeviceManager {
  _knownDevices: Array<DeviceInfo> = [];
  _observers: Array<Callback> = [];

  observe<Fn extends Callback>(callback: Fn) {
    this._observers.push(callback);
  }

  async enumerate() {
    const devices = await enumerateDevices();
    this._checkForDeviceChanges(devices);

    return devices;
  }

  _checkForDeviceChanges(newDevices: Array<DeviceInfo>) {
    const oldDevices = this._knownDevices;
    this._knownDevices = newDevices; // Replace the old devices.

    const changes: Array<DeviceChange> = this._calculateDeviceDiff(
      newDevices,
      oldDevices
    );

    // Notify subscribers of any changes.
    if (changes.length) {
      this._observers.forEach(observer => {
        observer(changes);
      });
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
    const additions = newDevices.slice();
    const removals = oldDevices.slice();
    const updates: Array<DeviceChange> = [];

    // If a "new" device exists in the list of old devices, then it obviously
    // wasn't just added and clearly we haven't removed it either. It's the
    // same device.
    additions.forEach((newDevice, newDeviceIndex) => {
      const oldDeviceIndex = removals.findIndex(oldDevice => {
        return isIdenticalDevice(newDevice, oldDevice);
      });

      if (oldDeviceIndex > -1) {
        additions.splice(newDeviceIndex, 1);
        const [oldDevice] = removals.splice(oldDeviceIndex, 1);

        if (!oldDevice.deviceId && newDevice.deviceId) {
          const update: DeviceUpdateEvent = {
            type: DeviceChangeType.Update,
            newInfo: newDevice,
            oldInfo: oldDevice,
          };

          updates.push(update);
        }
      }
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

type Callback = (deviceChanges: Array<DeviceChange>) => any;
