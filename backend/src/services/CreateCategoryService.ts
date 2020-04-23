import { getRepository } from 'typeorm';

import Category from '../models/Category';

interface Request {
    title: string;
}

export default class CreateCategoryService {
    public async execute({ title }: Request): Promise<Category> {
        const categoriesRepository = getRepository(Category);

        const lowercaseTitle = title.toLocaleLowerCase();

        let category = await categoriesRepository.findOne({
            where: { title: lowercaseTitle },
        });

        if (!category) {
            category = categoriesRepository.create({
                title: lowercaseTitle,
            });
            await categoriesRepository.save(category);
        }

        return category;
    }
}
