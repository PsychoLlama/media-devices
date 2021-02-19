import { supportsMediaDevices } from '../support-detection';

describe('Support detection', () => {
  const mockMediaDevices = <T>(MediaDevices: T) => {
    (navigator as any).mediaDevices = MediaDevices;
  };

  beforeEach(() => {
    mockMediaDevices({ mock: 'MediaDevices' });
  });

  it('returns false with no support', () => {
    mockMediaDevices(null);
    expect(supportsMediaDevices()).toBe(false);
  });

  it('returns true when the object exists', () => {
    expect(supportsMediaDevices()).toBe(true);
  });
});
