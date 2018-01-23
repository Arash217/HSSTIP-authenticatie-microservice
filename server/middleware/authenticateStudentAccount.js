const {StudentAccount} = require('./../models/studentAccount');
const {wrapAsync} = require('../util/wrapAsync');
const {AuthorizationError} = require('../util/errors');
const {createErrorMessage} = require('../util/errorCreator');

const authenticateStudentAccount = wrapAsync(async (req, res, next) => {
    const token = req.header('x-auth');

    const studentAccount = await StudentAccount.findByToken(token);

    if (!studentAccount){
        throw createErrorMessage(AuthorizationError, "Invalide token")
    }

    req.studentAccount = studentAccount;
    req.token = token;

    next();
});

module.exports = {
    authenticateStudentAccount
};