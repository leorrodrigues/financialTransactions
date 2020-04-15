import { Router } from 'express';
import { getRepository } from 'typeorm';
import CreateTransactionService from '../services/CreateTransactionService';
import GetBalanceService from '../services/GetBalanceService';

import Transaction from '../models/Transaction';

const transactionRouter = Router();

transactionRouter.get('/', async (request, response) => {
    const transactionsRepository = getRepository(Transaction);
    const transactions = await transactionsRepository.find();

    const getBalance = new GetBalanceService();

    const balance = await getBalance.execute();

    return response.json({ transactions, balance });
});

transactionRouter.post('/', async (request, response) => {
    const { title, value, type } = request.body;

    const createTransaction = new CreateTransactionService();

    const transaction = await createTransaction.execute({ title, value, type });

    return response.json(transaction);
});

export default transactionRouter;
