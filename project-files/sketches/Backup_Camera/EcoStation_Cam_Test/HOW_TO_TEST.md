# ESP32-CAM tester: how to use

Tests the camera and your Edge Impulse model on their own.
**Serial Monitor speed for this tester: 9600 baud.**

## The 3 boards, in plain words

| Board | What it is | Used for the tester? |
|---|---|---|
| **ESP32-CAM** (AI Thinker) | The board with the camera on it. Runs the model. | **Yes** |
| **CAM-MB** | Small board with a USB port. The ESP32-CAM plugs on top of it. It is only a USB cable adapter for uploading and seeing Serial messages. | **Yes** (to connect the CAM to the laptop) |
| **ESP32 DevKit** (main ESP32) | The station's main brain: RFID, servo, LCD, sensors, Wi-Fi. | **No.** Leave it out for this test. |

So for this test you only need: **ESP32-CAM on top of the CAM-MB, USB cable to the laptop.** No other wires.

## 1. Wiring for the test
1. Push the ESP32-CAM onto the CAM-MB (camera facing up, pins all the way in).
2. Plug a USB cable from the CAM-MB to the laptop. That's all. The USB powers it too.

No CAM-MB? Use a USB-TTL adapter instead:

| USB-TTL | ESP32-CAM |
|---|---|
| 5V  | 5V  |
| GND | GND |
| TX  | U0R (GPIO3) |
| RX  | U0T (GPIO1) |

Plus a jumper wire from **GPIO0 to GND** only while uploading.

## 2. Add the library (once)
1. Arduino IDE: **Sketch > Include Library > Add .ZIP Library...**
2. Pick the Edge Impulse zip from Downloads (`ei-shivali-project-2-arduino-....zip`).
3. If your zip has a different project name, change line 28 of the sketch to
   `#include <YourProjectName_inferencing.h>`.

## 3. Board settings (Tools menu)
- Board: **AI Thinker ESP32-CAM**
- PSRAM: **Enabled** (if shown)
- Port: the COM port that appears when you plug in the CAM-MB

## 4. Upload
- **CAM-MB:** press Upload. If it gets stuck at `Connecting....`, hold **IO0**, tap **RST**, let go of IO0.
- **USB-TTL:** GPIO0 wire to GND, press **RST**, press Upload. When it says `Done uploading`,
  remove the GPIO0 wire and press **RST** again.

The first build takes a few minutes (the model is big). That is normal.

## 5. Read the results
Open **Serial Monitor**, set the speed (bottom right) to **9600 baud**, press **RST** on the board. You should see:

```
[1] PSRAM and camera...
  PSRAM OK
  Camera OK
[2] Capture check...
  Photo: 320x240, JPEG 9000 bytes
  Brightness: 120 / 255  -> OK
--- Test #1 ---
  dry       91.0 %
  wet        9.0 %
  >>> RESULT: dry (91%)
```

Hold wet and dry items in front of the camera and watch the result change.
Type `f` + Enter to switch the flash off/on, `p` + Enter to pause.

## How the boards fit in the real station

- **Station you use now (`EcoStation_Main`, moisture sensor):** no camera at all.
  Only the ESP32 DevKit is used. The ESP32-CAM and CAM-MB are not needed.
- **Camera backup (`EcoStation_Main_Camera` on the DevKit + `EcoStation_Cam` on the CAM):**
  1. Upload `EcoStation_Cam` to the CAM while it sits on the CAM-MB (same as above).
  2. Take the CAM **off** the CAM-MB. The CAM-MB is not part of the station.
  3. Wire the CAM to the DevKit and the 5 V rail:

     | ESP32-CAM | Connect to |
     |---|---|
     | 5V | LM2596 5 V rail |
     | GND | common GND (same as DevKit GND) |
     | U0T (GPIO1) | DevKit **GPIO 16** (RX2) |
     | U0R (GPIO3) | DevKit **GPIO 17** (TX2) |

  4. To upload to the CAM again later, unplug the GPIO1/GPIO3 wires and put it back on the CAM-MB.
  Full station wiring is in `WIRING_CAMERA.md`.

Note: the tester uses 9600 baud. The real camera sketches (`EcoStation_Cam` and
`EcoStation_Main_Camera`) still talk to each other at 115200, so don't change those.

## If something fails
- **Garbage characters in Serial Monitor**: speed is not set to 9600.
- **no PSRAM**: PSRAM is not enabled, or the wrong board is selected.
- **Camera did not start (0x105 / 0x20004)**: reseat the ribbon cable, use a good 5V supply.
- **Brightness very dark**: lens cap still on, or ribbon loose.
- **Brownout / keeps restarting**: weak USB power. Try another cable or port.
- **`..._inferencing.h: No such file`**: library not added, or the #include name is wrong (step 2).
