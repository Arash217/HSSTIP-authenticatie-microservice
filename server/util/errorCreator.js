const createErrorMessage = (error, message) => {
    return {
        name: error,
        message
    }
};

module.exports = {
    createErrorMessage
};