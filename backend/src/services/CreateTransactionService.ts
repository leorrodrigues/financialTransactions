import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import GetBalanceService from './GetBalanceService';

import AppError from '../errors/AppError';

interface Request {
    title: string;
    value: number;
    type: 'income' | 'outcome';
}

export default class CreateTransactionService {
    public async execute({
        title,
        value,
        type,
    }: Request): Promise<Transaction> {
        const transactionsRepository = getRepository(Transaction);

        if (type !== 'income' && type !== 'outcome') {
            throw new AppError('invalid transaction type');
        }

        const getBalance = new GetBalanceService();
        const { total } = await getBalance.execute();

        if (type === 'outcome' && total < value) {
            throw new AppError('Insuficients founds.');
        }

        const transaction = transactionsRepository.create({
            title,
            value,
            type,
        });

        await transactionsRepository.save(transaction);

        return transaction;
    }
}
