import { Router } from 'express';

import testRoutes from './test.route';

const router = Router(); // eslint-disable-line new-cap

// public route
router.use('/test', testRoutes);

export default router;
