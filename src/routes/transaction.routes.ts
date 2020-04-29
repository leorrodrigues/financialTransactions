import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import TransactionsRepository from '../repositories/TransactionRepository';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionRouter = Router();

transactionRouter.get('/', async (request, response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find({
        relations: ['category'],
    });
    // Make the search selecting specific columns in table
    // const transactions = await transactionsRepository
    // .createQueryBuilder('transaction')
    // .leftJoinAndSelect('transaction.category', 'categories')
    // .select([
    //     'transaction.id as id',
    //     'transaction.title as title',
    //     'transaction.value as value',
    //     'transaction.type as type',
    //     'categories.title as category',
    // ])
    // .execute();

    const balance = await transactionsRepository.getBalance();

    return response.json({ transactions, balance });
});

transactionRouter.get('/:id', async (request, response) => {
    const { id } = request.params;

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.findOne(id);

    return response.json({ transactions });
});

transactionRouter.post('/', async (request, response) => {
    const { transactions } = request.body;

    const createTransaction = new CreateTransactionService();

    const transaction = await createTransaction.execute(transactions);

    return response.json(transaction);
});

transactionRouter.delete('/:id', async (request, response) => {
    const { id } = request.params;

    const deleteTransaction = new DeleteTransactionService();

    await deleteTransaction.execute({ id });

    response.send();
});

transactionRouter.post(
    '/import',
    upload.array('file'),
    async (request, response) => {
        const importTransactions = new ImportTransactionsService();

        const transactions = await importTransactions.execute({
            files: request.files,
        });

        response.json(transactions);
    },
);

export default transactionRouter;
