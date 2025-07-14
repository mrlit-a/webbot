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
const usePairingCode = true

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    console.log(chalk.red(`Script by * dev| malvin*, wa 263714757857`))
    console.log(chalk.cyan(`Please wait...`))
    return new Promise((resolve) => {
        rl.question(text, resolve)
    })
}

async function startSesi() {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
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

    if (usePairingCode && !Nano.authState.creds.registered) {
        var phoneNumber = await question(chalk.black(chalk.bgCyan(`\nENTER BOT NUMBER STARTING WITH COUNTRY CODE 263xxx: \n`)))
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        var code = await Nano.requestPairingCode(phoneNumber.trim(), "DVMALVIN")
        console.log(chalk.black(chalk.bgCyan(`Code:`)), chalk.black(chalk.bgWhite(code)))
    }

    Nano.ev.on('creds.update', await saveCreds)
    store?.bind(Nano.ev)

    Nano.public = global.public

    async function start() {
        Nano.newsletterFollow("120363402507750390@newsletter")
    }

    // Message handler
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

    // Other utility functions like sendImageAsSticker, sendFile, etc.

    // Group participant updates (welcome/goodbye)
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

    // Connection state handler
    Nano.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode
            console.log(color(lastDisconnect.error, 'deeppink'))
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(color(`Bad Session File, Please Delete Session and Scan Again`))
                    break
                case DisconnectReason.connectionClosed:
                    console.log(color('[SYSTEM]', 'white'), color('Connection closed, reconnecting...', 'deeppink'))
                    break
                case DisconnectReason.connectionLost:
                    console.log(color('[SYSTEM]', 'white'), color('Connection lost, trying to reconnect', 'deeppink'))
                    break
                case DisconnectReason.connectionReplaced:
                    console.log(color('Connection Replaced, Another New Session Opened'))
                    return Nano.logout()
                case DisconnectReason.loggedOut:
                    console.log(color(`Device Logged Out, Please Scan Again`))
                    return Nano.logout()
                case DisconnectReason.restartRequired:
                    console.log(color('Restart Required, Restarting...'))
                    break
                case DisconnectReason.timedOut:
                    console.log(color('Connection TimedOut, Reconnecting...'))
                    break
                default:
                    break
            }
            startSesi()
        } else if (connection === "connecting") {
            console.log(color('Connecting . . . '))
        } else if (connection === "open") {
            CFonts.say(`whyuxD`, { font: 'block', align: 'left', colors: ['cyan'] })
            console.log(chalk.red(`Do not sell this script!`))
            Nano.sendMessage("263776388689@s.whatsapp.net", { text: "Script is now connected... NOTE: Type SETMENU to display the menu settings!" }, {})
            start()
        }
    })

    return Nano
}

startSesi()

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err)
})
