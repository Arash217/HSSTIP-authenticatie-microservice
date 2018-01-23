const {NotFoundError, AuthorizationError, ValidationError, NotActivatedError} = require('../util/errors');

const errorhandler = (error, req, res, next) => {
    console.log(error);
    switch (error.name){
        case AuthorizationError:
            res.status(401).send(error);
            break;
        case NotActivatedError:
            res.status(403).send(error);
            break;
        case NotFoundError:
            res.status(404).send(error);
            break;
        case ValidationError:
            res.status(422).send(error);
            break;
        default:
            res.status(400).send(error);
    }
};

module.exports = {
    errorhandler
};