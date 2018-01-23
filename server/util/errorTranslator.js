const {AuthorizationError, UnexpectedError} = require('../util/errors');
const {createErrorMessage} = require('../util/errorCreator');

const errorTranslator = (error) =>  {

    const errorMessage = "Er is iets fout gegaan. Probeer het later opnieuw";

    if (!error.response) {
        throw createErrorMessage(UnexpectedError, errorMessage);
    }

    switch (error.response.status){
        case 401:
            throw createErrorMessage(AuthorizationError, errorMessage);
    }
};

module.exports = {
    errorTranslator
};