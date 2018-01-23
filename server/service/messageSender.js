const axios = require('axios');

const {errorTranslator} = require('../util/errorTranslator');

const messageSender = async (student_email, message_title, message_body, message_type) => {

    const {MESSAGING_SERVICE, MESSAGING_SERVICE_PORT} = process.env;
    const MessagingServiceURL = `http://${MESSAGING_SERVICE}:${MESSAGING_SERVICE_PORT}/message`;
    const {ADMIN_KEY} = process.env;

    try {
        await axios.post(MessagingServiceURL, {student_email, message_title, message_body, message_type}, {
            headers: {'x-auth': ADMIN_KEY}
        });
    } catch (error) {
        errorTranslator(error)
    }
};

module.exports = {
    messageSender
};
