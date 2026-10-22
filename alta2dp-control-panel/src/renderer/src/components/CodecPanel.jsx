import React from 'react'
import { CODECS, codecByKey, enumOptionsFor } from '../codecMeta'

/**
 * Codec selector chips + per-codec parameter panel.
 * `settings` is a map of registry value name -> numeric value (Next key draft).
 */
export default function CodecPanel({ device, codecKey, settings, onPickCodec, onChange }) {
  const supports = new Set(device.supports || [])
  const codec = codecByKey(codecKey)
  const cap = device.capability || {}

  return (
    <>
      <div className="section">
        <h3>编解码器选择（仅显示设备支持的）</h3>
        <div className="codec-row">
          {CODECS.map((c) => (
            <button
              key={c.key}
              className={`chip${codecKey === c.key ? ' active' : ''}`}
              disabled={!supports.has(c.key)}
              title={supports.has(c.key) ? c.tagline : '设备不支持（Capability 中对应 ChannelMode 为 0）'}
              onClick={() => onPickCodec(c.key)}
            >
              {c.name}
              {codecKey === c.key && Number(device.current?.Codec) === c.id ? (
                <span className="badge">● 使用中</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {codec && settings && (
        <div className="section">
          <h3>{codec.name} 参数 — {codec.tagline}</h3>
          <div className="card">
            <div className="field-grid">
              {codec.fields.map((f) => (
                <FieldEditor
                  key={f.reg}
                  field={f}
                  capMask={cap[f.reg]}
                  value={settings[f.reg]}
                  onChange={(v) => onChange(f.reg, v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FieldEditor({ field, capMask, value, onChange }) {
  if (field.kind === 'enum') {
    const opts = enumOptionsFor(field, capMask)
    let current = Number(value ?? field.fallback)
    if (!opts.some((o) => o.value === current)) current = opts[0].value
    return (
      <div className="field">
        <label>{field.label}</label>
        <select value={current} onChange={(e) => onChange(Number(e.target.value))}>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.kind === 'range') {
    const min = field.min
    // Cap max by device capability when it advertises a limit (e.g. bitpool)
    const capMax = Number(capMask || 0)
    const max = capMax > 0 && capMax <= field.max && /Bitpool/i.test(field.reg) ? capMax : field.max
    const v = clamp(Number(value ?? field.fallback), min, max)
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="slider-row">
          <input type="range" min={min} max={max} value={v} onChange={(e) => onChange(Number(e.target.value))} />
          <span className="slider-value">{v}</span>
        </div>
      </div>
    )
  }

  if (field.kind === 'bitrate') {
    const step = field.step || 16000
    const capMax = Number(capMask || 0)
    const max = Math.max(step, capMax > 0 ? roundUp(capMax, step) : field.max)
    const raw = Number(value ?? field.autoValue ?? 0)
    const v = clamp(Math.round(raw / step) * step, 0, max)
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="slider-row">
          <input type="range" min={0} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
          <span className="slider-value">{v === 0 ? '自动 Auto' : `${Math.round(v / 1000)} kbps`}</span>
        </div>
      </div>
    )
  }

  if (field.kind === 'toggle') {
    const on = Number(value ?? field.fallback) !== 0
    return (
      <div className="field">
        <label>{field.label}</label>
        <label className="switch">
          <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />
          <span className="track" />
          <span>{on ? '开' : '关'}</span>
        </label>
      </div>
    )
  }
  return null
}

function clamp(v, lo, hi) {
  if (!Number.isFinite(v)) return lo
  return Math.min(hi, Math.max(lo, v))
}
function roundUp(v, step) {
  return Math.ceil(v / step) * step
}
