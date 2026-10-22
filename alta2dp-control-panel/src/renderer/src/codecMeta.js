/**
 * Codec metadata shared with the renderer. Mirrors src/main/codecSchema.js.
 */

export const CODECS = [
  {
    id: 1,
    key: 'sbc',
    name: 'SBC',
    tagline: 'Mandatory A2DP baseline codec',
    capabilityFields: ['SbcChannelMode', 'SbcSamplingFrequency'],
    fields: [
      { reg: 'SbcChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 1: '联合立体声 Joint Stereo', 2: '立体声 Stereo', 4: '双声道 Dual Channel', 8: '单声道 Mono' }, fallback: 2 },
      { reg: 'SbcSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 1: '48 kHz', 2: '44.1 kHz', 4: '32 kHz', 8: '16 kHz' }, fallback: 2 },
      { reg: 'SbcAllocationMethod', label: '分配方式 Allocation Method', kind: 'enum', options: { 1: '响度 Loudness', 2: '信噪比 SNR' }, fallback: 2 },
      { reg: 'SbcSubbands', label: '子带数 Subbands', kind: 'enum', options: { 1: '8', 2: '4' }, fallback: 1 },
      { reg: 'SbcBlockLength', label: '块长度 Block Length', kind: 'enum', options: { 1: '16', 2: '12', 4: '8', 8: '4' }, fallback: 1 },
      { reg: 'SbcMinimumBitpool', label: '最小位池 Min Bitpool', kind: 'range', min: 2, max: 250, fallback: 2 },
      { reg: 'SbcMaximumBitpool', label: '最大位池 Max Bitpool', kind: 'range', min: 2, max: 250, fallback: 53 },
      { reg: 'AbrEnable', label: '自适应码率 ABR', kind: 'toggle', fallback: 1 }
    ]
  },
  {
    id: 2,
    key: 'aac',
    name: 'AAC',
    tagline: 'Advanced Audio Coding (Fraunhofer FDK)',
    capabilityFields: ['AacChannelMode', 'AacSamplingFrequency'],
    fields: [
      { reg: 'AacChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 4: '立体声 Stereo', 8: '单声道 Mono' }, fallback: 4 },
      { reg: 'AacSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 8: '44.1 kHz', 16: '48 kHz' }, fallback: 8 },
      { reg: 'AacBitrate', label: '目标码率 Target Bitrate', kind: 'bitrate', min: 0, max: 320000, step: 16000, fallback: 256000, autoValue: 0 },
      { reg: 'AacPeakBitrate', label: '峰值码率 Peak Bitrate', kind: 'bitrate', min: 0, max: 500000, step: 16000, fallback: 0, autoValue: 0 }
    ]
  },
  {
    id: 4,
    key: 'aptx',
    name: 'aptX',
    tagline: 'Qualcomm aptX',
    capabilityFields: ['AptxChannelMode'],
    fields: [
      { reg: 'AptxChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 1: '单声道 Mono', 2: '立体声 Stereo' }, fallback: 2 },
      { reg: 'AptxSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 1: '44.1 kHz', 2: '48 kHz' }, fallback: 1 }
    ]
  },
  {
    id: 5,
    key: 'aptx_hd',
    name: 'aptX HD',
    tagline: 'Qualcomm aptX HD (24-bit hi-res)',
    capabilityFields: ['AptxHdChannelMode'],
    fields: [
      { reg: 'AptxHdChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 1: '单声道 Mono', 2: '立体声 Stereo' }, fallback: 2 },
      { reg: 'AptxHdSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 1: '44.1 kHz', 2: '48 kHz' }, fallback: 1 },
      { reg: 'AptxHdSampleFormat', label: '采样格式 Sample Format', kind: 'enum', options: { 1: '16-bit', 2: '24-bit' }, fallback: 2 }
    ]
  },
  {
    id: 6,
    key: 'aptx_ll',
    name: 'aptX LL',
    tagline: 'Qualcomm aptX Low Latency',
    capabilityFields: ['AptxLlChannelMode'],
    fields: [
      { reg: 'AptxLlChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 1: '单声道 Mono', 2: '立体声 Stereo' }, fallback: 2 },
      { reg: 'AptxLlSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 1: '44.1 kHz', 2: '48 kHz' }, fallback: 1 }
    ]
  },
  {
    id: 7,
    key: 'ldac',
    name: 'LDAC',
    tagline: 'Sony LDAC hi-res codec',
    capabilityFields: ['LdacChannelMode'],
    fields: [
      { reg: 'LdacChannelMode', label: '声道模式 Channel Mode', kind: 'enum', options: { 1: '立体声 Stereo', 2: '双声道 Dual Channel', 4: '单声道 Mono' }, fallback: 1 },
      { reg: 'LdacSamplingFrequency', label: '采样率 Sampling Frequency', kind: 'enum', options: { 1: '44.1 kHz', 2: '48 kHz', 4: '88.2 kHz', 8: '96 kHz' }, fallback: 2 },
      { reg: 'LdacSampleFormat', label: '采样格式 Sample Format', kind: 'enum', options: { 1: '16-bit', 2: '24-bit', 4: '32-bit' }, fallback: 1 },
      { reg: 'LdacEqmid', label: '质量模式 Quality Mode', kind: 'enum', options: { 0: '音质优先 Quality (990 kbps)', 1: '标准 Normal (660 kbps)', 2: '连接稳定 Connection (330 kbps)', 3: '自适应 ABR' }, fallback: 0 }
    ]
  }
]

export function codecByKey(key) {
  return CODECS.find((c) => c.key === key)
}

export function codecById(id) {
  return CODECS.find((c) => c.id === Number(id))
}

/** Best-effort display name for a numeric Codec DWORD (Current/Next keys). */
export function codecNameFromNumber(n) {
  if (n == null) return '—'
  const c = codecById(n)
  if (c) return c.name
  if (Number(n) === 3) return 'SBC + AAC'
  if (Number(n) === 0) return 'None'
  return `Codec #${n}`
}

export function deviceSupports(capability, codec) {
  if (!capability) return false
  return codec.capabilityFields.some((f) => Number(capability[f] || 0) !== 0)
}

export function supportedCodecKeys(capability) {
  return CODECS.filter((c) => deviceSupports(capability, c)).map((c) => c.key)
}

export function enumOptionsFor(field, capabilityMask) {
  const opts = Object.entries(field.options).map(([v, label]) => ({ value: Number(v), label }))
  const mask = Number(capabilityMask || 0)
  if (!mask || field.kind !== 'enum') return opts
  const filtered = opts.filter((o) => (mask & o.value) === o.value)
  return filtered.length ? filtered : opts
}

export function formatKbps(bps) {
  if (!bps || bps <= 0) return '—'
  return `${Math.round(bps / 1000)} kbps`
}
