/*
  ESP32 #3 - Smart Door & Smart Gate

  KOMUNIKASI UART KE ESP32 #4:
  GPIO 16 - RX from ESP32 #4
  GPIO 17 - TX to ESP32 #4

  RFID:
  GPIO 21 - RFID SS
  GPIO 22 - RFID RST
  GPIO 23 - RFID MOSI
  GPIO 19 - RFID MISO
  GPIO 18 - RFID SCK

  SMART DOOR:
  GPIO 13 - Door Servo
  GPIO 14 - Door IR Sensor
  GPIO 15 - Door Buzzer

  SMART GATE:
  GPIO 25 - Gate Servo Left
  GPIO 26 - Gate Servo Right
  GPIO 32 - Gate IR Sensor
*/

#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

#define RX_FROM_ESP4 16
#define TX_TO_ESP4   17

#define RFID_SS_PIN 21
#define RFID_RST_PIN 22

#define DOOR_SERVO_PIN 13
#define DOOR_IR_PIN 14
#define DOOR_BUZZER_PIN 15

#define GATE_SERVO_LEFT_PIN 25
#define GATE_SERVO_RIGHT_PIN 26
#define GATE_IR_PIN 32

HardwareSerial ControlSerial(2);

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

Servo doorServo;
Servo gateLeftServo;
Servo gateRightServo;

bool doorOpen = false;
bool gateOpen = false;

unsigned long doorOpenTime = 0;
unsigned long gateOpenTime = 0;
unsigned long lastStatusSend = 0;

void sendLog(String type, String message) {
  String data = "ESP3:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("Kirim -> " + data);
}

void beepDoor(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(DOOR_BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(DOOR_BUZZER_PIN, LOW);
    delay(80);
  }
}

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

void connectWiFi(String ssid, String pass) {
  WiFi.begin(ssid.c_str(), pass.c_str());
  sendLog("WIFI", "CONNECTING");
}

void handleCommand(String cmd) {
  cmd.trim();

  if (cmd.startsWith("WIFI:")) {
    int commaIndex = cmd.indexOf(',');

    if (commaIndex > 5) {
      String ssid = cmd.substring(5, commaIndex);
      String pass = cmd.substring(commaIndex + 1);
      connectWiFi(ssid, pass);
    }
  }

  if (cmd == "DOOR:OPEN") openDoor();
  if (cmd == "DOOR:CLOSE") closeDoor();
  if (cmd == "GATE:OPEN") openGate();
  if (cmd == "GATE:CLOSE") closeGate();
}

void readRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i], HEX);
  }

  uid.toUpperCase();

  sendLog("RFID", uid);

  // Sementara semua kartu RFID dianggap valid
  openDoor();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void setup() {
  Serial.begin(115200);
  ControlSerial.begin(9600, SERIAL_8N1, RX_FROM_ESP4, TX_TO_ESP4);

  pinMode(DOOR_IR_PIN, INPUT);
  pinMode(GATE_IR_PIN, INPUT);
  pinMode(DOOR_BUZZER_PIN, OUTPUT);

  digitalWrite(DOOR_BUZZER_PIN, LOW);

  SPI.begin(18, 19, 23, 21);
  rfid.PCD_Init();

  doorServo.attach(DOOR_SERVO_PIN);
  gateLeftServo.attach(GATE_SERVO_LEFT_PIN);
  gateRightServo.attach(GATE_SERVO_RIGHT_PIN);

  closeDoor();
  closeGate();

  Serial.println("\n========================================");
  Serial.println("ESP32 #3 - Door, Gate & RFID");
  Serial.println("========================================");
  Serial.println("[INFO] Serial 115200, UART 9600");
  Serial.println("[READY] Waiting for WiFi config from ESP32-4...");
  Serial.println("[INFO] RFID Ready - Scan card to open door");

  sendLog("SYSTEM", "READY");
}

void loop() {
  if (ControlSerial.available()) {
    String cmd = ControlSerial.readStringUntil('\n');
    handleCommand(cmd);
  }

  readRFID();

  int doorIR = digitalRead(DOOR_IR_PIN);
  int gateIR = digitalRead(GATE_IR_PIN);

  // Kalau sensor IR kebalik, ubah LOW menjadi HIGH
  if (doorIR == LOW && !doorOpen) {
    openDoor();
  }

  if (gateIR == LOW && !gateOpen) {
    openGate();
  }

  if (doorOpen && millis() - doorOpenTime > 3000) {
    closeDoor();
  }

  if (gateOpen && millis() - gateOpenTime > 4000) {
    closeGate();
  }

  if (millis() - lastStatusSend > 3000) {
    lastStatusSend = millis();

    String status = "OK,DOOR=" + String(doorOpen ? "OPEN" : "CLOSE");
    status += ",GATE=" + String(gateOpen ? "OPEN" : "CLOSE");
    status += ",WIFI=" + String(WiFi.status() == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
