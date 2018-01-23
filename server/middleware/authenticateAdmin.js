const {wrapAsync} = require('../util/wrapAsync');
const {AuthorizationError} = require('../util/errors');
const {createErrorMessage} = require('../util/errorCreator');

const authenticateAdmin = wrapAsync(async (req, res, next) => {
    const token = req.header('x-auth');

    const {ADMIN_KEY} = process.env;

    if (token !== ADMIN_KEY){
        throw createErrorMessage(AuthorizationError, "Admin token is niet geldig")
    }

    next();
});

module.exports = {
    authenticateAdmin
};