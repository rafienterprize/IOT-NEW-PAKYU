/*
  ============================================================
  ESP32 #1 - Smart Lamp, Gas Detector, Fish Feeder
  ============================================================

  PERAN DALAM SISTEM:
    Device Controller #1 — menerima command dari ESP4 via UART,
    menjalankan aksi hardware, dan melaporkan status balik ke ESP4.

  KOMUNIKASI:
    UART ke ESP4  →  RX=GPIO16, TX=GPIO17  @9600 baud
    (ESP4 adalah satu-satunya pihak yang berbicara dengan ESP32 #1)

  PIN HARDWARE (TIDAK BERUBAH):
    GPIO 16  — RX dari ESP4 (UART)
    GPIO 17  — TX ke ESP4   (UART)
    GPIO 18  — Servo Fish Feeder
    GPIO 23  — Relay Smart Lamp
    GPIO 34  — Gas Sensor (ADC, input only)

  COMMAND YANG DITERIMA DARI ESP4:
    LAMP:ON            → nyalakan lampu
    LAMP:OFF           → matikan lampu
    FEED               → putar servo feeder
    WIFI:ssid,pass     → update & reconnect WiFi

  DATA YANG DIKIRIM KE ESP4 (format ESP1:TYPE:MESSAGE):
    ESP1:STATUS:OK,GAS=<val>,LAMP=<ON|OFF>,WIFI=<OK|NO>
    ESP1:GAS:ALERT
    ESP1:LAMP:ON | ESP1:LAMP:OFF
    ESP1:FEEDER:DONE
    ESP1:SYSTEM:READY
    ESP1:WIFI:CONNECTING | ESP1:WIFI:CONNECTED
  ============================================================
*/

#include <WiFi.h>
#include <ESP32Servo.h>

// ---------------------------------------------------------------------------
// WiFi credentials — disesuaikan sesuai instruksi
// ---------------------------------------------------------------------------
#define WIFI_SSID     "Wi-Fi"
#define WIFI_PASSWORD "1sampai9"

// ---------------------------------------------------------------------------
// Pin UART ke ESP4 (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define RX_FROM_ESP4 16
#define TX_TO_ESP4   17

// ---------------------------------------------------------------------------
// Pin Hardware (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define FISH_SERVO_PIN  18
#define LAMP_RELAY_PIN  23
#define GAS_SENSOR_PIN  34

// ---------------------------------------------------------------------------
// Konfigurasi sensor
// ---------------------------------------------------------------------------
#define GAS_THRESHOLD      1800   // Nilai ADC di atas ini = alert gas
#define STATUS_INTERVAL_MS 3000   // Kirim status setiap 3 detik
#define GAS_ALERT_COOLDOWN 500    // Jeda antara pengiriman alert gas (ms)

// ---------------------------------------------------------------------------
// UART ke ESP4
// ---------------------------------------------------------------------------
HardwareSerial ControlSerial(2);

// ---------------------------------------------------------------------------
// Objek hardware
// ---------------------------------------------------------------------------
Servo fishServo;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
bool        lampState       = false;
bool        gasAlert        = false;
unsigned long lastStatusSend = 0;
unsigned long lastGasAlert   = 0;

// ============================================================
// sendLog — kirim data ke ESP4 via UART
// Format: ESP1:<TYPE>:<MESSAGE>
// ============================================================
void sendLog(String type, String message) {
  String data = "ESP1:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("[TX->ESP4] " + data);
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
// Command dikirim ESP4 via UART, baris diakhiri '\n'
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

  // --- Lamp control ---
  if (cmd == "LAMP:ON") {
    digitalWrite(LAMP_RELAY_PIN, HIGH);
    lampState = true;
    sendLog("LAMP", "ON");
    return;
  }

  if (cmd == "LAMP:OFF") {
    digitalWrite(LAMP_RELAY_PIN, LOW);
    lampState = false;
    sendLog("LAMP", "OFF");
    return;
  }

  // --- Fish Feeder ---
  if (cmd == "FEED") {
    fishServo.write(90);
    delay(700);
    fishServo.write(0);
    sendLog("FEEDER", "DONE");
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
  pinMode(LAMP_RELAY_PIN, OUTPUT);
  pinMode(GAS_SENSOR_PIN, INPUT);
  digitalWrite(LAMP_RELAY_PIN, LOW);   // Lampu mati saat boot

  // Servo feeder
  fishServo.attach(FISH_SERVO_PIN);
  fishServo.write(0);                  // Posisi tertutup

  Serial.println("\n========================================");
  Serial.println("ESP32 #1 - Lamp, Gas Detector & Fish Feeder");
  Serial.println("========================================");
  Serial.println("PIN MAP:");
  Serial.println("  GPIO 16 - RX dari ESP4 (UART)");
  Serial.println("  GPIO 17 - TX ke ESP4   (UART)");
  Serial.println("  GPIO 18 - Servo Fish Feeder");
  Serial.println("  GPIO 23 - Relay Smart Lamp");
  Serial.println("  GPIO 34 - Gas Sensor (ADC)");
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

  // ---- Baca sensor gas ----
  int gasValue = analogRead(GAS_SENSOR_PIN);
  gasAlert = (gasValue > GAS_THRESHOLD);

  // Kirim alert gas (dengan cooldown agar tidak spam)
  if (gasAlert && (millis() - lastGasAlert > GAS_ALERT_COOLDOWN)) {
    lastGasAlert = millis();
    sendLog("GAS", "ALERT");
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
    status += ",GAS="       + String(gasValue);
    status += ",LAMP="      + String(lampState ? "ON" : "OFF");
    status += ",WIFI="      + String(currentWifiStatus == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
