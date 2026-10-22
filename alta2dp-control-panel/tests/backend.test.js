/**
 * Backend + schema unit tests (run against the mock backend).
 * Usage: node tests/backend.test.js
 */

process.env.ALT2DP_MOCK = '1'

const assert = require('node:assert')
const path = require('node:path')

async function main() {
  const backendPath = path.resolve(__dirname, '../src/main/backend.mjs')
  const schemaPath = path.resolve(__dirname, '../src/main/codecSchema.mjs')
  const backend = await import(backendPath)
  const schema = await import(schemaPath)

  let passed = 0
  function t(name, fn) {
    try {
      fn()
      passed++
      console.log(`  ✔ ${name}`)
    } catch (e) {
      console.error(`  ✘ ${name}\n    ${e.message}`)
      process.exitCode = 1
    }
  }

  console.log('registryBackend (mock):')

  t('getDevices returns two devices with capability/current/next', () => {
    const data = backend.getDevices()
    assert.strictEqual(data.devices.length, 2)
    const ap = data.devices.find((d) => d.address === '0000340e224a88bb')
    assert.ok(ap)
    assert.strictEqual(ap.capability.Name, 'AirPods Pro')
    assert.strictEqual(ap.current.Opened, 1)
    assert.strictEqual(ap.current.Bitrate, 256000)
    assert.strictEqual(ap.next.Codec, 2)
  })

  t('writeNext merges DWORD values and rejects bad names/values', () => {
    backend.writeNext('0000340e224a88bb', { Codec: 1, AacBitrate: 128000 })
    const dev = backend.getDevices().devices.find((x) => x.address === '0000340e224a88bb')
    assert.strictEqual(dev.next.Codec, 1)
    assert.strictEqual(dev.next.AacBitrate, 128000)
    assert.throws(() => backend.writeNext('0000340e224a88bb', { 'Bad Name!': 1 }), /Invalid registry value name/)
    assert.throws(() => backend.writeNext('0000340e224a88bb', { Codec: 1.5 }), /must be an integer/)
    // negative values wrap to unsigned DWORD like real registry storage
    backend.writeNext('0000340e224a88bb', { VolumeLevel: -1024 })
    const dev2 = backend.getDevices().devices.find((x) => x.address === '0000340e224a88bb')
    assert.strictEqual(dev2.next.VolumeLevel, 4294966272)
  })

  t('writeNext rejects unknown device (guards injection-style addresses)', () => {
    assert.throws(() => backend.writeNext('../../evil', { Codec: 1 }), /Unknown device/)
  })

  t('reconnect flips Opened in mock and accepts instance id', () => {
    const dev = backend.getDevices().devices.find((x) => x.address === '000070f94aa804e3')
    assert.strictEqual(dev.current.Opened, 0)
    const res = backend.reconnect(dev.instanceId)
    assert.deepStrictEqual(res, { ok: true })
    const dev2 = backend.getDevices().devices.find((x) => x.address === '000070f94aa804e3')
    assert.strictEqual(dev2.current.Opened, 1)
  })

  t('checkDriver reports mock status', () => {
    const s = backend.checkDriver()
    assert.strictEqual(s.driverInstalled, true)
    assert.match(s.serviceState, /mock/)
  })

  console.log('codecSchema:')

  t('supportedCodecs: AirPods Pro supports SBC+AAC only', () => {
    const cap = backend.getDevices().devices[0].capability
    assert.deepStrictEqual(schema.supportedCodecs(cap), ['sbc', 'aac'])
  })

  t('supportedCodecs: XM5 supports SBC+AAC+LDAC', () => {
    const cap = backend.getDevices().devices[1].capability
    assert.deepStrictEqual(schema.supportedCodecs(cap), ['sbc', 'aac', 'ldac'])
  })

  t('enumOptionsFor splits capability bitmask', () => {
    const field = schema.codecByKey('sbc').fields.find((f) => f.reg === 'SbcChannelMode')
    const opts = schema.enumOptionsFor(field, 15)
    assert.strictEqual(opts.length, 4) // Joint|Stereo|Dual|Mono
    const stereoOnly = schema.enumOptionsFor(field, 2)
    assert.deepStrictEqual(stereoOnly.map((o) => o.value), [2])
  })

  t('buildSettings produces single selections for all codec fields', () => {
    const cap = backend.getDevices().devices[1].capability
    const s = schema.buildSettings('ldac', cap, null)
    assert.strictEqual(s.Codec, 7)
    assert.strictEqual(s.LdacEqmid, 0) // Quality default
    assert.strictEqual(s.LdacSamplingFrequency, 2) // 48kHz default
    for (const f of schema.codecByKey('ldac').fields) assert.ok(f.reg in s, f.reg)
  })

  t('buildSettings keeps existing Next values when non-zero', () => {
    const cap = backend.getDevices().devices[0].capability
    const s = schema.buildSettings('aac', cap, { AacBitrate: 96000, AacChannelMode: 8 })
    assert.strictEqual(s.AacBitrate, 96000)
    assert.strictEqual(s.AacChannelMode, 8)
  })

  t('AAC bitrate default capped by capability', () => {
    const cap = { AacChannelMode: 4, AacSamplingFrequency: 8, AacBitrate: 192000 }
    const s = schema.buildSettings('aac', cap, null)
    assert.strictEqual(s.AacBitrate, 192000)
  })

  console.log(`\n${passed} tests passed${process.exitCode ? ', SOME FAILED' : ''}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
