# 🟡 ESP32 #4 - Gateway Controller: Sistem & Cara Kerja

ESP32-4 adalah **MASTER CONTROLLER** atau **GATEWAY** yang menjadi jembatan komunikasi antara ESP32 #1, #2, #3 dengan Backend (Website).

---

## 🎯 **Peran ESP32-4**

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  ESP32   │  UART   │  ESP32   │   USB   │ Backend  │
│  1,2,3   ├────────>│    #4    ├────────>│ Node.js  │
│ (Slave)  │<────────┤ (Gateway)│<────────┤ (Server) │
└──────────┘  9600   └──────────┘ 115200  └──────────┘
  Komponen              Bridge              Website
   Fisik              2-Way Comm           Dashboard
```

**Fungsi:**
1. ✅ **Terima data** dari ESP1/2/3 via UART → Forward ke Backend
2. ✅ **Terima command** dari Backend → Forward ke ESP1/2/3
3. ✅ **Kirim WiFi config** ke semua ESP
4. ✅ **Monitor status** ESP1/2/3 (online/offline)
5. ✅ **TEST MODE** untuk simulasi data tanpa hardware

---

## 📡 **Sistem Komunikasi**

### **1️⃣ UART Communication (ESP1/2/3 ↔ ESP4)**

**Baud Rate:** 9600 bps

#### **A. Dari ESP1 ke ESP4 (Baris 186-202)**

```cpp
void readFromESP(HardwareSerial &port, String name, int ledPin, unsigned long &lastSeen) {
  if (port.available()) {                          // ← Cek ada data masuk?
    String data = port.readStringUntil('\n');      // ← Baca sampai newline
    data.trim();                                   // ← Hapus whitespace

    if (data.length() > 0) {
      // ====== FORWARD KE BACKEND (USB SERIAL) ======
      Serial.println(data);  // ← Kirim langsung ke USB (Backend)
      
      lastSeen = millis();                         // ← Update waktu terakhir
      digitalWrite(ledPin, HIGH);                  // ← LED indicator ON

      // Alert sound untuk gas dan rain
      if (data.indexOf("ALERT") >= 0 || data.indexOf("GAS") >= 0 || data.indexOf("RAIN") >= 0) {
        alertSound();                              // ← Bunyi buzzer
      }
    }
  }
}
```

**Contoh Data:**
```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:RAIN:1800
ESP3:RFID:A1B2C3D4
```

**Cara Kerja:**
1. ESP1 kirim data via TX → ESP4 RX (GPIO 16)
2. ESP4 baca data dari UART
3. ESP4 forward langsung ke USB Serial → Backend
4. LED indicator menyala (tanda ESP1 aktif)
5. Jika alert (GAS/RAIN), buzzer berbunyi

---

#### **B. Dari ESP4 ke ESP1 (Baris 162-174)**

```cpp
void sendWiFiTo(HardwareSerial &port, String targetName) {
  String data = "WIFI:" + wifiSSID + "," + wifiPASS;  // ← Format: WIFI:SSID,PASS
  port.println(data);                                  // ← Kirim via UART TX
  Serial.println("[GATEWAY] WiFi sent to " + targetName);
}

void sendWiFiToAll() {
  Serial.println("[GATEWAY] Sending WiFi config to all ESP devices...");
  sendWiFiTo(ESP1Serial, "ESP1");  // ← Kirim ke ESP1 via GPIO 17 (TX)
  sendWiFiTo(ESP2Serial, "ESP2");  // ← Kirim ke ESP2 via GPIO 5 (TX)
  // ESP3 sementara disabled
  Serial.println("[GATEWAY] WiFi config sent to ESP1 & ESP2");
  successSound();
}
```

**Dipanggil saat:**
1. **ESP4 startup** (`setup()` baris 365)
2. **User tekan tombol BOOT** (GPIO 0) (baris 382-389)
3. **Command WIFI dari backend** (baris 293-302)

---

### **2️⃣ USB Serial Communication (ESP4 ↔ Backend)**

**Baud Rate:** 115200 bps

#### **A. Dari ESP4 ke Backend (Forward Data ESP1/2/3)**

**Dipanggil di `loop()` baris 394-398:**
```cpp
void loop() {
  // **BARU**: Kirim data test otomatis (jika TEST_MODE = true)
  sendTestData();  // ← Simulasi data ESP1/2/3
  
  // Baca data dari ESP1/2/3 via UART
  readFromESP(ESP1Serial, "ESP1", LED_ESP1, lastESP1);
  readFromESP(ESP2Serial, "ESP2", LED_ESP2, lastESP2);
  // readFromESP(ESP3Serial, "ESP3", LED_ESP3, lastESP3);

  // **BARU**: Handle command dari backend
  handleUSBCommands();  // ← Terima command dari website
```

---

#### **B. Dari Backend ke ESP4 (Command) - Baris 268-304**

```cpp
void handleUSBCommands() {
  // ====== TERIMA COMMAND DARI BACKEND VIA USB ======
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command.length() > 0) {
      Serial.println("[BACKEND] Command received: " + command);
      
      // Format: ESP1:LAMP:ON atau ESP2:CLOTHESLINE:IN
      int firstColon = command.indexOf(':');
      
      if (firstColon > 0) {
        String target = command.substring(0, firstColon);    // ← ESP1, ESP2, ESP3
        String payload = command.substring(firstColon + 1);  // ← LAMP:ON
        
        // ====== FORWARD COMMAND KE ESP YANG DITUJU ======
        if (target == "ESP1") {
          ESP1Serial.println(payload);  // ← Kirim ke ESP1 via UART
          Serial.println("[GATEWAY] Forwarded to ESP1: " + payload);
        } 
        else if (target == "ESP2") {
          ESP2Serial.println(payload);
          Serial.println("[GATEWAY] Forwarded to ESP2: " + payload);
        } 
        else if (target == "ESP3") {
          // ESP3 sementara disabled
          Serial.println("[ERROR] ESP3 is temporarily disabled");
        } 
        else if (target == "WIFI") {
          // ====== UPDATE WIFI CONFIG ======
          // Format: WIFI:SSID,PASSWORD
          int commaPos = payload.indexOf(',');
          if (commaPos > 0) {
            wifiSSID = payload.substring(0, commaPos);
            wifiPASS = payload.substring(commaPos + 1);
            Serial.println("[GATEWAY] WiFi config updated");
            sendWiFiToAll();  // ← Kirim ke semua ESP
          }
        } 
        else {
          Serial.println("[ERROR] Unknown target: " + target);
        }
      } else {
        Serial.println("[ERROR] Invalid command format");
      }
    }
  }
}
```

**Contoh Command dari Backend:**
```
ESP1:LAMP:ON          → Nyalakan lampu
ESP2:CLOTHESLINE:IN   → Masukkan jemuran
ESP3:DOOR:OPEN        → Buka pintu
WIFI:MyWiFi,Pass123   → Update WiFi semua ESP
```

---

## 🧪 **TEST MODE - Simulasi Data**

**Baris 77-107:**

```cpp
// **BARU**: Mode simulasi untuk testing tanpa ESP1/2/3 fisik
#define ENABLE_TEST_MODE true  // ← Set false untuk hardware real
unsigned long lastTestData = 0;
const unsigned long TEST_DATA_INTERVAL = 3000; // ← Kirim setiap 3 detik

void sendTestData() {
  if (!ENABLE_TEST_MODE) return;  // ← Skip jika TEST_MODE = false
  
  unsigned long now = millis();
  if (now - lastTestData < TEST_DATA_INTERVAL) return;  // ← Cek interval
  
  lastTestData = now;
  
  // ====== SIMULASI DATA DARI ESP1, ESP2, ESP3 ======
  int randomGas = random(1000, 1500);    // ← Random gas value
  int randomRain = random(500, 1000);    // ← Random rain value
  
  String esp1Data = "ESP1:STATUS:OK,GAS=" + String(randomGas) + ",LAMP=OFF,WIFI=OK";
  String esp2Data = "ESP2:STATUS:OK,RAIN=" + String(randomRain) + ",CLOTHESLINE=OUT,WIFI=OK";
  String esp3Data = "ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK";
  String esp4Data = "ESP4:STATUS:OK";
  
  // ====== KIRIM KE USB SERIAL (BACKEND) ======
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
```

**Cara Kerja:**
1. Jika `ENABLE_TEST_MODE = true`
2. Setiap 3 detik, generate data random
3. Kirim ke USB Serial seolah-olah dari ESP1/2/3
4. Backend menerima & process seperti data real
5. Website menampilkan data simulasi

**Gunakan untuk:**
- ✅ Test website tanpa hardware ESP1/2/3
- ✅ Debug backend & frontend
- ✅ Demo sistem ke client

---

## 📊 **Monitoring Status ESP1/2/3**

**Baris 209-238:**

```cpp
void updateStatusLED() {
  unsigned long now = millis();

  // ====== CEK TIMEOUT ESP1/2/3 ======
  bool esp1Online = now - lastESP1 < DEVICE_TIMEOUT;  // ← 7 detik timeout
  bool esp2Online = now - lastESP2 < DEVICE_TIMEOUT;
  bool esp3Online = now - lastESP3 < DEVICE_TIMEOUT;

  // ====== UPDATE LED INDICATOR ======
  digitalWrite(LED_ESP1, esp1Online ? HIGH : LOW);  // ← LED biru
  digitalWrite(LED_ESP2, esp2Online ? HIGH : LOW);  // ← LED hijau
  digitalWrite(LED_ESP3, esp3Online ? HIGH : LOW);  // ← LED merah

  // ====== SYSTEM LED BLINK ======
  if (now - lastBlink > 500) {
    lastBlink = now;
    systemBlinkState = !systemBlinkState;
    digitalWrite(LED_SYSTEM, systemBlinkState ? HIGH : LOW);  // ← LED kuning kedip
  }
}
```

**Cara Kerja:**
1. `lastESP1` di-update setiap kali terima data dari ESP1
2. Jika `millis() - lastESP1 > 7000` → ESP1 offline
3. LED indicator:
   - **Biru ON** = ESP1 online
   - **Hijau ON** = ESP2 online
   - **Merah ON** = ESP3 online
   - **Kuning kedip** = Sistem berjalan

---

## 🔊 **Sound System (Buzzer)**

**Baris 112-144:**

```cpp
void toneBeep(int durationMs) {
  digitalWrite(BUZZER_PIN, HIGH);  // ← Buzzer ON
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);   // ← Buzzer OFF
}

// ====== STARTUP SOUND ======
void startupSound() {
  toneBeep(80);   // Beep pendek
  delay(80);
  toneBeep(120);  // Beep sedang
  delay(80);
  toneBeep(200);  // Beep panjang
}

// ====== ALERT SOUND (GAS/RAIN) ======
void alertSound() {
  for (int i = 0; i < 3; i++) {
    toneBeep(80);
    delay(80);
  }
}

// ====== SUCCESS SOUND (WIFI SENT) ======
void successSound() {
  toneBeep(60);
  delay(60);
  toneBeep(60);
}
```

**Dipanggil saat:**
- **Startup:** 3 beep naik (baris 319)
- **Alert:** 3 beep cepat (baris 197)
- **Success:** 2 beep pendek (baris 174)

---

## 🖥️ **LCD Display (Optional)**

**Baris 46-58:**

```cpp
// NOTE: LCD I2C dikomentari karena optional
// Jika punya LCD 20x4, uncomment bagian ini

/*
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 20, 4);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("ESP32-4 Gateway");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");
}
*/
```

**Jika aktif, LCD menampilkan:**
- Baris 1: Status sistem
- Baris 2: Status ESP1/2/3
- Baris 3: Data sensor
- Baris 4: Command terakhir

---

## 🔘 **Button BOOT (GPIO 0)**

**Baris 382-389:**

```cpp
void loop() {
  // ... kode lain ...

  // ====== BUTTON UNTUK RESEND WIFI CONFIG ======
  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    if (millis() - lastWiFiSend > 2000) {  // ← Debounce 2 detik
      lastWiFiSend = millis();
      Serial.println("[BUTTON] Resending WiFi config to all devices...");
      sendWiFiToAll();  // ← Kirim ulang WiFi config
    }
  }
}
```

**Cara Pakai:**
1. Tekan tombol BOOT di ESP32-4
2. WiFi config dikirim ulang ke ESP1/2/3
3. Berguna jika ESP restart atau WiFi berubah

---

## 📋 **Setup & Initialization**

**Baris 306-365:**

```cpp
void setup() {
  // ====== SERIAL COMMUNICATION ======
  Serial.begin(115200);  // ← USB ke Backend

  // ====== LED INDICATOR ======
  pinMode(LED_ESP1, OUTPUT);    // GPIO 21 - Biru
  pinMode(LED_ESP2, OUTPUT);    // GPIO 22 - Hijau
  pinMode(LED_ESP3, OUTPUT);    // GPIO 23 - Merah
  pinMode(LED_SYSTEM, OUTPUT);  // GPIO 19 - Kuning

  pinMode(BUZZER_PIN, OUTPUT);         // GPIO 14
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);  // GPIO 0 (BOOT)

  digitalWrite(LED_ESP1, LOW);
  digitalWrite(LED_ESP2, LOW);
  digitalWrite(LED_ESP3, LOW);
  digitalWrite(LED_SYSTEM, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // ====== STARTUP SOUND ======
  startupSound();

  // ====== INITIALIZE UART TO ESP1/2/3 ======
  // ESP1 menggunakan HardwareSerial(1)
  ESP1Serial.begin(9600, SERIAL_8N1, ESP1_RX, ESP1_TX);  // GPIO 16/17
  
  // ESP2 menggunakan HardwareSerial(2)
  ESP2Serial.begin(9600, SERIAL_8N1, ESP2_RX, ESP2_TX);  // GPIO 4/5
  
  // ESP3 sementara disabled karena conflict
  pinMode(ESP3_RX, INPUT);   // GPIO 2
  pinMode(ESP3_TX, OUTPUT);  // GPIO 18

  // ====== PRINT INFO ======
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

  // ====== SEND WIFI CONFIG TO ALL ESP ======
  sendWiFiToAll();
}
```

---

## 🔄 **Loop - Main Program**

**Baris 391-408:**

```cpp
void loop() {
  // 1. KIRIM DATA TEST (jika TEST_MODE = true)
  sendTestData();
  
  // 2. BACA DATA DARI ESP1/2/3 VIA UART
  readFromESP(ESP1Serial, "ESP1", LED_ESP1, lastESP1);
  readFromESP(ESP2Serial, "ESP2", LED_ESP2, lastESP2);
  // ESP3 disabled
  
  // 3. HANDLE COMMAND DARI BACKEND VIA USB
  handleUSBCommands();

  // 4. UPDATE STATUS LED
  updateStatusLED();

  // 5. BUTTON CONFIG WIFI
  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    if (millis() - lastWiFiSend > 2000) {
      lastWiFiSend = millis();
      Serial.println("[BUTTON] Resending WiFi config to all devices...");
      sendWiFiToAll();
    }
  }
}
```

**Urutan Eksekusi:**
1. Kirim data simulasi (jika TEST_MODE aktif)
2. Cek & baca data dari ESP1/2/3
3. Cek & process command dari backend
4. Update LED status
5. Cek button BOOT

---

## 📊 **Data Flow Diagram**

```
                      ┌─────────────────────┐
                      │    ESP32 #4         │
                      │    (Gateway)        │
                      │                     │
   ┌──────────────────┤  USB Serial 115200  ├──────────────────┐
   │                  │  GPIO 3 (RX)        │                  │
   │                  │  GPIO 1 (TX)        │                  │
   │                  └─────────────────────┘                  │
   │                           │                               │
   │                           │ UART 9600                     │
   │                           │                               │
   ↓                           ↓                               ↓
┌──────┐           ┌──────────────────────┐            ┌──────────┐
│Backend│           │   ESP1/2/3           │            │ Backend  │
│      │           │   GPIO 16/17 (ESP1)  │            │          │
│Send: │           │   GPIO 4/5   (ESP2)  │            │Receive:  │
│ESP1:  │          │   GPIO 2/18  (ESP3)  │            │ESP1:     │
│LAMP:ON│          └──────────────────────┘            │STATUS:OK │
└──────┘                                                └──────────┘
Command                                                   Data
  Flow                                                    Flow
```

---

## 🎯 **Kesimpulan**

**ESP32-4 adalah hub pusat yang:**

1. ✅ **Bridge 2-way communication** (ESP1/2/3 ↔ Backend)
2. ✅ **Parse & route commands** ke ESP yang tepat
3. ✅ **Aggregate & forward data** dari semua ESP
4. ✅ **Manage WiFi config** untuk semua ESP
5. ✅ **Monitor status** ESP1/2/3 (online/offline)
6. ✅ **Visual feedback** via LED & buzzer
7. ✅ **Test mode** untuk simulasi tanpa hardware

**Tanpa ESP32-4, sistem tidak berfungsi karena:**
- ESP1/2/3 tidak bisa komunikasi dengan backend
- Website tidak bisa kirim command
- Tidak ada aggregasi data sensor

**ESP32-4 = Jantung sistem IoT Smart Home!** 🟡

