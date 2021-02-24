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
    devices.on('devicechange', handler);

    return {
      handler,
      devices,
    };
  };

  it('returns the full list of devices when queried', async () => {
    const { devices } = setup();
    const expectedDevices = setDeviceList([{ label: 'telescreen' }]);

    await expect(devices.enumerateDevices()).resolves.toEqual(expectedDevices);
  });

  it('detects device changes between queries', async () => {
    const { handler, devices } = setup();
    setDeviceList([{}]);

    const [device] = await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledWith(
      [{ type: DeviceChangeType.Add, device }],
      [device]
    );
  });

  it('does not duplicate change notifications to subscribers', async () => {
    const { handler, devices } = setup();
    setDeviceList([{}]);

    await devices.enumerateDevices();
    await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('detects removed devices', async () => {
    setDeviceList([{}]);
    const { devices } = setup();

    const [device] = await devices.enumerateDevices();
    setDeviceList([]);
    const handler = jest.fn();

    devices.on('devicechange', handler);
    await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledWith(
      [{ type: DeviceChangeType.Remove, device }],
      expect.any(Array)
    );
  });

  it('correlates identical devices between calls', async () => {
    const [device] = setDeviceList([{ label: 'first' }]);
    const { handler, devices } = setup();
    await devices.enumerateDevices();
    setDeviceList([device, { label: 'second' }]);

    handler.mockClear();
    const [, secondDevice] = await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledWith(
      [{ type: DeviceChangeType.Add, device: secondDevice }],
      expect.any(Array)
    );
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
    await devices.enumerateDevices();

    // Same device after the first approved `getUserMedia(...)` request.
    setDeviceList([device]);

    handler.mockClear();
    await devices.enumerateDevices();

    // It should detect that it's the same device.
    expect(handler).toHaveBeenCalledWith(
      [
        {
          type: DeviceChangeType.Update,
          oldInfo: { ...device, deviceId: null, label: null },
          newInfo: device,
        },
      ],
      expect.any(Array)
    );
  });

  // *scowls at Safari*
  it('infers similarity between devices with omitted group IDs', async () => {
    const redactedDevice = {
      label: '',
      deviceId: '',
      groupId: '',
      kind: 'audioinput' as const,
    };

    const device = {
      ...redactedDevice,
      label: '3D Scanner',
      deviceId: 'wec3d',
    };

    setDeviceList([redactedDevice]);
    const { handler, devices } = setup();
    await devices.enumerateDevices();

    setDeviceList([device]);
    handler.mockClear();
    await devices.enumerateDevices();

    // It should detect that it's the same device.
    expect(handler).toHaveBeenCalledWith(
      [
        {
          type: DeviceChangeType.Update,
          oldInfo: { ...device, deviceId: null, groupId: null, label: null },
          newInfo: { ...device, groupId: null },
        },
      ],
      expect.any(Array)
    );
  });

  it('watches the device list for changes at the OS level', async () => {
    const { handler, devices } = setup();
    await devices.enumerateDevices();

    handler.mockClear();
    setDeviceList([{ label: 'Telescope' }]);
    const [listener] = (getMediaDevicesApi() as any).listeners('devicechange');

    await listener();

    expect(handler).toHaveBeenCalledWith(
      [expect.objectContaining({ type: DeviceChangeType.Add })],
      expect.any(Array)
    );
  });

  it('only watches the device list if there are subscribers', async () => {
    new DeviceManager();

    setDeviceList([{}]);
    const [listener] = (getMediaDevicesApi() as any).listeners('devicechange');

    await listener();

    expect(getMediaDevicesApi().enumerateDevices).not.toHaveBeenCalled();
  });

  it('refreshes the device list after a successful GUM query', async () => {
    setDeviceList([{ label: '' }]);
    const { devices } = setup();
    await devices.getUserMedia({ video: true });

    expect(getMediaDevicesApi().enumerateDevices).toHaveBeenCalled();
  });

  it('returns the supported constraints when requested', () => {
    (getMediaDevicesApi() as any).getSupportedConstraints.mockReturnValue({
      mock: 'supported-constraints',
    });

    const { devices } = setup();
    const constraints = devices.getSupportedConstraints();

    expect(constraints).toEqual(
      navigator.mediaDevices.getSupportedConstraints()
    );
  });

  it('returns the display media stream when requested', async () => {
    const stream = new MediaStream();
    (getMediaDevicesApi() as any).getDisplayMedia.mockResolvedValue(stream);

    const { devices } = setup();

    await expect(devices.getDisplayMedia()).resolves.toBe(stream);
  });

  it('survives even if the media devices API is unsupported', () => {
    delete (navigator as any).mediaDevices;

    expect(setup).not.toThrow();
  });
});
