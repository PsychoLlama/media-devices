import DeviceManager, { OperationType } from '../device-manager';
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
    devices.ondevicechange = handler;

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

    expect(handler).toHaveBeenCalledWith({
      changes: [{ type: OperationType.Add, device }],
      devices: [device],
    });
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
    const { devices, handler } = setup();

    const [device] = await devices.enumerateDevices();
    setDeviceList([]);

    handler.mockClear();
    await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledWith({
      changes: [{ type: OperationType.Remove, device }],
      devices: expect.any(Array),
    });
  });

  it('correlates identical devices between calls', async () => {
    const [device] = setDeviceList([{ label: 'first' }]);
    const { handler, devices } = setup();
    await devices.enumerateDevices();
    setDeviceList([device, { label: 'second' }]);

    handler.mockClear();
    const [, secondDevice] = await devices.enumerateDevices();

    expect(handler).toHaveBeenCalledWith({
      changes: [{ type: OperationType.Add, device: secondDevice }],
      devices: expect.any(Array),
    });
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
    expect(handler).toHaveBeenCalledWith({
      devices: expect.any(Array),
      changes: [
        {
          type: OperationType.Update,
          oldInfo: { ...device, deviceId: null, label: null },
          newInfo: device,
        },
      ],
    });
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
    expect(handler).toHaveBeenCalledWith({
      devices: expect.any(Array),
      changes: [
        {
          type: OperationType.Update,
          oldInfo: { ...device, deviceId: null, groupId: null, label: null },
          newInfo: { ...device, groupId: null },
        },
      ],
    });
  });

  it('watches the device list for changes at the OS level', async () => {
    const { handler, devices } = setup();
    await devices.enumerateDevices();

    handler.mockClear();
    setDeviceList([{ label: 'Telescope' }]);
    (getMediaDevicesApi() as any).emit('devicechange');

    // HACK: implementation uses exactly two awaits before finishing.
    await Promise.resolve();
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith({
      changes: [expect.objectContaining({ type: OperationType.Add })],
      devices: expect.any(Array),
    });
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

  it('refreshes the device list after a successful display query', async () => {
    setDeviceList([{ label: '' }]);
    const { devices } = setup();
    await devices.getDisplayMedia({ video: true });

    expect(getMediaDevicesApi().enumerateDevices).toHaveBeenCalled();
  });

  it('only refreshes the device list after the first successful GDM', async () => {
    setDeviceList([{ label: '' }]);
    const { devices } = setup();

    await devices.getDisplayMedia({ video: true });
    await devices.getDisplayMedia({ video: true });
    await devices.getDisplayMedia({ video: true });

    expect(getMediaDevicesApi().enumerateDevices).toHaveBeenCalledTimes(1);
  });

  it('survives even if the media devices API is unsupported', () => {
    delete (navigator as any).mediaDevices;

    expect(setup).not.toThrow();
  });
});
