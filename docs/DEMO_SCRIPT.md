# 3-Minute Presenter Script: Mission Control Zero-Trust Demo

This printable cheat sheet guides a 3-minute presentation for non-technical leadership, professors, or recruiters. Every phrase is in plain English with zero unexplained acronyms.

---

## Quick Setup
1. Launch the web server:
   ```bash
   .venv\Scripts\python -m ztarb.service.app
   ```
2. Open `http://localhost:8000` in your browser.
3. Verify top bar shows **Plain English** mode (press `T` to toggle if needed).
4. Click **Presenter** button in the top right (or press `N` for speaker notes).
5. Keyboard shortcuts during presentation:
   - `Space` or `→` (Right Arrow): Next chapter / slide beat
   - `←` (Left Arrow): Previous chapter
   - `N`: Toggle speaker notes overlay
   - `T`: Toggle Plain English vs. Technical view

---

## 3-Minute Script Beat-by-Beat

### Beat 0: The Hook & Landing Page (0:00 - 0:30)
- **What to click**: Start at Landing Page (`/` or click brand logo).
- **What to show**: Big headline *"Stop slow data theft without locking everyone out."*
- **What to say**:
  > *"Thank you for your time. Traditional security access control has a critical blind spot: it checks each request in isolation. If an employee has permission to view customer files, traditional security approves every single request—even if an attacker has stolen the password and is quietly copying files one by one. Our project introduces a running daily 'exposure allowance' for every user, uses an AI to choose the gentlest safe response, and enforces a strict safety check so the AI can never break company rules."*

---

### Beat 1: The Problem — Stolen Password (0:30 - 1:00)
- **What to click**: Click **"1. The Problem"** card (or advance to Chapter 2).
- **What to show**: The Intruder downloading customer data while Traditional Access Control approves every request. The red leak meter fills to 100%.
- **What to say**:
  > *"Here is the problem in action. Priya is a finance analyst with valid access to customer databases. An intruder steals her credentials and downloads small files every few minutes. Notice the red leak meter filling to 100%. Every single request was individually allowed, yet the entire database walked out the door."*

---

### Beat 2: Idea 1 & 2 — Allowance & AI Graduated Responses (1:00 - 1:30)
- **What to click**: Advance to Chapter 3 & 4.
- **What to show**: The Daily Exposure Allowance bar draining as sensitive files are accessed, and the 5 graduated responses card.
- **What to say**:
  > *"Our first idea is a daily exposure allowance—like a daily spending limit for sensitive data. It drains when sensitive files are accessed and refills slowly over time. Instead of abruptly locking users out, an AI selects from five graduated options: letting routine work through, asking the user to verify identity with two-factor authentication, or granting a limited preview."*

---

### Beat 3: Idea 3 — The Safety Check (1:30 - 2:00)
- **What to click**: Advance to Chapter 5.
- **What to show**: Click **"Trigger Safety Overrule Demo"**. Watch the red flash and "OVERRULED" badge appear.
- **What to say**:
  > *"Can an AI be trusted with security? No. That is why our system has an uncompromising mathematical safety check. When the AI suggested letting a request through, the safety check detected that the daily allowance was exhausted. It instantly overruled the AI and blocked the request. The AI can only pick options company policy permits—it can never grant itself more access."*

---

### Beat 4: Head-to-Head Proof (2:00 - 2:30)
- **What to click**: Advance to Chapter 6.
- **What to show**: Head-to-head comparison bars. Traditional RBAC (0.48 GB, 100%) vs. Our System (0.12 GB, 25%).
- **What to say**:
  > *"Here is the empirical head-to-head proof. Under the exact same stealthy attack, traditional access control and fixed rules leaked 100% of the target data. Our system cut data theft by 75%, allowing only 0.12 GB before clamping down, while achieving a 0.00% rule violation rate across all 29,064 evaluated decisions."*

---

### Beat 5: Honest Limitations & Wrap-Up (2:30 - 3:00)
- **What to click**: Advance to Chapter 9 ("Where It Struggles") and click **Results** tab.
- **What to show**: Limitations box and Three Big Questions scorecard.
- **What to say**:
  > *"Where does the system fall short? In sudden burst downloads, a simple fixed rule stopped attacks just as well as the AI without needing training. And if an attacker waits hours between downloads, data can still slowly leak over months. But for stealthy insider theft, running exposure allowances provide verifiable protection without disrupting normal users. All results are from a synthetic benchmark. Thank you!"*

---

## Presenter Q&A Prep

| Question | Short Plain-English Answer |
| :--- | :--- |
| **Why not just lock the account after 3 downloads?** | Because normal employees like Priya often view 50 files a day. False alarms paralyze business operations. Our AI uses identity prompts and limited previews instead of blunt lockouts. |
| **What happens if the AI makes a mistake?** | The deterministic safety check acts as a supervisor. If the AI suggests any action outside company rules or exceeding budget, the safety check overrules it. In 29,064 tests, zero policy violations occurred. |
| **Does this work for multiple coordinated attackers?** | Allowances currently track individual accounts. Coordinating 50 stolen accounts requires cross-account identity clustering, which is our next planned research extension. |
