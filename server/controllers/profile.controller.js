import connection from '../config/database';
import bcrypt from 'bcrypt';
const saltRounds = 10;

export const updateProfile = (req, res) => {
    let data = req.body;
    let query;
    console.log('===========================>', data.password);
    if(data.password === '') {
        query = `update user set email='${data.email}' where id=${data.user_id}`;
        connection.query(`update user set email='${data.email}' where id=${data.user_id}`);
        res.send('success');
    } else {
        bcrypt.hash(data.password, saltRounds, function(err, hash) {
            query = `update user set email='${data.email}', password='${hash}' where id=${data.user_id}`;
            connection.query(`update user set email='${data.email}', password='${hash}' where id=${data.user_id}`);
            res.send(hash);
        });
    }
};

export const deleteAccountByUserId = (req, res) => {
    let user_id = req.body.id;
    connection.query(`delete from user where id=${user_id}`);
    connection.query(`delete from user_item where user_id=${user_id}`);
    connection.query(`delete from user_time where user_id=${user_id}`);
};


