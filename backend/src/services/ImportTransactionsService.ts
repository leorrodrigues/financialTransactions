/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from 'papaparse';

import uploadConfig from '../config/upload';

import CreateTransactionService from './CreateTransactionService';

import Transaction from '../models/Transaction';

interface Request {
    file: string;
}

class ImportTransactionsService {
    async execute({ file }: Request): Promise<Transaction[]> {
        const createTransaction = new CreateTransactionService();

        const csvFilePath = path.join(uploadConfig.directory, file);
        const csvFile = readFileSync(csvFilePath, 'utf8');
        const parsedFile = parse(csvFile, {
            delimiter: ', ',
            header: true,
            skipEmptyLines: true,
        });

        // 1- funciona, porem os elementos acontecem nao em ordem, podendo ocorrer uma desorder nos elementos inseridos no DB. Como as transacoes sao dependentes umas das outras, a ordem importa. Logo, esta alternativa nao resolve.
        // const transactions = parsedFile.data.map(
        //     ({ title, type, value, category }) => {
        //         return createTransaction.execute({
        //             title,
        //             type,
        //             value,
        //             category,
        //         });
        //     },
        // );
        // return Promise.all(transactions);

        const transactions = [];
        for (const { title, type, value, category } of parsedFile.data) {
            const transaction = await createTransaction.execute({
                title,
                type,
                value,
                category,
            });
            transactions.push(transaction);
        }
        return transactions;
    }
}

export default ImportTransactionsService;
