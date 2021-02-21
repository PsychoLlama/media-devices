import DeviceManager, { DeviceChangeType } from '../device-manager';
import { setDeviceList } from '../test-utils';

describe('DeviceManager', () => {
  beforeEach(() => {
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
});
