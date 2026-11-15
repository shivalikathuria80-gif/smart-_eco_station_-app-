# Smart Eco Station: Project Summary

## 1. The idea in one line
A smart dustbin station that **starts with an RFID card tap**, **senses whether the waste is wet or dry with a moisture sensor**, **sorts it automatically into the right bin**, **gives the user reward points**, and **tells the authorities on a website when a bin is getting full**.

## 2. The parts and what each one does

| Part | Job |
|---|---|
| **RFID reader (RC522) + card** | Identifies the person using the station |
| **Main ESP32** | The "brain": controls everything and connects to the internet over Wi-Fi |
| **Moisture sensor** | Sits on the flap; wet waste lowers its reading, so it decides wet or dry |
| **3rd ultrasonic sensor (HC-SR04)** | Above the flap, notices when waste has been put down |
| **Servo motor (SG90)** | Tilts the flap to drop the waste into the wet or dry bin |
| **2 more ultrasonic sensors (HC-SR04)** | One inside each bin, measuring how full it is |
| **16×2 LCD screen** | Shows messages and fill levels at the station |
| **Buzzer** | Beeps for success and errors |
| **Firebase Realtime Database** | Online storage for users, points, bin levels and logs |
| **Website** | Public page for checking points, plus the Authority Portal for staff |

## 3. Step by step: what happens when someone uses it

### Step 1: scanning the card
- The person taps their RFID card. The RC522 reads the card's unique number (UID), e.g. `A3 5F 8C 12`.
- The main ESP32 asks Firebase over Wi-Fi: "Is there a user saved under this card number?"
- **Not registered:** the LCD shows **Not registered** and the card's UID, the buzzer beeps 3 times, and a "denied" entry goes to the website's log. The Authority Portal then lists that UID so it can be registered in one click, and the card works at the very next tap.
- **No Wi-Fi / database:** the LCD shows **No connection, Try again** (so a network problem is never mistaken for an unregistered card).
- **Registered:** the LCD shows **"Hi <name>, Put waste in"**

### Step 2: waste goes in
- There is no lock. The LCD counts down **10 seconds** ("Put waste on the flap...").
- The person puts their waste on the flap inside. The ultrasonic sensor above the flap notices it straight away.
- If nothing is put down in time: **"No waste seen, No points given"**.

### Step 3: recognising the waste
- The ESP32 waits 1.5 s for the item to settle, then reads the moisture sensor under it.
- At power-on the station measured the dry, empty flap. If the reading now drops well below that, the waste is **wet** (food, peels); otherwise it is **dry** (paper, plastic).
- (A backup version, `EcoStation_Main_Camera`, uses an ESP32-CAM and AI instead.)

### Step 4: sorting
- The ESP32 first checks that the target bin isn't completely full.
- The servo tilts the flap **left for wet** or **right for dry**, then returns to the centre.
- The LCD shows e.g. **"Detected: WET → Wet bin"**.

### Step 5: reward points
- The ESP32 adds **+10 points** to the user's account in Firebase.
- The LCD shows **"+10 points! Total: 160"**, and a "reward" entry goes to the website's log.

### Step 6: checking how full the bins are
- Each ultrasonic sensor sends a sound pulse down into its bin and times the echo. A shorter time means the waste is closer, so the bin is fuller.
- The distance becomes a percentage. For a 40 cm deep bin, 40 cm away is 0% and 5 cm away is 100%.
- The levels are:
  - shown on the LCD: `Wet:45% Dry:80%`
  - sent to Firebase after every item and every 15 seconds
- At **90%**, an **alert** goes to the Authority Portal saying the bin should be emptied.

## 4. The camera backup (AI training)
Only for the backup build `EcoStation_Main_Camera`. The main build uses the moisture sensor instead and needs no training.

- **Where:** the model is trained on Google's **Teachable Machine** website, with no coding.
- **How:**
  1. Take many photos of wet waste (food, peels) and dry waste (paper, plastic), ideally with the ESP32-CAM itself.
  2. Upload them into two classes, **Wet** and **Dry**, and click **Train**.
  3. Export the model as **Keras**, which gives `keras_model.h5` and `labels.txt`.
- **Running it:** put the two files next to `app.py` and run `python app.py`. It prints the address the camera should send photos to.

## 5. The database (Firebase)
The ESP32 and the website both read and write the **same Firebase Realtime Database**, so any change shows up everywhere instantly. It holds three main things:

| Location | What's stored | Who writes it |
|---|---|---|
| `/users/{cardUID}` | name and points | Website (registering cards), ESP32 (adding points) |
| `/bins/STATION-01` | wet % and dry % fill levels | ESP32 |
| `/logs` | events: scans, rewards, alerts, with the time | ESP32 and the website |

## 6. The website

### Public section
- Explains the project and how it works.
- **Points checker:** type your card number to see your name, points, rank and roughly how many items you've recycled.

### Authority Portal (PIN protected)
- **Register new cards:** enter a card UID and a name, and that card can then unlock the station.
- **Adjust points:** manually add or remove points for any card.
- **Bin monitoring:** live bars showing each bin's fill level. They turn orange at 75% and red at 95%, and an alert banner appears when a bin is full.
- **Live event log:** the latest 20 scans, rewards and alerts, as they happen.

## 7. The complete flow

```
RFID card → Main ESP32 → checks Firebase → registered? → "Put waste in"
                                                        ↓
             waste put on flap → ultrasonic #3 sees it → moisture sensor → WET / DRY
                                                        ↓
             Servo sorts waste → +10 points in Firebase → LCD shows total
                                                        ↓
     Ultrasonic sensors → fill % → LCD + Firebase → Website Authority Portal
```

## 8. Where the files are

| Folder | Contents |
|---|---|
| `Desktop\eco station\Nyrc` | The website (`smart eco station.html`) |
| `D:\NYRC 2627\EcoStation_Main` | Main ESP32 code (C++), moisture sensor build |
| `D:\NYRC 2627\EcoStation_Main_Camera` | Backup: main ESP32 code for the camera build |
| `D:\NYRC 2627\EcoStation_Cam_Server` | ESP32-CAM code for the Teachable Machine version |
| `D:\NYRC 2627\ClassifierServer` | Python AI server (`app.py`) |
| `D:\NYRC 2627\EcoStation_Cam` | Backup option: AI running on the camera itself (Edge Impulse) |

## 9. Why it's useful
- **Cleaner recycling:** wet and dry waste are separated automatically, so there's no human mistake.
- **Motivation:** reward points make people want to use it.
- **Faster emptying:** authorities get an alert and empty bins before they overflow.
- **Responsible use:** only registered users can open the lid.
