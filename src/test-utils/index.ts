import { MockMediaDevices, MockMediaDeviceInfo } from './mocks';

export const mediaDevices = new MockMediaDevices();

Object.assign(navigator, { mediaDevices });

// Determines the device list given by `enumerateDevices()`.
export function setDeviceList(deviceList: Array<Partial<MediaDeviceInfo>>) {
  const devices = deviceList.map(overrides => {
    const device = new MockMediaDeviceInfo();
    return Object.assign(device, overrides);
  });

  mediaDevices.enumerateDevices.mockResolvedValue(devices);

  return devices;
}
