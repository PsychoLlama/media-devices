import DeviceManager from './device-manager';

export { supportsMediaDevices } from './support-detection';
export { DeviceKind } from './enumerate-devices';
export { OperationType } from './device-manager';

export type { DeviceInfo } from './enumerate-devices';
export type { DeviceChange } from './device-manager';

export default new DeviceManager();
