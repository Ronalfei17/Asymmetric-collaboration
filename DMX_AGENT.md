# Real DMX Agent

The web UI sends real-DMX commands through the existing cloud WebSocket. The
computer connected to the ETC Gadget runs `dmx-agent.js`, which receives those
commands and forwards them to the local DMX Bridge at `127.0.0.1:31808`.

## Local verification

Start the relay/web server, the DMX Bridge, and then the agent:

```powershell
npm start
npm run dmx-agent
```

Open `http://127.0.0.1:3000`, select **Real DMX**, enter the actual DMX address,
and move the intensity slider.

## Existing cloud website

Deploy `server.js` and `public/` to the existing website, then run the agent on
the computer connected to the Gadget. Pass the website WebSocket URL as the
last argument:

```powershell
npm run dmx-agent -- wss://YOUR-EXISTING-WEBSITE/ws
```

The browser, headset, and DMX Agent must use the same room. The default room is
`gp9`; override it with `DMX_ROOM` when required.

Optional environment variables:

- `DMX_RELAY_URL`: cloud relay WebSocket URL.
- `DMX_ROOM`: shared room name, default `gp9`.
- `DMX_BRIDGE_URL`: local Bridge URL, default `http://127.0.0.1:31808`.
- `DMX_BRIDGE_TOKEN`: local Bridge token.

The DMX Agent makes an outbound WebSocket connection, so the tablet does not
need the lighting computer's IP address and does not connect to port 31808.
