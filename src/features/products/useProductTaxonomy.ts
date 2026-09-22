import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getGenders, getCategories, getSubcategories, getOptions } from './taxonomy.api';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// Backs AddProductScreen's Basics/Inventory/Attributes steps — each list
// is only fetched once its parent selection is known (category needs
// gender, subcategory needs gender+category, size needs subcategory),
// mirroring the admin panel's own cascading Comboboxes.
export function useProductTaxonomy(gender: string, category: string, subcategory: string) {
  const queryClient = useQueryClient();

  const genders = useQuery({
    queryKey: ['taxonomy', 'genders'],
    queryFn: getGenders,
    staleTime: Infinity, // fixed enum on the backend, never changes at runtime
  });

  const categories = useQuery({
    queryKey: ['taxonomy', 'categories', gender],
    queryFn: () => getCategories(gender),
    enabled: !!gender,
  });

  const subcategories = useQuery({
    queryKey: ['taxonomy', 'subcategories', gender, category],
    queryFn: () => getSubcategories(gender, category),
    enabled: !!gender && !!category,
  });

  const colors = useQuery({
    queryKey: ['taxonomy', 'options', 'color'],
    queryFn: () => getOptions('color'),
  });

  const seasons = useQuery({
    queryKey: ['taxonomy', 'options', 'season'],
    queryFn: () => getOptions('season'),
  });

  const sizes = useQuery({
    queryKey: ['taxonomy', 'options', 'size', subcategory],
    queryFn: () => getOptions('size', subcategory),
    enabled: !!subcategory,
  });

  const brands = useQuery({
    queryKey: ['taxonomy', 'options', 'brand'],
    queryFn: () => getOptions('brand'),
  });

  return {
    genderOptions: (genders.data ?? []).map(capitalize),
    categoryOptions: categories.data ?? [],
    subcategoryOptions: subcategories.data ?? [],
    colorOptions: colors.data ?? [],
    seasonOptions: seasons.data ?? [],
    sizeOptions: sizes.data ?? [],
    brandOptions: brands.data ?? [],
    // A freshly-created brand should show up in the picker immediately,
    // without waiting on this hook's own re-render/refetch cycle.
    refreshBrands: () => queryClient.invalidateQueries({ queryKey: ['taxonomy', 'options', 'brand'] }),
  };
}
