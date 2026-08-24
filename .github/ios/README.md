# iOS development artifact

`ios-dev-artifact.yml` archives the React Native app with the `Local` scheme and
exports a development-signed IPA for the `com.padocorp.clubhouse.dev` bundle ID.
It runs after each push to `develop` and can also be started manually.

## Distribution model

This workflow does not upload to TestFlight. Its output is an Actions artifact
named `ios-dev-ipa-<run number>` that is retained for seven days.

The IPA can run only on devices included in the `allclear-dev` provisioning
profile. The device must have Developer Mode enabled, and the IPA is installed
with Xcode or Apple Configurator. Add a new device in Apple Developer, regenerate
the profile, and replace the profile secret before building for that device.

TestFlight is a separate distribution path. It requires an App Store Connect app
record, Apple Distribution signing, and App Store Connect upload credentials.

## GitHub environment

Create an `ios-dev-artifact` GitHub environment and configure these secrets:

| Secret | Value |
| --- | --- |
| `IOS_DEV_CERTIFICATE_BASE64` | Base64-encoded `.p12` containing an Apple Development certificate and its private key |
| `IOS_DEV_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `IOS_DEV_PROVISIONING_PROFILE_BASE64` | Base64-encoded `allclear-dev.mobileprovision` |
| `IOS_ENV_LOCAL` | Contents of `apps/mobile/.env.local` with `PROFILE=dev` |
| `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | Base64-encoded `GoogleService-Info.plist` |

The certificate must be one of the certificates embedded in the provisioning
profile. The workflow rejects mismatched, expired, non-development, wrong-team,
wrong-bundle, or device-free profiles before invoking Xcode.

Signing material is imported into a temporary keychain on the hosted runner and
removed in an `always()` cleanup step. Do not commit a `.p12`,
`.mobileprovision`, `.env.local`, or `GoogleService-Info.plist` file.

## Toolchain and output

- Runner: `macos-15`
- Xcode: `16.4`
- Scheme and configuration: `Local`
- Export method: `debugging`
- Artifact contents: IPA and available dSYMs
- Retention: seven days

When a signing certificate, profile, environment file, or Firebase file is
rotated, update only the corresponding environment secret. A provisioning
profile regeneration does not require a workflow code change as long as its
name, team, bundle ID, capabilities, and distribution type remain unchanged.
