import connection from '../config/database';
const fs = require("fs");
const multer = require('multer');

export const sendFormData = (req, res, next) => {
    const data = req.body;
    const query = `INSERT INTO test_table (comment, file) VALUES ('${data.comment}', '${req.file.originalname}')`;

    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        res.send('ok');
    });
};
