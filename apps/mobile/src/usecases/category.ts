import type {
	CategoryRepository,
	ListCategoriesResponse,
} from "@/repositories/category";

export type CategoryService = {
	listCategories: () => Promise<ListCategoriesResponse>;
};

type Deps = {
	repositories: [CategoryRepository];
};

export const getCategoryService = ({
	repositories,
}: Deps): CategoryService => ({
	listCategories: repositories[0].listCategories,
});
