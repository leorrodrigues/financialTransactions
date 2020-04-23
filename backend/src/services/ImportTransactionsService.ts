/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { readFileSync } from 'fs';
import { parse } from 'papaparse';

import CreateTransactionService from './CreateTransactionService';

import Transaction from '../models/Transaction';

interface Request {
    files:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] };
}

class ImportTransactionsService {
    async execute({ files }: Request): Promise<Transaction[]> {
        const transactions: Transaction[] = [];
        const createTransaction = new CreateTransactionService();

        // eslint-disable-next-line array-callback-return
        (files as Express.Multer.File[]).map(file => {
            const csvFile = readFileSync(file.path, 'utf8');
            const parsedFile = parse(csvFile, {
                delimiter: ', ',
                header: true,
                skipEmptyLines: true,
            });

            Array.prototype.push.apply(transactions, parsedFile.data);
        });

        const transactionsCreated = await createTransaction.execute(
            transactions,
        );

        return transactionsCreated;
    }
}

export default ImportTransactionsService;
