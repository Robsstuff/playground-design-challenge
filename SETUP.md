# Google Sheets Setup — Step-by-Step

Follow these steps once to connect the voting website to Google Sheets.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it **Playground Votes**.
3. Rename the first sheet tab to **Votes** (right-click the tab → Rename).
4. Add these headers and data in row 1 and rows 2–36:

```
A          B                           C      D
ID         Name                        Likes  Money
1          Beach and Sand Grass Gap    0      0
2          Playground Design 2         0      0
3          Playground Design 3         0      0
4          Playground Design 4         0      0
5          Playground Design 5         0      0
6          Playground Design 6         0      0
7          Playground Design 7         0      0
8          Playground Design 8         0      0
9          Playground Design 9         0      0
10         Playground Design 10        0      0
11         Playground Design 11        0      0
12         Playground Design 12        0      0
13         Playground Design 13        0      0
14         Playground Design 14        0      0
15         Playground Design 15        0      0
16         Playground Design 16        0      0
17         Playground Design 17        0      0
18         Playground Design 18        0      0
19         Playground Design 19        0      0
20         Playground Design 20        0      0
21         Playground Design 21        0      0
22         Playground Design 22        0      0
23         Playground Design 23        0      0
24         Playground Design 24        0      0
25         Playground Design 25        0      0
26         Playground Design 26        0      0
27         Playground Design 27        0      0
28         Playground Design 28        0      0
29         Playground Design 29        0      0
30         Playground Design 30        0      0
31         Playground Design 31        0      0
32         Playground Design 32        0      0
33         Playground Design 33        0      0
34         Playground Design 34        0      0
35         Playground Design 35        0      0
```

---

## Step 2 — Open Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Open the file `google-apps-script.gs` from this repo and **paste its entire contents** into the Apps Script editor.
4. Click **Save** (floppy disk icon or Ctrl+S).

---

## Step 3 — Deploy as Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to **Type** and select **Web app**.
3. Fill in:
   - **Description**: Playground Votes API
   - **Execute as**: Me
   - **Who has access**: **Anyone, even anonymous**
4. Click **Deploy**.
5. Click **Authorize access** and follow the prompts (allow the script to edit your Sheet).
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 4 — Add the URL to the Website

1. Open `config.js` in this repo.
2. Replace `SETUP_REQUIRED` with your Web app URL:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

3. Save the file.

---

## Step 5 — Push to GitHub

```bash
git add config.js
git commit -m "Connect Google Sheets backend"
git push
```

The website will now save all votes to your Google Sheet and display live data on the leaderboard.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Votes not saving | Check the URL in config.js matches exactly what Google gave you |
| "Error" on leaderboard | Make sure the Sheet tab is named exactly `Votes` (capital V) |
| Votes reset after push | You accidentally pushed config.js with SETUP_REQUIRED — re-add your URL |
| Need to update vote counts manually | Open the Sheet and edit the Likes / Money cells directly |
