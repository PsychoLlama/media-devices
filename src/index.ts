import DeviceManager from './device-manager';

export { supportsMediaDevices } from './support-detection';
export { DeviceInfo, DeviceKind } from './enumerate-devices';
export { OperationType, DeviceChange } from './device-manager';

export default new DeviceManager();
