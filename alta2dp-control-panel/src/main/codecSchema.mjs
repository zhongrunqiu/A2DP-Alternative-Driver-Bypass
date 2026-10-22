/**
 * Codec / registry parameter schema for the Alternative A2DP driver.
 *
 * Registry base: HKLM:\SYSTEM\CurrentControlSet\Services\AltA2DP\Parameters\Devices
 *   Capability\{bt_address}  READ ONLY  - bitmasks of what the device supports
 *   Current\{bt_address}     READ ONLY  - live negotiated state (driver updates)
 *   Next\{bt_address}        WRITABLE   - what the driver uses on next connection
 */

export const REG_BASE =
  'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\AltA2DP\\Parameters\\Devices'

// ---------------------------------------------------------------------------
// Enum tables: value -> label. For Capability keys the stored number is a
// bitmask (OR of these single-bit values); for Next keys it is one selection.
// ---------------------------------------------------------------------------

export const CODEC_NAMES = {
  0: 'None',
  1: 'SBC',
  2: 'AAC'
}

export const SBC_CHANNEL_MODE = { 1: 'Joint Stereo', 2: 'Stereo', 4: 'Dual Channel', 8: 'Mono' }
export const SBC_SAMPLING_FREQ = { 1: '48 kHz', 2: '44.1 kHz', 4: '32 kHz', 8: '16 kHz' }
export const SBC_ALLOCATION = { 1: 'Loudness', 2: 'SNR' } // 3 = Both (capability only)
export const SBC_SUBBANDS = { 1: '8', 2: '4' } // 3 = Both (capability only)
export const SBC_BLOCK_LENGTH = { 1: '16', 2: '12', 4: '8', 8: '4' }

export const AAC_CHANNEL_MODE = { 4: 'Stereo', 8: 'Mono' } // 12 = Both (capability only)
export const AAC_SAMPLING_FREQ = { 8: '44.1 kHz', 16: '48 kHz' } // 24 = Both (capability only)

export const LDAC_CHANNEL_MODE = { 1: 'Stereo', 2: 'Dual Channel', 4: 'Mono' }
export const LDAC_SAMPLING_FREQ = { 1: '44.1 kHz', 2: '48 kHz', 4: '88.2 kHz', 8: '96 kHz' }
export const LDAC_SAMPLE_FORMAT = { 1: '16-bit', 2: '24-bit', 4: '32-bit' }
export const LDAC_EQMID = {
  0: 'Quality (990 kbps)',
  1: 'Normal (660 kbps)',
  2: 'Connection (330 kbps)',
  3: 'ABR (adaptive)'
}

export const APTX_CHANNEL_MODE = { 1: 'Mono', 2: 'Stereo' }
export const APTX_SAMPLING_FREQ = { 1: '44.1 kHz', 2: '48 kHz' }
export const APTXHD_SAMPLE_FORMAT = { 1: '16-bit', 2: '24-bit' }

// ---------------------------------------------------------------------------
// Per-codec UI field definitions.
// kind: 'enum'   - single-select from `options` (value->label map)
//       'range'  - integer slider between min/max (registry raw number)
//       'toggle' - 0/1 checkbox
// capabilityField: name in the Capability key that gates this codec
//                  (0 or missing => device does not support the codec).
// ---------------------------------------------------------------------------

export const CODECS = [
  {
    id: 1,
    key: 'sbc',
    name: 'SBC',
    tagline: 'Mandatory A2DP baseline codec',
    capabilityFields: ['SbcChannelMode', 'SbcSamplingFrequency'],
    fields: [
      { reg: 'SbcChannelMode', label: 'Channel Mode', kind: 'enum', options: SBC_CHANNEL_MODE, fallback: 2 },
      { reg: 'SbcSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: SBC_SAMPLING_FREQ, fallback: 2 },
      { reg: 'SbcAllocationMethod', label: 'Allocation Method', kind: 'enum', options: SBC_ALLOCATION, fallback: 2 },
      { reg: 'SbcSubbands', label: 'Subbands', kind: 'enum', options: SBC_SUBBANDS, fallback: 1 },
      { reg: 'SbcBlockLength', label: 'Block Length', kind: 'enum', options: SBC_BLOCK_LENGTH, fallback: 1 },
      { reg: 'SbcMinimumBitpool', label: 'Min Bitpool', kind: 'range', min: 2, max: 250, fallback: 2 },
      { reg: 'SbcMaximumBitpool', label: 'Max Bitpool', kind: 'range', min: 2, max: 250, fallback: 53 },
      { reg: 'AbrEnable', label: 'Adaptive Bitrate (ABR)', kind: 'toggle', fallback: 1 }
    ]
  },
  {
    id: 2,
    key: 'aac',
    name: 'AAC',
    tagline: 'Advanced Audio Coding (Fraunhofer FDK)',
    capabilityFields: ['AacChannelMode', 'AacSamplingFrequency'],
    fields: [
      { reg: 'AacChannelMode', label: 'Channel Mode', kind: 'enum', options: AAC_CHANNEL_MODE, fallback: 4 },
      { reg: 'AacSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: AAC_SAMPLING_FREQ, fallback: 8 },
      { reg: 'AacBitrate', label: 'Target Bitrate', kind: 'bitrate', min: 0, max: 320000, step: 16000, fallback: 256000, autoValue: 0 },
      { reg: 'AacPeakBitrate', label: 'Peak Bitrate', kind: 'bitrate', min: 0, max: 500000, step: 16000, fallback: 0, autoValue: 0 }
    ]
  },
  {
    id: 4,
    key: 'aptx',
    name: 'aptX',
    tagline: 'Qualcomm aptX',
    capabilityFields: ['AptxChannelMode'],
    fields: [
      { reg: 'AptxChannelMode', label: 'Channel Mode', kind: 'enum', options: APTX_CHANNEL_MODE, fallback: 2 },
      { reg: 'AptxSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: APTX_SAMPLING_FREQ, fallback: 1 }
    ]
  },
  {
    id: 5,
    key: 'aptx_hd',
    name: 'aptX HD',
    tagline: 'Qualcomm aptX HD (24-bit hi-res)',
    capabilityFields: ['AptxHdChannelMode'],
    fields: [
      { reg: 'AptxHdChannelMode', label: 'Channel Mode', kind: 'enum', options: APTX_CHANNEL_MODE, fallback: 2 },
      { reg: 'AptxHdSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: APTX_SAMPLING_FREQ, fallback: 1 },
      { reg: 'AptxHdSampleFormat', label: 'Sample Format', kind: 'enum', options: APTXHD_SAMPLE_FORMAT, fallback: 2 }
    ]
  },
  {
    id: 6,
    key: 'aptx_ll',
    name: 'aptX LL',
    tagline: 'Qualcomm aptX Low Latency',
    capabilityFields: ['AptxLlChannelMode'],
    fields: [
      { reg: 'AptxLlChannelMode', label: 'Channel Mode', kind: 'enum', options: APTX_CHANNEL_MODE, fallback: 2 },
      { reg: 'AptxLlSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: APTX_SAMPLING_FREQ, fallback: 1 }
    ]
  },
  {
    id: 7,
    key: 'ldac',
    name: 'LDAC',
    tagline: 'Sony LDAC hi-res codec',
    capabilityFields: ['LdacChannelMode'],
    fields: [
      { reg: 'LdacChannelMode', label: 'Channel Mode', kind: 'enum', options: LDAC_CHANNEL_MODE, fallback: 1 },
      { reg: 'LdacSamplingFrequency', label: 'Sampling Frequency', kind: 'enum', options: LDAC_SAMPLING_FREQ, fallback: 2 },
      { reg: 'LdacSampleFormat', label: 'Sample Format', kind: 'enum', options: LDAC_SAMPLE_FORMAT, fallback: 1 },
      { reg: 'LdacEqmid', label: 'Quality Mode', kind: 'enum', options: LDAC_EQMID, fallback: 0 }
    ]
  }
]

export function codecByKey(key) {
  return CODECS.find((c) => c.key === key)
}

export function codecById(id) {
  return CODECS.find((c) => c.id === id)
}

/** Map a "Current"/"Next" numeric Codec value to a codec key (best effort). */
export function codecKeyFromNumber(n) {
  if (n == null) return null
  const c = codecById(Number(n))
  return c ? c.key : null
}

// ---------------------------------------------------------------------------
// Helpers for interpreting Capability bitmasks
// ---------------------------------------------------------------------------

/** True if the capability DWORD advertises support for the given codec. */
export function deviceSupportsCodec(capability, codec) {
  if (!capability) return false
  return codec.capabilityFields.some((f) => Number(capability[f] || 0) !== 0)
}

/** List of codec keys the device supports, in preference order. */
export function supportedCodecs(capability) {
  return CODECS.filter((c) => deviceSupportsCodec(capability, c)).map((c) => c.key)
}

/**
 * Enumerate selectable values for an enum field given the Capability bitmask.
 * Capability value 3 / 12 / 15 / 24 etc. are OR'd masks; split into bits.
 * Returns [{value,label}] — falls back to all options when mask unknown.
 */
export function enumOptionsFor(field, capabilityMask) {
  const opts = Object.entries(field.options).map(([v, label]) => ({ value: Number(v), label }))
  const mask = Number(capabilityMask || 0)
  if (!mask || field.kind !== 'enum') return opts
  const filtered = opts.filter((o) => (mask & o.value) === o.value)
  return filtered.length ? filtered : opts
}

/** Default Next value for a field constrained by the device's capability mask. */
export function defaultValueFor(field, capabilityMask) {
  if (field.kind === 'enum') {
    const opts = enumOptionsFor(field, capabilityMask)
    const preferred = opts.find((o) => o.value === field.fallback)
    return preferred ? preferred.value : opts[0].value
  }
  if (field.kind === 'range') {
    let v = Number(capabilityMask ?? field.fallback)
    if (!Number.isFinite(v)) v = field.fallback
    return Math.max(field.min, Math.min(field.max, v))
  }
  if (field.kind === 'bitrate') {
    const cap = Number(capabilityMask ?? 0)
    if (cap > 0) return Math.min(cap, field.max)
    return field.autoValue != null ? field.autoValue : field.fallback
  }
  return Number(field.fallback)
}

/** Build a full Next-key settings object for a codec from capability + existing next values. */
export function buildSettings(codecKey, capability, existingNext) {
  const codec = codecByKey(codecKey)
  if (!codec) throw new Error(`Unknown codec key: ${codecKey}`)
  const out = { Codec: codec.id }
  for (const f of codec.fields) {
    const capMask = capability ? capability[f.reg] : undefined
    const cur = existingNext ? existingNext[f.reg] : undefined
    out[f.reg] = cur != null && Number(cur) !== 0 ? Number(cur) : defaultValueFor(f, capMask)
  }
  return out
}
