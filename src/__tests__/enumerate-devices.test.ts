import enumerateDevices from '../enumerate-devices';
import { setDeviceList } from '../test-utils';

describe('Device enumeration', () => {
  beforeEach(() => {
    setDeviceList([]);
  });

  it('returns a list of devices', async () => {
    const device = { label: 'Selfie Stick' };
    setDeviceList([device]);

    const devices = await enumerateDevices();

    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject(device);
  });

  it('explicitly represents obfuscated fields', async () => {
    setDeviceList([{ label: '', deviceId: '', groupId: '' }]);
    const [device] = await enumerateDevices();

    expect(device).toMatchObject({
      label: null,
      deviceId: null,
      groupId: null,
    });
  });

  it('adds device metadata', async () => {
    const device = {
      kind: 'audioinput' as const,
      label: 'Nest Thermostat',
      deviceId: 'device-id',
      groupId: 'group-id',
    };

    setDeviceList([device]);

    const devices = await enumerateDevices();

    expect(devices[0]).toMatchObject(device);
  });

  it('strips default meta-devices', async () => {
    const device = {
      label: 'Surveillance Camera #451',
      deviceId: 'device-id',
    };

    setDeviceList([device, { ...device, deviceId: 'default' }]);

    const devices = await enumerateDevices();

    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({ deviceId: device.deviceId });
  });
});
