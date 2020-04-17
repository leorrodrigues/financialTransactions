import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
} from 'typeorm';

export default class InsertCategoryIntoTransaction1587001650952
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'transactions',
            new TableColumn({
                name: 'category_id',
                type: 'uuid',
                generationStrategy: 'uuid',
                default: 'uuid_generate_v4()',
            }),
        );

        await queryRunner.createForeignKey(
            'transactions',
            new TableForeignKey({
                name: 'CategoryId',
                columnNames: ['category_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'categories',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('transactions', 'CategoryId');

        await queryRunner.dropColumn('transactions', 'category_id');
    }
}
