import React from 'react'
import { codecNameFromNumber, formatKbps } from '../codecMeta'

export default function Sidebar({ devices, selectedAddr, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo">🎧</span> A2DP 控制面板
      </div>
      <div className="device-list">
        {devices.length === 0 && (
          <div className="empty-hint">
            未发现设备。
            <br />
            请确认 Alternative A2DP 驱动已安装并连接过蓝牙音频设备。
          </div>
        )}
        {devices.map((d) => {
          const connected = d.current && Number(d.current.Opened) === 1
          const name = (d.capability && d.capability.Name) || d.address
          const curCodec = d.current ? codecNameFromNumber(d.current.Codec) : '—'
          return (
            <div
              key={d.address}
              className={`device-item${selectedAddr === d.address ? ' selected' : ''}`}
              onClick={() => onSelect(d.address)}
            >
              <span className={`dot ${connected ? 'on' : 'off'}`} />
              <div className="device-meta">
                <div className="device-name">{name}</div>
                <div className="device-sub">
                  {connected ? `已连接 · ${curCodec}` : '未连接'}
                  {connected && d.current.Bitrate > 0 ? ` · ${formatKbps(d.current.Bitrate)}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
