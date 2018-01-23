const {messageSender} = require('../service/messageSender');

const sendPasswordResetMail = async (studentEmail, code) => {

    const {FRONTEND_ADDRESS, FRONTEND_PORT} = process.env;

    const messageTitle = 'Wachtwoord vergeten bij HSSTIP';
    const messageBody= `Beste student,
    <br>
    <br>
      U heeft aangegeven uw HSSTIP-wachtwoord te zijn vergeten.
    <br>
    <br>
      Wil je je wachtwoord resetten? Klik dan op de volgende link:
    <br>
    <br>
      <a href="http://${FRONTEND_ADDRESS}:${FRONTEND_PORT}/wachtwoord-reset/${code}">http://${FRONTEND_ADDRESS}:${FRONTEND_PORT}/wachtwoord-reset/${code}</a>
    <br>
    <br>
      <b>Let op: Gebruik VPN als je je wachtwoord buiten het schoolnetwerk probeert te resetten.</b> 
    <br>
    <br>
      Met vriendelijke groeten,
    <br>
    <br>
    HSSTIP`;

    await messageSender(studentEmail, messageTitle, messageBody, 1);
};

module.exports = {
    sendPasswordResetMail
};
