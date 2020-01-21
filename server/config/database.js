import mysql from 'mysql';

let user, password;
if(process.env.NODE_ENV === 'development') {
    user = 'root';
    password = '';
} else {
    user = process.env.DB_USER;
    password = process.env.DB_PASSWORD;
}

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : user,
    password : password,
    database : 'test_db'
});

export default connection;
