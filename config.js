// ============================================
// ⚙️ BOT CONFIGURATION
// ============================================

const getSudoNumbers = () => {
    if (!process.env.SUDO_NUMBERS || process.env.SUDO_NUMBERS.trim() === "") {
        return ["923053956147", ""];
    }
    return process.env.SUDO_NUMBERS.split(',')
        .map(num => num.trim())
        .filter(num => num !== '');
};

module.exports = {
    bot: {
        name: process.env.BOT_NAME || "Muzammil MD",
        prefix: process.env.BOT_PREFIX || ".",
        mode: process.env.BOT_MODE || "public"
    },
    admin: {
        sudoNumbers: getSudoNumbers(),
        maxAdmins: 5
    },
    session: {
        savePath: process.env.SESSION_PATH || "./auth_info",
        autoSave: true
    },
    security: {
        antiSpam: process.env.ANTI_SPAM === "true" || true,
        maxMessageRate: 10
    },
    notifications: {
        enabled: process.env.NOTIFICATION_ENABLED === "true" || true,
        alertOnNewUser: true
    }
};
