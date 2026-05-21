/*
  ESP32 #1 - Smart Lamp, Gas Detector, Fish Feeder

  KOMUNIKASI UART KE ESP32 #4:
  GPIO 16 - RX from ESP32 #4
  GPIO 17 - TX to ESP32 #4

  FITUR:
  GPIO 18 - Servo Fish Feeder
  GPIO 23 - Smart Lamp Relay
  GPIO 34 - Gas Sensor
*/

#include <WiFi.h>
#include <ESP32Servo.h>

#define RX_FROM_ESP4 16
#define TX_TO_ESP4   17

#define FISH_SERVO_PIN 18
#define LAMP_RELAY_PIN 23
#define GAS_SENSOR_PIN 34

#define GAS_THRESHOLD 1800

HardwareSerial ControlSerial(2);
Servo fishServo;

String wifiSSID = "";
String wifiPASS = "";

unsigned long lastStatusSend = 0;
unsigned long lastFeedTime = 0;

bool lampState = false;
bool gasAlert = false;

void sendLog(String type, String message) {
  String data = "ESP1:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("Kirim -> " + data);
}

void connectWiFi(String ssid, String pass) {
  wifiSSID = ssid;
  wifiPASS = pass;

  WiFi.begin(wifiSSID.c_str(), wifiPASS.c_str());
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

  if (cmd == "LAMP:ON") {
    digitalWrite(LAMP_RELAY_PIN, HIGH);
    lampState = true;
    sendLog("LAMP", "ON");
  }

  if (cmd == "LAMP:OFF") {
    digitalWrite(LAMP_RELAY_PIN, LOW);
    lampState = false;
    sendLog("LAMP", "OFF");
  }

  if (cmd == "FEED") {
    fishServo.write(90);
    delay(700);
    fishServo.write(0);
    sendLog("FEEDER", "DONE");
  }
}

void setup() {
  Serial.begin(115200);
  ControlSerial.begin(9600, SERIAL_8N1, RX_FROM_ESP4, TX_TO_ESP4);

  pinMode(LAMP_RELAY_PIN, OUTPUT);
  pinMode(GAS_SENSOR_PIN, INPUT);

  digitalWrite(LAMP_RELAY_PIN, LOW);

  fishServo.attach(FISH_SERVO_PIN);
  fishServo.write(0);

  sendLog("SYSTEM", "READY");
}

void loop() {
  if (ControlSerial.available()) {
    String cmd = ControlSerial.readStringUntil('\n');
    handleCommand(cmd);
  }

  int gasValue = analogRead(GAS_SENSOR_PIN);
  gasAlert = gasValue > GAS_THRESHOLD;

  if (gasAlert) {
    sendLog("GAS", "ALERT");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    // WiFi tersambung
  }

  if (millis() - lastStatusSend > 3000) {
    lastStatusSend = millis();

    String status = "OK,GAS=" + String(gasValue);
    status += ",LAMP=" + String(lampState ? "ON" : "OFF");
    status += ",WIFI=" + String(WiFi.status() == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
