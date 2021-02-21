import enumerateDevices, { DeviceInfo } from './enumerate-devices';

/**
 * Monitors the set of devices for changes and calculates convenient diffs
 * between updates. Steps are taken to handle cross-browser quirks and
 * attempts graceful integration with browser fingerprinting countermeasures.
 */
export default class DeviceManager {
  _knownDevices: Array<DeviceInfo> = [];
  _observers: Array<Callback> = [];

  observe<Callback extends (changes: Array<DeviceChange>) => any>(
    callback: Callback
  ) {
    this._observers.push(callback);
  }

  async enumerate() {
    const devices = await enumerateDevices();
    this._checkForDeviceChanges(devices);

    return devices;
  }

  _checkForDeviceChanges(devices: Array<DeviceInfo>) {
    const changes = this._calculateDeviceDiff(devices);
    this._knownDevices = devices;

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
  _calculateDeviceDiff(devices: Array<DeviceInfo>) {
    // TODO: Implement other diff types.
    if (this._knownDevices.length === devices.length) return [];

    const changes = devices.map(device => ({
      type: DeviceChangeType.Add,
      device,
    }));

    return changes;
  }
}

interface DeviceChange {
  type: DeviceChangeType;
  device: DeviceInfo;
}

export enum DeviceChangeType {
  Add = 'add',
  Remove = 'remove',
  Update = 'update',
}

type Callback = (deviceChanges: Array<DeviceChange>) => any;
