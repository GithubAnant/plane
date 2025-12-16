# ✈️ Paper Plane Game

tilt your phone, fly a paper plane through a desert. don't crash into stuff. that's it.

## how it works

your phone becomes the controller - tilt it to steer the plane. the gyroscope data gets sent to your desktop via websockets and boom, you're flying.

## running this thing

```bash
npm install
npm run dev
```

**important:** gyroscope only works on HTTPS. download ngrok first:

**macOS:**
```bash
brew install ngrok
```

**Windows:**
```bash
choco install ngrok
```
or download from [ngrok.com](https://ngrok.com/download)

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

then run:
```bash
ngrok http 5173
```

use the ngrok HTTPS url on your phone, otherwise the gyroscope won't work. localhost is fine for desktop.

press **A** on your phone to calibrate and start. tilt to fly. crash. repeat.

## stack

three.js for 3D, rapier for collisions, partykit for phone-to-desktop sync, your phone's gyroscope for controls. made the plane model in blender cause why not.
