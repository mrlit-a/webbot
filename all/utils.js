const moment = require('moment-timezone');

function timeGreeting() {
    const time = moment().tz('Asia/Makassar').format('HH:mm:ss');
    
    if (time < "05:00:00") {
        return "good morning 🌄";
    }
    if (time < "11:00:00") {
        return "good day 🌅";
    }
    if (time < "15:00:00") {
        return "good afternoon 🌞";
    }
    if (time < "18:00:00") {
        return "good evening 🌇";
    }
    if (time < "19:00:00") {
        return "good dusk 🌆";
    }
    return "good night 🌃";
}

module.exports = { timeGreeting };
