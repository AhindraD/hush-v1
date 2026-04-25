import { Router } from 'express';
import accountsRouter from './accounts';
import transactionsRouter from './transactions';
import complianceRouter from './compliance';

const router = Router();

router.use('/accounts', accountsRouter);
router.use('/accounts', transactionsRouter);
router.use('/accounts', complianceRouter);

export default router;
