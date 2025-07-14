/*

  !- ©ᴍᴀʟᴠɪɴ-dev
  https://wa.me/263714757857
  
*/

require("./all/global")
const func = require("./all/place")
const readline = require("readline")
const chalk = require('chalk')
const CFonts = require('cfonts')
const { getBuffer } = require('./all/myfunc')
const NodeCache = require("node-cache")
const msgRetryCounterCache = new NodeCache()
const yargs = require('yargs/yargs')
const _ = require('lodash')
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Initialize Express for web interface
const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static('public'))

// Store active sessions
const sessions = new Map()

// Create sessions directory
const sessionsDir = './sessions'
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir)
}

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    console.log(chalk.red(`Script by * dev| malvin*, wa 263714757857`))
    console.log(chalk.cyan(`Please wait...`))
    return new Promise((resolve) => {
        rl.question(text, resolve)
    })
}

async function startSesi(sessionId, phoneNumber = null, isWebRequest = false) {
    const sessionPath = path.join(sessionsDir, sessionId)
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !isWebRequest,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
                return msg?.message || undefined
            }
            return {
                conversation: 'dev|malvin'
            }
        }
    }

    const Nano = func.makeWASocket(connectionOptions)
    
    // Store session info
    sessions.set(sessionId, {
        sock: Nano,
        store: store,
        phoneNumber: phoneNumber,
        status: 'connecting'
    })

    // Handle pairing code for web requests
    if (isWebRequest && phoneNumber && !Nano.authState.creds.registered) {
        const code = await Nano.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''))
        sessions.get(sessionId).pairingCode = code
        return code
    }

    // Handle pairing code for console
    if (!isWebRequest && !Nano.authState.creds.registered) {
        var phoneNumber = await question(chalk.black(chalk.bgCyan(`\nENTER BOT NUMBER STARTING WITH COUNTRY CODE 263xxx: \n`)))
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        var code = await Nano.requestPairingCode(phoneNumber.trim())
        console.log(chalk.black(chalk.bgCyan(`Code:`)), chalk.black(chalk.bgWhite(code)))
        sessions.get(sessionId).phoneNumber = phoneNumber
    }

    Nano.ev.on('creds.update', await saveCreds)
    store?.bind(Nano.ev)

    Nano.public = global.public

    async function start() {
        Nano.newsletterFollow("120363402507750390@newsletter")
    }

    // Message handler - KEEPING YOUR ORIGINAL HANDLER
    Nano.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            m = chatUpdate.messages[0]
            if (!m.message) return
            m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
            if (m.key && m.key.remoteJid === 'status@broadcast') {
                if (global.autoreadsw) Nano.readMessages([m.key])
            }
            if (!Nano.public && m.key.remoteJid !== global.owner + "@s.whatsapp.net" && !m.key.fromMe && chatUpdate.type === 'notify') return
            if (m.isBaileys) return
            if (global.autoread) Nano.readMessages([m.key])
            m = func.smsg(Nano, m, store)
            require("./caxe.js")(Nano, m, store)
        } catch (err) {
            console.log(err)
        }
    })

    // Group participant updates - KEEPING YOUR ORIGINAL HANDLER
    Nano.ev.on('group-participants.update', async (anu) => {
        if (global.welcome) {
            try {
                let metadata = await Nano.groupMetadata(anu.id)
                let participants = anu.participants
                for (let num of participants) {
                    try {
                        ppuser = await Nano.profilePictureUrl(num, 'image')
                    } catch {
                        ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
                    }
                    try {
                        ppgroup = await Nano.profilePictureUrl(anu.id, 'image')
                    } catch {
                        ppgroup = 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60'
                    }

                    ppbuffer = await getBuffer(ppuser)

                    if (anu.action == 'add') {
                        let welcomeMsg = `
╔─────────────────╗
╟       *Welcome!* 👋     
╟   *@${num.split("@")[0]}*  
╚─────────────────╝`

                        let res = generateWAMessageFromContent(
                            anu.id,
                            {
                                orderMessage: {
                                    productId: "Dev 1234",
                                    title: "",
                                    description: "now",
                                    currencyCode: "IDR",
                                    message: welcomeMsg,
                                    priceAmount1000: "91000",
                                    thumbnail: ppbuffer,
                                    surface: "rizaldev",
                                    contextInfo: { mentionedJid: [num] },
                                },
                            },
                            {}
                        )
                        Nano.relayMessage(anu.id, res.message, {})
                    } else if (anu.action == 'remove') {
                        let goodbyeMsg = `
╔─────────────────╗
╟       *Goodbye!* 👋     
╟   *@${num.split("@")[0]}* 
╚─────────────────╝`

                        let res = generateWAMessageFromContent(
                            anu.id,
                            {
                                orderMessage: {
                                    productId: "Dev1234",
                                    title: "",
                                    description: "now",
                                    currencyCode: "IDR",
                                    message: goodbyeMsg,
                                    priceAmount1000: "91000",
                                    thumbnail: ppbuffer,
                                    surface: "rizaldev",
                                    contextInfo: { mentionedJid: [num] },
                                },
                            },
                            {}
                        )
                        Nano.relayMessage(anu.id, res.message, {})
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }
    })

    // Connection state handler - MODIFIED FOR MULTI-SESSION
    Nano.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode
            console.log(color(lastDisconnect.error, 'deeppink'))
            
            // Update session status
            if (sessions.has(sessionId)) {
                sessions.get(sessionId).status = 'disconnected'
            }
            
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(color(`Bad Session File, Please Delete Session and Scan Again`))
                    sessions.delete(sessionId)
                    fs.rmSync(sessionPath, { recursive: true, force: true })
                    break
                case DisconnectReason.connectionClosed:
                case DisconnectReason.connectionLost:
                case DisconnectReason.timedOut:
                    console.log(color('[SYSTEM]', 'white'), color('Connection issue, reconnecting...', 'deeppink'))
                    startSesi(sessionId, sessions.get(sessionId)?.phoneNumber, isWebRequest)
                    break
                case DisconnectReason.connectionReplaced:
                case DisconnectReason.loggedOut:
                    console.log(color(`Device Logged Out`))
                    sessions.delete(sessionId)
                    fs.rmSync(sessionPath, { recursive: true, force: true })
                    return
                case DisconnectReason.restartRequired:
                    console.log(color('Restart Required, Restarting...'))
                    startSesi(sessionId, sessions.get(sessionId)?.phoneNumber, isWebRequest)
                    break
                default:
                    break
            }
        } else if (connection === "connecting") {
            console.log(color(`Session ${sessionId} Connecting . . . `))
            if (sessions.has(sessionId)) {
                sessions.get(sessionId).status = 'connecting'
            }
        } else if (connection === "open") {
            CFonts.say(`whyuxD`, { font: 'block', align: 'left', colors: ['cyan'] })
            console.log(chalk.red(`Session ${sessionId} connected!`))
            
            // Update session status
            if (sessions.has(sessionId)) {
                sessions.get(sessionId).status = 'connected'
            }
            
            // Only send to owner for first/main session
            if (sessionId === 'main') {
                Nano.sendMessage("263776388689@s.whatsapp.net", { text: "Script is now connected... NOTE: Type SETMENU to display the menu settings!" }, {})
            }
            start()
        }
    })

    return Nano
}

// Web API Endpoints
app.post('/api/create-session', async (req, res) => {
    try {
        const { phoneNumber } = req.body
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number required' })
        }

        // Generate unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Create session and get pairing code
        const pairingCode = await startSesi(sessionId, phoneNumber, true)
        
        res.json({
            success: true,
            sessionId,
            pairingCode,
            message: 'Enter this code in WhatsApp'
        })
    } catch (error) {
        console.error('Error creating session:', error)
        res.status(500).json({ error: 'Failed to create session' })
    }
})

app.get('/api/session-status/:sessionId', (req, res) => {
    const { sessionId } = req.params
    const session = sessions.get(sessionId)
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' })
    }
    
    res.json({
        sessionId,
        status: session.status,
        phoneNumber: session.phoneNumber
    })
})

app.get('/api/active-sessions', (req, res) => {
    const activeSessions = Array.from(sessions.entries()).map(([id, session]) => ({
        sessionId: id,
        phoneNumber: session.phoneNumber,
        status: session.status
    }))
    
    res.json({ sessions: activeSessions })
})

// Start web server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(chalk.green(`Web interface running on http://localhost:${PORT}`))
})

// Start main session if running directly
if (require.main === module) {
    console.log(chalk.yellow('Starting main session...'))
    console.log(chalk.cyan('Web interface available at http://localhost:3000'))
    startSesi('main', null, false)
}

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err)
})
