const express = require('express');
import routes from '../routes/index';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
const multer = require('multer');
const app = express();


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        console.log('file=========>', file);
        cb(null, file.originalname)
    }
});

app.use(multer({dest:'./uploads/', storage: storage}).single('file'));

// parse body params and attache them to req.body
app.use(json());
app.use(urlencoded({ extended: true }));

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount all routes on /api path
app.use('/api', routes);

export default app;
