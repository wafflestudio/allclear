import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type AppleAppSiteAssociation = {
  applinks: { details: Array<{ appID: string; paths: string[] }> }
}

describe('apple universal links', () => {
  it('opens manager transfer links in every iOS app variant', () => {
    const association = JSON.parse(
      readFileSync(join(process.cwd(), 'public/.well-known/apple-app-site-association'), 'utf8'),
    ) as AppleAppSiteAssociation

    expect(association.applinks.details).not.toHaveLength(0)
    for (const app of association.applinks.details) {
      expect(app.paths).toContain('/manager-transfer/*')
    }
  })

  it('declares associated domains in every iOS build entitlement', () => {
    const entitlementPaths = [
      'clubhouse.entitlements',
      'clubhouseDebug.entitlements',
      'clubhouseLocal.entitlements',
      'clubhouseRelease.entitlements',
    ]

    for (const entitlementPath of entitlementPaths) {
      const entitlement = readFileSync(
        join(process.cwd(), '../mobile/ios/clubhouse', entitlementPath),
        'utf8',
      )
      expect(entitlement).toContain('com.apple.developer.associated-domains')
      expect(entitlement).toContain('applinks:all-clear.cc')
      expect(entitlement).toContain('applinks:dev.all-clear.cc')
    }
  })
})

describe('android app links', () => {
  it('keeps verified HTTPS domains and the custom scheme in the Android manifest', () => {
    const manifest = readFileSync(
      join(process.cwd(), '../mobile/android/app/src/main/AndroidManifest.xml'),
      'utf8',
    )

    expect(manifest).toContain('android:scheme="allclear"')
    expect(manifest).toContain('android:scheme="http"')
    expect(manifest).toContain('android:autoVerify="true"')
    expect(manifest).toContain('android:host="all-clear.cc"')
    expect(manifest).toContain('android:host="dev.all-clear.cc"')
  })

  it('registers the CI devRelease package certificate', () => {
    const association = JSON.parse(
      readFileSync(join(process.cwd(), 'public/.well-known/assetlinks.json'), 'utf8'),
    ) as Array<{
      relation: string[]
      target: {
        namespace: string
        package_name: string
        sha256_cert_fingerprints: string[]
      }
    }>
    const developmentFingerprints = association
      .filter(
        ({ relation, target }) =>
          relation.includes('delegate_permission/common.handle_all_urls') &&
          target.namespace === 'android_app' &&
          target.package_name === 'com.padocorp.clubhouse.applicationId.debug',
      )
      .flatMap(({ target }) => target.sha256_cert_fingerprints)

    expect(developmentFingerprints).toContain(
      '18:DE:12:2E:AE:A1:E4:69:C9:32:16:7C:09:FF:F9:E1:85:A0:51:F9:0E:26:39:1A:E6:C6:2D:CF:9B:54:4F:C2',
    )
  })

  it('fails the Android dev build when the restored keystore is not registered', () => {
    const workflow = readFileSync(
      join(process.cwd(), '../../.github/workflows/android-dev-internal.yml'),
      'utf8',
    )

    expect(workflow).toContain('Verify Android App Link certificate')
    expect(workflow).toContain('sha256_cert_fingerprints')
    expect(workflow).toContain('keytool -exportcert')
    expect(workflow).toContain('.filter(')
    expect(workflow).toContain('.flatMap(')
    expect(workflow).toContain('delegate_permission/common.handle_all_urls')
    expect(workflow).toContain('target.namespace === "android_app"')
  })
})

describe('app association response headers', () => {
  it('serves AASA and assetlinks files as JSON', async () => {
    const require = createRequire(import.meta.url)
    const nextConfig = require('../../next.config.js') as {
      headers: () => Promise<
        Array<{ source: string; headers: Array<{ key: string; value: string }> }>
      >
    }

    const headers = await nextConfig.headers()
    for (const source of [
      '/.well-known/apple-app-site-association',
      '/.well-known/assetlinks.json',
    ]) {
      expect(headers).toContainEqual({
        source,
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      })
    }
  })

  it('prevents manager transfer tokens from leaking through referrer headers', async () => {
    const require = createRequire(import.meta.url)
    const nextConfig = require('../../next.config.js') as {
      headers: () => Promise<
        Array<{ source: string; headers: Array<{ key: string; value: string }> }>
      >
    }

    const headers = await nextConfig.headers()
    expect(headers).toContainEqual({
      source: '/manager-transfer/:token',
      headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
    })
  })
})
