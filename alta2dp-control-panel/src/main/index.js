import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import {
  getDevices,
  writeNext,
  reconnect,
  checkDriver,
  USE_MOCK
} from './backend.mjs'
import { CODECS, buildSettings } from './codecSchema.mjs'

process.on('uncaughtException', (err) => {
  console.error('[main] uncaught:', err)
})

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    title: 'A2DP Control Panel',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------------
// Device polling + change notifications (connect/disconnect toasts)
// ---------------------------------------------------------------------------

let lastOpenedState = {}
let pollTimer = null

function pollAndNotify() {
  try {
    const data = getDevices()
    const state = {}
    for (const d of data.devices) {
      state[d.address] = d.current && Number(d.current.Opened) === 1
    }
    for (const [addr, opened] of Object.entries(state)) {
      const prev = lastOpenedState[addr]
      if (prev !== undefined && prev !== opened && win && !win.isDestroyed()) {
        const dev = data.devices.find((x) => x.address === addr)
        const name = (dev && dev.capability && dev.capability.Name) || addr
        win.webContents.send('device-event', {
          address: addr,
          name,
          connected: opened
        })
      }
    }
    lastOpenedState = state
  } catch (e) {
    console.error('[main] poll error:', e.message)
  }
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

function ok(fn) {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) }
  }
}

ipcMain.handle('driver:check', () => ok(() => checkDriver()))

ipcMain.handle('devices:list', () =>
  ok(() => {
    const data = getDevices()
    // Attach PnP instance id per device by matching BT address suffix.
    for (const d of data.devices) {
      const suffix = d.address.replace(/^0+/, '').toUpperCase()
      const pnp = (data.pnp || []).find(
        (p) => p.DeviceID && p.DeviceID.toUpperCase().includes('_' + suffix + '_')
      )
      d.instanceId = pnp ? pnp.DeviceID : null
      d.supports = CODECS.filter((c) => {
        return c.capabilityFields.some(
          (f) => Number((d.capability && d.capability[f]) || 0) !== 0
        )
      }).map((c) => c.key)
    }
    return data.devices
  })
)

ipcMain.handle('settings:build', (_ev, { address, codecKey }) =>
  ok(() => {
    const data = getDevices()
    const d = data.devices.find((x) => x.address === address)
    if (!d) throw new Error(`Device not found: ${address}`)
    return buildSettings(codecKey, d.capability, d.next)
  })
)

ipcMain.handle('settings:apply', (_ev, { address, props, instanceId, doReconnect }) =>
  ok(() => {
    writeNext(address, props)
    let reconnected = false
    if (doReconnect && instanceId) {
      reconnect(instanceId)
      reconnected = true
    }
    return { reconnected }
  })
)

ipcMain.handle('app:info', () => ({ mock: USE_MOCK, platform: process.platform }))

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  // DevTools / console logging is enough; no external scheme needed.
  createWindow()

  pollTimer = setInterval(pollAndNotify, 2000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (pollTimer) clearInterval(pollTimer)
  if (process.platform !== 'darwin') app.quit()
})
