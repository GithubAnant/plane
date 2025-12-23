# ✈️ Paper Plane Game

![Paper Plane Game](./image.png)

> tilt your phone, fly a paper plane through a desert. don't crash into stuff. that's it.

![controls](https://img.shields.io/badge/controls-gyroscope-blue)
![platform](https://img.shields.io/badge/platform-browser-green)

---

## how it works

your phone becomes the controller — tilt it to steer the plane. gyroscope data streams to your desktop over websockets. no apps, just browsers talking to browsers.

1. open the game on desktop
2. scan the QR code with your phone
3. tilt to fly
4. crash. repeat.

---

## running this thing
> ⭐ [star the repo](https://github.com/GithubAnant/plane) — it makes game smoother (seriously)!

```bash
npm install
npm run dev
```


### https is required

gyroscope API only works on HTTPS. use ngrok to tunnel your local server:

<details>
<summary><b>macOS</b></summary>

```bash
brew install ngrok
```
</details>

<details>
<summary><b>Windows</b></summary>

```bash
choco install ngrok
```
or download from [ngrok.com](https://ngrok.com/download)
</details>

<details>
<summary><b>Linux</b></summary>

```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```
</details>

then run:
```bash
ngrok http 5173
```

use the ngrok HTTPS url on your phone. localhost works fine for desktop.

press **A** on your phone to calibrate and start.

---

## stack

| what | why |
|------|-----|
| three.js | 3D rendering |
| rapier | physics & collisions |
| partykit | websocket sync between devices |
| device orientation API | phone gyroscope |
| blender | made the plane model |

---

## want to understand the code?

full architecture breakdown, data flows, and file-by-file documentation:

📖 **[read the codebase docs](./opus-docs/CODEBASE_DOCUMENTATION.md)**

---

## credits

original inspiration from [mustache-dev/fishing-app](https://github.com/mustache-dev/fishing-app)
