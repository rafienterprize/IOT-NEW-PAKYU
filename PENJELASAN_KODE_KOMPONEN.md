# 📖 Penjelasan Kode - Bagian yang Mengatur Komponen IoT

Dokumen ini menjelaskan **bagian mana di kode yang mengatur komponen fisik** (sensor, relay, servo, dll) untuk setiap ESP32.

---

## 🔵 **ESP32 #1 - Lamp, Gas Sensor, Fish Feeder**

### **📌 Pin Configuration (Baris 14-23)**

```cpp
// KOMUNIKASI UART
#define RX_FROM_ESP4 16     // Terima command dari ESP32-4
#define TX_TO_ESP4   17     // Kirim data ke ESP32-4

// KOMPONEN FISIK
#define FISH_SERVO_PIN 18   // Servo pemberi makan ikan
#define LAMP_RELAY_PIN 23   // Relay lampu (ON/OFF)
#define GAS_SENSOR_PIN 34   // Sensor gas MQ-2 (Analog)

#define GAS_THRESHOLD 1800  // Batas gas berbahaya
```

**Fungsi:**
- `FISH_SERVO_PIN` → Pin servo untuk buka/tutup wadah pakan ikan
- `LAMP_RELAY_PIN` → Pin relay untuk nyalakan/matikan lampu
- `GAS_SENSOR_PIN` → Pin analog untuk baca sensor gas

---

### **🔧 Setup Komponen (Baris 87-99)**

```cpp
void setup() {
  Serial.begin(115200);
  ControlSerial.begin(9600, SERIAL_8N1, RX_FROM_ESP4, TX_TO_ESP4);

  // SETUP KOMPONEN
  pinMode(LAMP_RELAY_PIN, OUTPUT);   // ← Lampu sebagai output
  pinMode(GAS_SENSOR_PIN, INPUT);    // ← Gas sensor sebagai input

  digitalWrite(LAMP_RELAY_PIN, LOW); // ← Lampu OFF di awal

  fishServo.attach(FISH_SERVO_PIN);  // ← Attach servo ke pin 18
  fishServo.write(0);                // ← Servo posisi awal (tertutup)
  
  sendLog("SYSTEM", "READY");
}
```

**Fungsi:**
- `pinMode()` → Set pin sebagai INPUT (sensor) atau OUTPUT (relay/servo)
- `digitalWrite()` → Nyalakan/matikan relay (HIGH/LOW)
- `fishServo.attach()` → Hubungkan servo ke pin
- `fishServo.write()` → Atur posisi servo (0-180 derajat)

---

### **💡 Kontrol Lampu (Baris 64-74)**

```cpp
void handleCommand(String cmd) {
  // TERIMA COMMAND DARI ESP32-4
  
  // ====== NYALAKAN LAMPU ======
  if (cmd == "LAMP:ON") {
    digitalWrite(LAMP_RELAY_PIN, HIGH);  // ← Relay ON (lampu nyala)
    lampState = true;
    sendLog("LAMP", "ON");               // ← Kirim konfirmasi ke ESP32-4
  }

  // ====== MATIKAN LAMPU ======
  if (cmd == "LAMP:OFF") {
    digitalWrite(LAMP_RELAY_PIN, LOW);   // ← Relay OFF (lampu mati)
    lampState = false;
    sendLog("LAMP", "OFF");
  }
```

**Cara Kerja:**
1. Website kirim command → Backend → ESP32-4 → ESP32-1
2. ESP32-1 terima command "LAMP:ON" via UART
3. `digitalWrite(LAMP_RELAY_PIN, HIGH)` → Relay ON → Lampu nyala
4. Kirim konfirmasi balik ke ESP32-4 → Backend → Website

---

### **🐟 Fish Feeder (Baris 76-81)**

```cpp
  // ====== BERI MAKAN IKAN ======
  if (cmd == "FEED") {
    fishServo.write(90);   // ← Servo buka (90 derajat)
    delay(700);            // ← Tunggu 0.7 detik
    fishServo.write(0);    // ← Servo tutup kembali
    sendLog("FEEDER", "DONE");
  }
```

**Cara Kerja:**
1. Command "FEED" diterima
2. Servo putar ke 90° (wadah pakan terbuka)
3. Pakan ikan jatuh selama 0.7 detik
4. Servo kembali ke 0° (wadah tertutup)

---

### **🔴 Baca Gas Sensor (Baris 110-116)**

```cpp
void loop() {
  // ====== BACA GAS SENSOR ======
  int gasValue = analogRead(GAS_SENSOR_PIN);  // ← Baca nilai analog (0-4095)
  gasAlert = gasValue > GAS_THRESHOLD;        // ← Cek apakah melebihi batas

  if (gasAlert) {
    sendLog("GAS", "ALERT");  // ← Kirim alert ke ESP32-4 → Backend → Website
    delay(500);
  }
```

**Cara Kerja:**
1. `analogRead()` baca sensor gas (nilai 0-4095)
2. Jika nilai > 1800 → Gas berbahaya terdeteksi
3. Kirim alert "GAS:ALERT" ke backend
4. Website tampilkan notifikasi merah

---

### **📊 Kirim Status (Baris 122-130)**

```cpp
  // ====== KIRIM STATUS SETIAP 3 DETIK ======
  if (millis() - lastStatusSend > 3000) {
    lastStatusSend = millis();

    String status = "OK,GAS=" + String(gasValue);            // ← Nilai gas
    status += ",LAMP=" + String(lampState ? "ON" : "OFF");   // ← Status lampu
    status += ",WIFI=" + String(WiFi.status() == WL_CONNECTED ? "OK" : "NO");

    sendLog("STATUS", status);  // ← Kirim: ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
  }
```

**Format Data yang Dikirim:**
```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
```

---

## 🟢 **ESP32 #2 - Clothesline & Rain Sensor**

### **📌 Pin Configuration (Baris 14-21)**

```cpp
#define RX_FROM_ESP4 16           // UART RX
#define TX_TO_ESP4   17           // UART TX

#define RAIN_SENSOR_PIN 35        // Sensor hujan (Analog)
#define CLOTHESLINE_SERVO_PIN 4   // Servo jemuran
#define RAIN_BUZZER_PIN 2         // Buzzer alert hujan

#define RAIN_THRESHOLD 1600       // Batas hujan terdeteksi
```

---

### **🌧️ Baca Rain Sensor (Baris 110-124)**

```cpp
void loop() {
  // ====== BACA RAIN SENSOR ======
  int rainValue = analogRead(RAIN_SENSOR_PIN);  // ← Baca sensor hujan
  rainAlert = rainValue > RAIN_THRESHOLD;       // ← Hujan detected?

  // ====== AUTO CLOTHESLINE IN (HUJAN) ======
  if (rainAlert && !clotheslineIn) {
    clotheslineServo.write(90);        // ← Servo masuk (jemuran masuk)
    clotheslineIn = true;
    sendLog("RAIN", "ALERT_CLOTHESLINE_IN");
  }

  // ====== AUTO CLOTHESLINE OUT (CERAH) ======
  if (!rainAlert && clotheslineIn) {
    clotheslineServo.write(0);         // ← Servo keluar (jemuran keluar)
    clotheslineIn = false;
    sendLog("RAIN", "CLEAR_CLOTHESLINE_OUT");
  }
```

**Cara Kerja Otomatis:**
1. Sensor baca nilai hujan terus-menerus
2. **Jika hujan:** Servo otomatis putar 90° (jemuran masuk)
3. **Jika cerah:** Servo kembali 0° (jemuran keluar)
4. Kirim notifikasi ke website

---

### **📢 Buzzer Alert (Baris 43-50)**

```cpp
void beepRain() {
  if (millis() - lastBeep > 800) {
    lastBeep = millis();
    digitalWrite(RAIN_BUZZER_PIN, HIGH);  // ← Buzzer ON
    delay(80);
    digitalWrite(RAIN_BUZZER_PIN, LOW);   // ← Buzzer OFF
  }
}
```

**Dipanggil di loop() baris 126:**
```cpp
  if (rainAlert) {
    beepRain();  // ← Buzzer berbunyi setiap 800ms saat hujan
  }
```

---

### **🎮 Kontrol Manual Clothesline (Baris 68-79)**

```cpp
void handleCommand(String cmd) {
  // ====== MASUKKAN JEMURAN MANUAL ======
  if (cmd == "CLOTHESLINE:IN") {
    clotheslineServo.write(90);
    clotheslineIn = true;
    sendLog("CLOTHESLINE", "IN");
  }

  // ====== KELUARKAN JEMURAN MANUAL ======
  if (cmd == "CLOTHESLINE:OUT") {
    clotheslineServo.write(0);
    clotheslineIn = false;
    sendLog("CLOTHESLINE", "OUT");
  }
}
```

**Cara Kerja:**
- User click button "Clothesline IN" di website
- Command dikirim: ESP4 → ESP2
- Servo putar ke 90° (jemuran masuk manual)

---

## 🔴 **ESP32 #3 - Door, Gate, RFID**

### **📌 Pin Configuration (Baris 18-36)**

```cpp
// RFID PINS
#define RFID_SS_PIN 21
#define RFID_RST_PIN 22
// RFID menggunakan SPI: MOSI=23, MISO=19, SCK=18

// DOOR
#define DOOR_SERVO_PIN 13        // Servo pintu
#define DOOR_IR_PIN 14           // IR sensor detect orang
#define DOOR_BUZZER_PIN 15       // Buzzer pintu

// GATE
#define GATE_SERVO_LEFT_PIN 25   // Servo gerbang kiri
#define GATE_SERVO_RIGHT_PIN 26  // Servo gerbang kanan
#define GATE_IR_PIN 32           // IR sensor detect mobil
```

---

### **🚪 Kontrol Door (Baris 61-74)**

```cpp
void openDoor() {
  doorServo.write(90);        // ← Servo buka pintu (90°)
  doorOpen = true;
  doorOpenTime = millis();    // ← Catat waktu buka
  beepDoor(1);                // ← Buzzer beep 1x
  sendLog("DOOR", "OPEN");
}

void closeDoor() {
  doorServo.write(0);         // ← Servo tutup pintu (0°)
  doorOpen = false;
  sendLog("DOOR", "CLOSE");
}
```

---

### **🎫 RFID Scanner (Baris 121-143)**

```cpp
void readRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;  // ← Ada kartu?
  if (!rfid.PICC_ReadCardSerial()) return;    // ← Baca UID

  String uid = "";

  // ====== BACA UID KARTU ======
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i], HEX);  // ← Convert ke HEX
  }

  uid.toUpperCase();

  sendLog("RFID", uid);  // ← Kirim UID ke backend

  // ====== BUKA PINTU OTOMATIS ======
  // Sementara semua kartu RFID dianggap valid
  openDoor();  // ← Pintu buka otomatis saat scan RFID

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
```

**Cara Kerja:**
1. Kartu RFID di-scan
2. ESP32-3 baca UID kartu
3. Kirim UID ke backend (backend cek whitelist)
4. Pintu otomatis buka
5. Setelah 3 detik, pintu tutup otomatis

---

### **🚗 Gate Control (Baris 76-87)**

```cpp
void openGate() {
  gateLeftServo.write(90);      // ← Servo kiri buka
  gateRightServo.write(90);     // ← Servo kanan buka
  gateOpen = true;
  gateOpenTime = millis();
  sendLog("GATE", "OPEN");
}

void closeGate() {
  gateLeftServo.write(0);       // ← Servo kiri tutup
  gateRightServo.write(180);    // ← Servo kanan tutup (arah berlawanan)
  gateOpen = false;
  sendLog("GATE", "CLOSE");
}
```

---

### **👁️ IR Sensor Auto Door/Gate (Baris 174-186)**

```cpp
void loop() {
  readRFID();

  int doorIR = digitalRead(DOOR_IR_PIN);  // ← Baca IR sensor pintu
  int gateIR = digitalRead(GATE_IR_PIN);  // ← Baca IR sensor gerbang

  // ====== AUTO OPEN DOOR (ORANG DETECTED) ======
  if (doorIR == LOW && !doorOpen) {
    openDoor();
  }

  // ====== AUTO OPEN GATE (MOBIL DETECTED) ======
  if (gateIR == LOW && !gateOpen) {
    openGate();
  }
```

**Cara Kerja:**
- IR sensor detect ada orang/mobil (LOW signal)
- Pintu/gerbang otomatis buka
- Setelah timeout, otomatis tutup

---

### **⏱️ Auto Close Timer (Baris 188-195)**

```cpp
  // ====== AUTO CLOSE DOOR SETELAH 3 DETIK ======
  if (doorOpen && millis() - doorOpenTime > 3000) {
    closeDoor();
  }

  // ====== AUTO CLOSE GATE SETELAH 4 DETIK ======
  if (gateOpen && millis() - gateOpenTime > 4000) {
    closeGate();
  }
```

---

## 🟡 **ESP32 #4 - Gateway (Master Controller)**

### **📌 Fungsi Utama**

ESP32-4 **TIDAK mengontrol komponen fisik langsung**. Fungsinya:

1. **Bridge komunikasi** ESP1/2/3 ↔ Backend
2. **Forward command** dari backend ke ESP yang tepat
3. **Aggregate data** dari semua ESP
4. **Kirim WiFi config** ke semua ESP

---

### **🔄 Forward Command (Baris 268-298)**

```cpp
void handleUSBCommands() {
  // ====== TERIMA COMMAND DARI BACKEND (USB SERIAL) ======
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    Serial.println("[BACKEND] Command received: " + command);
    
    // Format: ESP1:LAMP:ON atau ESP2:CLOTHESLINE:IN
    int firstColon = command.indexOf(':');
    
    if (firstColon > 0) {
      String target = command.substring(0, firstColon);  // ← ESP1, ESP2, ESP3
      String payload = command.substring(firstColon + 1); // ← LAMP:ON
      
      // ====== FORWARD KE ESP YANG DITUJU ======
      if (target == "ESP1") {
        ESP1Serial.println(payload);  // ← Kirim via UART ke ESP1
        Serial.println("[GATEWAY] Forwarded to ESP1: " + payload);
      } 
      else if (target == "ESP2") {
        ESP2Serial.println(payload);  // ← Kirim via UART ke ESP2
      } 
      else if (target == "ESP3") {
        ESP3Serial.println(payload);  // ← Kirim via UART ke ESP3
      }
```

**Cara Kerja:**
1. Website → Backend kirim: `ESP1:LAMP:ON`
2. ESP32-4 terima via USB Serial
3. Parse target ESP (ESP1)
4. Forward command via UART ke ESP1
5. ESP1 eksekusi (nyalakan lampu)

---

### **📡 Aggregate Data (Baris 226-264)**

```cpp
void readFromESP(HardwareSerial &port, String name, int ledPin, unsigned long &lastSeen) {
  if (port.available()) {
    String data = port.readStringUntil('\n');
    data.trim();

    if (data.length() > 0) {
      // ====== FORWARD DATA KE BACKEND (USB SERIAL) ======
      Serial.println(data);  // ← Kirim: ESP1:STATUS:OK,GAS=1234...
      
      lastSeen = millis();
      digitalWrite(ledPin, HIGH);  // ← LED indicator ON
```

**Cara Kerja:**
1. ESP1/2/3 kirim data via UART ke ESP4
2. ESP4 terima data
3. ESP4 forward langsung ke Backend via USB
4. Backend parse & broadcast ke website

---

## 📊 **Summary - Komponen & Kodenya**

| ESP32 | Komponen | Pin | Function | Baris Kode |
|-------|----------|-----|----------|------------|
| **ESP32 #1** | **Lamp Relay** | GPIO 23 | `digitalWrite(23, HIGH/LOW)` | 64-74 |
| | **Fish Servo** | GPIO 18 | `fishServo.write(90)` | 76-81 |
| | **Gas Sensor** | GPIO 34 | `analogRead(34)` | 110-116 |
| **ESP32 #2** | **Clothesline Servo** | GPIO 4 | `clotheslineServo.write(90)` | 68-79, 110-124 |
| | **Rain Sensor** | GPIO 35 | `analogRead(35)` | 110 |
| | **Rain Buzzer** | GPIO 2 | `digitalWrite(2, HIGH)` | 43-50 |
| **ESP32 #3** | **Door Servo** | GPIO 13 | `doorServo.write(90)` | 61-74 |
| | **Gate Servo L/R** | GPIO 25/26 | `gateServo.write(90)` | 76-87 |
| | **RFID** | SPI | `rfid.PICC_ReadCardSerial()` | 121-143 |
| | **IR Sensors** | GPIO 14/32 | `digitalRead(14)` | 174-186 |
| **ESP32 #4** | **Gateway** | USB+UART | Forward commands & data | 226-298 |

---

## 🔗 **Alur Data Lengkap:**

```
┌──────────┐                    ┌──────────┐
│ Website  │ Click "Lamp ON"    │ Backend  │
│          ├───────────────────>│ Node.js  │
└──────────┘                    └────┬─────┘
                                     │ Serial USB
                                     ↓
                                ┌──────────┐
                                │ ESP32 #4 │ Send: ESP1:LAMP:ON
                                │ Gateway  ├────────┐
                                └──────────┘        │ UART
                                                    ↓
                                               ┌──────────┐
                                               │ ESP32 #1 │
                                               │ Receive: │
                                               │ LAMP:ON  │
                                               └────┬─────┘
                                                    │
                                                    ↓
                                            digitalWrite(23, HIGH)
                                                    │
                                                    ↓
                                            🔥 LAMPU NYALA!
```

---

**Semua kode sudah terstruktur dengan baik! Tinggal upload ke hardware dan test!** 🚀

