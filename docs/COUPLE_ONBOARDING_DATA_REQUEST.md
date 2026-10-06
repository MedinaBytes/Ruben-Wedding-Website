# Ruben & Andrea Wedding Platform — Couple Onboarding & Backend Setup Questionnaire
*Official onboarding guide, content request, and technical questionnaire prepared for Ruben & Andrea*
*Wedding Date: October 2, 2027 · Schloss Hetzendorf, Vienna, Austria*

---

## 1. Executive Summary & Purpose

This document details all the information, credentials, and personalized content required from **Ruben (Groom)** and **Andrea (Bride)** to fully configure the live wedding website, admin console, and automated guest dispatch engines.

The platform is designed to operate on **zero-maintenance, 100% free-tier infrastructure** (Vercel Hobby + Supabase Free + Resend Free). To activate all interactive features without placeholders, please provide the details outlined in the sections below.

---

## 2. Checklist Overview

| Area | Status | Responsible | Required By |
| :--- | :---: | :---: | :---: |
| **1. Service Accounts & API Keys** | Pending | Groom & Bride / Dev | T-12 Months |
| **2. Gift Registry & Banking Details** | Pending | Groom & Bride | T-10 Months |
| **3. Multi-Language Invitation Copy** | Pending | Groom & Bride | T-10 Months |
| **4. Event Schedule & Logistics** | Pending | Groom & Bride | T-8 Months |
| **5. Catering Courses & Menu Choices** | Pending | Groom & Bride | T-6 Months |
| **6. Guest Roster (CSV / Excel)** | Pending | Groom & Bride | T-9 Months (Save the Date) |

---

## 3. Section 1: Service Accounts & Communications Setup

### 3.1 Email Service (Resend API)
The platform uses **Resend** to dispatch royal email invitations featuring the animated wax seal and gold calligraphy.
- **Provider:** [Resend.com](https://resend.com) (Free tier: 3,000 emails/month, 100/day).
- **Items needed from the couple:**
  1. **Resend API Key:** (format: `re_xxxxxxxxxxxxxx`). The developer can create the free account on behalf of the couple, or the couple can generate it at `resend.com/api-keys`.
  2. **Sender Email Address ("From"):**
     - Default during setup: `onboarding@resend.dev`
     - Custom domain (recommended): `invitations@theandyrubenwedding.website` (or `wedding@theandyrubenwedding.website`).
  3. **Sender Display Name:** Usually `"Ruben & Andrea"` or `"Ruben & Andrea | Schloss Hetzendorf"`.

### 3.2 WhatsApp Communication Mode
Invitations can be dispatched via WhatsApp directly to guests' phones. Two modes are supported:
- **Mode A (Zero-Risk Manual wa.me Links — Recommended):**
  - No credentials required! The admin panel generates pre-formatted click-to-chat links (`wa.me/<phone>?text=<encoded_message>`).
  - You simply click "Send on WhatsApp" next to each guest in the admin console. WhatsApp Web or Desktop opens with the personalized message and private link ready.
- **Mode B (Automated Meta Cloud API — Optional):**
  - If you prefer automated sending in the background:
    * Meta WhatsApp Phone Number ID
    * Permanent System User Access Token
    * Approved Meta Message Template

### 3.3 Spotify Playlist
- **Wedding Playlist URL:** Public Spotify playlist link where guests can listen to the couple's wedding preview music or add song requests.
- *Default placeholder:* `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M` (Top Classical)

### 3.4 Official Concierge Contacts
Direct contact information displayed on the website and invitations if a guest needs assistance with travel, dress code, or hotel booking:
- **Concierge Phone / WhatsApp:** (e.g., `+43 660 0000000` or the wedding planner's number)
- **Concierge Email:** (e.g., `wedding@theandyrubenwedding.website` or `ruben.andrea.wedding@gmail.com`)

---

## 4. Section 2: Gift Registry & Financial Payment Channels

The website features an elegant, discreet Gift Registry section. Choose which payment methods to activate and provide the corresponding details:

### 4.1 SEPA Bank Transfer (Austria / EU)
- **Bank Name:** (e.g., `Erste Bank Österreich`, `Bank Austria`, `Raiffeisenlandesbank`)
- **Account Holder Name:** (e.g., `Ruben Quijada & Andrea Müllauer`)
- **IBAN:** (e.g., `AT61 2011 1000 0000 0000`)
- **BIC / SWIFT:** (e.g., `GIBAATWWXXX`)
- **Transfer Reference / Note:** (e.g., `Wedding Ruben & Andrea 2027`)

### 4.2 Revolut
- **Revolut Tag / Username:** (e.g., `@ruben_andrea` or `revolut.me/ruben_andrea`)
- **Display Note:** (e.g., *"Instant fee-free transfer via Revolut"*)

### 4.3 Wise (For International Guests)
- **Wise Email or Revtag:** (e.g., `andrea.ruben@wise.com`)
- **Display Note:** (e.g., *"Recommended for international multi-currency transfers"*)

### 4.4 Traditional Wishing Well Box (Schloss Hetzendorf)
- **Wishing Well Card Note:** Custom message explaining where physical cards / gifts can be placed at the palace.
- *Default text:* *"An imperial wishing well box will be placed at Schloss Hetzendorf during the welcome cocktail for guests who wish to hand-deliver their greeting card."*

---

## 5. Section 3: Personalized Invitation Messages (Multi-Language)

Guests receive digital invitations in their preferred language. Please confirm or customize the text for each of the 4 supported languages:

### 5.1 English (en)
- **Email Subject:** `Royal Wedding Invitation · Ruben & Andrea · Vienna 2027`
- **WhatsApp Message:**
  ```text
  Dear {name},

  Ruben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!

  Please open your personalized digital invitation here:
  {url}
  ```

### 5.2 Español (es)
- **Email Subject:** `Invitación de Boda Real · Ruben y Andrea · Viena 2027`
- **WhatsApp Message:**
  ```text
  ¡Hola {name}!

  Ruben y Andrea te invitan cordialmente a celebrar su boda el 2 de octubre de 2027 en Viena.

  Por favor abre tu invitación digital personalizada aquí:
  {url}
  ```

### 5.3 Deutsch - Österreich (de-AT)
- **Email Subject:** `Einladung zur imperialen Hochzeit · Ruben & Andrea · Wien 2027`
- **WhatsApp Message:**
  ```text
  Liebe/r {name},

  Ruben & Andrea laden dich herzlich ein, ihre Hochzeit am 2. Oktober 2027 in Wien zu feiern!

  Bitte öffne deine persönliche digitale Einladung hier:
  {url}
  ```

### 5.4 Magyar (hu)
- **Email Subject:** `Esküvői Meghívó · Ruben és Andrea · Bécs 2027`
- **WhatsApp Message:**
  ```text
  Kedves {name}!

  Ruben és Andrea szeretettel meghívnak, hogy ünnepeld velük az esküvőjüket 2027. október 2-án Bécsben!

  Kérjük, nyisd meg a személyre szóló digitális meghívódat itt:
  {url}
  ```

---

## 6. Section 4: Event Logistics, Venue & Privacy Controls

### 6.1 Private Residence Address (Gate Control)
The platform includes an optional toggle to show the couple's personal apartment address in Vienna (for close family staying nearby).
- **Show private address on accommodations page?** [ ] YES  [ ] NO (Default: NO — only Palace and Hotels shown)
- **If YES, provide:**
  - Street & House Number: (e.g., `Schönbrunner Schloßstraße 47`)
  - Postal Code & City: (e.g., `1120 Wien, Austria`)
  - Access / Intercom Notes: (e.g., `Buzzer "Ruben & Andrea", 2nd floor`)

### 6.2 Recommended Hotels
List 2 to 4 recommended hotels for international guests:
1. **Luxury / Historic Hotel:** (e.g., *Hotel Sacher Wien* or *Imperial Hotel*)
2. **Close to Palace (Hetzendorf / Schönbrunn):** (e.g., *Austria Trend Hotel Park Royal Palace Vienna*)
3. **Boutique / Mid-range:** (e.g., *Motel One Wien-Hauptbahnhof*)
*(Optional: include any booking discount promo code or booking deadlines).*

### 6.3 Day-of Schedule (October 2, 2027)
Confirm the timing of the day's milestones:
- **14:00** — Guest Arrival & Welcome Refreshment (Palace Courtyard)
- **15:00** — Solemn Marriage Ceremony (Schloss Hetzendorf Chapel)
- **16:30** — Agape & Champagne Reception with Live String Quartet
- **18:30** — Imperial Banquet Dinner in the Baroque Ballroom
- **21:00** — First Dance & Viennese Waltz
- **21:30** — Evening Celebration & DJ
- **00:00** — Midnight Viennese Goulash & Wedding Cake
- **04:00** — Carriages & Event Conclusion

---

## 7. Section 5: Catering Menu Options & Dietary Courses

Guests select their preferred meal during RSVP. Please confirm the menu offerings:

1. **Classic Meat Course:**
   - *Example:* Beef Tenderloin with parsnip purée, glazed baby carrots & red wine jus.
2. **Fish Course:**
   - *Example:* Alpine Trout (Österreichische Bachforelle) with buttered parsley potatoes & lemon emulsion.
3. **Vegetarian Gourmet Course:**
   - *Example:* Creamy Arborio Truffle Risotto with Styrian black truffles & aged parmesan crisp.
4. **Vegan Course:**
   - *Example:* Roasted wild forest mushrooms with herb polenta & seasonal garden vegetables.
5. **Children's Menu:**
   - *Example:* Traditional mini Wiener Schnitzel with homemade potato salad.

---

## 8. Section 6: Bulk Guest Import Template (CSV / Excel)

To generate all personalized URLs, QR codes, and dispatch links in bulk, please prepare a spreadsheet following this exact format.

### 8.1 Column Definitions

| Column Name | Required | Example | Description |
| :--- | :---: | :--- | :--- |
| `display_name` | **YES** | `Familia Quijada Sanchez` | Guest or family name printed on envelope & invitation |
| `email` | Optional | `maria.quijada@example.com` | Guest email for 1-click Resend dispatch |
| `whatsapp` | Optional | `+34612345678` | Full phone number with country code (e.g., `+43`, `+34`, `+36`, `+1`) |
| `language` | **YES** | `es` | Recipient locale: `es`, `en`, `de-AT`, or `hu` |
| `max_guests` | **YES** | `2` | Maximum guest capacity allocated to this party (e.g. 1 to 6) |
| `plus_one_allowed` | **YES** | `true` | Whether the guest is invited with an unnamed companion (`true` or `false`) |
| `group_name` | Optional | `Family Ruben` | Organizational grouping (e.g. `Family Ruben`, `Friends Vienna`, `Bridal Party`) |
| `personal_message` | Optional | `We cannot wait to celebrate with you!` | Private note displayed inside their personal digital stationery |

### 8.2 Sample CSV Data (Copy & Paste into Excel or Notepad)

```csv
display_name,email,whatsapp,language,max_guests,plus_one_allowed,group_name,personal_message
Familia Quijada Sanchez,maria.quijada@example.com,+34612345678,es,4,false,Family Ruben,Nos emociona compartir este viaje y este día con ustedes.
Christian & Guest,christian.weber@example.at,+436641234567,de-AT,2,true,Friends Vienna,Wir freuen uns sehr auf ein unvergessliches Fest mit euch!
Mate Kovacs,mate.kovacs@example.hu,+36301234567,hu,1,false,Friends Hungary,Szeretettel várunk titeket Bécsben!
Sarah Jenkins,sarah.j@example.com,+447911123456,en,2,true,International Friends,Looking forward to celebrating this royal celebration together!
```

> **Important Excel Tip:** When entering phone numbers with `+` in Microsoft Excel, type a single apostrophe `'` first (e.g. `'+436641234567`) so Excel treats it as text and does not delete the plus sign.

---

## 9. Fill-In-The-Blanks Questionnaire (Copy & Return to Dev)

*Ruben & Andrea: You can copy the section below, fill in the blanks, and return it via email, WhatsApp, or Google Doc.*

```markdown
### WEDDING PLATFORM CONFIGURATION FORM

1. GENERAL & CONCIERGE CONTACTS:
- Concierge Contact Phone (with country code): 
- Concierge Contact Email: 
- Spotify Wedding Playlist URL: 

2. GIFT REGISTRY & BANKING:
- Activate Bank Transfer (Yes/No): 
  * Bank Name: 
  * Account Holder: 
  * IBAN: 
  * BIC/SWIFT: 
  * Reference Note: 
- Activate Revolut (Yes/No): 
  * Revolut Tag: 
- Activate Wise (Yes/No): 
  * Wise Email / Tag: 
- Wishing Well Physical Box Note (leave blank for default): 

3. RESIDENCE PRIVACY:
- Show personal home address in Vienna on website? (Yes/No): 
  * Street & Number: 
  * City & Postal Code: 
  * Intercom / Door Notes: 

4. CATERING COURSES (Confirm or replace):
- Classic Meat Course description: 
- Fish Course description: 
- Vegetarian Course description: 
- Vegan Course description: 
- Children's Course description: 

5. SCHEDULE MILESTONES (Confirm or adjust):
- 14:00 Arrival & Welcome Refreshment
- 15:00 Marriage Ceremony
- 16:30 Agape & Champagne Reception
- 18:30 Imperial Banquet Dinner
- 21:00 First Dance & Viennese Waltz
- 00:00 Midnight Snack & Cake
- 04:00 Carriages

6. ATTACHMENTS:
- Attached Guest List Spreadsheet (.csv or .xlsx): [ ] Yes
```
