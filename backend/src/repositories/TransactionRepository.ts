/* eslint-disable no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
    income: number;
    outcome: number;
    total: number;
}

@EntityRepository(Transaction)
class TransactionRepository extends Repository<Transaction> {
    public async getBalance(): Promise<Balance> {
        const transactions = await this.find();

        if (!transactions) {
            return { income: 0, outcome: 0, total: 0 };
        }

        const { income, outcome } = transactions.reduce(
            ({ income, outcome }, transaction) => {
                transaction.type === 'income'
                    ? (income += transaction.value)
                    : (outcome += transaction.value);
                return { income, outcome };
            },
            { income: 0, outcome: 0 },
        );

        const transacionWithBalance = {
            income,
            outcome,
            total: income - outcome,
        };

        return transacionWithBalance;
    }
}

export default TransactionRepository;
