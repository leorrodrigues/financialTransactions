import request from 'supertest';
import { isUuid } from 'uuidv4';

import { Connection, getConnection } from 'typeorm';
import createConnection from '../database';

import app from '../app';

let connection: Connection;

describe('Transaction', () => {
    beforeAll(async () => {
        connection = await createConnection('test-connection');
        await connection.runMigrations();
    });

    beforeEach(async () => {
        await connection.query('DELETE FROM transactions');
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
        });

        expect(isUuid(response.body.id)).toBe(true);

        expect(response.body).toMatchObject({
            title: 'Loan',
            type: 'income',
            value: 1200,
        });
    });

    it('should be able to list the transactions', async () => {
        await request(app).post('/transactions').send({
            title: 'Salary',
            type: 'income',
            value: 3000,
        });

        await request(app).post('/transactions').send({
            title: 'Bicycle',
            type: 'outcome',
            value: 1500,
        });

        await request(app).post('/transactions').send({
            title: 'Loan',
            type: 'income',
            value: 1200,
        });

        const response = await request(app).get('/transactions');

        expect(response.body.transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                    id: expect.any(String),
                    title: 'Salary',
                    type: 'income',
                    value: 3000,
                }),
                expect.objectContaining({
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                    id: expect.any(String),
                    title: 'Bicycle',
                    type: 'outcome',
                    value: 1500,
                }),
                expect.objectContaining({
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                    id: expect.any(String),
                    title: 'Loan',
                    type: 'income',
                    value: 1200,
                }),
            ]),
        );

        expect(response.body.balance).toMatchObject({
            income: 4200,
            outcome: 1500,
            total: 2700,
        });
    });

    it('should not be able to create outcome transaction without a valid balance', async () => {
        const response = await request(app).post('/transactions').send({
            title: 'Bicycle',
            type: 'outcome',
            value: 3000,
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject(
            expect.objectContaining({
                message: expect.any(String),
                status: expect.any(String),
            }),
        );
    });
});
