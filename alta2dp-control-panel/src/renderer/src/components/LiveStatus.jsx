import React from 'react'
import { codecNameFromNumber, formatKbps } from '../codecMeta'

/** Live status: current codec / bitrate / connection / latency / SCO / error */
export default function LiveStatus({ device }) {
  const cur = device && device.current
  if (!cur) {
    return <div className="card" style={{ color: 'var(--text-dim)' }}>暂无实时状态（设备从未连接？）</div>
  }
  const opened = Number(cur.Opened) === 1
  const sco = Number(cur.ScoActive) === 1
  const err = Number(cur.Error || 0)
  // Delay is in 100ns units → ms = value / 10000
  const delayMs = cur.Delay ? Math.round(Number(cur.Delay) / 10000) : 0

  return (
    <div className="status-grid">
      <div className="stat">
        <div className="k">连接状态</div>
        <div className={`v ${opened ? 'ok' : ''}`}>{opened ? '已连接' : '未连接'}</div>
      </div>
      <div className="stat">
        <div className="k">当前编解码</div>
        <div className="v">{codecNameFromNumber(cur.Codec)}</div>
      </div>
      <div className="stat">
        <div className="k">实际码率</div>
        <div className="v">{cur.Bitrate > 0 ? formatKbps(cur.Bitrate) : '—'}</div>
      </div>
      <div className="stat">
        <div className="k">传输延迟</div>
        <div className={`v ${delayMs > 200 ? 'warn' : ''}`}>{delayMs > 0 ? `${delayMs} ms` : '—'}</div>
      </div>
      <div className="stat">
        <div className="k">通话 (SCO)</div>
        <div className={`v ${sco ? 'warn' : ''}`}>{sco ? '通话中·A2DP挂起' : '无'}</div>
      </div>
      <div className="stat">
        <div className="k">错误码</div>
        <div className={`v ${err ? 'err' : 'ok'}`}>{err ? `0x${err.toString(16)}` : '无'}</div>
      </div>
    </div>
  )
}
