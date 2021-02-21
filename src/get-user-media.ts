import { getMediaDevicesApi } from './support-detection';

// TODO: Enumerate known error types.
export default async function getUserMedia(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  return getMediaDevicesApi().getUserMedia(constraints);
}
