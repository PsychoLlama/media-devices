# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added

- Merges to `main` automatically publish an `@rc` release.

## [0.5.0] - 2024-04-28

### Changed

- Reworked the build process to avoid an unmaintained plugin which affects how TypeScript definitions are published.
- Publish as ESM package. Legacy entrypoints are maintained for compatibility.
- Replaced packaged source files with a generated `.d.ts` definition for TypeScript.

### Removed

- Source files are no longer distributed with the package. You should not notice a difference.

## [0.4.0] - 2022-05-30

### Removed

- The deprecated `on('devicechange')` interface has been removed. Use `ondevicechange` instead.

## [0.3.0] - 2021-12-04

### Added

- Export `DeviceChange` type which describes each object in a device change set.
- New `mediaDevices.ondevicechange` mutable field for listeners.
- Public methods are bound, no longer depending on implicit `this` context.

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

[Unreleased]: https://github.com/PsychoLlama/media-devices/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/PsychoLlama/media-devices/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/PsychoLlama/media-devices/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/PsychoLlama/media-devices/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/PsychoLlama/media-devices/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PsychoLlama/media-devices/releases/tag/v0.1.0
