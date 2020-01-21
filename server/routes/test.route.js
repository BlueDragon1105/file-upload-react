import { Router } from 'express';
import * as TestController from '../controllers/test.controller';

const router = Router(); // eslint-disable-line new-cap

router.route('/sendFormData')

    /** POST /api/test - Test post api */
    .post(TestController.sendFormData);

export default router;
