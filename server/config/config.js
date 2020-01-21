import { config as envConfig } from 'dotenv';

envConfig();

const config = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET
};

export default config;
