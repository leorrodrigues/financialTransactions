import React, { useState, useEffect } from 'react';

import income from '../../assets/income.svg';
import outcome from '../../assets/outcome.svg';
import total from '../../assets/total.svg';

import api from '../../services/api';

import Header from '../../components/Header';

import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import { Container, CardContainer, Card, TableContainer } from './styles';

interface Transaction {
    id: string;
    title: string;
    value: number;
    formattedValue: string;
    formattedDate: string;
    type: 'income' | 'outcome';
    category: { title: string };
    created_at: Date;
}

interface Balance {
    income: number;
    outcome: number;
    total: number;
    formattedIncome: string;
    formattedOutcome: string;
    formattedTotal: string;
}

interface TransactionAndBalance {
    transactions: Transaction[];
    balance: Balance;
}

const Dashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState<Balance>({} as Balance);

    useEffect(() => {
        async function loadTransactions(): Promise<void> {
            const response = await api.get<TransactionAndBalance>(
                '/transactions',
            );
            const transactionsData = response.data.transactions;
            const balanceData = response.data.balance;

            const formattedTransactions = transactionsData.map(
                (transaction) => {
                    const formattedTransaction = {
                        ...transaction,
                        formattedValue: formatCurrency(
                            transaction.value,
                            transaction.type,
                        ),
                        formattedDate: formatDate(transaction.created_at),
                    };
                    return formattedTransaction;
                },
            );

            const formattedBalance = {
                ...balanceData,
                formattedIncome: formatCurrency(balanceData.income, 'income'),
                formattedOutcome: formatCurrency(
                    balanceData.outcome,
                    'outcome',
                ),
                formattedTotal: formatCurrency(balanceData.total, 'income'),
            };

            setTransactions(formattedTransactions);
            setBalance(formattedBalance);
        }
        loadTransactions();
    }, []);

    return (
        <>
            <Header />
            <Container>
                <CardContainer>
                    <Card>
                        <header>
                            <p>Income</p>
                            <img src={income} alt="Income" />
                        </header>
                        <h1 data-testid="balance-income">
                            {balance.formattedIncome}
                        </h1>
                    </Card>
                    <Card>
                        <header>
                            <p>Outcome</p>
                            <img src={outcome} alt="Outcome" />
                        </header>
                        <h1 data-testid="balance-outcome">
                            {balance.formattedOutcome}
                        </h1>
                    </Card>
                    <Card total>
                        <header>
                            <p>Balance</p>
                            <img src={total} alt="Total" />
                        </header>
                        <h1 data-testid="balance-total">
                            {balance.formattedTotal}
                        </h1>
                    </Card>
                </CardContainer>

                <TableContainer>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Value</th>
                                <th>Category</th>
                                <th>Data</th>
                            </tr>
                        </thead>

                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td className="title">
                                        {transaction.title}
                                    </td>
                                    <td className={transaction.type}>
                                        {transaction.formattedValue}
                                    </td>
                                    <td>{transaction.category.title}</td>
                                    <td>{transaction.formattedDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableContainer>
            </Container>
        </>
    );
};

export default Dashboard;
