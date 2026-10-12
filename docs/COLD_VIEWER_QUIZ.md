# Cold-Viewer Comprehension Quiz

This test verifies that someone with **no prior cybersecurity knowledge** can accurately answer these 5 core questions after watching the 3-minute Story walkthrough.

---

### Question 1: What is the main security problem this system solves?
**Plain English Answer:**
Traditional access control checks each request on its own. When an employee's password is stolen, an intruder can slowly copy sensitive customer data a little at a time without any single download looking abnormal.
- *Where this is taught in the demo:* **Chapter 2 ("The Problem")** — shows the intruder downloading files while traditional checks approve every request and the red leak meter fills to 100%.

---

### Question 2: What does the exposure allowance do?
**Plain English Answer:**
It acts like a daily spending limit for sensitive data. Each request drains the allowance based on data volume and suspicion, and the allowance refills slowly over time like a recharging battery.
- *Where this is taught in the demo:* **Chapter 3 ("Idea 1: An Exposure Allowance")** — demonstrates the allowance bar draining on sensitive requests and recharging at a steady rate.

---

### Question 3: Who can overrule the AI?
**Plain English Answer:**
A mathematical safety check inspects every suggestion from the AI. If the AI suggests an action that breaks company policy or exceeds the daily allowance, the safety check immediately overrules it and forces a safe action.
- *Where this is taught in the demo:* **Chapter 5 ("Idea 3: A Safety Check That Cannot Be Fooled")** — shows the interactive safety check flashing red with an "OVERRULED" badge when the AI suggests granting access with an empty allowance.

---

### Question 4: Did the system ever break company rules during testing?
**Plain English Answer:**
Zero times. With the safety check enabled, the system achieved a 0.00% policy violation rate across all 29,064 evaluated decisions. Without the safety check, an unguarded AI broke compliance rules.
- *Where this is taught in the demo:* **Chapter 6 ("Head-to-Head Comparison")** and **Results Page ("Question 3: Did the system ever break company rules?")**.

---

### Question 5: Where does the system struggle or fall short?
**Plain English Answer:**
1. In sudden massive downloads (burst attacks), a simple fixed rule stopped attacks just as well as the AI without needing any training.
2. If an attacker spaces downloads slower than the allowance refill rate, data can still slowly leak over months.
3. Allowances track individual accounts, so coordinating 50 separate stolen accounts requires cross-account clustering.
4. All results are from a synthetic benchmark simulator, not live company networks.
- *Where this is taught in the demo:* **Chapter 9 ("Where It Struggles")** and the **Limitations Box** on the Results page.
