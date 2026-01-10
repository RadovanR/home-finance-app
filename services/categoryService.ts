
import { supabase } from './supabaseClient';
import { CategoryItem } from '../types';

export const fetchCategories = async (): Promise<CategoryItem[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data as CategoryItem[];
};

export const addCategory = async (category: Omit<CategoryItem, 'id'>): Promise<CategoryItem | null> => {
    const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

    if (error) {
        console.error('Error adding category:', error);
        return null;
    }

    return data as CategoryItem;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        return false;
    }
    return true;
};

export const updateCategory = async (category: CategoryItem): Promise<CategoryItem | null> => {
    const { data, error } = await supabase
        .from('categories')
        .update({ name: category.name, color: category.color, order: category.order })
        .eq('id', category.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating category:', error);
        return null;
    }

    return data as CategoryItem;
};

export const updateCategoryOrder = async (categories: CategoryItem[]): Promise<boolean> => {
    // Prepare updates: needed fields are id and order
    const updates = categories.map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        order: index
    }));

    const { error } = await supabase
        .from('categories')
        .upsert(updates);

    if (error) {
        console.error('Error updating category order:', error);
        return false;
    }
    return true;
};
