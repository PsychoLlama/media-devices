/* istanbul ignore file */
import EventEmitter from 'events';

export class MockMediaDeviceInfo implements MediaDeviceInfo {
  deviceId = 'mock-device-id';
  groupId = 'mock-group-id';
  kind = 'audioinput' as const;
  label = '';
  toJSON() {
    return this;
  }
}

// TODO: Use `EventTarget` instead of `EventEmitter`.
export class MockMediaDevices extends EventEmitter implements MediaDevices {
  // --- incomplete stubs ---
  dispatchEvent = vi.fn();
  ondevicechange = null;
  getUserMedia = vi.fn();
  getDisplayMedia = vi.fn();
  getSupportedConstraints = vi.fn();

  // --- complete stubs ---
  enumerateDevices = vi.fn().mockResolvedValue([]);

  addEventListener(...args: Parameters<EventEmitter['addListener']>) {
    return super.addListener(...args);
  }

  removeEventListener(...args: Parameters<EventEmitter['removeListener']>) {
    return super.removeListener(...args);
  }
}

export class MockMediaStream {}
