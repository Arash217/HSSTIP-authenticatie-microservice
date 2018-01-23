const expect = require('expect');
const request = require('supertest');
const nock = require('nock');

const {app} = require('./../server');
const {StudentAccount} = require('../models/studentAccount');
const {studentAccounts, populateStudentAccounts} = require('./seed/seed');

beforeEach(populateStudentAccounts);

const {MESSAGING_SERVICE, MESSAGING_SERVICE_PORT} = process.env;
const MessagingServiceHost = `http://${MESSAGING_SERVICE}:${MESSAGING_SERVICE_PORT}`;

const {STUDENT_SERVICE, STUDENT_SERVICE_PORT} = process.env;
const StudentServiceURL = `http://${STUDENT_SERVICE}:${STUDENT_SERVICE_PORT}`;

const {ADMIN_KEY} = process.env;

describe('POST /student/register', () => {
    it('should create a non actief student account and send a message to messaging service', (done) => {
        const email = 's1097736@student.hsleiden.nl';
        const wachtwoord = '123mnb!';

        const scope = nock(MessagingServiceHost)
            .post('/message')
            .reply(200);

        request(app)
            .post('/student/register')
            .set('x-auth', ADMIN_KEY)
            .send({email, wachtwoord})
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                scope.done();
                StudentAccount.findOne({email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.wachtwoord).not.toBe(wachtwoord);
                    expect(studentAccount.actief).toBe(false);
                    expect(studentAccount.verificatiecode).toBeTruthy();
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return authorization error if no admin token given', (done) => {
        const email = 's1097737@student.hsleiden.nl';
        const wachtwoord = '123mnb!';

        request(app)
            .post('/student/register')
            .send({email, wachtwoord})
            .expect(401)
            .end(done);
    });

    it('should return validation errors if request invalid', (done) => {
        request(app)
            .post('/student/register')
            .set('x-auth', ADMIN_KEY)
            .send({email: '1', wachtwoord: '1'})
            .expect(422)
            .end(done);
    });

    it('should return unexpected error if messaging service not reachable', (done) => {
        const email = 's1097737@student.hsleiden.nl';
        const wachtwoord = '123mnb!';

        request(app)
            .post('/student/register')
            .set('x-auth', ADMIN_KEY)
            .send({email, wachtwoord})
            .expect(400)
            .end(done);
    });

    it('should return authorization error if no admin token send to messaging service', (done) => {
        const email = 's1097738@student.hsleiden.nl';
        const wachtwoord = '123mnb!';

        const scope = nock(MessagingServiceHost)
            .post('/message')
            .reply(401);

        request(app)
            .post('/student/register')
            .set('x-auth', ADMIN_KEY)
            .send({email, wachtwoord})
            .expect(401)
            .end((err) => {
                scope.done();
                done(err);
            });
    });

    it('should not create student account if email in use', (done) => {
        request(app)
            .post('/student/register')
            .set('x-auth', ADMIN_KEY)
            .send({
                email: studentAccounts[0].email,
                wachtwoord: 'pasword123'
            })
            .expect(422)
            .end(done);
    });
});

describe('GET /student/me', () => {
    it('should return student account if authenticated', (done) => {
        request(app)
            .get('/student/me')
            .set('x-auth', studentAccounts[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.email).toBe(studentAccounts[0].email);
            })
            .end(done);
    });

    it('should return authorization error if not authenticated', (done) => {
        request(app)
            .get('/student/me')
            .expect(401)
            .end(done);

    });
});

describe('GET /student/:email', () => {
    it('should return 200 if student account exists', (done) => {
        request(app)
            .get(`/student/${studentAccounts[0].email}`)
            .set('x-auth', ADMIN_KEY)
            .expect(200)
            .end(done);
    });

    it('should return authorization error if no admin token given', (done) => {
        request(app)
            .get(`/student/${studentAccounts[0].email}`)
            .expect(401)
            .end(done);

    });

    it('should return not found error if student account does not exist', (done) => {
        request(app)
            .get(`/student/s1097739@student.hsleiden.nl`)
            .set('x-auth', ADMIN_KEY)
            .expect(404)
            .end(done);

    });
});

describe('POST /student/login', () => {
    it('should login student and return auth token', (done) => {
        request(app)
            .post('/student/login')
            .send({
                email: studentAccounts[1].email,
                wachtwoord: studentAccounts[1].wachtwoord
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.token).toBeTruthy();
                expect(res.body.email).toBe(studentAccounts[1].email);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findById(studentAccounts[1]._id).then((studentAccount) => {
                    expect(studentAccount.toObject().tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.body.token
                    });
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return not found error if student account does not exist', (done) => {
        request(app)
            .post('/student/login')
            .send({
                email: studentAccounts[1].email + '1',
                wachtwoord: studentAccounts[1].wachtwoord
            })
            .expect(404)
            .expect((res) => {
                expect(res.header['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findById(studentAccounts[1]._id).then((studentAccount) => {
                    expect(studentAccount.tokens.length).toBe(1);
                    done();
                }).catch((error) => done(error));
            })
    });

    it('should return not activated error if student account is not activated', (done) => {
        request(app)
            .post('/student/login')
            .send({
                email: studentAccounts[2].email,
                wachtwoord: studentAccounts[2].wachtwoord
            })
            .expect(403)
            .expect((res) => {
                expect(res.header['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findById(studentAccounts[2]._id).then((studentAccount) => {
                    expect(studentAccount.tokens.length).toBe(1);
                    done();
                }).catch((error) => done(error));
            })
    });

    it('should reject invalid login', (done) => {
        request(app)
            .post('/student/login')
            .send({
                email: studentAccounts[1].email,
                wachtwoord: studentAccounts[1].wachtwoord + '1'
            })
            .expect(401)
            .expect((res) => {
                expect(res.header['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findById(studentAccounts[1]._id).then((studentAccount) => {
                    expect(studentAccount.tokens.length).toBe(1);
                    done();
                }).catch((error) => done(error));
            })
    });
});

describe('POST /student/password/change', () => {
    it('should change password of a student', (done) => {
        const wachtwoord = studentAccounts[0].wachtwoord;
        const nieuw_wachtwoord = '123mnb';

        request(app)
            .post('/student/password/change')
            .set('x-auth', studentAccounts[0].tokens[0].token)
            .send({wachtwoord, nieuw_wachtwoord})
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findOne({email: studentAccounts[0].email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.wachtwoord).not.toBe(nieuw_wachtwoord);
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return authorization error if not authenticated', (done) => {
        request(app)
            .post('/student/password/change')
            .expect(401)
            .end(done);
    });

    it('should return validation error if new password invalid', (done) => {
        const wachtwoord = studentAccounts[0].wachtwoord;
        const nieuw_wachtwoord = '123';

        request(app)
            .post('/student/password/change')
            .set('x-auth', studentAccounts[0].tokens[0].token)
            .send({wachtwoord, nieuw_wachtwoord})
            .expect(422)
            .end(done);
    });
});

describe('POST /student/password/reset/:email', () => {
    it('should make a reset code and send a message to messaging service', (done) => {

        const scope = nock(MessagingServiceHost)
            .post('/message')
            .reply(200);

        request(app)
            .post(`/student/password/reset/${studentAccounts[0].email}`)
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                scope.done();
                StudentAccount.findOne({email: studentAccounts[0].email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.resetcode).toBeTruthy();
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return not found error if student account does not exist', (done) => {
        request(app)
            .post(`/student/password/reset/${studentAccounts[0].email + 1}`)
            .expect(404)
            .end(done);
    });

    it('should return not found error if student account does exist but is not active', (done) => {
        request(app)
            .post(`/student/password/reset/${studentAccounts[2].email}`)
            .expect(404)
            .end(done);
    });

    it('should return unexpected error if messaging service not reachable', (done) => {
        request(app)
            .post(`/student/password/reset/${studentAccounts[0].email}`)
            .expect(400)
            .end(done);
    });

    it('should return authorization error if no admin token send to messaging service', (done) => {
        const scope = nock(MessagingServiceHost)
            .post('/message')
            .reply(401);

        request(app)
            .post(`/student/password/reset/${studentAccounts[0].email}`)
            .expect(401)
            .end((err) => {
                scope.done();
                done(err);
            });
    });
});

describe('PUT /student/password/reset/:resetcode', () => {
    it('should reset password of student', (done) => {
        const nieuw_wachtwoord = '123456789';

        request(app)
            .put(`/student/password/reset/${studentAccounts[3].resetcode}`)
            .send({nieuw_wachtwoord})
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                StudentAccount.findOne({email: studentAccounts[3].email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.resetcode).toBeFalsy();
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return not found error if reset code is invalid or already used', (done) => {
        request(app)
            .put(`/student/password/reset/${studentAccounts[3].resetcode + '1'}`)
            .expect(404)
            .end(done);
    });

    it('should return validation error if request is invalid', (done) => {
        const nieuw_wachtwoord = '12345';

        request(app)
            .put(`/student/password/reset/${studentAccounts[3].resetcode}`)
            .send({nieuw_wachtwoord})
            .expect(422)
            .end(done);
    });
});

describe('POST /student/me/activate/:email', () => {
    it('should make a verification code (if user account not actief) and send a message to messaging service', (done) => {
        const scope = nock(MessagingServiceHost)
            .post('/message')
            .reply(200);

        request(app)
            .post(`/student/me/activate/${studentAccounts[3].email}`)
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                scope.done();
                StudentAccount.findOne({email: studentAccounts[3].email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.verificatiecode).toBeTruthy();
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return not found error if student account does not exist', (done) => {
        request(app)
            .post(`/student/me/activate/${studentAccounts[0].email + 1}`)
            .expect(404)
            .end(done);
    });


    it('should return not found error if student account does exist and is active', (done) => {
        request(app)
            .post(`/student/me/activate/${studentAccounts[0].email}`)
            .expect(404)
            .end(done);
    });


    it('should return unexpected error if messaging service not reachable', (done) => {
        request(app)
            .post(`/student/me/activate/${studentAccounts[2].email}`)
            .expect(400)
            .end(done);
    });

    it('should return authorization error if no admin token send to messaging service', (done) => {
      const scope = nock(MessagingServiceHost)
          .post('/message')
          .reply(401);

      request(app)
          .post(`/student/me/activate/${studentAccounts[2].email}`)
          .expect(401)
          .end((err) => {
              scope.done();
              done(err);
          });
    });
});

describe('PUT /student/me/activate/:verificatiecode', () => {
    it('should activate student account', (done) => {
        const scope = nock(StudentServiceURL)
            .post(`/student/activate/${studentAccounts[4].email}`)
            .reply(200);

        request(app)
            .put(`/student/me/activate/${studentAccounts[4].verificatiecode}`)
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                scope.done();
                StudentAccount.findOne({email: studentAccounts[4].email}).then((studentAccount) => {
                    expect(studentAccount).toBeTruthy();
                    expect(studentAccount.verificatiecode).toBeFalsy();
                    expect(studentAccount.actief).toBe(true);
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should return not found error if verification code is invalid or already used', (done) => {
        request(app)
            .put(`/student/me/activate/${studentAccounts[4].verificatiecode + '1'}`)
            .expect(404)
            .end(done);
    });

    it('should return unexpected error if student service not reachable', (done) => {
        request(app)
            .put(`/student/me/activate/${studentAccounts[4].verificatiecode}`)
            .expect(400)
            .end(done);
    });

    it('should return authorization error if no admin token send to student service', (done) => {
        const scope = nock(StudentServiceURL)
            .post(`/student/activate/${studentAccounts[4].email}`)
            .reply(401);

        request(app)
            .put(`/student/me/activate/${studentAccounts[4].verificatiecode}`)
            .expect(401)
            .end((err) => {
                scope.done();
                done(err);
            });
    });
});

describe('DELETE /student/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/student/me/token')
            .set('x-auth', studentAccounts[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                StudentAccount.findById(studentAccounts[0]._id).then((studentAccount) => {
                    expect(studentAccount.tokens.length).toBe(0);
                    done();
                }).catch((error) => done(error));
            })
    });

    it('should return authorization error if not authenticated', (done) => {
        request(app)
            .delete('/student/me/token')
            .expect(401)
            .end(done);
    });
});