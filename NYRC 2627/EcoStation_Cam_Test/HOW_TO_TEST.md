# ESP32-CAM tester: how to use

Tests the camera and your Edge Impulse model on their own. Nothing else needs to be wired.

## 1. Add the library (once)
1. Arduino IDE: **Sketch > Include Library > Add .ZIP Library...**
2. Pick the Edge Impulse zip from Downloads (`ei-shivali-project-2-arduino-....zip`).
3. If your zip has a different project name, change line 28 of the sketch to
   `#include <YourProjectName_inferencing.h>` (look in File > Examples to see the exact name).

## 2. Board settings (Tools menu)
- Board: **AI Thinker ESP32-CAM**
- PSRAM: **Enabled** (if shown)
- Port: your COM port

## 3. Upload
**With the CAM-MB board (the small USB board under the camera):** plug in USB, press Upload.
If it gets stuck at `Connecting....`, hold **IO0**, tap **RST**, let go of IO0.

**With a USB-TTL adapter:**

| Adapter | ESP32-CAM |
|---|---|
| 5V  | 5V  |
| GND | GND |
| TX  | U0R (GPIO3) |
| RX  | U0T (GPIO1) |

1. Put a jumper wire from **GPIO0 to GND** (upload mode).
2. Press **RST** on the camera, then press Upload.
3. When it says `Done uploading`, **remove the GPIO0 wire** and press **RST** again.

The first build takes a few minutes (the model is big). That is normal.

## 4. Read the results
Open **Serial Monitor at 115200 baud**. You should see:

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

## If something fails
- **no PSRAM**: PSRAM is not enabled, or the wrong board is selected.
- **Camera did not start (0x105 / 0x20004)**: reseat the ribbon cable, use a good 5V supply.
- **Brightness very dark**: lens cap still on, or ribbon loose.
- **Brownout / keeps restarting**: weak USB power. Try another cable or port.
- **`..._inferencing.h: No such file`**: library not added, or the #include name is wrong (step 1).
