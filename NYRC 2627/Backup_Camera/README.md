# Camera backup (not part of the main build)

The station runs **`EcoStation_Main`** (moisture sensor, no camera). Everything in
this folder is a backup in case you ever want to go back to an ESP32-CAM.
You don't need any of it for the competition build.

| Folder | Board | Job |
|---|---|---|
| `EcoStation_Main_Camera/` | ESP32 DevKit | Main sketch where an ESP32-CAM decides wet/dry. Wiring: [WIRING_CAMERA.md](WIRING_CAMERA.md) |
| `EcoStation_Cam/` | ESP32-CAM (AI-Thinker) | **Option A:** classifies wet/dry on the CAM (Edge Impulse model) |
| `EcoStation_Cam_Test/` | ESP32-CAM (AI-Thinker) | Stand-alone tester. Steps: [HOW_TO_TEST.md](EcoStation_Cam_Test/HOW_TO_TEST.md) |
| `EcoStation_Cam_Server/` | ESP32-CAM (AI-Thinker) | **Option B:** sends a photo to `ClassifierServer`, relays WET/DRY |
| `ClassifierServer/` | PC / Raspberry Pi | Flask server running a Teachable Machine model (`python app.py`) |
| `circuit_diagram.svg` | | Old circuit drawing of the camera build |

Flash **either** Option A or Option B onto the ESP32-CAM, not both.

- **Option A (Edge Impulse):** project `shivali-project-2` (labels `wet` and `dry`).
  Deployment → Arduino library → Build, then Sketch > Include Library > Add .ZIP Library.
  Switch on with the flap empty (see WIRING_CAMERA.md 5a and 5b).
- **Option B (Teachable Machine):** put `keras_model.h5` + `labels.txt` (Export →
  Tensorflow → Keras) in `ClassifierServer/`, run `pip install -r requirements.txt`
  then `python app.py`, and copy the URL it prints into `SERVER_URL`. The PC must stay
  on and on the same Wi-Fi as the station.

The camera build was designed for a 12 V adapter and an LM2596 (WIRING_CAMERA.md),
because the ESP32-CAM needs more current than a computer USB port gives.
