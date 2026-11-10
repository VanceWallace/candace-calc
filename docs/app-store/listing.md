# CandaceCalc: App Store listing (iOS)

Copy-ready text for App Store Connect. Character counts are checked against Apple's limits.

## App information

| Field | Value | Limit |
|---|---|---|
| Name | CandaceCalc: Tape Calculator | 28 / 30 |
| Subtitle | Retro printing calculator | 25 / 30 |
| Primary category | Utilities | |
| Secondary category | Finance | |
| Bundle ID | com.glassandwater.candacecalc (from app.json) | |
| Price | Free (your call) | |
| Copyright | 2026 Vance Wallace | |

## Promotional text (170 max, can change any time without review)

A calculator that prints like the office classics. Every sum lands on a paper tape you can scroll back through, with big keys and a bright amber display.

(153 characters)

## Keywords (100 max, comma-separated, no spaces)

adding machine,receipt,paper,vintage,history,big buttons,large,senior,checkbook,budget,office,tally

Words already in the name and subtitle (tape, calculator, retro, printing) are left out, because Apple indexes those fields already.

## Description (4,000 max)

CandaceCalc is a calculator built like the printing calculators that sat on office desks in the 1980s. Every calculation prints onto a paper tape, so you can always see what you added, what you subtracted, and what it came to.

BIG, CLEAR, EASY TO READ
• Large keys you can press without hunting
• A bright amber display that's easy to read at a glance
• Results shown to the cent, so totals look like money

A TAPE THAT REMEMBERS
• Each calculation prints with the date and time, and how long ago it was
• Scroll back through your tape to find an earlier total
• Keep history for 30, 60 or 90 days. Older entries clear themselves

FIX MISTAKES THE OLD-FASHIONED WAY
• Pressed the wrong number? AC tears it off the tape and the total keeps going
• Press = again to reprint a result
• Undo your last step

MAKE IT YOURS
• Light beige or dark charcoal calculator
• Put the paper in the center, or to the left or right
• Key clicks and printer sounds, or silence
• Show or hide dates on the tape

PRIVATE BY DESIGN
Your calculations stay on your phone. CandaceCalc doesn't collect, track or share any data. No account, no ads.

Good for balancing a checkbook, adding up receipts, splitting a bill, or any time you want to see your work.

## What's New (version 1.0.0)

The first release of CandaceCalc.

## App Privacy (the "nutrition label" questionnaire)

- Do you or your third-party partners collect data from this app? **No.**
- Result shown on the store page: **Data Not Collected.**
- This holds as long as the app keeps storing history only on the device and adds no analytics, crash-reporting or ad SDKs. Revisit it if that changes.

## Age rating

Answer **None** to every content question. Expected rating: **4+**.

## URLs

| Field | Value |
|---|---|
| Privacy Policy URL (required) | Host `privacy.html` and paste its address here (see below) |
| Support URL (required) | The same page works; its support section lists vancito12@hotmail.com |
| Marketing URL (optional) | Leave blank, or glassandwater.com |

## App Review notes

CandaceCalc is a standalone calculator with no sign-in and no network features. Calculations are kept on the device only. To see the main features: enter 47.50 + 12.50 and press = to print a result to the tape; type a number and press AC to see it torn from the tape while the running total continues; tap SETTINGS to change paper position, color, sounds and history length.

## Export compliance

`usesNonExemptEncryption: false` is already set in app.json, so App Store Connect won't ask for encryption documents.

## Screenshots

Upload the captioned set in this order (iPhone 6.9" at 1320 × 2868 and iPhone 6.3" at 1206 × 2622):

1. Every sum prints on paper tape
2. Tear off the mistakes
3. Light or dark, like the classics
4. Set it up your way

## Before you submit

- [ ] Replace `assets/icon.png` and `assets/splash-icon.png` with the new files
- [x] Set `ios.supportsTablet` to `false` in app.json (done; iPhone-only for 1.0, so no iPad screenshots are needed)
- [x] Support email filled in on `privacy.html` (vancito12@hotmail.com)
- [ ] Host `privacy.html` at a public address and paste it into both URL fields
- [ ] Build with `eas build --platform ios --profile production` and test the build in TestFlight
