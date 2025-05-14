# MokuroDex

<div align="center">
  <img src="public/logo.png" alt="MokuroDex Logo" width="180"/>
  <h3>Self-hosted mokuro's processed manga reader with Anki integration</h3>
</div>

## What is MokuroDex?

MokuroDex is a **self-hosted manga server** (similar to Jellyfin) for reading Mokuro-processed manga on your **local network**. It features a stunning **UI** and powerful Anki integration for japanese learners.

<div align="center">
  <img src="public/preview.png" alt="MokuroDex Demo" width="800"/>
  <p><i>Read manga and study vocabulary at the same time</i></p>
</div>

## ✨ Features

- 🖥️ **Self-hosted server** - host your own manga collection
- 🎨 **Beautiful UI** - clean, responsive interface inspired by MangaDex
- 📖 **Multiple reading modes** - single page, double page, vertical scroll
- 🌓 **Light/dark mode** and customizable reading direction

## 🔤 Language Learning



1. Hover over Japanese text (or tap on mobile) → Text box appears
2. Use Yomichan to look up words directly on the page
3. Add words to Anki with one click
4. **Save images to Anki cards:**
   - Add the full current manga page to your Anki card
   - Or use the built-in cropping tool to select and add just a panel

## 🚀 Quick Setup

```bash
# Install
git clone https://github.com/imhuy105/mokurodex.git
cd mokurodex
npm install

# Run
npm run dev

# Access from your browser
http://localhost:3000
```

## 📂 Manga Directory Setup

Since MokuroDex serves manga files over your network, you need to put your manga in the right place:

```
public/MANGA/
  ├── One Piece/              # Manga name
  │   ├── Volume 01/          # Volume name
  │   │   ├── 001.jpg         # Mokuro-processed images
  │   │   ├── 002.jpg
  │   │   └── ...
  │   ├── volume.mokuro       # Mokuro metadata file
  │   └── ...
  └── Naruto/                 # Another manga
      └── ...
```

**Why this structure?** MokuroDex needs to know where to find your manga files to serve them to browsers on your network.

### Required: Scan Your Library

**After adding manga files, you MUST scan your library to make them appear:**

1. Go to **Settings → Import → Scan Library**
2. Wait for the scan to complete

<div align="center">
  <img src="public/scan.png" alt="Scan Library Screenshot" width="600"/>
  <p><i>The Scan Library feature is required for MokuroDex to recognize your manga</i></p>
</div>

## 📱 Mobile Setup

To read manga and create Anki cards from your phone/tablet:

### 1. On your computer running Anki:

1. Install [Anki](https://apps.ankiweb.net/)
2. Install the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on
3. In Anki: Tools → Add-ons → AnkiConnect → Config
4. Change these settings:
   ```json
   {
     "webBindAddress": "0.0.0.0",
     "webCorsOriginList": ["*"]
   }
   ```
5. Restart Anki

### 2. Set a static IP (recommended):

To avoid changing settings when your IP changes:
- Go to your router (usually http://192.168.0.1 or http://192.168.1.1)
- Find "DHCP Reservation" or "Static IP"
- Add your computer's MAC address and assign it a fixed IP (like 192.168.1.100)

### 3. On your phone:

1. Install Yomichan on your mobile browser
2. Access MokuroDex at `http://[your-computer-ip]:3000`

This lets you read manga on your phone, look up words with Yomichan, and send cards (with images!) to Anki running on your computer.

## License

Open source for personal use only.
