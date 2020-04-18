import request from 'supertest';
import { isUuid } from 'uuidv4';
import path from 'path';

import { Connection, getConnection, getRepository } from 'typeorm';
import createConnection from '../database';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import app from '../app';

let connection: Connection;

describe('Transaction', () => {
    beforeAll(async () => {
        connection = await createConnection('test-connection');
        await connection.runMigrations();
    });

    beforeEach(async () => {
        await connection.query('DELETE FROM categories');
        await connection.query('DELETE FROM categories');
    });

    afterAll(async () => {
        const mainConnection = getConnection();

        await connection.close();
        await mainConnection.close();
    });

    it('should be able to create a new transaction', async () => {
        const response = await request(app).post('/transactions').send({
            title: 'Loan',
            type: 'income',
            value: 1200,
            category: 'test',
        });

        expect(isUuid(response.body.id)).toBe(true);

        expect(response.body).toMatchObject({
            title: 'Loan',
            type: 'income',
            value: 1200,
            category: expect.any(String),
        });
    });

    it('should be able to list the transactions', async () => {
        await request(app).post('/transactions').send({
            title: 'Salary',
            type: 'income',
            value: 3000,
            category: 'test',
        });

        await request(app).post('/transactions').send({
            title: 'Bicycle',
            type: 'outcome',
            value: 1500,
            category: 'test',
        });

        await request(app).post('/transactions').send({
            title: 'Loan',
            type: 'income',
            value: 1200,
            category: 'test',
        });

        const response = await request(app).get('/transactions');

        expect(response.body.transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Salary',
                    type: 'income',
                    value: 3000,
                    category: 'test',
                }),
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Bicycle',
                    type: 'outcome',
                    value: 1500,
                    category: 'test',
                }),
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Loan',
                    type: 'income',
                    value: 1200,
                    category: 'test',
                }),
            ]),
        );

        expect(response.body.balance).toMatchObject({
            income: 4200,
            outcome: 1500,
            total: 2700,
        });
    });

    it('should not be able to create a transaction with type different than income or outcome', async () => {
        const response = await request(app).post('/transactions').send({
            title: 'Bicycle',
            type: 'iincome',
            value: 3000,
            category: 'test',
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: 'invalid transaction type',
                status: 'error',
            }),
        );
    });

    it('should not be able to create outcome transaction without a valid balance', async () => {
        const response = await request(app).post('/transactions').send({
            title: 'Bicycle',
            type: 'outcome',
            value: 3000,
            category: 'test',
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: expect.any(String),
                status: expect.any(String),
            }),
        );
    });

    it('should be able to list transactions', async () => {
        await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        await request(app).post('/transactions').send({
            title: 'April Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        await request(app).post('/transactions').send({
            title: 'Macbook',
            type: 'outcome',
            value: 6000,
            category: 'Eletronics',
        });

        const response = await request(app).get('/transactions');

        expect(response.body.transactions).toHaveLength(3);
        expect(response.body.balance).toMatchObject({
            income: 8000,
            outcome: 6000,
            total: 2000,
        });
    });

    it('should be able to create new transaction', async () => {
        const transactionsRepository = getRepository(Transaction);

        const response = await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        const transaction = await transactionsRepository.findOne({
            where: {
                title: 'March Salary',
            },
        });

        expect(transaction).toBeTruthy();

        expect(response.body).toMatchObject(
            expect.objectContaining({
                id: expect.any(String),
            }),
        );
    });

    it('should create tags when inserting new transactions', async () => {
        const transactionsRepository = getRepository(Transaction);
        const categoriesRepository = getRepository(Category);

        const response = await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        const category = await categoriesRepository.findOne({
            where: {
                title: 'Salary',
            },
        });

        expect(category).toBeTruthy();

        const transaction = await transactionsRepository.findOne({
            where: {
                title: 'March Salary',
                category_id: category?.id,
            },
        });

        expect(transaction).toBeTruthy();

        expect(response.body).toMatchObject(
            expect.objectContaining({
                id: expect.any(String),
            }),
        );
    });

    it('should not create tags when they already exists', async () => {
        const transactionsRepository = getRepository(Transaction);
        const categoriesRepository = getRepository(Category);

        const { identifiers } = await categoriesRepository.insert({
            title: 'Salary',
        });

        const insertedCategoryId = identifiers[0].id;

        await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        const transaction = await transactionsRepository.findOne({
            where: {
                title: 'March Salary',
                category_id: insertedCategoryId,
            },
        });

        const categoriesCount = await categoriesRepository.find();

        expect(categoriesCount).toHaveLength(1);
        expect(transaction).toBeTruthy();
    });

    it('should not be able to create outcome transaction without a valid balance', async () => {
        await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        const response = await request(app).post('/transactions').send({
            title: 'iPhone',
            type: 'outcome',
            value: 4500,
            category: 'Eletronics',
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                status: 'error',
                message: expect.any(String),
            }),
        );
    });

    it('should be able to delete a transaction', async () => {
        const transactionsRepository = getRepository(Transaction);

        const response = await request(app).post('/transactions').send({
            title: 'March Salary',
            type: 'income',
            value: 4000,
            category: 'Salary',
        });

        await request(app).delete(`/transactions/${response.body.id}`);

        const transaction = await transactionsRepository.findOne(
            response.body.id,
        );

        expect(transaction).toBeFalsy();
    });

    it('should not be able to delete a transaction that does not exists', async () => {
        const response = await request(app).delete(`/transactions/0`);

        console.log(response.body);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                status: 'error',
                message: 'Invalid transaction',
            }),
        );
    });

    it('should not be able to delete a transaction that does not has uuid4 as id', async () => {
        const response = await request(app).delete(
            `/transactions/7ba27ace-34ad-4b43-a6f1-1eed9811ab9b`,
        );

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                status: 'error',
                message: 'Invalid transaction',
            }),
        );
    });

    it('should be able to import transactions', async () => {
        const transactionsRepository = getRepository(Transaction);
        const categoriesRepository = getRepository(Category);

        const importCSV = path.resolve(__dirname, 'import_template.csv');

        await request(app)
            .post('/transactions/import')
            .attach('file', importCSV);

        const transactions = await transactionsRepository.find();
        const categories = await categoriesRepository.find();

        expect(categories).toHaveLength(2);
        expect(categories).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Others',
                }),
                expect.objectContaining({
                    title: 'Food',
                }),
            ]),
        );

        expect(transactions).toHaveLength(3);
        expect(transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Loan',
                    type: 'income',
                }),
                expect.objectContaining({
                    title: 'Website Hosting',
                    type: 'outcome',
                }),
                expect.objectContaining({
                    title: 'Ice cream',
                    type: 'outcome',
                }),
            ]),
        );
    });
});
