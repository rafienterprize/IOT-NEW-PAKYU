/**
 * ============================================================
 * esp4Api — Service Layer Komunikasi ke ESP4
 * ============================================================
 *
 * SEMUA komunikasi HTTP antara frontend dan ESP4 dilakukan
 * melalui file ini. Tidak ada komponen atau hook yang boleh
 * melakukan fetch langsung tanpa melewati service ini.
 *
 * Keuntungan:
 *  - Perubahan IP/endpoint cukup di config/esp4.ts
 *  - Error handling konsisten di satu tempat
 *  - Mudah di-mock untuk testing
 *  - Mudah diperluas jika endpoint bertambah
 */

import {
  ESP4_BASE_URL,
  ESP4_ENDPOINTS,
  REQUEST_TIMEOUT_MS,
} from '../config/esp4';

// ---------------------------------------------------------------------------
// Tipe data
// ---------------------------------------------------------------------------

export interface DeviceStatus {
  espNumber: number;
  isOnline: boolean;
  lastSeenAt: string;
  lampState?: string;
  gasValue?: number;
  rainValue?: number;
  clotheslinePos?: string;
  doorState?: string;
  gateState?: string;
  wifiStatus?: string;
}

export interface SensorReading {
  value: number;
  timestamp: string;
  sensorType: string;
  espNumber: number;
}

export interface DeviceLog {
  id: number;
  espNumber: number;
  messageType: string;
  message: string;
  createdAt: string;
}

export interface RFIDEntry {
  id: number;
  uid: string;
  description?: string;
  createdAt: string;
}

export interface RFIDScan {
  uid: string;
  authorized: boolean;
  espNumber: number;
  scannedAt: string;
}

export interface AutoModeState {
  enabled: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// Helper internal — satu fungsi fetch terpusat
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ESP4_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    const err: ApiError = {
      message: `HTTP ${response.status}: ${errorText}`,
      status: response.status,
    };
    throw err;
  }

  // ESP32 mungkin mengembalikan body kosong pada DELETE
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// STATUS — GET /status
// ---------------------------------------------------------------------------

/**
 * Ambil status semua device dari ESP4.
 * Response dari ESP4 bisa berupa array langsung atau { devices: [...] } atau { data: [...] }
 */
export async function getStatus(): Promise<DeviceStatus[]> {
  const json = await request<any>(ESP4_ENDPOINTS.status);
  const raw: any[] = Array.isArray(json)
    ? json
    : (json.devices ?? json.data ?? []);

  return raw.map((d: any) => ({
    espNumber: d.espNumber ?? d.esp ?? d.id,
    isOnline: d.isOnline ?? d.online ?? false,
    lastSeenAt: d.lastSeenAt ?? d.lastSeen ?? new Date().toISOString(),
    lampState: d.lampState ?? d.lamp,
    gasValue: d.gasValue ?? d.gas,
    rainValue: d.rainValue ?? d.rain,
    clotheslinePos: d.clotheslinePos ?? d.clothesline,
    doorState: d.doorState ?? d.door,
    gateState: d.gateState ?? d.gate,
    wifiStatus: d.wifiStatus ?? d.wifi,
  }));
}

// ---------------------------------------------------------------------------
// SENSOR — GET /sensor/gas | GET /sensor/rain
// ---------------------------------------------------------------------------

/** Ambil nilai terkini sensor gas (ESP1) */
export async function getSensorGas(): Promise<number> {
  const json = await request<any>(ESP4_ENDPOINTS.sensorGas);
  return typeof json.value === 'number' ? json.value : (typeof json === 'number' ? json : 0);
}

/** Ambil nilai terkini sensor hujan (ESP2) */
export async function getSensorRain(): Promise<number> {
  const json = await request<any>(ESP4_ENDPOINTS.sensorRain);
  return typeof json.value === 'number' ? json.value : (typeof json === 'number' ? json : 0);
}

// ---------------------------------------------------------------------------
// LOGS — GET /logs
// ---------------------------------------------------------------------------

/** Ambil log sistem, bisa difilter per ESP */
export async function getLogs(espNumber?: number, limit = 50): Promise<DeviceLog[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (espNumber !== undefined) params.set('esp', String(espNumber));

  const json = await request<any>(`${ESP4_ENDPOINTS.logs}?${params}`);
  const raw: any[] = Array.isArray(json) ? json : (json.logs ?? json.data ?? []);

  return raw.map((l: any, idx: number) => ({
    id: l.id ?? idx,
    espNumber: l.espNumber ?? l.esp ?? 0,
    messageType: l.messageType ?? l.type ?? 'INFO',
    message: l.message ?? '',
    createdAt: l.createdAt ?? l.timestamp ?? new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// COMMAND — POST /command
// ---------------------------------------------------------------------------

/**
 * Kirim command ke ESP target melalui ESP4.
 * ESP4 yang meneruskan ke ESP1/2/3 via UART.
 *
 * @param target  Nomor ESP tujuan (1 | 2 | 3)
 * @param command String command, contoh: "LAMP:ON", "FEED", "DOOR:OPEN"
 */
export async function sendCommand(target: 1 | 2 | 3, command: string): Promise<void> {
  await request(ESP4_ENDPOINTS.command, {
    method: 'POST',
    body: JSON.stringify({ target, command }),
  });
}

// ---------------------------------------------------------------------------
// WIFI — POST /wifi
// ---------------------------------------------------------------------------

/**
 * Kirim konfigurasi WiFi ke ESP4.
 * ESP4 akan meneruskan ke semua ESP atau ESP tertentu.
 *
 * @param ssid      SSID WiFi
 * @param password  Password WiFi (min 8 karakter)
 * @param target    Nomor ESP tujuan (opsional, jika kosong = broadcast semua)
 */
export async function sendWifiConfig(
  ssid: string,
  password: string,
  target?: number
): Promise<void> {
  const body: Record<string, unknown> = { ssid, password };
  if (target !== undefined) body.target = target;

  await request(ESP4_ENDPOINTS.wifi, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// AUTO MODE — GET /automode | POST /automode
// ---------------------------------------------------------------------------

/** Ambil status auto mode jemuran ESP2 */
export async function getAutoMode(): Promise<boolean> {
  const json = await request<any>(ESP4_ENDPOINTS.autoMode);
  return json.enabled ?? json.autoMode ?? json.data?.enabled ?? false;
}

/**
 * Aktifkan atau matikan auto mode jemuran.
 * Saat aktif, ESP2 otomatis menarik jemuran masuk saat hujan terdeteksi.
 */
export async function setAutoMode(enabled: boolean): Promise<void> {
  await request(ESP4_ENDPOINTS.autoMode, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

// ---------------------------------------------------------------------------
// RFID WHITELIST — GET | POST | DELETE /rfid/whitelist
// ---------------------------------------------------------------------------

/** Ambil daftar RFID yang diizinkan */
export async function getRfidWhitelist(): Promise<RFIDEntry[]> {
  const json = await request<any>(ESP4_ENDPOINTS.rfidWhitelist);
  const raw: any[] = Array.isArray(json) ? json : (json.whitelist ?? json.data ?? []);

  return raw.map((e: any, idx: number) => ({
    id: e.id ?? idx,
    uid: e.uid ?? '',
    description: e.description,
    createdAt: e.createdAt ?? e.timestamp ?? new Date().toISOString(),
  }));
}

/**
 * Tambahkan UID RFID ke whitelist.
 * Returns entry yang baru dibuat.
 */
export async function addRfidToWhitelist(
  uid: string,
  description?: string
): Promise<RFIDEntry> {
  const json = await request<any>(ESP4_ENDPOINTS.rfidWhitelist, {
    method: 'POST',
    body: JSON.stringify({ uid, description }),
  });

  // Normalise response — ESP4 mungkin return { data: {...} } atau langsung objek
  const entry = json.data ?? json;
  return {
    id: entry.id ?? Date.now(),
    uid: entry.uid ?? uid,
    description: entry.description ?? description,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Hapus UID RFID dari whitelist.
 */
export async function removeRfidFromWhitelist(uid: string): Promise<void> {
  await request(`${ESP4_ENDPOINTS.rfidWhitelist}/${uid}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// RFID SCANS — GET /rfid/scans
// ---------------------------------------------------------------------------

/** Ambil log scan RFID terbaru (max 20 entri) */
export async function getRfidScans(): Promise<RFIDScan[]> {
  const json = await request<any>(ESP4_ENDPOINTS.rfidScans);
  const raw: any[] = Array.isArray(json) ? json : (json.scans ?? json.data ?? []);

  return raw.slice(0, 20).map((s: any) => ({
    uid: s.uid ?? '',
    authorized: s.authorized ?? false,
    espNumber: s.espNumber ?? 3,
    scannedAt: s.scannedAt ?? s.timestamp ?? new Date().toISOString(),
  }));
}
