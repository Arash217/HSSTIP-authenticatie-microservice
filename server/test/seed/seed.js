const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {StudentAccount} = require('../../models/studentAccount');

const studentAccountOneId = new ObjectID();
const studentAccountTwoId = new ObjectID();
const studentAccountThreeId = new ObjectID();
const studentAccountFourId = new ObjectID();
const studentAccountFiveId = new ObjectID();

const studentAccounts = [{
        _id: studentAccountOneId,
        email: 's1097731@student.hsleiden.nl',
        wachtwoord: 'studentOnePass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: studentAccountOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }],
        actief: true
    }, {
        _id: studentAccountTwoId,
        email: 's1097732@student.hsleiden.nl',
        wachtwoord: 'studentTwoPass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: studentAccountTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }],
        actief: true
    }, {
        _id: studentAccountThreeId,
        email: 's1097733@student.hsleiden.nl',
        wachtwoord: 'studentThreePass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: studentAccountThreeId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }],
        actief: false
    }, {
        _id: studentAccountFourId,
        email: 's1097734@student.hsleiden.nl',
        wachtwoord: 'studentFourPass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: studentAccountFourId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }],
        actief: false,
        resetcode: '7fd8c0b37e30c0b971e7adf452d2462a8529d5703ab3db0e02af95cdf1d1f94c'
    }, {
        _id: studentAccountFiveId,
        email: 's1097735@student.hsleiden.nl',
        wachtwoord: 'studentFivePass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: studentAccountFiveId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }],
        actief: false,
        verificatiecode: '7fd8c0b37e30c0b971e7adf452d2462a8529d5703ab3db0e02af95cdf1d1f94d'
    }
];

const populateStudentAccounts = (done) => {
    StudentAccount.remove({}).then(() => {
      const studentAccountOne = new StudentAccount(studentAccounts[0]).save();
      const studentAccountTwo = new StudentAccount(studentAccounts[1]).save();
      const studentAccountThree = new StudentAccount(studentAccounts[2]).save();
      const studentAccountFour = new StudentAccount(studentAccounts[3]).save();
      const studentAccountFive = new StudentAccount(studentAccounts[4]).save();

      return Promise.all(
          [studentAccountOne, studentAccountTwo, studentAccountThree, studentAccountFour, studentAccountFive]
      );
  }).then(() => done());
};

module.exports = {
    studentAccounts,
    populateStudentAccounts
};