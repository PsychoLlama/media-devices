import getUserMedia from '../get-user-media';
import { getMediaDevicesApi } from '../support-detection';

describe('getUserMedia()', () => {
  beforeEach(() => {
    (getMediaDevicesApi() as any).getUserMedia.mockResolvedValue(
      new MediaStream()
    );
  });

  it('returns the media stream', async () => {
    const stream = await getUserMedia({ video: true });

    expect(stream).toBeInstanceOf(MediaStream);
  });
});
