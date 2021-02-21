import DeviceManager, { DeviceChangeType } from '../device-manager';
import { setDeviceList } from '../test-utils';
import { getMediaDevicesApi } from '../support-detection';

describe('DeviceManager', () => {
  beforeEach(() => {
    (getMediaDevicesApi() as any).removeAllListeners('devicechange');
    (getMediaDevicesApi() as any).enumerateDevices.mockClear();
    setDeviceList([]);
  });

  const setup = () => {
    const handler = jest.fn();
    const devices = new DeviceManager();
    devices.observe(handler);

    return {
      handler,
      devices,
    };
  };

  it('returns the full list of devices when queried', async () => {
    const { devices } = setup();
    const expectedDevices = setDeviceList([{ label: 'telescreen' }]);

    await expect(devices.enumerate()).resolves.toEqual(expectedDevices);
  });

  it('detects device changes between queries', async () => {
    const { handler, devices } = setup();
    setDeviceList([{}]);

    const [device] = await devices.enumerate();

    expect(handler).toHaveBeenCalledWith([
      { type: DeviceChangeType.Add, device },
    ]);
  });

  it('does not duplicate change notifications to observers', async () => {
    const { handler, devices } = setup();
    setDeviceList([{}]);

    await devices.enumerate();
    await devices.enumerate();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('detects removed devices', async () => {
    setDeviceList([{}]);
    const { devices } = setup();

    const [device] = await devices.enumerate();
    setDeviceList([]);
    const handler = jest.fn();

    devices.observe(handler);
    await devices.enumerate();

    expect(handler).toHaveBeenCalledWith([
      { type: DeviceChangeType.Remove, device },
    ]);
  });

  it('correlates identical devices between calls', async () => {
    const [device] = setDeviceList([{ label: 'first' }]);
    const { handler, devices } = setup();
    await devices.enumerate();
    setDeviceList([device, { label: 'second' }]);

    handler.mockClear();
    const [, secondDevice] = await devices.enumerate();

    expect(handler).toHaveBeenCalledWith([
      { type: DeviceChangeType.Add, device: secondDevice },
    ]);
  });

  it('infers device relationships when the ID was just added', async () => {
    const { handler, devices } = setup();
    const kind = 'videoinput' as const;
    const groupId = 'group-id';
    const redactedDevice = { label: '', deviceId: '', groupId, kind };
    const device = {
      ...redactedDevice,
      label: 'Creepy Shelf Elf',
      deviceId: "sh'elf",
    };

    // Simulates fingerprinting countermeasures.
    setDeviceList([redactedDevice]);
    await devices.enumerate();

    // Same device after the first approved `getUserMedia(...)` request.
    setDeviceList([device]);

    handler.mockClear();
    await devices.enumerate();

    // It should detect that it's the same device.
    expect(handler).toHaveBeenCalledWith([
      {
        type: DeviceChangeType.Update,
        oldInfo: { ...device, deviceId: null, label: null },
        newInfo: device,
      },
    ]);
  });

  it('watches the device list for changes at the OS level', async () => {
    const { handler, devices } = setup();
    await devices.enumerate();

    handler.mockClear();
    setDeviceList([{ label: 'Telescope' }]);
    const [listener] = (getMediaDevicesApi() as any).listeners('devicechange');

    await listener();

    expect(handler).toHaveBeenCalledWith([
      expect.objectContaining({ type: DeviceChangeType.Add }),
    ]);
  });

  it('only watches the device list if there are subscribers', async () => {
    new DeviceManager();

    setDeviceList([{}]);
    const [listener] = (getMediaDevicesApi() as any).listeners('devicechange');

    await listener();

    expect(getMediaDevicesApi().enumerateDevices).not.toHaveBeenCalled();
  });
});
