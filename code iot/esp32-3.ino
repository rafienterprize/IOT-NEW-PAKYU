/*
  ============================================================
  ESP32 #3 - Smart Door, Smart Gate & RFID Access
  ============================================================

  PERAN DALAM SISTEM:
    Device Controller #3 — menerima command dari ESP4 via UART,
    menjalankan aksi hardware, dan melaporkan status balik ke ESP4.

  KOMUNIKASI:
    UART ke ESP4  →  RX=GPIO16, TX=GPIO17  @9600 baud
    (ESP4 adalah satu-satunya pihak yang berbicara dengan ESP32 #3)

  PIN HARDWARE (TIDAK BERUBAH):
    GPIO 16  — RX dari ESP4 (UART)
    GPIO 17  — TX ke ESP4   (UART)

    RFID RC522:
    GPIO 21  — RFID SS  (SPI CS)
    GPIO 22  — RFID RST
    GPIO 23  — RFID MOSI
    GPIO 19  — RFID MISO
    GPIO 18  — RFID SCK

    SMART DOOR:
    GPIO 13  — Door Servo
    GPIO 14  — Door IR Sensor
    GPIO 15  — Door Buzzer

    SMART GATE:
    GPIO 25  — Gate Servo Left
    GPIO 26  — Gate Servo Right
    GPIO 32  — Gate IR Sensor

  COMMAND YANG DITERIMA DARI ESP4:
    DOOR:OPEN          → buka pintu
    DOOR:CLOSE         → tutup pintu
    GATE:OPEN          → buka gerbang
    GATE:CLOSE         → tutup gerbang
    WIFI:ssid,pass     → update & reconnect WiFi

  LOGIKA OTOMATIS (TIDAK BERUBAH):
    IR door LOW dan pintu tutup → buka pintu otomatis
    IR gate LOW dan gate tutup  → buka gate otomatis
    Pintu terbuka > 3000ms      → tutup otomatis
    Gate terbuka  > 4000ms      → tutup otomatis
    Scan RFID                   → buka pintu (sementara semua kartu valid)

  DATA YANG DIKIRIM KE ESP4 (format ESP3:TYPE:MESSAGE):
    ESP3:STATUS:OK,DOOR=<OPEN|CLOSE>,GATE=<OPEN|CLOSE>,WIFI=<OK|NO>
    ESP3:DOOR:OPEN | ESP3:DOOR:CLOSE
    ESP3:GATE:OPEN | ESP3:GATE:CLOSE
    ESP3:RFID:<UID>
    ESP3:SYSTEM:READY
    ESP3:WIFI:CONNECTING | ESP3:WIFI:CONNECTED
  ============================================================
*/

#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
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
// Pin RFID RC522 (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define RFID_SS_PIN  21
#define RFID_RST_PIN 22
// SPI pins (diinisialisasi manual): MOSI=23, MISO=19, SCK=18

// ---------------------------------------------------------------------------
// Pin Smart Door (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define DOOR_SERVO_PIN   13
#define DOOR_IR_PIN      14
#define DOOR_BUZZER_PIN  15

// ---------------------------------------------------------------------------
// Pin Smart Gate (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define GATE_SERVO_LEFT_PIN  25
#define GATE_SERVO_RIGHT_PIN 26
#define GATE_IR_PIN          32

// ---------------------------------------------------------------------------
// Konfigurasi timing (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
#define DOOR_AUTO_CLOSE_MS 3000   // Pintu menutup otomatis setelah 3 detik
#define GATE_AUTO_CLOSE_MS 4000   // Gate menutup otomatis setelah 4 detik
#define STATUS_INTERVAL_MS 3000   // Kirim status setiap 3 detik

// ---------------------------------------------------------------------------
// UART ke ESP4
// ---------------------------------------------------------------------------
HardwareSerial ControlSerial(2);

// ---------------------------------------------------------------------------
// Objek hardware
// ---------------------------------------------------------------------------
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

Servo doorServo;
Servo gateLeftServo;
Servo gateRightServo;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
bool          doorOpen      = false;
bool          gateOpen      = false;
unsigned long doorOpenTime  = 0;
unsigned long gateOpenTime  = 0;
unsigned long lastStatusSend = 0;

// ============================================================
// sendLog — kirim data ke ESP4 via UART
// Format: ESP3:<TYPE>:<MESSAGE>
// ============================================================
void sendLog(String type, String message) {
  String data = "ESP3:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("[TX->ESP4] " + data);
}

// ============================================================
// beepDoor — bunyi buzzer pintu (TIDAK BERUBAH)
// ============================================================
void beepDoor(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(DOOR_BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(DOOR_BUZZER_PIN, LOW);
    delay(80);
  }
}

// ============================================================
// openDoor / closeDoor (TIDAK BERUBAH — logika & pin sama)
// ============================================================
void openDoor() {
  doorServo.write(90);
  doorOpen = true;
  doorOpenTime = millis();
  beepDoor(1);
  sendLog("DOOR", "OPEN");
}

void closeDoor() {
  doorServo.write(0);
  doorOpen = false;
  sendLog("DOOR", "CLOSE");
}

// ============================================================
// openGate / closeGate (TIDAK BERUBAH — logika & pin sama)
// ============================================================
void openGate() {
  gateLeftServo.write(90);
  gateRightServo.write(90);
  gateOpen = true;
  gateOpenTime = millis();
  sendLog("GATE", "OPEN");
}

void closeGate() {
  gateLeftServo.write(0);
  gateRightServo.write(180);
  gateOpen = false;
  sendLog("GATE", "CLOSE");
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

  // --- Door control ---
  if (cmd == "DOOR:OPEN")  { openDoor();  return; }
  if (cmd == "DOOR:CLOSE") { closeDoor(); return; }

  // --- Gate control ---
  if (cmd == "GATE:OPEN")  { openGate();  return; }
  if (cmd == "GATE:CLOSE") { closeGate(); return; }
}

// ============================================================
// readRFID — baca kartu RFID, laporkan UID ke ESP4 (TIDAK BERUBAH)
// ESP4 yang menentukan apakah UID diizinkan atau tidak
// ============================================================
void readRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("[RFID] Card scanned: " + uid);
  sendLog("RFID", uid);

  // Sementara semua kartu dianggap valid → buka pintu
  // ESP4 akan tahu UID mana yang diizinkan dari whitelist-nya
  openDoor();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
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
  pinMode(DOOR_IR_PIN,   INPUT);
  pinMode(GATE_IR_PIN,   INPUT);
  pinMode(DOOR_BUZZER_PIN, OUTPUT);
  digitalWrite(DOOR_BUZZER_PIN, LOW);

  // SPI untuk RFID (pin TIDAK BERUBAH: SCK=18, MISO=19, MOSI=23, SS=21)
  SPI.begin(18, 19, 23, 21);
  rfid.PCD_Init();

  // Servo
  doorServo.attach(DOOR_SERVO_PIN);
  gateLeftServo.attach(GATE_SERVO_LEFT_PIN);
  gateRightServo.attach(GATE_SERVO_RIGHT_PIN);

  // Posisi awal — semua tertutup
  closeDoor();
  closeGate();

  Serial.println("\n========================================");
  Serial.println("ESP32 #3 - Door, Gate & RFID Access");
  Serial.println("========================================");
  Serial.println("PIN MAP:");
  Serial.println("  GPIO 16 - RX dari ESP4 (UART)");
  Serial.println("  GPIO 17 - TX ke ESP4   (UART)");
  Serial.println("  GPIO 21 - RFID SS");
  Serial.println("  GPIO 22 - RFID RST");
  Serial.println("  GPIO 23 - RFID MOSI");
  Serial.println("  GPIO 19 - RFID MISO");
  Serial.println("  GPIO 18 - RFID SCK");
  Serial.println("  GPIO 13 - Door Servo");
  Serial.println("  GPIO 14 - Door IR Sensor");
  Serial.println("  GPIO 15 - Door Buzzer");
  Serial.println("  GPIO 25 - Gate Servo Left");
  Serial.println("  GPIO 26 - Gate Servo Right");
  Serial.println("  GPIO 32 - Gate IR Sensor");
  Serial.println("========================================");
  Serial.println("[RFID] Ready - Scan card to open door");

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

  // ---- Baca RFID (TIDAK BERUBAH) ----
  readRFID();

  // ---- Baca IR sensor (TIDAK BERUBAH) ----
  int doorIR = digitalRead(DOOR_IR_PIN);
  int gateIR = digitalRead(GATE_IR_PIN);

  // IR LOW dan perangkat masih tertutup → buka otomatis
  if (doorIR == LOW && !doorOpen) {
    openDoor();
  }
  if (gateIR == LOW && !gateOpen) {
    openGate();
  }

  // ---- Auto-close timer (TIDAK BERUBAH) ----
  if (doorOpen && (millis() - doorOpenTime > DOOR_AUTO_CLOSE_MS)) {
    closeDoor();
  }
  if (gateOpen && (millis() - gateOpenTime > GATE_AUTO_CLOSE_MS)) {
    closeGate();
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
    status += ",DOOR=" + String(doorOpen ? "OPEN" : "CLOSE");
    status += ",GATE=" + String(gateOpen ? "OPEN" : "CLOSE");
    status += ",WIFI=" + String(currentWifiStatus == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
