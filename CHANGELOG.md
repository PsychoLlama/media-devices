# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Export `DeviceChange` type which describes each object in a device change set.
- New `mediaDevices.ondevicechange` mutable field for listeners.

### Fixed

- Querying `getDisplayMedia(...)` now refreshes the device cache for cases where browsers loosen fingerprinting countermeasures.

### Deprecated

- Using the event emitter interface is no longer advised. It will be removed in a future release. Use the `ondevicechange` field instead:
  ```diff
  -mediaDevices.on('devicechange', handler)
  +mediaDevices.ondevicechange = handler
  ```

## [0.2.0] - 2021-02-23

### Added

- Another parameter added to the `devicechange` listener containing the entire list of known devices.
- Enum and type exports for `DeviceKind`, `DeviceInfo`, and `OperationType`.

### Changed

- Made `device.groupId` a nullable field because [Safari is a monster](https://github.com/PsychoLlama/media-devices/issues/3).

### Fixed

- No longer throws an error if you try to import in an unsupported environment.

## [0.1.0] - 2021-02-21

### Added

- Initial API compatible with `navigator.mediaDevices`.
- A device list-diffing implementation of `ondevicechange`.
- Support detection via `supportsMediaDevices()`.

[Unreleased]: https://github.com/PsychoLlama/media-devices/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/PsychoLlama/media-devices/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PsychoLlama/media-devices/releases/tag/v0.1.0
