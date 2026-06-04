/*
  ============================================================
  ESP32 TEST — Single ESP32 Web Server + Smart Door Servo
  ============================================================

  TUJUAN:
    File ini adalah versi TEST/PROTOTYPE untuk memverifikasi
    bahwa website (frontend) bisa berkomunikasi langsung
    dengan ESP32 dan menggerakkan hardware IoT.

    Hanya 1 ESP32 dipakai. Tidak perlu ESP1, ESP2, ESP3.

  YANG BERFUNGSI:
    ✅ Web Server HTTP (serve frontend dari LittleFS)
    ✅ REST API (semua endpoint ada, response sukses semua)
    ✅ DOOR:OPEN → servo GPIO13 bergerak ke 90°
    ✅ DOOR:CLOSE → servo GPIO13 kembali ke 0°
    ✅ Auto-close pintu setelah 3 detik

  YANG TIDAK BERFUNGSI (dummy response saja):
    ⬜ LAMP:ON / LAMP:OFF    → tidak ada relay terhubung
    ⬜ FEED                  → tidak ada servo feeder
    ⬜ CLOTHESLINE:IN/OUT    → tidak ada servo jemuran
    ⬜ GATE:OPEN/CLOSE       → tidak ada servo gate
    ⬜ Sensor gas & hujan    → return nilai 0
    ⬜ RFID                  → tidak ada RFID reader

  PIN YANG DIPAKAI:
    GPIO 13 — Door Servo (sama seperti ESP3 aslinya)
    GPIO 2  — LED onboard (blink tanda ESP berjalan)

  HARDWARE YANG PERLU DISAMBUNGKAN:
    Servo → Signal ke GPIO13, VCC ke 5V/3.3V, GND ke GND

  WIFI:
    SSID:     Wi-Fi
    Password: 123456789

  LIBRARY YANG DIBUTUHKAN:
    - ESPAsyncWebServer (me-no-dev)
    - AsyncTCP (me-no-dev)
    - ArduinoJson v6.x (Benoit Blanchon)
    - ESP32Servo

  CARA PAKAI:
    1. Upload firmware ini ke ESP32
    2. Build frontend: cd frontend && npm run build
    3. Taruh hasil build di folder data/ sketch ini
    4. Upload filesystem: Tools → ESP32 Sketch Data Upload
    5. Buka Serial Monitor → catat IP
    6. Ganti ESP4_BASE_URL di frontend/src/config/esp4.ts
    7. Build + upload filesystem lagi
    8. Buka browser → http://<IP>
    9. Coba klik OPEN/CLOSE di halaman ESP3 Door

  FILE ASLI TIDAK DIUBAH:
    code iot/esp32-4.ino tetap utuh untuk sistem lengkap.
  ============================================================
*/

#include <Arduino.h>
#include <WiFi.h>

// Fix kompatibilitas ESPAsyncWebServer dengan ESP32 Arduino core 3.x
// Error: mbedtls_md5_starts_ret not declared
#ifndef mbedtls_md5_starts_ret
  #define mbedtls_md5_starts_ret  mbedtls_md5_starts
  #define mbedtls_md5_update_ret  mbedtls_md5_update
  #define mbedtls_md5_finish_ret  mbedtls_md5_finish
#endif

#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ============================================================
// KONFIGURASI
// ============================================================

#define WIFI_SSID     "Wi-Fi"
#define WIFI_PASSWORD "1sampai9"

// Pin servo pintu — sama dengan ESP3 aslinya
#define DOOR_SERVO_PIN 13

// LED onboard untuk indikator
#define LED_PIN 2

// Auto-close pintu setelah 3 detik
#define DOOR_AUTO_CLOSE_MS 3000

// ============================================================
// OBJEK GLOBAL
// ============================================================

AsyncWebServer server(80);
Servo doorServo;

// State pintu
bool          doorOpen     = false;
unsigned long doorOpenTime = 0;

// Blink LED
unsigned long lastBlink = 0;
bool          blinkState = false;

// ============================================================
// HELPER: CORS headers
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
// AKSI DOOR
// ============================================================
void openDoor() {
  doorServo.write(90);
  doorOpen     = true;
  doorOpenTime = millis();
  Serial.println("[DOOR] OPEN");
}

void closeDoor() {
  doorServo.write(0);
  doorOpen = false;
  Serial.println("[DOOR] CLOSE");
}

// ============================================================
// SETUP API ROUTES
// ============================================================
void setupApiRoutes() {

  // CORS preflight
  server.on("/*", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    AsyncWebServerResponse *resp = request->beginResponse(200);
    addCorsHeaders(resp);
    request->send(resp);
  });

  // ------------------------------------------------------------------
  // GET /status — kembalikan status device
  // Door state real, yang lain dummy offline
  // ------------------------------------------------------------------
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    JsonArray arr = doc.createNestedArray("devices");

    // ESP1 — offline (tidak ada hardware)
    JsonObject d1 = arr.createNestedObject();
    d1["espNumber"] = 1; d1["isOnline"] = false;
    d1["lastSeenAt"] = "2024-01-01T00:00:00Z";
    d1["lampState"] = "OFF"; d1["gasValue"] = 0; d1["wifiStatus"] = "NO";

    // ESP2 — offline (tidak ada hardware)
    JsonObject d2 = arr.createNestedObject();
    d2["espNumber"] = 2; d2["isOnline"] = false;
    d2["lastSeenAt"] = "2024-01-01T00:00:00Z";
    d2["rainValue"] = 0; d2["clotheslinePos"] = "OUT"; d2["wifiStatus"] = "NO";

    // ESP3 — online (kita yang handle, servo terhubung)
    JsonObject d3 = arr.createNestedObject();
    d3["espNumber"] = 3; d3["isOnline"] = true;
    d3["lastSeenAt"] = "2024-01-01T00:00:00Z";
    d3["doorState"] = doorOpen ? "OPEN" : "CLOSE";
    d3["gateState"] = "CLOSE"; d3["wifiStatus"] = "OK";

    // ESP4 self — online
    JsonObject d4 = arr.createNestedObject();
    d4["espNumber"] = 4; d4["isOnline"] = true;
    d4["lastSeenAt"] = "2024-01-01T00:00:00Z";
    d4["wifiStatus"] = (WiFi.status() == WL_CONNECTED) ? "OK" : "NO";

    String out; serializeJson(doc, out);
    sendJson(request, 200, out);
  });

  // ------------------------------------------------------------------
  // GET /sensor/gas — dummy 0
  // ------------------------------------------------------------------
  server.on("/sensor/gas", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"value\":0}");
  });

  // ------------------------------------------------------------------
  // GET /sensor/rain — dummy 0
  // ------------------------------------------------------------------
  server.on("/sensor/rain", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"value\":0}");
  });

  // ------------------------------------------------------------------
  // GET /logs — empty
  // ------------------------------------------------------------------
  server.on("/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"data\":[]}");
  });

  // ------------------------------------------------------------------
  // GET /automode
  // ------------------------------------------------------------------
  server.on("/automode", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"enabled\":false}");
  });

  // ------------------------------------------------------------------
  // POST /automode — dummy ok
  // ------------------------------------------------------------------
  server.on("/automode", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      sendJson(request, 200, "{\"success\":true}");
    }
  );

  // ------------------------------------------------------------------
  // GET /rfid/whitelist — empty
  // ------------------------------------------------------------------
  server.on("/rfid/whitelist", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"data\":[]}");
  });

  // ------------------------------------------------------------------
  // POST /rfid/whitelist — dummy ok
  // ------------------------------------------------------------------
  server.on("/rfid/whitelist", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      sendJson(request, 201, "{\"success\":true,\"data\":{\"id\":1,\"uid\":\"TEST\",\"createdAt\":\"2024-01-01T00:00:00Z\"}}");
    }
  );

  // ------------------------------------------------------------------
  // DELETE /rfid/whitelist/:uid — dummy ok
  // ------------------------------------------------------------------
  server.on("^\\/rfid\\/whitelist\\/(.+)$", HTTP_DELETE,
    [](AsyncWebServerRequest *request) {
      sendJson(request, 200, "{\"success\":true}");
    }
  );

  // ------------------------------------------------------------------
  // GET /rfid/scans — empty
  // ------------------------------------------------------------------
  server.on("/rfid/scans", HTTP_GET, [](AsyncWebServerRequest *request) {
    sendJson(request, 200, "{\"data\":[]}");
  });

  // ------------------------------------------------------------------
  // POST /wifi — dummy ok
  // ------------------------------------------------------------------
  server.on("/wifi", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      sendJson(request, 200, "{\"success\":true}");
    }
  );

  // ------------------------------------------------------------------
  // POST /command — INI YANG AKTIF BENERAN
  //
  // Hanya DOOR:OPEN dan DOOR:CLOSE yang gerakkan servo.
  // Command lain tetap balas success tapi tidak ada aksi fisik.
  // ------------------------------------------------------------------
  server.on("/command", HTTP_POST, [](AsyncWebServerRequest *request) {},
    nullptr,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t, size_t) {
      StaticJsonDocument<128> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      if (err) {
        sendJson(request, 400, "{\"success\":false,\"message\":\"Invalid JSON\"}");
        return;
      }

      int    target  = doc["target"]  | 0;
      String command = doc["command"] | "";
      command.trim();

      Serial.println("[CMD] target=" + String(target) + " command=" + command);

      // ✅ DOOR — benar-benar gerakkan servo
      if (command == "DOOR:OPEN") {
        openDoor();
        sendJson(request, 200, "{\"success\":true,\"note\":\"Door servo activated\"}");
        return;
      }

      if (command == "DOOR:CLOSE") {
        closeDoor();
        sendJson(request, 200, "{\"success\":true,\"note\":\"Door servo activated\"}");
        return;
      }

      // ⬜ Semua command lain — dummy success, tidak ada aksi fisik
      Serial.println("[CMD] Dummy response (no hardware connected for this command)");
      sendJson(request, 200, "{\"success\":true,\"note\":\"dummy - no hardware\"}");
    }
  );

  // ------------------------------------------------------------------
  // Static files dari LittleFS (frontend build)
  // ------------------------------------------------------------------
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  // SPA fallback
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      AsyncWebServerResponse *resp = request->beginResponse(200);
      addCorsHeaders(resp);
      request->send(resp);
      return;
    }
    if (LittleFS.exists("/index.html")) {
      AsyncWebServerResponse *resp =
        request->beginResponse(LittleFS, "/index.html", "text/html");
      addCorsHeaders(resp);
      request->send(resp);
    } else {
      sendJson(request, 404,
        "{\"message\":\"Upload frontend files ke LittleFS dulu!\"}");
    }
  });
}

// Flag agar server.begin() hanya dipanggil sekali
bool serverStarted = false;

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000); // beri waktu lebih saat boot

  Serial.println("\n========================================");
  Serial.println("ESP32 TEST — Smart Door Only");
  Serial.println("========================================");

  // LED onboard
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Servo pintu — attach dulu sebelum WiFi agar tidak conflict timing
  doorServo.attach(DOOR_SERVO_PIN);
  doorServo.write(0);
  Serial.println("[SERVO] Door servo attached to GPIO" + String(DOOR_SERVO_PIN));

  // LittleFS
  if (!LittleFS.begin(true)) {
    Serial.println("[LittleFS] GAGAL — filesystem error");
  } else {
    Serial.println("[LittleFS] OK");
  }

  // Setup routes dulu SEBELUM begin — aman dilakukan tanpa WiFi
  setupApiRoutes();

  // WiFi — gunakan event-based agar tidak blocking & crash
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);  // auto reconnect jika putus
  WiFi.persistent(false);       // jangan simpan ke flash tiap connect

  Serial.println("[WIFI] Connecting to: " WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Tunggu maksimal 20 detik
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Connected!");
    Serial.println("[WIFI] IP: " + WiFi.localIP().toString());
    Serial.println("[HTTP] Access: http://" + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);

    // Mulai server HANYA jika WiFi berhasil
    server.begin();
    serverStarted = true;
    Serial.println("[HTTP] Web server started on port 80");
  } else {
    Serial.println("[WIFI] GAGAL — akan coba lagi di loop()");
  }

  Serial.println("========================================");
  Serial.println("[TEST] Hanya DOOR:OPEN dan DOOR:CLOSE aktif");
  Serial.println("[TEST] Semua command lain = dummy response");
  Serial.println("========================================");
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  // Kalau WiFi baru connect setelah setup() gagal → start server
  if (!serverStarted && WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Connected (retry)!");
    Serial.println("[WIFI] IP: " + WiFi.localIP().toString());
    Serial.println("[HTTP] Access: http://" + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);
    server.begin();
    serverStarted = true;
    Serial.println("[HTTP] Web server started on port 80");
  }

  // Auto-close pintu setelah DOOR_AUTO_CLOSE_MS
  if (doorOpen && (millis() - doorOpenTime > DOOR_AUTO_CLOSE_MS)) {
    closeDoor();
    Serial.println("[DOOR] Auto-closed after " + String(DOOR_AUTO_CLOSE_MS / 1000) + "s");
  }

  // Blink LED saat WiFi connected (tanda ESP berjalan normal)
  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - lastBlink > 1000) {
      lastBlink  = millis();
      blinkState = !blinkState;
      digitalWrite(LED_PIN, blinkState ? HIGH : LOW);
    }
  } else {
    // WiFi putus — LED mati, tunggu auto reconnect
    digitalWrite(LED_PIN, LOW);
  }

  // Yield ke RTOS — WAJIB ada agar tidak crash tcp_alloc
  delay(10);
}
