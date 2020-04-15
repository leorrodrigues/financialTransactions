/* eslint-disable no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
    income: number;
    outcome: number;
    total: number;
}

export default class GetBalanceService {
    public async execute(): Promise<Balance> {
        const transactionsRepository = getRepository(Transaction);

        const transactions = await transactionsRepository.find();

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
