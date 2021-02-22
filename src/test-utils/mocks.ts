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

export class MockMediaDevices extends EventEmitter implements MediaDevices {
  // --- incomplete stubs ---
  dispatchEvent = jest.fn();
  ondevicechange = null;
  getUserMedia = jest.fn();
  getDisplayMedia = jest.fn();
  getSupportedConstraints = jest.fn();

  // --- complete stubs ---
  addEventListener = this.addListener;
  removeEventListener = this.removeListener;
  enumerateDevices = jest.fn().mockResolvedValue([]);
}

export class MockMediaStream {}
