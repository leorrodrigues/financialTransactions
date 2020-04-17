import { getCustomRepository, getRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionRepository';
import Transaction from '../models/Transaction';

import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
    title: string;
    value: number;
    type: 'income' | 'outcome';
    category: string;
}

export default class CreateTransactionService {
    public async execute({
        title,
        value,
        type,
        category,
    }: Request): Promise<Transaction> {
        const transactionsRepository = getCustomRepository(
            TransactionRepository,
        );
        const categoriesRepository = getRepository(Category);

        if (type !== 'income' && type !== 'outcome') {
            throw new AppError('invalid transaction type');
        }

        const { total } = await transactionsRepository.getBalance();

        if (type === 'outcome' && total < value) {
            throw new AppError('Insuficients founds.');
        }

        const categoryExists = await categoriesRepository.findOne({
            where: { title: category },
        });

        let category_id;
        if (categoryExists) {
            category_id = categoryExists.id;
        } else {
            const newCategory = categoriesRepository.create({
                title: category,
            });
            await categoriesRepository.save(newCategory);
            category_id = newCategory.id;
        }

        const transaction = transactionsRepository.create({
            title,
            value,
            type,
            category: category_id,
        });

        await transactionsRepository.save(transaction);

        return transaction;
    }
}
