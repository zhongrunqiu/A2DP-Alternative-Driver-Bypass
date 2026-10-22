import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  appInfo: () => ipcRenderer.invoke('app:info'),
  driverCheck: () => ipcRenderer.invoke('driver:check'),
  listDevices: () => ipcRenderer.invoke('devices:list'),
  buildSettings: (address, codecKey) =>
    ipcRenderer.invoke('settings:build', { address, codecKey }),
  applySettings: (address, props, instanceId, doReconnect) =>
    ipcRenderer.invoke('settings:apply', { address, props, instanceId, doReconnect }),
  onDeviceEvent: (cb) => {
    const listener = (_ev, data) => cb(data)
    ipcRenderer.on('device-event', listener)
    return () => ipcRenderer.removeListener('device-event', listener)
  }
})
