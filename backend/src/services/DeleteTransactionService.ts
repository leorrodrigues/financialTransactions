import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionRepository';

import AppError from '../errors/AppError';

interface Request {
    id: string;
}

class DeleteTransactionService {
    async execute({ id }: Request): Promise<void> {
        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const transaction = await transactionsRepository.findOne(id);

        if (!transaction) {
            throw new AppError('Invalid transaction', 401);
        }

        await transactionsRepository.delete(id);
    }
}

export default DeleteTransactionService;
