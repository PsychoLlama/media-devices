import { getMediaDevicesApi } from './support-detection';

export default async function getUserMedia(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  return getMediaDevicesApi().getUserMedia(constraints);
}
