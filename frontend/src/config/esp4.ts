/**
 * ============================================================
 * KONFIGURASI ESP4 — Satu-satunya sumber konfigurasi komunikasi
 * ============================================================
 *
 * ESP4 adalah gateway utama sistem. Frontend HANYA boleh
 * berkomunikasi dengan ESP4. ESP4 yang mengurus komunikasi
 * ke ESP1, ESP2, ESP3 via UART.
 *
 * CARA MENGUBAH IP:
 *   Ganti nilai ESP4_BASE_URL di bawah sesuai IP ESP4 di
 *   jaringan lokal Anda.
 *
 * CARA MENEMUKAN IP ESP4:
 *   Buka Serial Monitor Arduino setelah ESP4 terhubung WiFi.
 *   IP akan ditampilkan di Serial Monitor.
 *
 * CONTOH:
 *   export const ESP4_BASE_URL = 'http://192.168.1.105';
 *   export const ESP4_BASE_URL = 'http://192.168.4.1';  // AP mode
 */
export const ESP4_BASE_URL = 'http://10.110.25.248';

// ---------------------------------------------------------------------------
// Polling & timeout
// ---------------------------------------------------------------------------

/** Interval polling data dari ESP4 (milidetik) */
export const POLLING_INTERVAL_MS = 3000;

/** Timeout tiap HTTP request ke ESP4 (milidetik) */
export const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Threshold sensor (harus sama dengan nilai di firmware ESP)
// ---------------------------------------------------------------------------

/** Nilai gas di atas angka ini dianggap bahaya */
export const GAS_THRESHOLD = 1800;

/** Nilai rain di atas angka ini dianggap hujan */
export const RAIN_THRESHOLD = 1600;

// ---------------------------------------------------------------------------
// Daftar endpoint yang disediakan ESP4
// Frontend HANYA menggunakan endpoint di bawah ini.
// ---------------------------------------------------------------------------
export const ESP4_ENDPOINTS = {
  /**
   * GET /status
   * Mengembalikan status semua device (ESP1–ESP4)
   * Response: { devices: [ { espNumber, isOnline, lastSeenAt, lampState,
   *             gasValue, rainValue, clotheslinePos, doorState, gateState,
   *             wifiStatus } ] }
   */
  status: '/status',

  /**
   * GET /sensor/gas
   * Nilai terkini sensor gas dari ESP1
   * Response: { value: number }
   */
  sensorGas: '/sensor/gas',

  /**
   * GET /sensor/rain
   * Nilai terkini sensor hujan dari ESP2
   * Response: { value: number }
   */
  sensorRain: '/sensor/rain',

  /**
   * POST /command
   * Kirim command ke ESP target (diteruskan ESP4 via UART)
   * Body:     { target: 1|2|3, command: string }
   * Response: { success: boolean }
   *
   * Command yang valid:
   *   LAMP:ON | LAMP:OFF         → ESP1
   *   FEED                       → ESP1
   *   CLOTHESLINE:IN | CLOTHESLINE:OUT → ESP2
   *   DOOR:OPEN | DOOR:CLOSE     → ESP3
   *   GATE:OPEN | GATE:CLOSE     → ESP3
   */
  command: '/command',

  /**
   * POST /wifi
   * Kirim konfigurasi WiFi ke semua atau ESP tertentu
   * Body:     { ssid: string, password: string, target?: 1|2|3|4 }
   * Response: { success: boolean }
   */
  wifi: '/wifi',

  /**
   * GET  /logs?esp={1|2|3|4}&limit={n}
   * Log sistem per device
   * Response: { data: [ { id, espNumber, messageType, message, createdAt } ] }
   */
  logs: '/logs',

  /**
   * GET  /automode
   * Status auto mode jemuran ESP2
   * Response: { enabled: boolean }
   *
   * POST /automode
   * Toggle auto mode
   * Body:     { enabled: boolean }
   * Response: { success: boolean }
   */
  autoMode: '/automode',

  /**
   * GET    /rfid/whitelist
   * Daftar UID RFID yang diizinkan (disimpan di ESP4/ESP3)
   * Response: { data: [ { id, uid, description, createdAt } ] }
   *
   * POST   /rfid/whitelist
   * Tambah UID baru
   * Body:     { uid: string, description?: string }
   * Response: { success: boolean, data: { id, uid, description, createdAt } }
   *
   * DELETE /rfid/whitelist/:uid
   * Hapus UID dari whitelist
   * Response: { success: boolean }
   */
  rfidWhitelist: '/rfid/whitelist',

  /**
   * GET /rfid/scans
   * Log scan RFID terbaru
   * Response: { data: [ { uid, authorized, espNumber, scannedAt } ] }
   */
  rfidScans: '/rfid/scans',
} as const;
