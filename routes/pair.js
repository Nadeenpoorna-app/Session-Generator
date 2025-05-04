const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const AdmZip = require("adm-zip");
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const megaUploader = require("../utils/megaUploader");
const MESSAGE = process.env.MESSAGE ||  `
🚀 *𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗬* ✅

> 🚫ᴅᴏɴ'ᴛ ꜱʜᴀʀᴇ ᴛʜɪꜱ ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ!!!

✨ *Gɪᴠᴇ ᴀ Sᴛᴀʀ ᴛᴏ Rᴇᴘᴏ Fᴏʀ Cᴏᴜʀᴀɢᴇ* 🌟
https://github.com/Nadeenpoorna-app/NADEEN-MD

🪀 *Fᴏʟʟᴏᴡ Wʜᴀᴛꜱᴀᴘᴘ Cʜᴀɴɴᴇʟ* 🪀
https://whatsapp.com/channel/0029VagN2qW3gvWUBhsjcn3I

👨🏻‍💻 *Cᴏɴᴛᴀᴄᴛ Oᴡɴᴇʀ* 👨🏻‍💻
https://wa.me/94711451319

🎥 *Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 💻
https://youtube.com/@NADEEN-MD

> ▄︻デռǟɖɛɛռ-ʍɖ══━一

🎯 *Nα∂єєη м∂ ву Nα∂єєη Pσσяηα* 🎯
`

const router = express.Router();

async function connectToWhatsApp(sessionPath, res, sessionId, phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.ubuntu("Chrome"),
        mobile: false,
        pairingCode: true,
        version: [2, 2323, 4],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,  // Add timeout for queries
        emitOwnEvents: true           // Enable event emission
    });

    try {
        if (!sock.authState.creds.registered) {
            await delay(1500);
            console.log("📱 Requesting pairing code for:", phoneNumber);
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("🔗 Generated pairing code:", code);

            if (!res.headersSent) {
                res.json({ status: "pair", pairingCode: code });
            }
        }
    } catch (error) {
        console.error("❌ Error generating pairing code:", error);
        if (!res.headersSent) {
            return res.status(500).json({
                status: 'error',
                error: 'Failed to generate pairing code'
            });
        }
        return;
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        console.log('Connection status:', connection);

        if (connection === "open") {
            await delay(10000);
            console.log("✅ Connected via Pair-Code!");
            try {
                await fs.ensureDir(sessionPath);
                await fs.writeJson(`${sessionPath}/creds.json`, state.creds);

                // Create session archive
                      const sessionZipPath = `${sessionPath}.zip`;
                      const zip = new AdmZip();
                      zip.addLocalFolder(sessionPath);
                      zip.writeZip(sessionZipPath);
                      console.log("📦 Session zip created:", sessionZipPath);

                      //Random Mega ID generator
                            function randomMegaId(length = 6, numberLength = 4) {
                      
                              const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                      
                              let result = '';
                      
                              for (let i = 0; i < length; i++) {
                      
                              result += characters.charAt(Math.floor(Math.random() * characters.length));
                      
                                }
                      
                               const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                      
                                return `${result}${number}`;
                      
                                }
                      
                            
                            // Add retry mechanism for Mega upload
            let retries = 3;
            let megaLink;
            while (retries > 0) {
                try {
                    megaLink = await megaUploader(
                        fs.createReadStream(sessionZipPath),
                        `${randomMegaId()}.zip`
                    );
                    break;
                } catch (err) {
                    console.error(`Upload attempt failed, retries left: ${--retries}`);
                    await delay(1000);
                }
            }

            if (!megaLink) {
                throw new Error("Failed to upload session after multiple attempts");
            }
                      
                            // Update global string_session
                            let string_session = megaLink.replace('https://mega.nz/file/', '𝙽𝙰𝙳𝙴𝙴𝙽-𝙼𝙳=');
                      
                            //GET YOUR CREDS.JSON FILE  WITH "https://mega.nz/file/YOUR_SESSION_ID"
                      
                            if (string_session == null) {
                              console.error("❌ Session ID ID is undefined. Please check your connection.");
                          }else{
                            console.log("===================================================");
                            console.log("🔐 Session ID:", string_session);
                            console.log("===================================================");
                          }

                          let user = sock.user.id;

      setTimeout(async () => {
          try {
              let sessionMsg = await sock.sendMessage(user, { 
                  text: `${string_session}`
              });
              await sock.sendMessage(user, { text: MESSAGE } , { quoted : sessionMsg });
              console.log("✅ Session sent to WhatsApp");
          } catch (err) {
              console.error("❌ Failed to send or logout:", err);
          }
      }, 4000);
  } catch (err) {
                console.error("❌ Error after login:", err);
                if (!res.headersSent) {
                    res.status(500).json({
                        status: 'error',
                        error: "Session creation failed"
                    });
                }
            }
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            
            console.log('Connection closed due to:', lastDisconnect?.error?.message);
            
            if (shouldReconnect) {
                console.log('Reconnecting...');
                connectToWhatsApp(sessionPath, res, sessionId, phoneNumber);
            } else {
                console.log('Connection closed permanently');
                if (!res.headersSent) {
                    res.status(500).json({
                        status: 'error',
                        error: "Connection terminated"
                    });
                }
            }
        }
    })

    sock.ev.on("creds.update", saveCreds);
}

// ROUTES
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "pair.html"));
});

router.post("/generate", async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

        if (!formattedPhone || formattedPhone.length < 10) {
            return res.status(400).json({
                status: 'error',
                error: 'Please enter a valid phone number'
            });
        }

        const sessionId = `session-${Date.now()}`;
        const sessionPath = path.join(__dirname, "..", "sessions", sessionId);

        console.log('🚀 Initiating connection for:', formattedPhone);
        await connectToWhatsApp(sessionPath, res, sessionId, formattedPhone);
    } catch (err) {
        console.error("❌ Error:", err);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'error',
                error: "Failed to generate session"
            });
        }
    }
});

module.exports = router;
