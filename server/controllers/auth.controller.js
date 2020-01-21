import connection from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../helpers/apierror';
import bcrypt from 'bcrypt';
import config from '../config/config'
import jwt from 'jsonwebtoken';
// import sgMail from "@sendgrid/mail"
const sgMail = require('@sendgrid/mail');
import uuid from 'uuid';

const saltRounds = 10;

export const login = (req, res, next) => {
    const { email, password } = req.body;
    connection.query(`select id, email, password from user where email='${email}'`, function (error, results, fields) {
        if (error) throw error;
        const user = results[0];
        if(user) {
            bcrypt.compare(password, user.password, function(err, result) {
                if(result) {
                    // Passwords match
                    const token = jwt.sign({
                        id: user.id,
                        email: user.email,
                    }, config.jwtSecret);
                    console.log('token', token);
                    res.json({ token, user });
                } else {
                    // Passwords don't match
                    const err = new ApiError('Password is wrong!', httpStatus.BAD_REQUEST, true);
                    next(err);
                }
            });
        } else {
            const err = new ApiError('User does not exist', httpStatus.BAD_REQUEST, true);
            next(err);
        }
    });
};

export const signup = (req, res) => {
    const { email, password } = req.body;
    const created = new Date().toISOString().slice(0,10);
    bcrypt.hash(password, saltRounds, function(err, hash) {
        connection.query(`insert into user (email, password, created) values('${email}', '${hash}', '${created}')`, function (error, results, fields) {
            if (error) {
                if(error.errno === 1062) {
                    res.send('duplicated');
                } else {
                    throw error;
                }
            } else {
                const insertId = results['insertId'];
                connection.query(`insert into user_time (user_id, item_time, name) values ('${insertId}', '8:00', 'Breakfast')`);
                connection.query(`insert into user_time (user_id, item_time, name) values ('${insertId}', '12:00', 'Lunch')`);
                connection.query(`insert into user_time (user_id, item_time, name) values ('${insertId}', '17:00', 'Dinner')`);
                connection.query(`insert into user_item (user_id, created) values ('${insertId}', '${created}')`, function (error, results) {
                    if (error) throw error;
                    let insertId_ = results['insertId'];
                    connection.query(`update user_item set day_id=${insertId_} where id=${insertId_}`);
                });
                res.send('success');
            }
        });
    });
};

export const resetRequest = (req, res) => {
    const {email} = req.body;
    const uniqid = uuid.v1();
    connection.query(`update user set reset_token='${uniqid}' where email='${email}'`);
    console.log('resetPassword=============>', email , uniqid , req.headers.host, process.env.SENDGRID_API_KEY , req.headers);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: email,
        from: process.env.SMTP_USERNAME,
        subject: 'Please visit following link to reset password',
        text: 'Please confirm your email',
        html: `<a href='${req.headers.origin}/reset-password/${uniqid}'>CLICK ME</a>`,
    };
    sgMail.send(msg);
};



export const resetPassword = (req, res) => {
    const {reset_token, password} = req.body;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        connection.query(`update user set password='${hash}' where reset_token='${reset_token}'`, function (error, results, fields) {
            if (error) throw error;
            res.send('success');
        });
    });
};

export const resetCheck = (req, res) => {
    const {reset_token} = req.body;
    connection.query(`select email from user where reset_token='${reset_token}'`, function (error, results) {
        if (error) throw error;
        console.log('check result==========>', reset_token, results);
        if(results.length===0) {
            res.send(false);
        } else {
            res.send(true);
        }
    });
    console.log('reset_token', reset_token);
};
