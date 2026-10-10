**Title:** Finalize firmware: fix points reset bug, block empty-flap rewards, Firebase boot check

## Summary
- **Points reset bug fixed.** `addPoints` read the balance and wrote balance + 10. If the read failed (bad Wi-Fi), it overwrote the user's balance with 10. Points are now added with a Firebase server-side increment, the same way the website's manual adjustment works.
- **No points for an empty flap.** `app.py` maps an `Empty` Teachable Machine class to `NONE`, and the main ESP32 also treats results below 60% confidence as "no item". The flap isn't moved, no points are given, and the attempt is logged.
- **Camera errors are handled immediately** instead of waiting out the 8 s timeout.
- **Firebase boot check:** the LCD shows "Firebase OK" or "Firebase FAILED" at startup.
- **Wi-Fi reconnect throttled** to every 10 s on both boards (it was called on every loop).
- **Model warm-up** in `app.py`, so the first item doesn't time out on the ESP32.
- **Folder layout:** sketches are moved into same-named folders (`EcoStation_Main/EcoStation_Main.ino`, …), which the Arduino IDE requires and the README already described.
- README updated (Empty class, Firebase rules, boot check).

## Testing
- `app.py` passes a Python syntax check.
- Firebase URL and data paths checked against the website. The live database responds; `/logs` currently denies reads, so the rules need updating for the portal's event log.
- **Not yet done:** the sketches haven't been compiled here. Verify both in the Arduino IDE before flashing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
