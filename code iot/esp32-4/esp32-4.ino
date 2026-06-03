/*
  ============================================================
  ESP32 #4 - Web Server & Gateway Utama
  ============================================================

  PERAN DALAM SISTEM:
    Pusat komunikasi seluruh sistem IoT Smart Home.
    - Menjadi HTTP Web Server untuk frontend (static site via LittleFS)
    - Menyediakan REST API untuk frontend
    - Menjadi gateway ke ESP1, ESP2, ESP3 via UART
    - Menyimpan state semua device di RAM
    - Menyimpan RFID whitelist di LittleFS (persistent)

  ARSITEKTUR:
    Browser → HTTP → ESP4 Web Server → UART → ESP1 / ESP2 / ESP3

  PIN HARDWARE:
    UART ke ESP1:  RX=GPIO16, TX=GPIO17  @9600 baud
    UART ke ESP2:  RX=GPIO4,  TX=GPIO5   @9600 baud
    UART ke ESP3:  RX=GPIO13, TX=GPIO15  @9600 baud  ← pin baru (hindari conflict)
    LED ESP1:      GPIO21
    LED ESP2:      GPIO22
    LED ESP3:      GPIO23
    LED System:    GPIO19
    Buzzer:        GPIO14
    Config Button: GPIO0

  DEPENDENCIES (Arduino Library Manager):
    - ESPAsyncWebServer  (me-no-dev)
    - AsyncTCP           (me-no-dev)
    - ArduinoJson        (Benoit Blanchon) v6.x

  FILESYSTEM:
    LittleFS — simpan file frontend (index.html, assets/) dan rfid_whitelist.json

  CARA DEPLOY FRONTEND:
    1. Build frontend: cd frontend && npm run build
    2. Copy isi folder frontend/dist/ ke folder data/ di sketch ini
    3. Upload filesystem via Arduino IDE:
       Tools → ESP32 Sketch Data Upload (plugin arduino-esp32fs)
       atau via PlatformIO: pio run --target uploadfs

  CARA UBAH IP / KONFIGURASI:
    Ubah bagian "KONFIGURASI" di bawah ini.
    Hanya satu lokasi — tidak perlu ganti di banyak tempat.
  ============================================================
*/

// ============================================================
// DEPENDENCIES
// ============================================================
#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

// ============================================================
// KONFIGURASI — UBAH DI SINI SAJA
// ============================================================

// WiFi
#define WIFI_SSID     "Wi-Fi"
#define WIFI_PASSWORD "1sampai9"

// PIN UART ke ESP1 (dipertahankan dari firmware lama)
#define ESP1_RX 16
#define ESP1_TX 17

// PIN UART ke ESP2 (dipertahankan dari firmware lama)
#define ESP2_RX 4
#define ESP2_TX 5

// PIN UART ke ESP3
// CATATAN: GPIO2 dan GPIO18 dari firmware lama bermasalah:
//   GPIO2  = boot strapping pin (bisa ganggu upload)
//   GPIO18 = sering dipakai SPI, conflict RFID di ESP3
// Gunakan GPIO13 (RX) dan GPIO15 (TX) yang bebas konflik.
#define ESP3_RX 13
#define ESP3_TX 15

// PIN LED Status
#define LED_ESP1   21
#define LED_ESP2   22
#define LED_ESP3   23
#define LED_SYSTEM 19

// PIN Buzzer & Button
#define BUZZER_PIN        14
#define CONFIG_BUTTON_PIN  0

// Timeout device dianggap offline (ms)
#define DEVICE_TIMEOUT_MS 10000

// Ukuran buffer log per device
#define LOG_BUFFER_SIZE 20

// File RFID whitelist di LittleFS
#define RFID_WHITELIST_FILE "/rfid_whitelist.json"


// ============================================================
// OBJEK GLOBAL
// ============================================================

// UART ke ESP1, ESP2, ESP3
HardwareSerial ESP1Serial(1);
HardwareSerial ESP2Serial(2);
HardwareSerial ESP3Serial(0); // Serial0 dipakai khusus ESP3
// Catatan: Serial0 (GPIO1/3) adalah USB Serial utama saat flash.
// Setelah boot, kita reinit ke GPIO13/15. Tidak bentrok selama
// tidak ada upload aktif.

// Web Server port 80
AsyncWebServer server(80);

// ============================================================
// DEVICE STATE — state seluruh device disimpan di RAM
// ============================================================

struct DeviceState {
  bool   isOnline;
  unsigned long lastSeenAt;  // millis()
  String lastSeenISO;         // ISO timestamp

  // ESP1
  int    gasValue;
  String lampState;

  // ESP2
  int    rainValue;
  String clotheslinePos;

  // ESP3
  String doorState;
  String gateState;

  String wifiStatus;
};

DeviceState devices[4]; // index 0 = ESP1, 1 = ESP2, 2 = ESP3, 3 = ESP4

// ============================================================
// LOG BUFFER — circular buffer log per device
// ============================================================

struct LogEntry {
  int    id;
  int    espNumber;
  String messageType;
  String message;
  String createdAt;
};

// Semua log digabung dalam satu ring buffer
LogEntry logBuffer[LOG_BUFFER_SIZE * 4];
int      logHead    = 0;
int      logCount   = 0;
int      logIdSeq   = 1;

// ============================================================
// RFID STATE
// ============================================================

struct RFIDEntry {
  int    id;
  String uid;
  String description;
  String createdAt;
};

struct RFIDScan {
  String uid;
  bool   authorized;
  int    espNumber;
  String scannedAt;
};

#define MAX_RFID_WHITELIST 50
#define MAX_RFID_SCANS     20

RFIDEntry rfidWhitelist[MAX_RFID_WHITELIST];
int       rfidWhitelistCount = 0;

RFIDScan  rfidScans[MAX_RFID_SCANS];
int       rfidScanHead  = 0;
int       rfidScanCount = 0;

// ============================================================
// AUTO MODE STATE
// ============================================================
bool autoModeEnabled = false;

// ============================================================
// MISC STATE
// ============================================================
unsigned long lastESP1Seen = 0;
unsigned long lastESP2Seen = 0;
unsigned long lastESP3Seen = 0;
unsigned long lastBlink    = 0;
bool          blinkState   = false;


// ============================================================
// HELPER: ISO timestamp dari millis()
// ============================================================
String millisToISO(unsigned long ms) {
  // Estimasi relatif dari boot — cukup untuk frontend
  unsigned long sec  = ms / 1000;
  unsigned long mins = sec / 60;
  unsigned long hrs  = mins / 60;
  char buf[32];
  snprintf(buf, sizeof(buf), "PT%02luH%02luM%02luS", hrs % 24, mins % 60, sec % 60);
  return String(buf);
}

String nowISO() {
  // Karena ESP32 tidak punya RTC, gunakan uptime sebagai pseudo-timestamp
  unsigned long ms   = millis();
  unsigned long sec  = ms / 1000;
  unsigned long mins = sec / 60;
  unsigned long hrs  = mins / 60;
  char buf[32];
  snprintf(buf, sizeof(buf), "2024-01-01T%02lu:%02lu:%02luZ",
           hrs % 24, mins % 60, sec % 60);
  return String(buf);
}

// ============================================================
// HELPER: CORS headers — wajib agar browser tidak block request
// ============================================================
void addCorsHeaders(AsyncWebServerResponse *response) {
  response->addHeader("Access-Control-Allow-Origin",  "*");
  response->addHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response->addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// HELPER: Kirim JSON response
// ============================================================
void sendJson(AsyncWebServerRequest *request, int code, String body) {
  AsyncWebServerResponse *resp = request->beginResponse(code, "application/json", body);
  addCorsHeaders(resp);
  request->send(resp);
}

// ============================================================
// HELPER: Buzzer
// ============================================================
void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void startupSound() {
  beep(80); delay(80);
  beep(120); delay(80);
  beep(200);
}

void alertSound() {
  for (int i = 0; i < 3; i++) { beep(80); delay(80); }
}

void successSound() {
  beep(60); delay(60); beep(60);
}

// ============================================================
// LOG BUFFER — tambah entri ke ring buffer
// ============================================================
void addLog(int espNum, String type, String message) {
  int idx = logHead % (LOG_BUFFER_SIZE * 4);
  logBuffer[idx].id          = logIdSeq++;
  logBuffer[idx].espNumber   = espNum;
  logBuffer[idx].messageType = type;
  logBuffer[idx].message     = message;
  logBuffer[idx].createdAt   = nowISO();

  logHead++;
  if (logCount < LOG_BUFFER_SIZE * 4) logCount++;
}

// ============================================================
// RFID WHITELIST — SPIFFS/LittleFS persistence
// ============================================================

void saveRfidWhitelist() {
  StaticJsonDocument<4096> doc;
  JsonArray arr = doc.createNestedArray("whitelist");
  for (int i = 0; i < rfidWhitelistCount; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["id"]          = rfidWhitelist[i].id;
    obj["uid"]         = rfidWhitelist[i].uid;
    obj["description"] = rfidWhitelist[i].description;
    obj["createdAt"]   = rfidWhitelist[i].createdAt;
  }
  File f = LittleFS.open(RFID_WHITELIST_FILE, "w");
  if (f) {
    serializeJson(doc, f);
    f.close();
    Serial.println("[RFID] Whitelist saved to LittleFS");
  }
}

void loadRfidWhitelist() {
  if (!LittleFS.exists(RFID_WHITELIST_FILE)) {
    Serial.println("[RFID] No whitelist file found, starting fresh");
    return;
  }
  File f = LittleFS.open(RFID_WHITELIST_FILE, "r");
  if (!f) return;

  StaticJsonDocument<4096> doc;
  DeserializationError err = deserializeJson(doc, f);
  f.close();
  if (err) {
    Serial.println("[RFID] Failed to parse whitelist: " + String(err.c_str()));
    return;
  }

  rfidWhitelistCount = 0;
  JsonArray arr = doc["whitelist"].as<JsonArray>();
  for (JsonObject obj : arr) {
    if (rfidWhitelistCount >= MAX_RFID_WHITELIST) break;
    rfidWhitelist[rfidWhitelistCount].id          = obj["id"] | rfidWhitelistCount;
    rfidWhitelist[rfidWhitelistCount].uid         = obj["uid"].as<String>();
    rfidWhitelist[rfidWhitelistCount].description = obj["description"].as<String>();
    rfidWhitelist[rfidWhitelistCount].createdAt   = obj["createdAt"].as<String>();
    rfidWhitelistCount++;
  }
  Serial.println("[RFID] Loaded " + String(rfidWhitelistCount) + " whitelist entries");
}

bool isRfidAuthorized(String uid) {
  for (int i = 0; i < rfidWhitelistCount; i++) {
    if (rfidWhitelist[i].uid == uid) return true;
  }
  return false;
}

void addRfidScan(String uid, bool authorized, int espNum) {
  int idx = rfidScanHead % MAX_RFID_SCANS;
  rfidScans[idx].uid        = uid;
  rfidScans[idx].authorized = authorized;
  rfidScans[idx].espNumber  = espNum;
  rfidScans[idx].scannedAt  = nowISO();
  rfidScanHead++;
  if (rfidScanCount < MAX_RFID_SCANS) rfidScanCount++;
}

// ============================================================
// DEVICE STATE — inisialisasi default
// ============================================================
void initDeviceStates() {
  for (int i = 0; i < 4; i++) {
    devices[i].isOnline      = false;
    devices[i].lastSeenAt    = 0;
    devices[i].lastSeenISO   = nowISO();
    devices[i].gasValue      = 0;
    devices[i].lampState     = "OFF";
    devices[i].rainValue     = 0;
    devices[i].clotheslinePos = "OUT";
    devices[i].doorState     = "CLOSE";
    devices[i].gateState     = "CLOSE";
    devices[i].wifiStatus    = "NO";
  }
}

// ============================================================
// UART PARSER — parse "ESPx:TYPE:MESSAGE" dari ESP1/2/3
// ============================================================
void parseAndUpdateState(String raw, int espNum) {
  // Format: ESPx:TYPE:MESSAGE
  int firstColon  = raw.indexOf(':');
  int secondColon = raw.indexOf(':', firstColon + 1);
  if (firstColon < 0 || secondColon < 0) return;

  String type    = raw.substring(firstColon + 1, secondColon);
  String message = raw.substring(secondColon + 1);
  message.trim();

  int devIdx = espNum - 1; // 0-based index
  if (devIdx < 0 || devIdx > 2) return;

  // Tandai device online
  devices[devIdx].isOnline    = true;
  devices[devIdx].lastSeenAt  = millis();
  devices[devIdx].lastSeenISO = nowISO();

  // Tambah ke log buffer
  addLog(espNum, type, message);

  // Alert sound
  if (type == "GAS" || message.indexOf("ALERT") >= 0) {
    alertSound();
  }

  // Parse STATUS message: "OK,GAS=1234,LAMP=ON,WIFI=OK"
  if (type == "STATUS") {
    // Tokenise key=value pairs
    String msg = message;
    int pos = 0;
    while (pos < (int)msg.length()) {
      int comma = msg.indexOf(',', pos);
      if (comma < 0) comma = msg.length();
      String token = msg.substring(pos, comma);
      int eq = token.indexOf('=');
      if (eq > 0) {
        String key = token.substring(0, eq);
        String val = token.substring(eq + 1);
        if      (key == "GAS")         devices[devIdx].gasValue       = val.toInt();
        else if (key == "LAMP")        devices[devIdx].lampState       = val;
        else if (key == "RAIN")        devices[devIdx].rainValue       = val.toInt();
        else if (key == "CLOTHESLINE") devices[devIdx].clotheslinePos  = val;
        else if (key == "DOOR")        devices[devIdx].doorState       = val;
        else if (key == "GATE")        devices[devIdx].gateState       = val;
        else if (key == "WIFI")        devices[devIdx].wifiStatus      = val;
      }
      pos = comma + 1;
    }
  }
  // Parse individual state updates
  else if (type == "LAMP")        { devices[devIdx].lampState      = message; }
  else if (type == "CLOTHESLINE") { devices[devIdx].clotheslinePos = message; }
  else if (type == "DOOR")        { devices[devIdx].doorState      = message; }
  else if (type == "GATE")        { devices[devIdx].gateState      = message; }
  else if (type == "GAS")         { /* alert sudah di-log */ }
  else if (type == "RFID") {
    bool auth = isRfidAuthorized(message);
    addRfidScan(message, auth, espNum);
    Serial.println("[RFID] Scan: " + message + " → " + (auth ? "AUTHORIZED" : "UNAUTHORIZED"));
  }
  else if (type == "WIFI") {
    devices[devIdx].wifiStatus = message;
  }

  // Auto mode: jika ESP2 kirim RAIN alert dan auto mode aktif → log saja
  // (ESP2 sudah otomatis handle sendiri, ESP4 tidak perlu kirim command balik)
}

// ============================================================
// UART READ — baca data dari satu serial port
// ============================================================
void readFromESP(HardwareSerial &port, int espNum, int ledPin) {
  while (port.available()) {
    String data = port.readStringUntil('\n');
    data.trim();
    if (data.length() == 0) continue;

    Serial.println("[UART ESP" + String(espNum) + "] " + data);
    digitalWrite(ledPin, HIGH);

    // Update timestamp device
    switch (espNum) {
      case 1: lastESP1Seen = millis(); break;
      case 2: lastESP2Seen = millis(); break;
      case 3: lastESP3Seen = millis(); break;
    }

    parseAndUpdateState(data, espNum);
  }
}

// ============================================================
// UART SEND — kirim command ke ESP target
// ============================================================
bool sendToESP(int target, String command) {
  command.trim();
  Serial.println("[UART→ESP" + String(target) + "] " + command);

  switch (target) {
    case 1: ESP1Serial.println(command); addLog(1, "COMMAND", command); return true;
    case 2: ESP2Serial.println(command); addLog(2, "COMMAND", command); return true;
    case 3: ESP3Serial.println(command); addLog(3, "COMMAND", command); return true;
  }
  return false;
}

// ============================================================
// DEVICE ONLINE CHECK — set offline jika tidak ada kabar
// ============================================================
void checkDeviceTimeout() {
  unsigned long now = millis();

  auto check = [&](int espNum, unsigned long lastSeen, int ledPin) {
    int idx = espNum - 1;
    bool wasOnline = devices[idx].isOnline;
    bool nowOnline = (now - lastSeen) < DEVICE_TIMEOUT_MS;

    if (wasOnline && !nowOnline) {
      devices[idx].isOnline = false;
      Serial.println("[TIMEOUT] ESP" + String(espNum) + " offline");
      addLog(espNum, "SYSTEM", "OFFLINE");
    }
    digitalWrite(ledPin, nowOnline ? HIGH : LOW);
  };

  if (lastESP1Seen > 0) check(1, lastESP1Seen, LED_ESP1);
  if (lastESP2Seen > 0) check(2, lastESP2Seen, LED_ESP2);
  if (lastESP3Seen > 0) check(3, lastESP3Seen, LED_ESP3);
}

// ============================================================
// LED SYSTEM BLINK
// ============================================================
void updateSystemLED() {
  if (millis() - lastBlink > 500) {
    lastBlink  = millis();
    blinkState = !blinkState;
    digitalWrite(LED_SYSTEM, blinkState ? HIGH : LOW);
  }
}

// ============================================================
// JSON BUILDERS — serialisasi state ke JSON untuk API response
// ============================================================

String buildStatusJson() {
  StaticJsonDocument<2048> doc;
  JsonArray arr = doc.createNestedArray("devices");

  const char* deviceLabels[] = {"ESP1","ESP2","ESP3","ESP4"};
  for (int i = 0; i < 4; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["espNumber"]  = i + 1;
    obj["label"]      = deviceLabels[i];
    obj["isOnline"]   = devices[i].isOnline;
    obj["lastSeenAt"] = devices[i].lastSeenISO;
    obj["wifiStatus"] = devices[i].wifiStatus;

    if (i == 0) { // ESP1
      obj["gasValue"]  = devices[0].gasValue;
      obj["lampState"] = devices[0].lampState;
    }
    if (i == 1) { // ESP2
      obj["rainValue"]     = devices[1].rainValue;
      obj["clotheslinePos"] = devices[1].clotheslinePos;
    }
    if (i == 2) { // ESP3
      obj["doorState"] = devices[2].doorState;
      obj["gateState"] = devices[2].gateState;
    }
    if (i == 3) { // ESP4 self
      obj["isOnline"]   = true;
      obj["wifiStatus"] = (WiFi.status() == WL_CONNECTED) ? "OK" : "NO";
    }
  }

  String out;
  serializeJson(doc, out);
  return out;
}

String buildLogsJson(int espFilter, int limit) {
  StaticJsonDocument<4096> doc;
  JsonArray arr = doc.createNestedArray("data");

  int total   = min(logCount, LOG_BUFFER_SIZE * 4);
  int added   = 0;
  // Iterasi dari yang terbaru
  for (int i = total - 1; i >= 0 && added < limit; i--) {
    int idx = (logHead - 1 - i + LOG_BUFFER_SIZE * 4) % (LOG_BUFFER_SIZE * 4);
    if (idx < 0) idx += LOG_BUFFER_SIZE * 4;

    LogEntry& e = logBuffer[idx];
    if (espFilter > 0 && e.espNumber != espFilter) continue;

    JsonObject obj = arr.createNestedObject();
    obj["id"]          = e.id;
    obj["espNumber"]   = e.espNumber;
    obj["messageType"] = e.messageType;
    obj["message"]     = e.message;
    obj["createdAt"]   = e.createdAt;
    added++;
  }

  String out;
  serializeJson(doc, out);
  return out;
}

String buildRfidWhitelistJson() {
  StaticJsonDocument<2048> doc;
  JsonArray arr = doc.createNestedArray("data");
  for (int i = 0; i < rfidWhitelistCount; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["id"]          = rfidWhitelist[i].id;
    obj["uid"]         = rfidWhitelist[i].uid;
    obj["description"] = rfidWhitelist[i].description;
    obj["createdAt"]   = rfidWhitelist[i].createdAt;
  }
  String out;
  serializeJson(doc, out);
  return out;
}

String buildRfidScansJson() {
  StaticJsonDocument<2048> doc;
  JsonArray arr = doc.createNestedArray("data");
  int total = min(rfidScanCount, MAX_RFID_SCANS);
  for (int i = total - 1; i >= 0; i--) {
    int idx = (rfidScanHead - 1 - i + MAX_RFID_SCANS) % MAX_RFID_SCANS;
    if (idx < 0) idx += MAX_RFID_SCANS;
    JsonObject obj = arr.createNestedObject();
    obj["uid"]        = rfidScans[idx].uid;
    obj["authorized"] = rfidScans[idx].authorized;
    obj["espNumber"]  = rfidScans[idx].espNumber;
    obj["scannedAt"]  = rfidScans[idx].scannedAt;
  }
  String out;
  serializeJson(doc, out);
  return out;
}

// ============================================================
// API ROUTES — setup semua HTTP endpoint
// ============================================================
void setupApiRoutes() {

  // ---- CORS preflight (browser kirim OPTIONS sebelum POST/DELETE) ----
  server.on("/*", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    AsyncWebServerResponse *resp = request->beginResponse(200);
    addCorsHeaders(resp);
    request->send(resp);
  });

  // ------------------------------------------------------------------
  // GET /status
  // Response: { devices: [ { espNumber, isOnline, lastSeenAt, ... } ] }
  // ------------------------------------------------------------------
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, buildStatusJson());
  });

  // ------------------------------------------------------------------
  // GET /sensor/gas
  // Response: { value: number }
  // ------------------------------------------------------------------
  server.on("/sensor/gas", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<64> doc;
    doc["value"] = devices[0].gasValue;
    String out; serializeJson(doc, out);
    sendJson(request, 200, out);
  });

  // ------------------------------------------------------------------
  // GET /sensor/rain
  // Response: { value: number }
  // ------------------------------------------------------------------
  server.on("/sensor/rain", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<64> doc;
    doc["value"] = devices[1].rainValue;
    String out; serializeJson(doc, out);
    sendJson(request, 200, out);
  });

  // ------------------------------------------------------------------
  // GET /logs?esp=1&limit=50
  // Response: { data: [ { id, espNumber, messageType, message, createdAt } ] }
  // ------------------------------------------------------------------
  server.on("/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    int espFilter = 0;
    int limit     = 50;
    if (request->hasParam("esp"))   espFilter = request->getParam("esp")->value().toInt();
    if (request->hasParam("limit")) {
      int requestedLimit = request->getParam("limit")->value().toInt();
      limit = (requestedLimit < 200) ? requestedLimit : 200;
    }
    sendJson(request, 200, buildLogsJson(espFilter, limit));
  });

  // ------------------------------------------------------------------
  // POST /command
  // Body:     { target: 1|2|3, command: "LAMP:ON" }
  // Response: { success: true }
  // ------------------------------------------------------------------
  server.on("/command", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      if (err) { sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid JSON\"}"); return; }

      int    target  = doc["target"]  | 0;
      String command = doc["command"] | "";
      command.trim();

      if (target < 1 || target > 3 || command.length() == 0) {
        sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid target or command\"}");
        return;
      }

      bool ok = sendToESP(target, command);
      if (ok) {
        sendJson(request, 200, "{\"success\":true}");
      } else {
        sendJson(request, 500, "{\"success\":false,\"message\":\"Failed to send command\"}");
      }
    }
  );

  // ------------------------------------------------------------------
  // POST /wifi
  // Body:     { ssid: "...", password: "...", target?: 1|2|3|4 }
  // Response: { success: true }
  // ------------------------------------------------------------------
  server.on("/wifi", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      if (err) { sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid JSON\"}"); return; }

      String ssid     = doc["ssid"]     | "";
      String password = doc["password"] | "";
      int    target   = doc["target"]   | 0;

      if (ssid.length() == 0 || password.length() < 8) {
        sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid ssid or password\"}");
        return;
      }

      String cmd = "WIFI:" + ssid + "," + password;

      if (target == 0 || target == 1) sendToESP(1, cmd);
      if (target == 0 || target == 2) sendToESP(2, cmd);
      if (target == 0 || target == 3) sendToESP(3, cmd);

      sendJson(request, 200, "{\"success\":true}");
    }
  );

  // ------------------------------------------------------------------
  // GET /automode
  // Response: { enabled: boolean }
  // ------------------------------------------------------------------
  server.on("/automode", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<64> doc;
    doc["enabled"] = autoModeEnabled;
    String out; serializeJson(doc, out);
    sendJson(request, 200, out);
  });

  // ------------------------------------------------------------------
  // POST /automode
  // Body:     { enabled: true|false }
  // Response: { success: true }
  // ------------------------------------------------------------------
  server.on("/automode", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      StaticJsonDocument<64> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      if (err) { sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid JSON\"}"); return; }

      if (!doc.containsKey("enabled")) {
        sendJson(request, 400, "{\"success\":false,\"message\":\"Missing 'enabled' field\"}");
        return;
      }

      autoModeEnabled = doc["enabled"].as<bool>();
      Serial.println("[AUTOMODE] Set to: " + String(autoModeEnabled ? "ON" : "OFF"));
      addLog(4, "AUTOMODE", autoModeEnabled ? "ENABLED" : "DISABLED");
      sendJson(request, 200, "{\"success\":true}");
    }
  );

  // ------------------------------------------------------------------
  // GET /rfid/whitelist
  // Response: { data: [ { id, uid, description, createdAt } ] }
  // ------------------------------------------------------------------
  server.on("/rfid/whitelist", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, buildRfidWhitelistJson());
  });

  // ------------------------------------------------------------------
  // POST /rfid/whitelist
  // Body:     { uid: "A1B2C3D4", description?: "..." }
  // Response: { success: true, data: { id, uid, description, createdAt } }
  // ------------------------------------------------------------------
  server.on("/rfid/whitelist", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      if (err) { sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid JSON\"}"); return; }

      String uid  = doc["uid"]         | "";
      String desc = doc["description"] | "";
      uid.trim();

      if (uid.length() == 0) {
        sendJson(request, 400, "{\"success\":false,\"message\":\"UID cannot be empty\"}");
        return;
      }

      // Cek duplikat
      for (int i = 0; i < rfidWhitelistCount; i++) {
        if (rfidWhitelist[i].uid == uid) {
          sendJson(request, 409, "{\"success\":false,\"message\":\"UID already exists\"}");
          return;
        }
      }

      if (rfidWhitelistCount >= MAX_RFID_WHITELIST) {
        sendJson(request, 507, "{\"success\":false,\"message\":\"Whitelist full\"}");
        return;
      }

      int newId = rfidWhitelistCount + 1;
      rfidWhitelist[rfidWhitelistCount].id          = newId;
      rfidWhitelist[rfidWhitelistCount].uid         = uid;
      rfidWhitelist[rfidWhitelistCount].description = desc;
      rfidWhitelist[rfidWhitelistCount].createdAt   = nowISO();
      rfidWhitelistCount++;

      saveRfidWhitelist();

      StaticJsonDocument<256> resp;
      resp["success"] = true;
      JsonObject d = resp.createNestedObject("data");
      d["id"]          = newId;
      d["uid"]         = uid;
      d["description"] = desc;
      d["createdAt"]   = rfidWhitelist[rfidWhitelistCount - 1].createdAt;
      String out; serializeJson(resp, out);
      sendJson(request, 201, out);
    }
  );

  // ------------------------------------------------------------------
  // DELETE /rfid/whitelist/:uid
  // Response: { success: true }
  // ------------------------------------------------------------------
  server.on("^\\/rfid\\/whitelist\\/(.+)$", HTTP_DELETE,
    [](AsyncWebServerRequest *request) {
      String uid = request->pathArg(0);
      uid.trim();

      for (int i = 0; i < rfidWhitelistCount; i++) {
        if (rfidWhitelist[i].uid == uid) {
          // Shift array
          for (int j = i; j < rfidWhitelistCount - 1; j++) {
            rfidWhitelist[j] = rfidWhitelist[j + 1];
          }
          rfidWhitelistCount--;
          saveRfidWhitelist();
          sendJson(request, 200, "{\"success\":true}");
          return;
        }
      }
      sendJson(request, 404, "{\"success\":false,\"message\":\"UID not found\"}");
    }
  );

  // ------------------------------------------------------------------
  // GET /rfid/scans
  // Response: { data: [ { uid, authorized, espNumber, scannedAt } ] }
  // ------------------------------------------------------------------
  server.on("/rfid/scans", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, buildRfidScansJson());
  });

  // ------------------------------------------------------------------
  // Frontend static files — serve dari LittleFS
  // index.html untuk semua path yang tidak cocok (SPA fallback)
  // ------------------------------------------------------------------
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  // SPA fallback: route yang tidak dikenal → kembalikan index.html
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      AsyncWebServerResponse *resp = request->beginResponse(200);
      addCorsHeaders(resp);
      request->send(resp);
      return;
    }
    // Kalau bukan file statis → return index.html untuk client-side routing
    if (LittleFS.exists("/index.html")) {
      AsyncWebServerResponse *resp = request->beginResponse(LittleFS, "/index.html", "text/html");
      addCorsHeaders(resp);
      request->send(resp);
    } else {
      sendJson(request, 404, "{\"message\":\"Not found. Upload frontend files to LittleFS.\"}");
    }
  });
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================");
  Serial.println("ESP32 #4 - Web Server & Gateway");
  Serial.println("IoT Smart Home System");
  Serial.println("========================================");

  // --- PIN inisialisasi ---
  pinMode(LED_ESP1,         OUTPUT);
  pinMode(LED_ESP2,         OUTPUT);
  pinMode(LED_ESP3,         OUTPUT);
  pinMode(LED_SYSTEM,       OUTPUT);
  pinMode(BUZZER_PIN,       OUTPUT);
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(LED_ESP1,   LOW);
  digitalWrite(LED_ESP2,   LOW);
  digitalWrite(LED_ESP3,   LOW);
  digitalWrite(LED_SYSTEM, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  startupSound();

  // --- Inisialisasi UART ke ESP1, ESP2, ESP3 ---
  ESP1Serial.begin(9600, SERIAL_8N1, ESP1_RX, ESP1_TX);
  ESP2Serial.begin(9600, SERIAL_8N1, ESP2_RX, ESP2_TX);
  ESP3Serial.begin(9600, SERIAL_8N1, ESP3_RX, ESP3_TX);

  Serial.println("[UART] ESP1 → RX=" + String(ESP1_RX) + " TX=" + String(ESP1_TX));
  Serial.println("[UART] ESP2 → RX=" + String(ESP2_RX) + " TX=" + String(ESP2_TX));
  Serial.println("[UART] ESP3 → RX=" + String(ESP3_RX) + " TX=" + String(ESP3_TX));

  // --- Inisialisasi device state ---
  initDeviceStates();
  // ESP4 self selalu online
  devices[3].isOnline    = true;
  devices[3].lastSeenISO = nowISO();
  devices[3].wifiStatus  = "CONNECTING";

  // --- LittleFS ---
  if (!LittleFS.begin(true)) {
    Serial.println("[LittleFS] FAILED — filesystem error");
  } else {
    Serial.println("[LittleFS] OK");
    loadRfidWhitelist();
  }

  // --- WiFi ---
  Serial.println("[WIFI] Connecting to: " WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Tunggu koneksi maksimal 15 detik
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Connected!");
    Serial.println("[WIFI] IP Address: " + WiFi.localIP().toString());
    devices[3].wifiStatus = "OK";
    successSound();
    addLog(4, "WIFI", "CONNECTED:" + WiFi.localIP().toString());
  } else {
    Serial.println("[WIFI] Failed to connect. Continuing without WiFi...");
    devices[3].wifiStatus = "FAILED";
    addLog(4, "WIFI", "FAILED");
  }

  // --- Setup API routes & Web Server ---
  setupApiRoutes();
  server.begin();
  Serial.println("[HTTP] Web server started on port 80");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[HTTP] Access at: http://" + WiFi.localIP().toString());
  }

  Serial.println("========================================");
  Serial.println("[READY] ESP4 Gateway is ready!");
  Serial.println("========================================");

  addLog(4, "SYSTEM", "READY");
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  // Baca data dari ESP1, ESP2, ESP3
  readFromESP(ESP1Serial, 1, LED_ESP1);
  readFromESP(ESP2Serial, 2, LED_ESP2);
  readFromESP(ESP3Serial, 3, LED_ESP3);

  // Cek device timeout
  checkDeviceTimeout();

  // Blink LED system tanda ESP4 berjalan
  updateSystemLED();

  // Auto mode — jika hujan dan auto mode aktif → kirim CLOTHESLINE:IN ke ESP2
  static bool autoModeSent = false;
  if (autoModeEnabled && devices[1].rainValue > 1600 && !autoModeSent) {
    sendToESP(2, "CLOTHESLINE:IN");
    autoModeSent = true;
    Serial.println("[AUTOMODE] Rain detected, sending CLOTHESLINE:IN to ESP2");
    addLog(4, "AUTOMODE", "TRIGGERED:CLOTHESLINE:IN");
  }
  if (devices[1].rainValue <= 1600) {
    autoModeSent = false; // Reset agar bisa trigger lagi nanti
  }

  // WiFi reconnect jika putus
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 30000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WIFI] Reconnecting...");
      WiFi.reconnect();
      devices[3].wifiStatus = "RECONNECTING";
    } else {
      devices[3].wifiStatus = "OK";
    }
  }

  // Config button — kirim ulang WiFi config ke semua ESP jika ditekan
  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    static unsigned long lastButtonPress = 0;
    if (millis() - lastButtonPress > 2000) {
      lastButtonPress = millis();
      Serial.println("[BUTTON] Resending WiFi config...");
      String cmd = "WIFI:" + String(WIFI_SSID) + "," + String(WIFI_PASSWORD);
      sendToESP(1, cmd);
      sendToESP(2, cmd);
      sendToESP(3, cmd);
      successSound();
      addLog(4, "SYSTEM", "WIFI_CONFIG_RESENT");
    }
  }

  delay(10); // yield ke RTOS task web server
}
