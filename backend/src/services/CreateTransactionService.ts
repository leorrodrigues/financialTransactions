import { getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionRepository';
import Transaction from '../models/Transaction';

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
        const transactionsRepository = getCustomRepository(
            TransactionRepository,
        );

        if (type !== 'income' && type !== 'outcome') {
            throw new AppError('invalid transaction type');
        }

        const { total } = await transactionsRepository.getBalance();

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
