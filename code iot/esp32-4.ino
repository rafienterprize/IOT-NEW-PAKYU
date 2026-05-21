/*
  ESP32 #4 - WiFi Controller + LED Status + Buzzer + LCD 20x4

  SERIAL COMMUNICATION:
  GPIO 16 - RX logs from ESP32 #1
  GPIO 17 - TX WiFi config to ESP32 #1

  GPIO 4  - RX logs from ESP32 #2
  GPIO 5  - TX WiFi config to ESP32 #2

  GPIO 2  - RX logs from ESP32 #3
  GPIO 18 - TX WiFi config to ESP32 #3

  LED STATUS:
  GPIO 21 - LED ESP32 #1 Status Blue
  GPIO 22 - LED ESP32 #2 Status Green
  GPIO 23 - LED ESP32 #3 Status Red
  GPIO 19 - LED System Status Yellow

  BUZZER & BUTTON:
  GPIO 14 - Startup & Alert Buzzer
  GPIO 0  - Config Button / Boot Button

  LCD I2C 20x4:
  SDA default ESP32 = GPIO 21
  SCL default ESP32 = GPIO 22

  PENTING:
  Karena GPIO 21 dan GPIO 22 di list kamu dipakai LED,
  kalau tetap pakai LCD I2C default, PIN AKAN BENTROK.

  Solusi di kode ini:
  - LCD I2C dipindah ke pin custom:
    SDA = GPIO 27
    SCL = GPIO 33

  Jadi wiring LCD:
  VCC -> 5V / VIN
  GND -> GND
  SDA -> GPIO 27
  SCL -> GPIO 33
*/

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// UART ke ESP32 #1
HardwareSerial ESP1Serial(1);

// UART ke ESP32 #2
HardwareSerial ESP2Serial(2);

// UART ke ESP32 #3
HardwareSerial ESP3Serial(0);

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

// LCD I2C custom pin supaya tidak bentrok dengan LED GPIO 21 & 22
#define LCD_SDA 27
#define LCD_SCL 33

// Alamat LCD umum: 0x27 atau 0x3F
LiquidCrystal_I2C lcd(0x27, 20, 4);

String wifiSSID = "NAMA_WIFI_KAMU";
String wifiPASS = "PASSWORD_WIFI_KAMU";

unsigned long lastWiFiSend = 0;
unsigned long lastBlink = 0;
unsigned long lastLCDUpdate = 0;

bool systemBlinkState = false;

unsigned long lastESP1 = 0;
unsigned long lastESP2 = 0;
unsigned long lastESP3 = 0;

const unsigned long DEVICE_TIMEOUT = 7000;

String lcdLine1 = "ESP1: Menunggu...";
String lcdLine2 = "ESP2: Menunggu...";
String lcdLine3 = "ESP3: Menunggu...";
String lcdLine4 = "SYSTEM: STARTING";

void lcdPrintLine(byte row, String text) {
  lcd.setCursor(0, row);

  if (text.length() > 20) {
    text = text.substring(0, 20);
  }

  while (text.length() < 20) {
    text += " ";
  }

  lcd.print(text);
}

void updateLCD() {
  lcdPrintLine(0, lcdLine1);
  lcdPrintLine(1, lcdLine2);
  lcdPrintLine(2, lcdLine3);
  lcdPrintLine(3, lcdLine4);
}

String makeLCDStatus(String deviceName, String data) {
  // Contoh data:
  // ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
  // Biar muat di LCD 20x4, dibuat ringkas.
  data.trim();

  String result = deviceName + ": ";

  int firstColon = data.indexOf(':');
  int secondColon = data.indexOf(':', firstColon + 1);

  if (secondColon > 0) {
    String type = data.substring(firstColon + 1, secondColon);
    String msg = data.substring(secondColon + 1);

    if (type == "STATUS") {
      result += msg;
    } else {
      result += type + " " + msg;
    }
  } else {
    result += data;
  }

  if (result.length() > 20) {
    result = result.substring(0, 20);
  }

  return result;
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

  Serial.println("Kirim WiFi ke " + targetName + " -> " + data);

  lcdLine4 = "WiFi sent " + targetName;
  updateLCD();
}

void sendWiFiToAll() {
  sendWiFiTo(ESP1Serial, "ESP1");
  sendWiFiTo(ESP2Serial, "ESP2");
  sendWiFiTo(ESP3Serial, "ESP3");

  lcdLine4 = "WiFi sent to all";
  updateLCD();

  successSound();
}

void readFromESP(HardwareSerial &port, String name, int ledPin, unsigned long &lastSeen) {
  if (port.available()) {
    String data = port.readStringUntil('\n');
    data.trim();

    if (data.length() > 0) {
      Serial.println("Dari " + name + " -> " + data);

      lastSeen = millis();
      digitalWrite(ledPin, HIGH);

      if (name == "ESP1") {
        lcdLine1 = makeLCDStatus("ESP1", data);
      } else if (name == "ESP2") {
        lcdLine2 = makeLCDStatus("ESP2", data);
      } else if (name == "ESP3") {
        lcdLine3 = makeLCDStatus("ESP3", data);
      }

      lcdLine4 = "Last update: " + name;
      updateLCD();

      if (data.indexOf("ALERT") >= 0 || data.indexOf("GAS") >= 0 || data.indexOf("RAIN") >= 0) {
        lcdLine4 = "ALERT from " + name;
        updateLCD();
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

  if (!esp1Online && lastESP1 != 0) {
    lcdLine1 = "ESP1: Offline";
  }

  if (!esp2Online && lastESP2 != 0) {
    lcdLine2 = "ESP2: Offline";
  }

  if (!esp3Online && lastESP3 != 0) {
    lcdLine3 = "ESP3: Offline";
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

  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();

  lcdPrintLine(0, "IoT Smart Home");
  lcdPrintLine(1, "ESP32-4 Control");
  lcdPrintLine(2, "LCD Ready");
  lcdPrintLine(3, "Starting...");

  startupSound();

  ESP1Serial.begin(9600, SERIAL_8N1, ESP1_RX, ESP1_TX);
  ESP2Serial.begin(9600, SERIAL_8N1, ESP2_RX, ESP2_TX);
  ESP3Serial.begin(9600, SERIAL_8N1, ESP3_RX, ESP3_TX);

  Serial.println("ESP32-4 Controller READY");
  Serial.println("Tekan BOOT/GPIO0 untuk kirim ulang WiFi config.");

  delay(1500);

  lcdLine1 = "ESP1: Waiting...";
  lcdLine2 = "ESP2: Waiting...";
  lcdLine3 = "ESP3: Waiting...";
  lcdLine4 = "System Ready";
  updateLCD();

  sendWiFiToAll();
}

void loop() {
  readFromESP(ESP1Serial, "ESP1", LED_ESP1, lastESP1);
  readFromESP(ESP2Serial, "ESP2", LED_ESP2, lastESP2);
  readFromESP(ESP3Serial, "ESP3", LED_ESP3, lastESP3);

  updateStatusLED();

  if (millis() - lastLCDUpdate > 1000) {
    lastLCDUpdate = millis();
    updateLCD();
  }

  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    if (millis() - lastWiFiSend > 2000) {
      lastWiFiSend = millis();
      Serial.println("Tombol config ditekan, kirim ulang WiFi...");
      lcdLine4 = "Send WiFi config";
      updateLCD();
      sendWiFiToAll();
    }
  }
}
