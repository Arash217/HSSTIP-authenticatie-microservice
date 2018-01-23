const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');

const {AuthorizationError, NotFoundError, NotActivatedError} = require('../util/errors');
const {createErrorMessage} = require('../util/errorCreator');

const StudentAccountSchema = new mongoose.Schema({
    email: {
        type: String,
        required: "E-mailadres is verplicht",
        trim: true,
        unique: true,
        validate: [/^s[0-9]{7}@student.hsleiden.nl$/, "E-mailadres is niet geldig"]
    },

    wachtwoord: {
        type: String,
        trim: true,
        minlength: [6, 'Wachtwoord is te kort'],
        required: "Wachtwoord is verplicht"
    },

    verificatiecode: {
        type: String
    },

    resetcode: {
        type: String
    },

    actief: {
      type: Boolean,
      default: false
    },

    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

StudentAccountSchema.methods.generateVerificationCode = function () {
    const studentAccount = this;

    const code = crypto.randomBytes(32).toString('hex');
    studentAccount.verificatiecode = code;

    return studentAccount.save().then(() => {
        return code;
    })
};

StudentAccountSchema.methods.generateResetCode = function () {
    const studentAccount = this;

    const code = crypto.randomBytes(32).toString('hex');
    studentAccount.resetcode = code;

    return studentAccount.save().then(() => {
        return code;
    })
};

StudentAccountSchema.methods.generateAuthToken = function () {
    const studentAccount = this;
    const access = 'auth';
    const token = jwt.sign({_id: studentAccount._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    studentAccount.tokens.push({access, token});

    return studentAccount.save().then(() => {
        return token;
    })
};

StudentAccountSchema.methods.removeToken = function (token) {
    const studentAccount = this;

    return studentAccount.update({
        $pull: {
            tokens: {
                token
            }
        }
    })
};

StudentAccountSchema.statics.findByToken = function (token) {
    const StudentAccount = this;
    let decoded;

    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
       return Promise.reject(createErrorMessage(AuthorizationError, "Invalide token"));
    }

    return StudentAccount.findOne({
        actief: true,
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

StudentAccountSchema.statics.findByCredentials = function (email, wachtwoord) {
    const StudentAccount = this;

    return StudentAccount.findOne({email}).then((studentAccount) => {

        if (!studentAccount){
            return Promise.reject(createErrorMessage(NotFoundError, "Account bestaat niet"));
        }

        if (!studentAccount.actief){
            return Promise.reject(createErrorMessage(NotActivatedError, "Account is niet geactiveerd"));
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(wachtwoord, studentAccount.wachtwoord, (err, res) => {
                if (!res){
                    reject(createErrorMessage(AuthorizationError, "Wachtwoord is incorrect"));
                }

                resolve(studentAccount);
            })
        })
    })
};

StudentAccountSchema.pre('save', function (next) {
    const studentAccount = this;

    if(!studentAccount.isModified('wachtwoord')){
        return next();
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(studentAccount.wachtwoord, salt, (err, hash) => {
            studentAccount.wachtwoord = hash;
            next();
        });
    });
});

StudentAccountSchema.plugin(uniqueValidator, {message: 'Account met dit {PATH} bestaat al'});
const StudentAccount = mongoose.model('StudentAccount', StudentAccountSchema);

module.exports = {
    StudentAccount
};