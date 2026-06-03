/*
  ESP32 #4 - Gateway Controller (Tanpa LCD)
  
  Fungsi: Bridge komunikasi antara ESP32 #1, #2, #3 dengan Backend (Node.js)
  
  SERIAL COMMUNICATION:
  GPIO 16 - RX logs from ESP32 #1
  GPIO 17 - TX WiFi config to ESP32 #1

  GPIO 4  - RX logs from ESP32 #2
  GPIO 5  - TX WiFi config to ESP32 #2

  GPIO 2  - RX logs from ESP32 #3
  GPIO 18 - TX WiFi config to ESP32 #3

  USB Serial (GPIO 3/1) - Komunikasi dengan Backend

  LED STATUS:
  GPIO 21 - LED ESP32 #1 Status Blue
  GPIO 22 - LED ESP32 #2 Status Green
  GPIO 23 - LED ESP32 #3 Status Red
  GPIO 19 - LED System Status Yellow

  BUZZER & BUTTON:
  GPIO 14 - Startup & Alert Buzzer
  GPIO 0  - Config Button / Boot Button
*/

#include <Arduino.h>

// UART ke ESP32 #1
HardwareSerial ESP1Serial(1);

// UART ke ESP32 #2
HardwareSerial ESP2Serial(2);

// UART ke ESP32 #3 - Ganti pakai Serial1 yang lain
// Karena Serial(0) conflict dengan USB Serial
HardwareSerial ESP3Serial(1); // Temporary, akan diinit manual

// PIN UART
#define ESP1_RX 16
#define ESP1_TX 17

#define ESP2_RX 4
#define ESP2_TX 5

#define ESP3_RX 2
#define ESP3_TX 18

// PIN LED
#define LED_ESP1 21
#define LED_ESP2 22
#define LED_ESP3 23
#define LED_SYSTEM 19

// PIN BUZZER & BUTTON
#define BUZZER_PIN 14
#define CONFIG_BUTTON_PIN 0

String wifiSSID = "Buahahay";  // WiFi SSID untuk semua ESP32
String wifiPASS = "namahotspot";  // WiFi Password untuk semua ESP32

unsigned long lastWiFiSend = 0;
unsigned long lastBlink = 0;
unsigned long lastLCDUpdate = 0;

bool systemBlinkState = false;

unsigned long lastESP1 = 0;
unsigned long lastESP2 = 0;
unsigned long lastESP3 = 0;

const unsigned long DEVICE_TIMEOUT = 7000;

// Mode simulasi untuk testing tanpa ESP1/2/3 fisik - DISABLED untuk production
#define ENABLE_TEST_MODE false  // Set false = gunakan hardware real ESP1/2/3
unsigned long lastTestData = 0;
const unsigned long TEST_DATA_INTERVAL = 3000;

void sendTestData() {
  if (!ENABLE_TEST_MODE) return;
  
  unsigned long now = millis();
  if (now - lastTestData < TEST_DATA_INTERVAL) return;
  
  lastTestData = now;
  
  // Simulasi data dari ESP1, ESP2, ESP3
  int randomGas = random(1000, 1500);
  int randomRain = random(500, 1000);
  
  String esp1Data = "ESP1:STATUS:OK,GAS=" + String(randomGas) + ",LAMP=OFF,WIFI=OK";
  String esp2Data = "ESP2:STATUS:OK,RAIN=" + String(randomRain) + ",CLOTHESLINE=OUT,WIFI=OK";
  String esp3Data = "ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK";
  String esp4Data = "ESP4:STATUS:OK";
  
  // Kirim ke USB Serial (backend)
  Serial.println(esp1Data);
  delay(100);
  Serial.println(esp2Data);
  delay(100);
  Serial.println(esp3Data);
  delay(100);
  Serial.println(esp4Data);
  
  // Blink system LED untuk indikator
  digitalWrite(LED_SYSTEM, HIGH);
  delay(50);
  digitalWrite(LED_SYSTEM, LOW);
}

void toneBeep(int durationMs) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);
}

void startupSound() {
  toneBeep(80);
  delay(80);
  toneBeep(120);
  delay(80);
  toneBeep(200);
}

void alertSound() {
  for (int i = 0; i < 3; i++) {
    toneBeep(80);
    delay(80);
  }
}

void successSound() {
  toneBeep(60);
  delay(60);
  toneBeep(60);
}

void sendWiFiTo(HardwareSerial &port, String targetName) {
  String data = "WIFI:" + wifiSSID + "," + wifiPASS;
  port.println(data);
  Serial.println("[GATEWAY] WiFi sent to " + targetName);
}

void sendWiFiToAll() {
  Serial.println("[GATEWAY] Sending WiFi config to all ESP devices...");
  sendWiFiTo(ESP1Serial, "ESP1");
  sendWiFiTo(ESP2Serial, "ESP2");
  // ESP3 sementara di-disable
  // sendWiFiTo(ESP3Serial, "ESP3");
  Serial.println("[GATEWAY] WiFi config sent to ESP1 & ESP2");
  successSound();
}

void readFromESP(HardwareSerial &port, String name, int ledPin, unsigned long &lastSeen) {
  if (port.available()) {
    String data = port.readStringUntil('\n');
    data.trim();

    if (data.length() > 0) {
      // **PENTING**: Forward data ke USB Serial untuk backend
      Serial.println(data);
      
      lastSeen = millis();
      digitalWrite(ledPin, HIGH);

      // Alert sound untuk gas dan rain
      if (data.indexOf("ALERT") >= 0 || data.indexOf("GAS") >= 0 || data.indexOf("RAIN") >= 0) {
        alertSound();
      }
    }
  }
}

void updateStatusLED() {
  unsigned long now = millis();

  bool esp1Online = now - lastESP1 < DEVICE_TIMEOUT;
  bool esp2Online = now - lastESP2 < DEVICE_TIMEOUT;
  bool esp3Online = now - lastESP3 < DEVICE_TIMEOUT;

  digitalWrite(LED_ESP1, esp1Online ? HIGH : LOW);
  digitalWrite(LED_ESP2, esp2Online ? HIGH : LOW);
  digitalWrite(LED_ESP3, esp3Online ? HIGH : LOW);

  if (now - lastBlink > 500) {
    lastBlink = now;
    systemBlinkState = !systemBlinkState;
    digitalWrite(LED_SYSTEM, systemBlinkState ? HIGH : LOW);
  }

}

void setup() {
  Serial.begin(115200);

  pinMode(LED_ESP1, OUTPUT);
  pinMode(LED_ESP2, OUTPUT);
  pinMode(LED_ESP3, OUTPUT);
  pinMode(LED_SYSTEM, OUTPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(LED_ESP1, LOW);
  digitalWrite(LED_ESP2, LOW);
  digitalWrite(LED_ESP3, LOW);
  digitalWrite(LED_SYSTEM, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Startup sound
  startupSound();

  // Initialize UART to other ESP32
  // ESP1 menggunakan HardwareSerial(1)
  ESP1Serial.begin(9600, SERIAL_8N1, ESP1_RX, ESP1_TX);
  
  // ESP2 menggunakan HardwareSerial(2)
  ESP2Serial.begin(9600, SERIAL_8N1, ESP2_RX, ESP2_TX);
  
  // ESP3 tidak bisa pakai HardwareSerial tambahan
  // Gunakan pinMode manual untuk GPIO 2 dan 18
  // Sementara disable ESP3 dulu
  pinMode(ESP3_RX, INPUT);
  pinMode(ESP3_TX, OUTPUT);

  Serial.println("");
  Serial.println("========================================");
  Serial.println("ESP32-4 Gateway Controller");
  Serial.println("IoT Smart Home System");
  Serial.println("========================================");
  Serial.println("");
  Serial.println("[INFO] USB Serial: 115200 baud (to Backend)");
  Serial.println("[INFO] UART Serial: 9600 baud (to ESP1/2/3)");
  Serial.println("");
  Serial.println("[READY] Gateway is ready!");
  Serial.println("[INFO] Press BOOT button (GPIO0) to resend WiFi config");
  Serial.println("");
  Serial.println("Waiting for data from ESP devices...");
  Serial.println("========================================");

  delay(1000);

  // Send WiFi config to all ESP
  sendWiFiToAll();
}

void handleUSBCommands() {
  // Terima command dari backend via USB Serial
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command.length() > 0) {
      Serial.println("[BACKEND] Command received: " + command);
      
      // Format command dari backend: ESP1:LAMP:ON atau ESP2:GATE:OPEN
      int firstColon = command.indexOf(':');
      
      if (firstColon > 0) {
        String target = command.substring(0, firstColon);
        String payload = command.substring(firstColon + 1);
        
        // Forward command ke ESP yang dituju
        if (target == "ESP1") {
          ESP1Serial.println(payload);
          Serial.println("[GATEWAY] Forwarded to ESP1: " + payload);
        } else if (target == "ESP2") {
          ESP2Serial.println(payload);
          Serial.println("[GATEWAY] Forwarded to ESP2: " + payload);
        } else if (target == "ESP3") {
          // ESP3 sementara disabled
          Serial.println("[ERROR] ESP3 is temporarily disabled");
          // ESP3Serial.println(payload);
          // Serial.println("[GATEWAY] Forwarded to ESP3: " + payload);
        } else if (target == "WIFI") {
          // Update WiFi config: WIFI:SSID,PASSWORD
          int commaPos = payload.indexOf(',');
          if (commaPos > 0) {
            wifiSSID = payload.substring(0, commaPos);
            wifiPASS = payload.substring(commaPos + 1);
            Serial.println("[GATEWAY] WiFi config updated");
            sendWiFiToAll();
          }
        } else {
          Serial.println("[ERROR] Unknown target: " + target);
        }
      } else {
        Serial.println("[ERROR] Invalid command format");
      }
    }
  }
}

void loop() {
  // **BARU**: Kirim data test otomatis
  sendTestData();
  
  readFromESP(ESP1Serial, "ESP1", LED_ESP1, lastESP1);
  readFromESP(ESP2Serial, "ESP2", LED_ESP2, lastESP2);
  // ESP3 sementara di-disable karena conflict
  // readFromESP(ESP3Serial, "ESP3", LED_ESP3, lastESP3);

  // **BARU**: Handle command dari backend
  handleUSBCommands();

  updateStatusLED();

  // Button untuk resend WiFi config
  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    if (millis() - lastWiFiSend > 2000) {
      lastWiFiSend = millis();
      Serial.println("[BUTTON] Resending WiFi config to all devices...");
      sendWiFiToAll();
    }
  }
}
