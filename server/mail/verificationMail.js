const {messageSender} = require('../service/messageSender');

const sendVerificationMail = async (studentEmail, code) => {

    const {FRONTEND_ADDRESS, FRONTEND_PORT} = process.env;

    const messageTitle = 'Bevestiging HSSTIP account';
    const messageBody= `Beste student,
    <br>
    <br>
      Bedankt voor het aanmaken van een HSSTIP account.
    <br>
    <br>
      Wil je gebruik maken van HSSTIP? Activeer dan jouw account door op de volgende link te klikken:
    <br>
    <br>
      <a href="http://${FRONTEND_ADDRESS}:${FRONTEND_PORT}/account-activeren/${code}">http://${FRONTEND_ADDRESS}:${FRONTEND_PORT}/activeren/${code}</a>
    <br>
    <br>
      <b>Let op: Gebruik VPN als je je account buiten het schoolnetwerk probeert te activeren.</b> 
    <br>
    <br>
      Met vriendelijke groeten,
    <br>
    <br>
    HSSTIP`;

    await messageSender(studentEmail, messageTitle, messageBody, 1);
};

module.exports = {
    sendVerificationMail
};
