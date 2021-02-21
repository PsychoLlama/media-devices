import { supportsMediaDevices, getMediaDevicesApi } from '../support-detection';

describe('Support detection', () => {
  const mockMediaDevices = <T>(MediaDevices: T) => {
    (navigator as any).mediaDevices = MediaDevices;
  };

  beforeEach(() => {
    mockMediaDevices({ mock: 'MediaDevices' });
  });

  describe('supportsMediaDevices()', () => {
    it('returns false with no support', () => {
      mockMediaDevices(null);
      expect(supportsMediaDevices()).toBe(false);
    });

    it('returns true when the object exists', () => {
      expect(supportsMediaDevices()).toBe(true);
    });
  });

  describe('getMediaDevicesApi', () => {
    it('throws if the API is unsupported', () => {
      (navigator as any).mediaDevices = undefined;
      expect(getMediaDevicesApi).toThrow(/media ?devices/i);
    });

    it('returns the media devices API', () => {
      expect(getMediaDevicesApi()).toBe(navigator.mediaDevices);
    });
  });
});
