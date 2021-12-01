<div align="center">
  <h1>Media Devices</h1>
  <p>Easily manage media devices in the browser</p>
  
  <div>
    <a href="https://github.com/PsychoLlama/media-devices/actions/workflows/main.yml">
      <img src="https://img.shields.io/github/workflow/status/PsychoLlama/media-devices/CI/main" alt="Build status" />
    </a>
    <img src="https://img.shields.io/npm/types/media-devices" alt="Build status" />
    <a href="https://www.npmjs.com/package/media-devices">
      <img src="https://img.shields.io/npm/v/media-devices" alt="npm version" />
    </a>
  </div>
</div>

## Purpose
`media-devices` wraps the [native browser API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices) and tries to normalize as many cross-browser quirks as possible ([reference](#known-quirks)). It also provides a device list diffing observer that notifies you as devices are added, removed, or updated.

## API
The API is a carbon copy of [`navigator.mediaDevices`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices), with the exception of `ondevicechange` which was replaced for more bells and whistles.

Here's the gist:

```js
import MediaDevices from 'media-devices'

// List the available hardware
await MediaDevices.enumerateDevices()

// Get the user's camera & microphone
await MediaDevices.getUserMedia({ video: true, audio: true })

// Share your screen
await MediaDevices.getDisplayMedia()

// Listen for changes in available devices
MediaDevices.ondevicechange = ({ changes }) => {
  // [{ type: 'add', ... }, { type: 'update', ... }]
}
```

### `supportsMediaDevices()`
Exported as a separate utility function, this helps determine if your browser supports the `navigator.mediaDevices` API. Be aware that some browsers only expose it on secure sites.

```js
import { supportsMediaDevices } from 'media-devices'

if (supportsMediaDevices()) {
  // yey
}
```

### `ondevicechange`
`MediaDevices` emits this event whenever the list of devices changes. It passes two things:

1. A list of changes
1. The full list of devices

```js
MediaDevices.ondevicechange = ({ changes, devices }) => {
  // ...
}
```

The list of devices is exactly what you'd get from `enumerateDevices()`. The changes are a diff between this list and the last, showing which devices were added, which were removed, and which were updated.

```js
[
  // A device was just plugged in.
  {
    type: 'add',
    device: DeviceInfo,
  },

  // A device was disconnected.
  {
    type: 'remove',
    device: DeviceInfo,
  },

  // The browser gave us more information about a device.
  {
    type: 'update',
    oldInfo: DeviceInfo,
    newInfo: DeviceInfo,
  },
]
```

Update events are odd. Browsers redact information until the user explicitly grants trust, so things like labels and device IDs might start off null. [Another quirk](#speaker-replacement) regarding speakers may cause the device to update in-place.

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

### Missing Group IDs
As of Safari v14, even with permissions, the browser doesn't provide group IDs. Why? Because they're monsters.

Group IDs are `null` in Safari.

### Hidden Devices
Chrome and Safari only show the first of each device type (mic, camera, speakers) until `getUserMedia(...)` is approved. Other options are hidden. If you have 10 cameras, you'll only see the first until you're authorized. Even then, Chrome only shows you cameras, microphones are still hidden.

While we can't work around it, we can automatically identify that old camera in the list of 10 and show the other 9 as added devices.

### Speaker Replacement
There's a subtle difference between wired speakers vs bluetooth devices. It seems that by default, many computers list internal speakers as a single device (expected), but if you plug in an auxiliary jack, it swaps the label in-place and uses the same device ID (unexpected). So if you plug in headphones but you've also got speakers on your computer, it may only list one device.

Bluetooth behaves more as you'd expect. They are shown as distinct devices and you can switch between them.

Once again, there's not much this library can do. Just something to be aware of.
