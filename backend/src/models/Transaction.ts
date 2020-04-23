import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import Category from './Category';

@Entity('transactions')
class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('integer')
    value: number;

    @Column()
    type: 'income' | 'outcome';

    // @ManyToOne(type => Category, category => category)
    @ManyToOne(() => Category, { eager: true })
    @JoinColumn({ name: 'category_id' })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    category: Category;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

export default Transaction;
