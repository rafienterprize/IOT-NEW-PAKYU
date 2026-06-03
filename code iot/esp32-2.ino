/*
  ============================================================
  ESP32 #2 - Smart Clothesline & Rain Sensor
  ============================================================

  PERAN DALAM SISTEM:
    Device Controller #2 — menerima command dari ESP4 via UART,
    menjalankan aksi hardware, dan melaporkan status balik ke ESP4.

  KOMUNIKASI:
    UART ke ESP4  →  RX=GPIO16, TX=GPIO17  @9600 baud
    (ESP4 adalah satu-satunya pihak yang berbicara dengan ESP32 #2)

  PIN HARDWARE (TIDAK BERUBAH):
    GPIO 16  — RX dari ESP4 (UART)
    GPIO 17  — TX ke ESP4   (UART)
    GPIO 35  — Rain Sensor (ADC, input only)
    GPIO 4   — Clothesline Servo
    GPIO 2   — Rain Buzzer

  COMMAND YANG DITERIMA DARI ESP4:
    CLOTHESLINE:IN     → tarik jemuran ke dalam
    CLOTHESLINE:OUT    → keluarkan jemuran
    WIFI:ssid,pass     → update & reconnect WiFi

  LOGIKA OTOMATIS (TIDAK BERUBAH):
    Jika rain > RAIN_THRESHOLD dan jemuran di luar → tarik masuk otomatis
    Jika rain <= RAIN_THRESHOLD dan jemuran di dalam → keluarkan otomatis

  DATA YANG DIKIRIM KE ESP4 (format ESP2:TYPE:MESSAGE):
    ESP2:STATUS:OK,RAIN=<val>,CLOTHESLINE=<IN|OUT>,WIFI=<OK|NO>
    ESP2:RAIN:ALERT_CLOTHESLINE_IN
    ESP2:RAIN:CLEAR_CLOTHESLINE_OUT
    ESP2:CLOTHESLINE:IN | ESP2:CLOTHESLINE:OUT
    ESP2:SYSTEM:READY
    ESP2:WIFI:CONNECTING | ESP2:WIFI:CONNECTED
  ============================================================
*/

#include <WiFi.h>
#include <ESP32Servo.h>

// ---------------------------------------------------------------------------
// WiFi credentials — disesuaikan sesuai instruksi
// ---------------------------------------------------------------------------
#define WIFI_SSID     "Wi-Fi"
#define WIFI_PASSWORD "123456789"

// ---------------------------------------------------------------------------
// Pin UART ke ESP4 (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define RX_FROM_ESP4 16
#define TX_TO_ESP4   17

// ---------------------------------------------------------------------------
// Pin Hardware (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define RAIN_SENSOR_PIN       35
#define CLOTHESLINE_SERVO_PIN  4
#define RAIN_BUZZER_PIN        2

// ---------------------------------------------------------------------------
// Konfigurasi sensor
// ---------------------------------------------------------------------------
#define RAIN_THRESHOLD     1600   // Nilai ADC di atas ini = hujan
#define STATUS_INTERVAL_MS 3000   // Kirim status setiap 3 detik
#define BEEP_INTERVAL_MS    800   // Jeda antara beep buzzer (ms)

// ---------------------------------------------------------------------------
// UART ke ESP4
// ---------------------------------------------------------------------------
HardwareSerial ControlSerial(2);

// ---------------------------------------------------------------------------
// Objek hardware
// ---------------------------------------------------------------------------
Servo clotheslineServo;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
bool          clotheslineIn = false;
bool          rainAlert     = false;
unsigned long lastStatusSend = 0;
unsigned long lastBeep       = 0;

// ============================================================
// sendLog — kirim data ke ESP4 via UART
// Format: ESP2:<TYPE>:<MESSAGE>
// ============================================================
void sendLog(String type, String message) {
  String data = "ESP2:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("[TX->ESP4] " + data);
}

// ============================================================
// beepRain — buzzer beep saat hujan terdeteksi
// Menggunakan non-blocking timing (TIDAK BERUBAH)
// ============================================================
void beepRain() {
  if (millis() - lastBeep > BEEP_INTERVAL_MS) {
    lastBeep = millis();
    digitalWrite(RAIN_BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(RAIN_BUZZER_PIN, LOW);
  }
}

// ============================================================
// connectWiFi — hubungkan ke WiFi
// ============================================================
void connectWiFi(String ssid, String pass) {
  Serial.println("[WIFI] Connecting to: " + ssid);
  WiFi.disconnect(true);
  WiFi.begin(ssid.c_str(), pass.c_str());
  sendLog("WIFI", "CONNECTING");
}

// ============================================================
// handleCommand — proses command dari ESP4
// ============================================================
void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  Serial.println("[RX<-ESP4] " + cmd);

  // --- WiFi update ---
  if (cmd.startsWith("WIFI:")) {
    int commaIdx = cmd.indexOf(',');
    if (commaIdx > 5) {
      String ssid = cmd.substring(5, commaIdx);
      String pass = cmd.substring(commaIdx + 1);
      connectWiFi(ssid, pass);
    }
    return;
  }

  // --- Clothesline control ---
  if (cmd == "CLOTHESLINE:IN") {
    clotheslineServo.write(90);
    clotheslineIn = true;
    sendLog("CLOTHESLINE", "IN");
    return;
  }

  if (cmd == "CLOTHESLINE:OUT") {
    clotheslineServo.write(0);
    clotheslineIn = false;
    sendLog("CLOTHESLINE", "OUT");
    return;
  }
}

// ============================================================
// setup
// ============================================================
void setup() {
  // Debug serial
  Serial.begin(115200);

  // UART ke ESP4
  ControlSerial.begin(9600, SERIAL_8N1, RX_FROM_ESP4, TX_TO_ESP4);

  // Inisialisasi pin hardware
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(RAIN_BUZZER_PIN, OUTPUT);
  digitalWrite(RAIN_BUZZER_PIN, LOW);

  // Servo jemuran
  clotheslineServo.attach(CLOTHESLINE_SERVO_PIN);
  clotheslineServo.write(0);    // Posisi OUT (keluar) saat boot

  Serial.println("\n========================================");
  Serial.println("ESP32 #2 - Smart Clothesline & Rain Sensor");
  Serial.println("========================================");
  Serial.println("PIN MAP:");
  Serial.println("  GPIO 16 - RX dari ESP4 (UART)");
  Serial.println("  GPIO 17 - TX ke ESP4   (UART)");
  Serial.println("  GPIO 35 - Rain Sensor (ADC)");
  Serial.println("  GPIO  4 - Clothesline Servo");
  Serial.println("  GPIO  2 - Rain Buzzer");
  Serial.println("========================================");

  // Connect WiFi langsung — tidak menunggu perintah ESP4
  connectWiFi(WIFI_SSID, WIFI_PASSWORD);

  // Lapor ke ESP4 bahwa perangkat siap
  sendLog("SYSTEM", "READY");
}

// ============================================================
// loop
// ============================================================
void loop() {
  // ---- Terima command dari ESP4 via UART ----
  if (ControlSerial.available()) {
    String cmd = ControlSerial.readStringUntil('\n');
    handleCommand(cmd);
  }

  // ---- Baca sensor hujan ----
  int rainValue = analogRead(RAIN_SENSOR_PIN);
  rainAlert = (rainValue > RAIN_THRESHOLD);

  // ---- Logika otomatis jemuran (TIDAK BERUBAH) ----
  // Hujan terdeteksi dan jemuran masih di luar → tarik masuk
  if (rainAlert && !clotheslineIn) {
    clotheslineServo.write(90);
    clotheslineIn = true;
    sendLog("RAIN", "ALERT_CLOTHESLINE_IN");
  }

  // Hujan berhenti dan jemuran di dalam → keluarkan
  if (!rainAlert && clotheslineIn) {
    clotheslineServo.write(0);
    clotheslineIn = false;
    sendLog("RAIN", "CLEAR_CLOTHESLINE_OUT");
  }

  // Bunyikan buzzer selama hujan (non-blocking)
  if (rainAlert) {
    beepRain();
  }

  // ---- Cek status WiFi & lapor perubahan ----
  static wl_status_t lastWifiStatus = WL_IDLE_STATUS;
  wl_status_t currentWifiStatus = WiFi.status();

  if (currentWifiStatus != lastWifiStatus) {
    lastWifiStatus = currentWifiStatus;
    if (currentWifiStatus == WL_CONNECTED) {
      Serial.println("[WIFI] Connected. IP: " + WiFi.localIP().toString());
      sendLog("WIFI", "CONNECTED");
    } else if (currentWifiStatus == WL_CONNECT_FAILED || currentWifiStatus == WL_CONNECTION_LOST) {
      Serial.println("[WIFI] Connection lost, reconnecting...");
      WiFi.reconnect();
      sendLog("WIFI", "RECONNECTING");
    }
  }

  // ---- Kirim status rutin ke ESP4 setiap 3 detik ----
  if (millis() - lastStatusSend >= STATUS_INTERVAL_MS) {
    lastStatusSend = millis();

    String status = "OK";
    status += ",RAIN="        + String(rainValue);
    status += ",CLOTHESLINE=" + String(clotheslineIn ? "IN" : "OUT");
    status += ",WIFI="        + String(currentWifiStatus == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
