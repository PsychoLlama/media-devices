<div align="center">
  <h1>Media Devices</h1>
  <p>Easily manage media devices in the browser</p>
</div>

## Purpose
`media-devices` wraps the [native browser API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices) and tries to normalize as many cross-browser quirks as possible ([reference](#known-quirks)). It also provides a device list diffing observer that notifies you as devices are added, removed, or updated.

## API
The API is a carbon copy of [`navigator.mediaDevices`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices), with the exception of `ondevicechange` which was replaced for more bells and whistles.

Here's an overview:

```js
import MediaDevices from 'media-devices'

// List the available hardware
await MediaDevices.enumerateDevices()

// Get the user's camera & microphone
await MediaDevices.getUserMedia({ video: true, audio: true })

// Share your screen
await MediaDevices.getDisplayMedia()

// Listen for changes in available devices
MediaDevices.on('devicechange', changes => {
  // [{ type: 'add', ... }, { type: 'update', ... }]
})
```

### `on('devicechange')`
Notifies you whenever the device list is updated and passes you a list of changes. Each change is an update, removal, or addition.

```js
interface DeviceAddEvent {
  type: 'add';
  device: DeviceInfo;
}

interface DeviceRemoveEvent {
  type: 'remove';
  device: DeviceInfo;
}

interface DeviceUpdateEvent {
  type: 'update';
  newInfo: DeviceInfo;
  oldInfo: DeviceInfo;
}
```

### `supportsMediaDevices()`
Exported as a separate utility function, this helps determine if your browser supports the `navigator.mediaDevices` API. Be aware that some browsers only expose it on secure sites.

```js
import { supportsMediaDevices } from 'media-devices'

if (supportsMediaDevices()) {
  // ... party
}
```

---------------

## Known Quirks
For the curious...

### Duplicate Devices
Preferred devices are represented through list order: preferred devices are show up first. Chrome has a "feature" where preferred devices are duplicated in the list with a `"default"` device ID. You'll notice some meeting apps get confused this and list them twice in their device dropdowns. I can't find any sources or justified reasoning, and they're the only browser that does it.

Since that information is already available in list ordering, `media-devices` strips out the duplicates.

### Redacted Device Names
Until the first approved `getUserMedia(...)` query, browsers assume you're not trusted enough to see the list of device names. That's fair. Device names are an easy target for user fingerprinting. They patched it by setting `device.label` to an empty string.

It works, but it can break certain UIs if they're not carefully checking for empty strings. `media-devices` makes this behavior explicit by setting the label to `null`.

This library updates the device list after a successful `getUserMedia(...)` query ensuring your device state is as accurate as possible.

### Redacted Device IDs
According to the spec, device IDs are meant to persist until the user clears site data, which is a dream come true if you're one of those assholes writing fingerprinting software. Some browsers thwart those efforts by redacting the device ID until you've been approved a `getUserMedia(...)` request.

That makes it hard to tell whether the device list actually changed. This library handles the heavy lifting of fuzzy matching devices to determine if new ones were added, others were removed, or if you just got permission to see the real ID/label.

Device IDs are set to `null` in this case.

### Hidden Devices
Chrome only shows the first of each device type (mic, camera, speakers) until `getUserMedia(...)` is approved. Other options are hidden. If you have 10 cameras, you'll only see the first until you're authorized. Even then, it only shows you cameras, microphones are still hidden.

While we can't work around it, we can automatically identify that old camera in the list of 10 and show the other 9 as added devices.

### Speaker Replacement
There's a subtle difference between wired speakers vs bluetooth devices. It seems that by default, many computers list internal speakers as a single device (expected), but if you plug in an auxiliary jack, it swaps the label in-place and uses the same device ID (unexpected). So if you plug in headphones but you've also got speakers on your computer, it may only list one device.

Bluetooth behaves more as you'd expect. They are shown as distinct devices and you can switch between them.

Once again, there's not much this library can do. Just something to be aware of.
