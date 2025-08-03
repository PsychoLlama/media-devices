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
  dispatchEvent = jest.fn();
  ondevicechange = null;
  getUserMedia = jest.fn();
  getDisplayMedia = jest.fn();
  getSupportedConstraints = jest.fn();

  // --- complete stubs ---
  enumerateDevices = jest.fn().mockResolvedValue([]);

  addEventListener(...args: Parameters<EventEmitter['addListener']>) {
    return super.addListener(...args);
  }

  removeEventListener(...args: Parameters<EventEmitter['removeListener']>) {
    return super.removeListener(...args);
  }
}

export class MockMediaStream {}
