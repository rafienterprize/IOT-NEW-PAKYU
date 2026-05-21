/*
  ESP32 #2 - Smart Trash & Smart Clothesline

  KOMUNIKASI UART KE ESP32 #4:
  GPIO 16 - RX from ESP32 #4
  GPIO 17 - TX to ESP32 #4

  CLOTHESLINE:
  GPIO 35 - Rain Sensor
  GPIO 4  - Clothesline Servo
  GPIO 2  - Buzzer Rain Alert
*/

#include <WiFi.h>
#include <ESP32Servo.h>

#define RX_FROM_ESP4 16
#define TX_TO_ESP4   17

#define RAIN_SENSOR_PIN 35
#define CLOTHESLINE_SERVO_PIN 4
#define RAIN_BUZZER_PIN 2

#define RAIN_THRESHOLD 1600

HardwareSerial ControlSerial(2);
Servo clotheslineServo;

String wifiSSID = "";
String wifiPASS = "";

bool clotheslineIn = false;
bool rainAlert = false;

unsigned long lastStatusSend = 0;
unsigned long lastBeep = 0;

void sendLog(String type, String message) {
  String data = "ESP2:" + type + ":" + message;
  ControlSerial.println(data);
  Serial.println("Kirim -> " + data);
}

void beepRain() {
  if (millis() - lastBeep > 800) {
    lastBeep = millis();
    digitalWrite(RAIN_BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(RAIN_BUZZER_PIN, LOW);
  }
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

  if (cmd == "CLOTHESLINE:IN") {
    clotheslineServo.write(90);
    clotheslineIn = true;
    sendLog("CLOTHESLINE", "IN");
  }

  if (cmd == "CLOTHESLINE:OUT") {
    clotheslineServo.write(0);
    clotheslineIn = false;
    sendLog("CLOTHESLINE", "OUT");
  }
}

void setup() {
  Serial.begin(115200);
  ControlSerial.begin(9600, SERIAL_8N1, RX_FROM_ESP4, TX_TO_ESP4);

  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(RAIN_BUZZER_PIN, OUTPUT);

  digitalWrite(RAIN_BUZZER_PIN, LOW);

  clotheslineServo.attach(CLOTHESLINE_SERVO_PIN);
  clotheslineServo.write(0);

  sendLog("SYSTEM", "READY");
}

void loop() {
  if (ControlSerial.available()) {
    String cmd = ControlSerial.readStringUntil('\n');
    handleCommand(cmd);
  }

  int rainValue = analogRead(RAIN_SENSOR_PIN);
  rainAlert = rainValue > RAIN_THRESHOLD;

  if (rainAlert && !clotheslineIn) {
    clotheslineServo.write(90);
    clotheslineIn = true;
    sendLog("RAIN", "ALERT_CLOTHESLINE_IN");
  }

  if (!rainAlert && clotheslineIn) {
    clotheslineServo.write(0);
    clotheslineIn = false;
    sendLog("RAIN", "CLEAR_CLOTHESLINE_OUT");
  }

  if (rainAlert) {
    beepRain();
  }

  if (millis() - lastStatusSend > 3000) {
    lastStatusSend = millis();

    String status = "OK,RAIN=" + String(rainValue);
    status += ",CLOTHESLINE=" + String(clotheslineIn ? "IN" : "OUT");
    status += ",WIFI=" + String(WiFi.status() == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);
  }
}
