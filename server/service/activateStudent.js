const axios = require('axios');

const {errorTranslator} = require('../util/errorTranslator');

const activateStudent = async(studentEmail) => {

    const {STUDENT_SERVICE, STUDENT_SERVICE_PORT} = process.env;
    const StudentServiceURL = `http://${STUDENT_SERVICE}:${STUDENT_SERVICE_PORT}/student/activate/${studentEmail}`;
    const {ADMIN_KEY} = process.env;

    try {
        await axios.post(StudentServiceURL, {}, {
            headers: {'x-auth': ADMIN_KEY}
        });
    } catch (error){
        errorTranslator(error);
    }
};

module.exports = {
    activateStudent
};