import config from './config/config';
import app from './config/express';

console.log('env', process.env.PORT);

app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
});

