import React, { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import CodecPanel from './components/CodecPanel'
import LiveStatus from './components/LiveStatus'
import { codecByKey, codecNameFromNumber, formatKbps } from './codecMeta'

const api = window.api

export default function App() {
  const [devices, setDevices] = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [codecKey, setCodecKey] = useState(null)
  const [settings, setSettings] = useState(null)
  const [toasts, setToasts] = useState([])
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState({ mock: false, platform: '' })
  const [driver, setDriver] = useState(null)
  const toastSeq = useRef(0)

  const pushToast = useCallback((text, kind = '') => {
    const id = ++toastSeq.current
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  // ---- initial app info / driver state -----------------------------------
  useEffect(() => {
    ;(async () => {
      try {
        const a = await api.appInfo()
        setInfo(a)
        const d = await api.driverCheck()
        if (d.ok) setDriver(d.data)
      } catch (e) {
        pushToast('初始化失败: ' + e.message, 'error')
      }
    })()
  }, [pushToast])

  // ---- device polling ------------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      const res = await api.listDevices()
      if (!res.ok) throw new Error(res.error)
      setDevices(res.data)
      setSelectedAddr((prev) => {
        if (prev && res.data.some((d) => d.address === prev)) return prev
        return res.data.length ? res.data[0].address : null
      })
    } catch (e) {
      // silent — status bar shows last error
      setLastPollError(String(e.message || e))
    }
  }, [])

  const [lastPollError, setLastPollError] = useState(null)

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 2000)
    return () => clearInterval(t)
  }, [refresh])

  // ---- connect/disconnect toasts from main process ------------------------
  useEffect(() => {
    if (!api.onDeviceEvent) return
    return api.onDeviceEvent(({ name, connected }) => {
      pushToast(`${name} ${connected ? '已连接 ✅' : '已断开 ❌'}`, connected ? 'success' : 'error')
      refresh()
    })
  }, [pushToast, refresh])

  // ---- selected device & settings draft ------------------------------------
  const device = devices.find((d) => d.address === selectedAddr) || null

  // Pick the codec shown in the panel: prefer Next.Codec, then Current.Codec.
  useEffect(() => {
    if (!device) return
    const nextId = device.next && device.next.Codec
    const curId = device.current && device.current.Codec
    let key = null
    for (const id of [nextId, curId]) {
      const c = CODEC_ID_TO_KEY(id)
      if (c && (device.supports || []).includes(c)) { key = c; break }
    }
    if (!key && device.supports && device.supports.length) key = device.supports[0]
    setCodecKey((prev) => (prev && (device.supports || []).includes(prev) ? prev : key))
  }, [device && device.address, devices])

  async function loadSettings(addr, key) {
    if (!addr || !key) return
    const res = await api.buildSettings(addr, key)
    if (res.ok) setSettings(res.data)
    else pushToast('读取配置失败: ' + res.error, 'error')
  }

  useEffect(() => {
    setSettings(null)
    if (device && codecKey) loadSettings(device.address, codecKey)
  }, [device && device.address, codecKey])

  function pickCodec(key) {
    setCodecKey(key)
  }

  function changeField(reg, value) {
    setSettings((s) => ({ ...s, [reg]: value }))
  }

  // ---- apply ---------------------------------------------------------------
  async function apply(withReconnect) {
    if (!device || !settings) return
    setBusy(true)
    try {
      const props = { ...settings }
      const res = await api.applySettings(device.address, props, device.instanceId, withReconnect)
      if (!res.ok) throw new Error(res.error)
      if (withReconnect) {
        pushToast(
          res.data.reconnected
            ? `已写入注册表并重连 ${nameOf(device)}，新设置将在重连后生效`
            : '已写入注册表（未找到 PnP 实例 ID，无法自动重连）',
          res.data.reconnected ? 'success' : 'error'
        )
      } else {
        pushToast('已写入 Next 注册表键（下次连接时生效）', 'success')
      }
      refresh()
    } catch (e) {
      pushToast('应用失败: ' + e.message + (String(e.message).includes('Access') ? '（请以管理员身份运行）' : ''), 'error')
    } finally {
      setBusy(false)
    }
  }

  // ---- render --------------------------------------------------------------
  const cur = device && device.current
  const opened = cur && Number(cur.Opened) === 1

  return (
    <div className="app">
      <div className="layout">
        <Sidebar devices={devices} selectedAddr={selectedAddr} onSelect={setSelectedAddr} />
        <main className="main">
          {info.mock && (
            <div className="banner">
              ⚠ 当前为演示/Mock 模式（非 Windows 或设置了 ALT2DP_MOCK=1）。在 Windows 上以管理员身份运行即可读写真实注册表。
            </div>
          )}
          {driver && !driver.isAdmin && !info.mock && (
            <div className="banner">⚠ 未以管理员身份运行：无法写入 HKLM 注册表或重启设备。</div>
          )}
          {driver && !driver.driverInstalled && !info.mock && (
            <div className="banner">⚠ 未检测到 AltA2DP 驱动注册表项，请先安装 Alternative A2DP 驱动。</div>
          )}

          <div className="main-header">
            <div className="main-title">{device ? nameOf(device) : '选择设备'}</div>
            <div className="main-addr">
              {device ? `${fmtAddr(device.address)}${device.instanceId ? '' : ' · 无 PnP 实例'}` : ''}
            </div>
          </div>

          {device && (
            <div className="content">
              <div className="section">
                <h3>实时状态</h3>
                <LiveStatus device={device} />
              </div>

              <CodecPanel
                device={device}
                codecKey={codecKey}
                settings={settings}
                onPickCodec={pickCodec}
                onChange={changeField}
              />

              <div className="section">
                <h3>应用</h3>
                <div className="actions">
                  <button className="btn primary" disabled={!settings || busy} onClick={() => apply(true)}>
                    {busy ? '处理中…' : '✔ 应用并重连'}
                  </button>
                  <button className="btn" disabled={!settings || busy} onClick={() => apply(false)}>
                    仅保存（下次连接生效）
                  </button>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                    “应用并重连”会禁用再启用该蓝牙设备节点，短暂中断音频。
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* footer live status bar */}
      <footer className="statusbar">
        <span className="sb-item">
          设备：<b>{device ? nameOf(device) : '—'}</b>
        </span>
        <span className="sb-item">
          状态：<b style={{ color: opened ? 'var(--green)' : 'var(--text-dim)' }}>{opened ? '已连接' : '未连接'}</b>
        </span>
        <span className="sb-item">
          编解码：<b>{cur ? codecNameFromNumber(cur.Codec) : '—'}</b>
        </span>
        <span className="sb-item">
          码率：<b>{cur && cur.Bitrate > 0 ? formatKbps(cur.Bitrate) : '—'}</b>
        </span>
        <span className="sb-item">
          延迟：<b>{cur && cur.Delay ? Math.round(Number(cur.Delay) / 10000) + ' ms' : '—'}</b>
        </span>
        {lastPollError && <span className="sb-item" style={{ color: 'var(--red)' }}>轮询错误: {lastPollError}</span>}
        <span className="sb-item" style={{ marginLeft: 'auto' }}>
          {info.mock ? <span className="mock-tag">MOCK 模式</span> : `Windows · ${driver ? driver.serviceState : ''}`}
        </span>
      </footer>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function nameOf(d) {
  return (d.capability && d.capability.Name) || d.address
}

function fmtAddr(a) {
  // 0000340e224a88bb -> 34:0E:22:4A:88:BB
  const raw = a.replace(/^0+/, '').padStart(12, '0')
  return raw.match(/.{2}/g).join(':').toUpperCase()
}

const IDS = { 1: 'sbc', 2: 'aac', 4: 'aptx', 5: 'aptx_hd', 6: 'aptx_ll', 7: 'ldac' }
function CODEC_ID_TO_KEY(id) {
  if (id == null) return null
  return IDS[Number(id)] || null
}
