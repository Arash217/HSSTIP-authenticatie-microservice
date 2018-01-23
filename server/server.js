const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const {mongoose} = require('./db/mongoose');
const {StudentAccount} = require('./models/studentAccount');
const {authenticateStudentAccount} = require('./middleware/authenticateStudentAccount');
const {authenticateAdmin} = require('./middleware/authenticateAdmin');
const {errorhandler} = require('./middleware/errorHandler');
const {createErrorMessage} = require('./util/errorCreator');
const {NotFoundError} = require('./util/errors');
const {wrapAsync} = require('./util/wrapAsync');
const {sendVerificationMail} = require('./mail/verificationMail');
const {sendPasswordResetMail} = require('./mail/passwordResetMail');
const {activateStudent} = require('./service/activateStudent');

const app = express();

const port = process.env.PORT;

app.use(bodyParser.json());
app.use(cors());

app.post('/student/register', authenticateAdmin, wrapAsync(async (req, res) => {
    const body = _.pick(req.body, ['email', 'wachtwoord']);
    const studentAccount = new StudentAccount(body);
    await studentAccount.save();
    const code = await studentAccount.generateVerificationCode();
    await sendVerificationMail(studentAccount.email, code);
    res.send();
}));

app.get('/student/me', authenticateStudentAccount, wrapAsync(async (req, res) => {
    res.send({email: req.studentAccount.email});
}));

app.get('/student/:email', authenticateAdmin, wrapAsync(async (req, res) => {
    const {email} = req.params;
    const studentAccount = await StudentAccount.findOne({email});

    if (!studentAccount){
        throw createErrorMessage(NotFoundError, "Account bestaat niet of is niet geactiveerd")
    }

    res.send();
}));

app.post('/student/login', wrapAsync(async (req, res) => {
    const body = _.pick(req.body, ['email', 'wachtwoord']);
    const studentAccount = await StudentAccount.findByCredentials(body.email, body.wachtwoord);
    const token = await studentAccount.generateAuthToken();
    res.send({email: studentAccount.email, token});
}));

app.post('/student/password/change', authenticateStudentAccount, wrapAsync(async (req, res) => {
    const body = _.pick(req.body, ['wachtwoord', 'nieuw_wachtwoord']);
    const {email} = req.studentAccount;
    const studentAccount = await StudentAccount.findByCredentials(email, body.wachtwoord);
    studentAccount.wachtwoord = body.nieuw_wachtwoord;
    await studentAccount.save();
    res.send();
}));

app.post('/student/password/reset/:email', wrapAsync(async (req, res) => {
    const {email} = req.params;
    const studentAccount = await StudentAccount.findOne({email, actief: true});

    if (!studentAccount){
        throw createErrorMessage(NotFoundError, "Account bestaat niet of is niet geactiveerd")
    }

    const code = await studentAccount.generateResetCode();
    await sendPasswordResetMail(studentAccount.email, code);

    res.send();
}));

app.put('/student/password/reset/:resetcode', wrapAsync(async (req, res) => {
    const {resetcode} = req.params;
    const {nieuw_wachtwoord} = req.body;
    const studentAccount = await StudentAccount.findOne({resetcode});

    if (!studentAccount){
        throw createErrorMessage(NotFoundError, "Invalide code of wachtwoord is reeds aangepast met deze code")
    }

    studentAccount.wachtwoord = nieuw_wachtwoord;
    studentAccount.resetcode = null;
    await studentAccount.save();

    res.send();
}));

app.post('/student/me/activate/:email', wrapAsync(async (req, res) => {
    const {email} = req.params;
    const studentAccount = await StudentAccount.findOne({email, actief: false});

    if (!studentAccount){
        throw createErrorMessage(NotFoundError, "Account bestaat niet of is reeds geactiveerd")
    }

    const code = await studentAccount.generateVerificationCode();
    await sendVerificationMail(studentAccount.email, code);
    res.send();
}));

app.put('/student/me/activate/:verificatiecode', wrapAsync(async (req, res) => {
    const {verificatiecode} = req.params;
    const studentAccount = await StudentAccount.findOne({verificatiecode});

    if (!studentAccount){
        throw createErrorMessage(NotFoundError, "Invalide verificatiecode of account is reeds geactiveerd")
    }

    await activateStudent(studentAccount.email);
    studentAccount.verificatiecode = null;
    studentAccount.actief = true;
    await studentAccount.save();
    res.send();
}));

app.delete('/student/me/token', authenticateStudentAccount, wrapAsync(async (req, res) => {
    await req.studentAccount.removeToken(req.token);
    res.send();
}));

app.use(errorhandler);

app.listen(port, () => {
    console.log('Started on port', port);
});

module.exports = {
    app
};