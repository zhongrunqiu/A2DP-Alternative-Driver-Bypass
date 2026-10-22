/**
 * AltA2DP registry backend.
 *
 * On Windows: shells out to PowerShell to read/write the driver's registry keys
 * and to cycle PnP devices for reconnection.
 *
 * Anywhere else (or with ALT2DP_MOCK=1): serves realistic mock data so the UI
 * can be developed and tested on any machine.
 */

import { execFileSync } from 'node:child_process'

export const REG_BASE =
  'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\AltA2DP\\Parameters\\Devices'

export const IS_WINDOWS = process.platform === 'win32'
export const USE_MOCK =
  process.env.ALT2DP_MOCK === '1' ||
  (!IS_WINDOWS && process.env.ALT2DP_MOCK !== '0')

// ---------------------------------------------------------------------------
// PowerShell scripts (executed with -NoProfile -NonInteractive -EncodedCommand)
// ---------------------------------------------------------------------------

const SCRIPT_GET_DEVICES = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
$base = 'HKLM:\SYSTEM\CurrentControlSet\Services\AltA2DP\Parameters\Devices'

function Get-KeyProps($path) {
  if (-not (Test-Path $path)) { return $null }
  $item = Get-Item $path
  $h = [ordered]@{}
  foreach ($name in $item.GetValueNames()) {
    if ($name -eq '') { continue }
    $h[$name] = (Get-ItemProperty -Path $path -Name $name).$name
  }
  return [PSCustomObject]$h
}

$devices = @()
foreach ($k in (Get-ChildItem "$base\Capability" -EA SilentlyContinue)) {
  $addr = $k.PSChildName
  $devices += [PSCustomObject]@{
    address    = $addr
    capability = (Get-KeyProps "$base\Capability\$addr")
    current    = (Get-KeyProps "$base\Current\$addr")
    next       = (Get-KeyProps "$base\Next\$addr")
  }
}

$pnp = @(Get-CimInstance Win32_PnPEntity -EA SilentlyContinue |
  Where-Object { $_.DeviceID -like '*BTHENUM*110b*' } |
  Select-Object DeviceID, Name, Status)

$result = [PSCustomObject]@{ devices = $devices; pnp = $pnp }
$json = $result | ConvertTo-Json -Depth 6 -Compress
if (-not $json) { $json = '{"devices":[],"pnp":[]}' }
Write-Output $json
`

const SCRIPT_WRITE_NEXT = String.raw`
$ErrorActionPreference = 'Stop'
$path = 'NEXT_PATH_PLACEHOLDER'
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
$props = 'PROPS_JSON_PLACEHOLDER' | ConvertFrom-Json
foreach ($p in $props.PSObject.Properties) {
  Set-ItemProperty -Path $path -Name $p.Name -Value ([int]$p.Value) -Type DWord
}
Write-Output '{"ok":true}'
`

const SCRIPT_RECONNECT = String.raw`
$ErrorActionPreference = 'Stop'
$instanceId = 'INSTANCE_ID_PLACEHOLDER'
Disable-PnpDevice -InstanceId $instanceId -Confirm:$false
Start-Sleep -Seconds 2
Enable-PnpDevice -InstanceId $instanceId -Confirm:$false
Write-Output '{"ok":true}'
`

const SCRIPT_CHECK_DRIVER = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
$svc = Get-Service AltA2DP -EA SilentlyContinue
$svc2 = Get-Service AltA2dpSVC -EA SilentlyContinue
$reg = Test-Path 'HKLM:\SYSTEM\CurrentControlSet\Services\AltA2DP'
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
[PSCustomObject]@{
  driverInstalled = [bool]$reg
  driverState     = if ($svc) { $svc.Status.ToString() } else { 'NotFound' }
  serviceState    = if ($svc2) { $svc2.Status.ToString() } else { 'NotFound' }
  isAdmin         = [bool]$isAdmin
} | ConvertTo-Json -Compress
`

// ---------------------------------------------------------------------------
// PowerShell execution helper
// ---------------------------------------------------------------------------

function runPs(script) {
  // -EncodedCommand avoids all quoting problems (pass UTF-16LE base64)
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  const stdout = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
  )
  const text = stdout.trim()
  if (!text) return null
  return JSON.parse(text)
}

// ---------------------------------------------------------------------------
// Mock backend — mirrors the README's registry schema exactly
// ---------------------------------------------------------------------------

export const mockStore = {
  devices: [
    {
      address: '0000340e224a88bb',
      capability: {
        Name: 'AirPods Pro',
        Codec: 3,
        SbcChannelMode: 15,
        SbcSamplingFrequency: 3,
        SbcAllocationMethod: 3,
        SbcSubbands: 3,
        SbcBlockLength: 15,
        SbcMinimumBitpool: 2,
        SbcMaximumBitpool: 53,
        AbrEnable: 1,
        AacChannelMode: 4,
        AacSamplingFrequency: 8,
        AacBitrate: 256000,
        AacPeakBitrate: 0,
        LdacChannelMode: 0,
        LdacSamplingFrequency: 0,
        LdacSampleFormat: 0,
        LdacEqmid: 0,
        AptxChannelMode: 0,
        AptxSamplingFrequency: 0,
        AptxHdChannelMode: 0,
        AptxHdSamplingFrequency: 0,
        AptxHdSampleFormat: 0,
        AptxLlChannelMode: 0,
        AptxLlSamplingFrequency: 0
      },
      next: {
        Codec: 2,
        SbcChannelMode: 2,
        SbcSamplingFrequency: 2,
        SbcAllocationMethod: 2,
        SbcSubbands: 1,
        SbcBlockLength: 1,
        SbcMinimumBitpool: 2,
        SbcMaximumBitpool: 53,
        AbrEnable: 1,
        AacChannelMode: 4,
        AacSamplingFrequency: 8,
        AacBitrate: 256000,
        AacPeakBitrate: 0,
        VolumeLevel: -1024
      },
      current: {
        Codec: 2,
        Opened: 1,
        Bitrate: 256000,
        ScoActive: 0,
        Delay: 1500000,
        Error: 0,
        AacChannelMode: 4,
        AacSamplingFrequency: 8
      },
      instanceId:
        'BTHENUM\\{0000110B-0000-1000-8000-00805F9B34FB}_VID&0001004C_PID&2027\\9&3A3A251&0&340E224A88BB_C00000000'
    },
    {
      address: '000070f94aa804e3',
      capability: {
        Name: 'WH-1000XM5',
        Codec: 3,
        SbcChannelMode: 15,
        SbcSamplingFrequency: 7,
        SbcAllocationMethod: 3,
        SbcSubbands: 3,
        SbcBlockLength: 15,
        SbcMinimumBitpool: 2,
        SbcMaximumBitpool: 250,
        AbrEnable: 1,
        AacChannelMode: 12,
        AacSamplingFrequency: 24,
        AacBitrate: 320000,
        AacPeakBitrate: 0,
        LdacChannelMode: 7,
        LdacSamplingFrequency: 15,
        LdacSampleFormat: 3,
        LdacEqmid: 3,
        AptxChannelMode: 0,
        AptxSamplingFrequency: 0,
        AptxHdChannelMode: 0,
        AptxHdSamplingFrequency: 0,
        AptxHdSampleFormat: 0,
        AptxLlChannelMode: 0,
        AptxLlSamplingFrequency: 0
      },
      next: {
        Codec: 7,
        SbcChannelMode: 2,
        SbcSamplingFrequency: 2,
        SbcAllocationMethod: 2,
        SbcSubbands: 1,
        SbcBlockLength: 1,
        SbcMinimumBitpool: 2,
        SbcMaximumBitpool: 250,
        AbrEnable: 1,
        AacChannelMode: 4,
        AacSamplingFrequency: 8,
        AacBitrate: 0,
        AacPeakBitrate: 0,
        LdacChannelMode: 1,
        LdacSamplingFrequency: 2,
        LdacSampleFormat: 1,
        LdacEqmid: 0,
        VolumeLevel: 0
      },
      current: {
        Codec: 7,
        Opened: 0,
        Bitrate: 0,
        ScoActive: 0,
        Delay: 0,
        Error: 0,
        LdacChannelMode: 1,
        LdacSamplingFrequency: 2,
        LdacSampleFormat: 1,
        LdacEqmid: 0
      },
      instanceId:
        'BTHENUM\\{0000110B-0000-1000-8000-00805F9B34FB}_VID&0002105F_PID&0079\\7&2B1C0D3&0&70F94AA804E3_C00000000'
    }
  ]
}

function mockGetDevices() {
  return {
    devices: mockStore.devices.map((d) => ({
      address: d.address,
      capability: { ...d.capability },
      current: d.current ? { ...d.current } : null,
      next: d.next ? { ...d.next } : null
    })),
    pnp: mockStore.devices.map((d) => ({
      DeviceID: d.instanceId,
      Name: d.capability.Name,
      Status: d.current && d.current.Opened === 1 ? 'OK' : 'Unknown'
    }))
  }
}

function mockCheckDriver() {
  return {
    driverInstalled: true,
    driverState: 'Running (mock)',
    serviceState: 'Running (mock)',
    isAdmin: true
  }
}

// ---------------------------------------------------------------------------
// Public API (used by IPC handlers and unit tests)
// ---------------------------------------------------------------------------

function findMock(address) {
  return mockStore.devices.find((d) => d.address.toLowerCase() === String(address).toLowerCase())
}

export function getDevices() {
  if (USE_MOCK) return mockGetDevices()
  return runPs(SCRIPT_GET_DEVICES) || { devices: [], pnp: [] }
}

export function writeNext(address, props) {
  // Sanitize: only DWORD-safe integer values, known key names
  const clean = {}
  for (const [k, v] of Object.entries(props)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(k)) throw new Error(`Invalid registry value name: ${k}`)
    const n = Number(v)
    if (!Number.isInteger(n)) throw new Error(`Registry value ${k} must be an integer, got ${v}`)
    clean[k] = n >>> 0 // store as unsigned 32-bit DWORD
  }
  if (USE_MOCK) {
    const d = findMock(address)
    if (!d) throw new Error(`Unknown device: ${address}`)
    d.next = { ...(d.next || {}), ...clean }
    return { ok: true }
  }
  if (!/^[0-9a-fA-F]{1,16}$/.test(address)) throw new Error(`Invalid BT address: ${address}`)
  const path = `${REG_BASE}\\Next\\${address}`
  const script = SCRIPT_WRITE_NEXT.replace(
    'NEXT_PATH_PLACEHOLDER',
    path.replace(/'/g, "''")
  ).replace('PROPS_JSON_PLACEHOLDER', JSON.stringify(clean).replace(/'/g, "''"))
  return runPs(script)
}

export function reconnect(instanceId) {
  if (USE_MOCK) {
    const d = mockStore.devices.find((x) => x.instanceId === instanceId)
    if (d && d.current) d.current.Opened = 1
    return { ok: true }
  }
  const script = SCRIPT_RECONNECT.replace(
    'INSTANCE_ID_PLACEHOLDER',
    instanceId.replace(/'/g, "''")
  )
  return runPs(script)
}

export function checkDriver() {
  if (USE_MOCK) return mockCheckDriver()
  return runPs(SCRIPT_CHECK_DRIVER)
}
