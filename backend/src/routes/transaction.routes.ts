import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import CreateTransactionService from '../services/CreateTransactionService';

import TransactionsRepository from '../repositories/TransactionRepository';

const transactionRouter = Router();

transactionRouter.get('/', async (request, response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find();

    const balance = await transactionsRepository.getBalance();

    return response.json({ transactions, balance });
});

transactionRouter.post('/', async (request, response) => {
    const { title, value, type } = request.body;

    const createTransaction = new CreateTransactionService();

    const transaction = await createTransaction.execute({ title, value, type });

    return response.json(transaction);
});

export default transactionRouter;
