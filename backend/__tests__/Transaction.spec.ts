import request from 'supertest';
import { isUuid } from 'uuidv4';
import path from 'path';

import { Connection, getConnection, getRepository } from 'typeorm';
import createConnection from '../src/database';

import Transaction from '../src/models/Transaction';
import Category from '../src/models/Category';

import app from '../src/app';

let connection: Connection;

describe('Transaction', () => {
    beforeAll(async () => {
        connection = await createConnection('test-connection');
        await connection.runMigrations();
    });

    beforeEach(async () => {
        await connection.query('DELETE FROM transactions');
        await connection.query('DELETE FROM categories');
    });

    afterAll(async () => {
        const mainConnection = getConnection();

        await connection.close();
        await mainConnection.close();
    });

    it('should be able to create a new transaction', async () => {
        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Loan',
                        type: 'income',
                        value: 1200,
                        category: 'salary',
                    },
                ],
            });

        expect(isUuid(response.body[0].id)).toBe(true);
        expect(isUuid(response.body[0].category.id)).toBe(true);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Loan',
                    type: 'income',
                    value: 1200,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'salary',
                    }),
                }),
            ]),
        );
    });

    it('should be able to create a batch of new transactions', async () => {
        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Loan',
                        type: 'income',
                        value: 1200,
                        category: 'salary',
                    },
                    {
                        title: 'Sushi',
                        type: 'outcome',
                        value: 1000,
                        category: 'food',
                    },
                ],
            });

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Loan',
                    type: 'income',
                    value: 1200,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'salary',
                    }),
                }),
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Sushi',
                    type: 'outcome',
                    value: 1000,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'food',
                    }),
                }),
            ]),
        );
    });

    it('should be able to list the transactions', async () => {
        await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Salary',
                        type: 'income',
                        value: 3000,
                        category: 'Salary',
                    },
                    {
                        title: 'Sushi',
                        type: 'outcome',
                        value: 1500,
                        category: 'Food',
                    },
                    {
                        title: 'Loan',
                        type: 'income',
                        value: 1200,
                        category: 'other',
                    },
                ],
            });

        const response = await request(app).get('/transactions');

        expect(response.body.transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Salary',
                    type: 'income',
                    value: 3000,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'salary',
                        updated_at: expect.any(String),
                        created_at: expect.any(String),
                    }),
                }),
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Sushi',
                    type: 'outcome',
                    value: 1500,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'food',
                        updated_at: expect.any(String),
                        created_at: expect.any(String),
                    }),
                }),
                expect.objectContaining({
                    id: expect.any(String),
                    title: 'Loan',
                    type: 'income',
                    value: 1200,
                    category: expect.objectContaining({
                        id: expect.any(String),
                        title: 'other',
                        updated_at: expect.any(String),
                        created_at: expect.any(String),
                    }),
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
        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Bicycle',
                        type: 'iincome',
                        value: 3000,
                        category: 'test',
                    },
                ],
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: 'Invalid transaction type.',
                status: 'error',
            }),
        );
    });

    it('should not be able to create a transaction with type different than income or outcome in multiple transactions', async () => {
        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Salary',
                        type: 'income',
                        value: 3000,
                        category: 'salary',
                    },
                    {
                        title: 'Bicycle',
                        type: 'ioutcome',
                        value: 3000,
                        category: 'test',
                    },
                ],
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: 'Invalid transaction type.',
                status: 'error',
            }),
        );
    });

    it('should not be able to create outcome transaction without a valid balance', async () => {
        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Bicycle',
                        type: 'outcome',
                        value: 3000,
                        category: 'test',
                    },
                ],
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: 'Insufficient founds.',
                status: 'error',
            }),
        );
    });

    it('should not be able to create outcome transaction without a valid balance in multiple transactions', async () => {
        const response = await request(app)
            .post('/transactions')
            .send({
                transaction: [
                    {
                        title: 'Salary',
                        type: 'income',
                        value: 2999,
                        category: 'salary',
                    },
                    {
                        title: 'Bicycle',
                        type: 'outcome',
                        value: 3000,
                        category: 'test',
                    },
                ],
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
        await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'April Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'Macbook',
                        type: 'outcome',
                        value: 6000,
                        category: 'Eletronics',
                    },
                ],
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

        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        const transaction = await transactionsRepository.findOne({
            where: {
                title: 'March Salary',
            },
        });

        expect(transaction).toBeTruthy();

        expect(response.body).toMatchObject(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                }),
            ]),
        );
    });

    it('should create tags when inserting new transactions', async () => {
        const transactionsRepository = getRepository(Transaction);
        const categoriesRepository = getRepository(Category);

        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        const category = await categoriesRepository.findOne({
            where: {
                title: 'salary',
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
            expect.arrayContaining([
                expect.objectContaining({
                    category: expect.objectContaining({
                        id: expect.any(String),
                    }),
                }),
            ]),
        );
    });

    it('should not create tags when they already exists', async () => {
        const transactionsRepository = getRepository(Transaction);
        const categoriesRepository = getRepository(Category);

        const { identifiers } = await categoriesRepository.insert({
            title: 'salary',
        });

        const insertedCategoryId = identifiers[0].id;

        await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
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

    it('should be able to delete a transaction', async () => {
        const transactionsRepository = getRepository(Transaction);

        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        await request(app).delete(`/transactions/${response.body.id}`);

        const transaction = await transactionsRepository.findOne({
            id: response.body.id,
        });

        expect(transaction).toBeFalsy();
    });

    it('should be able to delete a transaction with service', async () => {
        const transactionsRepository = getRepository(Transaction);

        const response = await request(app)
            .post('/transactions')
            .send({
                transactions: [
                    {
                        title: 'March Salary',
                        type: 'income',
                        value: 4000,
                        category: 'Salary',
                    },
                ],
            });

        await request(app).delete(`/transactions/${response.body[0].id}`);

        const transaction = await transactionsRepository.findOne({
            id: response.body.id,
        });

        expect(transaction).toBeFalsy();
    });

    it('should not be able to delete a transaction that does not exists', async () => {
        const response = await request(app).delete(`/transactions/0`);

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
                    title: 'others',
                    id: expect.any(String),
                }),
                expect.objectContaining({
                    title: 'food',
                    id: expect.any(String),
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
