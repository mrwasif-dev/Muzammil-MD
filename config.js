module.exports = {
    bot: {
        name: process.env.BOT_NAME || "Muzammil MD",
        prefix: process.env.BOT_PREFIX || ".",
        mode: process.env.BOT_MODE || "public"
    },
    sudo: (process.env.SUDO_NUMBERS || "923053956147").split(',').filter(n => n.trim())
};
