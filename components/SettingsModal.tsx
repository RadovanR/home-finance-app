
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Pencil, Check, GripVertical } from 'lucide-react';
import { CategoryItem, Category } from '../types';
import { addCategory, deleteCategory, updateCategory, updateCategoryOrder } from '../services/categoryService';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: CategoryItem[];
    onUpdateCategories: () => void;
}

interface SortableItemProps {
    category: CategoryItem;
    onEdit: (cat: CategoryItem) => void;
    onDelete: (id: string, name: string) => Promise<void> | void;
}

// Separate component for sortable item
const SortableItem: React.FC<SortableItemProps> = ({ category, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Lower opacity for the "placeholder" remaining in the list
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as 'relative',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab', // Force cursor here
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-colors select-none ${isDragging
                ? 'shadow-xl ring-2 ring-indigo-500 bg-indigo-50 z-50 opacity-100 cursor-grabbing'
                : 'hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md hover:scale-[1.01] cursor-grab'
                }`}
        >
            {/* Content Section */}
            <div className="flex items-center gap-3" style={{ cursor: 'inherit' }}>
                <div className="text-gray-300">
                    <GripVertical size={20} />
                </div>
                <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                ></div>
                <span className="font-medium text-gray-800">{category.name}</span>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onEdit(category)}
                    className="p-2 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer relative z-10"
                >
                    <Pencil size={18} />
                </button>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onDelete(category.id, category.name)}
                    className="p-2 text-gray-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer relative z-10"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

interface StaticCategoryItemProps {
    category: CategoryItem;
    onEdit: (cat: CategoryItem) => void;
    onDelete?: (id: string, name: string) => void;
}

const StaticCategoryItem: React.FC<StaticCategoryItemProps> = ({ category, onEdit, onDelete }) => (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg select-none cursor-default opacity-80 bg-gray-50">
        <div className="flex items-center gap-3">
            <div className="text-gray-300 opacity-20">
                <GripVertical size={20} />
            </div>
            <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color }}
            ></div>
            <span className="font-medium text-gray-800">{category.name}</span>
        </div>

        <div className="flex items-center gap-2">
            <button
                onClick={() => onEdit(category)}
                className="p-2 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer"
            >
                <Pencil size={18} />
            </button>
            {onDelete && (
                <button
                    onClick={() => onDelete(category.id, category.name)}
                    className="p-2 text-gray-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, categories, onUpdateCategories }) => {
    const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#94a3b8');
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
    const [localCategories, setLocalCategories] = useState<CategoryItem[]>([]);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum distance to move before drag starts (prevents accidental drags on clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!isOpen) return null;

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsAdding(true);

        if (editingCategory) {
            // Update
            const updatedCat = { ...editingCategory, name: newCategoryName.trim(), color: newCategoryColor };
            const result = await updateCategory(updatedCat);
            if (result) {
                onUpdateCategories();
                setEditingCategory(null);
                setNewCategoryName('');
                setNewCategoryColor('#94a3b8');
            } else {
                alert('Chyba pri úprave kategórie.');
            }
        } else {
            // Add
            // Find if there is an 'Other' category which should stay last
            const currentTabCategories = categories.filter(c => c.type === activeTab).sort((a, b) => (a.order || 0) - (b.order || 0));
            const otherCategory = currentTabCategories.find(c => c.name === Category.OTHER);
            let newOrder = currentTabCategories.length;

            if (otherCategory) {
                // Insert before 'Other'
                newOrder = currentTabCategories.length - 1;
                // Move 'Other' to the end
                await updateCategory({ ...otherCategory, order: currentTabCategories.length });
            }

            const newCategory = {
                name: newCategoryName.trim(),
                type: activeTab,
                color: newCategoryColor,
                order: newOrder
            };

            const added = await addCategory(newCategory);
            if (added) {
                onUpdateCategories();
                setNewCategoryName('');
                setNewCategoryColor('#94a3b8');
            } else {
                alert('Chyba pri ukladaní kategórie.');
            }
        }
        setIsAdding(false);
    };

    const handleEditClick = (cat: CategoryItem) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setNewCategoryColor(cat.color);
        if (cat.type !== activeTab) {
            setActiveTab(cat.type);
        }
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryColor('#94a3b8');
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (window.confirm(`Naozaj chcete vymazať kategóriu "${name}"?`)) {
            const success = await deleteCategory(id);
            if (success) {
                onUpdateCategories();
            } else {
                alert('Chyba pri mazaní kategórie.');
            }
        }
    };

    const filteredCategories = localCategories.filter(c => c.type === activeTab);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // Filter out 'Other' for sorting logic
            const currentDraggables = filteredCategories.filter(c => c.name !== Category.OTHER);

            const oldIndex = currentDraggables.findIndex((c) => c.id === active.id);
            const newIndex = currentDraggables.findIndex((c) => c.id === over?.id);

            // 1. Get the new reordered list for current tab (excluding Other)
            const reorderedSubset = arrayMove(currentDraggables, oldIndex, newIndex) as CategoryItem[];

            // 2. Assign new 'order' values to this subset
            const updatedSubset = reorderedSubset.map((item, idx) => ({
                ...item,
                order: idx
            }));

            // 3. Handle 'Other' category if it exists
            const otherCategory = filteredCategories.find(c => c.name === Category.OTHER);
            let finalSubset = updatedSubset;

            if (otherCategory) {
                const updatedOther = { ...otherCategory, order: updatedSubset.length };
                finalSubset = [...updatedSubset, updatedOther];
            }

            // 4. Update local state by merging this new subset with the items from the other tab
            setLocalCategories(prev => {
                const otherItems = prev.filter(c => c.type !== activeTab);
                return [...otherItems, ...finalSubset];
            });

            // 5. Send update to DB (fire and forget for UI smoothness)
            await updateCategoryOrder(finalSubset);
        }
    };

    const handleClose = () => {
        onUpdateCategories();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Tag size={20} className="text-indigo-600" />
                        Správa Kategórií
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-2">
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Výdavky
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Príjmy
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                    {filteredCategories.filter(c => c.name !== Category.OTHER).length === 0 && !filteredCategories.find(c => c.name === Category.OTHER) ? (
                        <p className="text-center text-gray-500 py-4">Žiadne kategórie.</p>
                    ) : (
                        <>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <SortableContext
                                    items={filteredCategories.filter(c => c.name !== Category.OTHER).map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredCategories.filter(c => c.name !== Category.OTHER).map((cat) => (
                                        <SortableItem
                                            key={cat.id}
                                            category={cat}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteCategory}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {/* Render Other category as static item if it exists */}
                            {filteredCategories.find(c => c.name === Category.OTHER) && (
                                <StaticCategoryItem
                                    category={filteredCategories.find(c => c.name === Category.OTHER)!}
                                    onEdit={handleEditClick}
                                // onDelete={handleDeleteCategory} // Usually we don't delete 'Other', but passing it just in case logic allows
                                />
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{editingCategory ? 'Upraviť kategóriu' : 'Pridať novú kategóriu'}</h3>
                    <form onSubmit={handleSaveCategory} className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Názov kategórie"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {editingCategory ? <Check size={20} /> : <Plus size={20} />}
                                {editingCategory ? 'Uložiť' : 'Pridať'}
                            </button>
                        </div>

                        {editingCategory && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-xs text-gray-500 underline hover:text-gray-700"
                            >
                                Zrušiť úpravu
                            </button>
                        )}

                        <div className="flex items-center gap-4">
                            <label className="text-sm text-gray-500">Farba:</label>
                            <div className="relative overflow-hidden w-10 h-10 rounded-full border border-gray-300 shadow-sm cursor-pointer">
                                <input
                                    type="color"
                                    value={newCategoryColor}
                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{newCategoryColor}</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
