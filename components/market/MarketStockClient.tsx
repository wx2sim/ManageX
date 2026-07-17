'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ServiceCategory, ServiceSubcategory, MarketInput, Recipe, RecipeIngredient } from '@/lib/types';
import { addMarketInput, updateItem, deleteItem, deleteMarketInput, updateMarketInput } from '@/actions/market_logic';
import { addRecipe, produceRecipe, deleteRecipe, updateItemSubcategory, editRecipe } from '@/actions/recipes';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';
import ItemCard from '@/components/service/ItemCard';
import { uploadProductImage } from '@/lib/cloudinary';
import BarcodeScanner from '@/components/stock/BarcodeScanner';

interface MarketStockClientProps {
  items: Item[];
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  marketInputs: (MarketInput & { items: { name: string } | null })[];
  recipes: Recipe[];
  recipeIngredients: RecipeIngredient[];
  isModal?: boolean;
  onSuccessModal?: () => void;
}

const PREDEFINED_ICONS = [
  '💧', '🥤', '🍷', '🍺', '🍼',
  '🍔', '🍟', '🍕', '🌭', '🥪',
  '🚬', '💨', '💊', '🩹', '🧴',
  '💄', '💋', '💅', '💇‍♀️', '👗',
  '🧻', '🧼', '🧽', '🧹', '🗑️',
  '🛍️', '📦', '📱', '🔋', '🔌',
  '🥩', '🧅', '🥔', '🍅', '🥬'
];

const UNITS = ['unit', 'piece', 'g', 'kg', 'ml', 'l'];

export default function MarketStockClient({ items, categories, subcategories, marketInputs, recipes, recipeIngredients, isModal, onSuccessModal }: MarketStockClientProps) {
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isRecipesModalOpen, setIsRecipesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const { t, tError } = useTranslation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'stock_entry' | 'editItemBarcode' | 'newItemBarcode' | 'newAlternateBarcode'>('stock_entry');
  const [newItemBarcode, setNewItemBarcode] = useState('');
  
  // Barcode Edit States
  const [editItemBarcode, setEditItemBarcode] = useState('');
  const [editItemAlternateBarcodes, setEditItemAlternateBarcodes] = useState<string[]>([]);
  const [newAlternateBarcode, setNewAlternateBarcode] = useState('');

  // --- INPUT FORM STATE ---
  const [isPending, startTransition] = useOverlayTransition();
  const [error, setError] = useState<string | null>(null);

  // Edit Input State
  const [editingInput, setEditingInput] = useState<any>(null);
  const [editInputQuantity, setEditInputQuantity] = useState('');
  const [editInputBuyPrice, setEditInputBuyPrice] = useState('');
  const [editInputSellPrice, setEditInputSellPrice] = useState('');
  const [editInputDate, setEditInputDate] = useState('');
  const [editInputCurrentStock, setEditInputCurrentStock] = useState('');

  const [isNewItem, setIsNewItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [newItemType, setNewItemType] = useState<'raw_material' | 'finished'>('finished');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemSubcategoryId, setNewItemSubcategoryId] = useState('');
  const [newItemImage, setNewItemImage] = useState('🛍️');
  const [newItemUnit, setNewItemUnit] = useState('unit');
  const [newItemMinStockAlert, setNewItemMinStockAlert] = useState('');

  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [shoppingDate, setShoppingDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Ledger State
  const [monthFilter, setMonthFilter] = useState('');
  const [lastBoughtPrice, setLastBoughtPrice] = useState<number | null>(null);
  const [lastSellPrice, setLastSellPrice] = useState<number | null>(null);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editSellPrice, setEditSellPrice] = useState('');
  const [editStockQty, setEditStockQty] = useState('');
  const [editMinStockAlert, setEditMinStockAlert] = useState('');
  const [isEditing, startEditTransition] = useOverlayTransition();

  // Identification options state
  const [newItemOption, setNewItemOption] = useState<'icon' | 'gallery' | 'camera'>('icon');
  const [newItemCloudinaryUrl, setNewItemCloudinaryUrl] = useState<string | null>(null);
  const [newItemUploading, setNewItemUploading] = useState(false);
  const [newItemFile, setNewItemFile] = useState<File | null>(null);

  const [editItemIcon, setEditItemIcon] = useState<string | null>(null);
  const [editItemImageUrl, setEditItemImageUrl] = useState<string | null>(null);
  const [editItemOption, setEditItemOption] = useState<'icon' | 'gallery' | 'camera'>('icon');
  const [editItemCloudinaryUrl, setEditItemCloudinaryUrl] = useState<string | null>(null);
  const [editItemUploading, setEditItemUploading] = useState(false);
  const [editShowUploadOptions, setEditShowUploadOptions] = useState(false);
  const [editItemCategoryId, setEditItemCategoryId] = useState('');
  const [editItemSubcategoryId, setEditItemSubcategoryId] = useState('');
  const [editItemFile, setEditItemFile] = useState<File | null>(null);

  const [showAllProducts, setShowAllProducts] = useState(false);

  // Product filtering states
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | null>(null);

  const closeInputModal = () => {
    if (newItemCloudinaryUrl && newItemCloudinaryUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newItemCloudinaryUrl);
    }
    setNewItemFile(null);
    setNewItemCloudinaryUrl(null);
    setIsInputModalOpen(false);
  };

  const closeEditModal = () => {
    if (editItemCloudinaryUrl && editItemCloudinaryUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editItemCloudinaryUrl);
    }
    setEditItemFile(null);
    setEditingItem(null);
  };

  // Local State
  const [localCategories, setLocalCategories] = useState(categories);
  const [localSubcats, setLocalSubcats] = useState(subcategories);

  const finishedProducts = useMemo(() => items.filter(i => i.item_type === 'finished' || !i.item_type).filter(i => i.is_active !== false), [items]);

  const processBarcode = (code: string) => {
    setIsScannerModalOpen(false);
    
    const cleanCode = code.trim();
    // Search for existing item in all items (both finished and raw materials)
    const foundItem = items.find(
      item => item.barcode?.trim() === cleanCode || (item.alternate_barcodes && item.alternate_barcodes.some(b => b.trim() === cleanCode))
    );
    
    if (foundItem) {
      setIsInputModalOpen(true);
      setIsNewItem(false);
      setSelectedItemId(foundItem.id);
      setBuyPrice(foundItem.cost_price.toString());
      setSellPrice(foundItem.sell_price.toString());
      setLastBoughtPrice(foundItem.cost_price);
      setLastSellPrice(foundItem.sell_price);
      setSuccessMessage(t('market.scanner.foundItem') || `Found product: ${foundItem.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setIsInputModalOpen(true);
      setIsNewItem(true);
      setNewItemBarcode(cleanCode);
      setSuccessMessage(t('market.scanner.newItem') || 'New barcode detected. Please add product details.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalCategories(categories); }, [categories]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalSubcats(subcategories); }, [subcategories]);

  const filteredSubcategories = useMemo(() => {
    return localSubcats.filter(s => s.category_id === newItemCategoryId);
  }, [localSubcats, newItemCategoryId]);

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedItemId(val);
    if (val) {
      const target = items.find(i => i.id === val);
      if (target) {
        setBuyPrice(target.cost_price.toString());
        setSellPrice(target.sell_price.toString());
        setLastBoughtPrice(target.cost_price);
        setLastSellPrice(target.sell_price);
      }
    } else {
      setBuyPrice('');
      setSellPrice('');
      setLastBoughtPrice(null);
      setLastSellPrice(null);
    }
  };

  const handleNewItemImageSelect = (file: File) => {
    if (newItemCloudinaryUrl && newItemCloudinaryUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newItemCloudinaryUrl);
    }
    setNewItemFile(file);
    const url = URL.createObjectURL(file);
    setNewItemCloudinaryUrl(url);
  };

  const handleEditItemImageSelect = (file: File) => {
    if (editItemCloudinaryUrl && editItemCloudinaryUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editItemCloudinaryUrl);
    }
    setEditItemFile(file);
    const url = URL.createObjectURL(file);
    setEditItemCloudinaryUrl(url);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewItem && newItemOption !== 'icon' && !newItemFile) {
      setError(t('market.input.uploadRequired') || 'Please upload an image first.');
      return;
    }
    setError(null);
    startTransition(async () => {
      let finalImageUrl = null;

      if (isNewItem && newItemOption !== 'icon' && newItemFile) {
        setNewItemUploading(true);
        try {
          finalImageUrl = await uploadProductImage(newItemFile);
        } catch (err: any) {
          console.error(err);
          setError(tError(err.message || 'Failed to upload image.'));
          setNewItemUploading(false);
          return;
        }
        setNewItemUploading(false);
      }

      const data = {
        item_id: isNewItem ? undefined : selectedItemId,
        name: isNewItem ? newItemName : undefined,
        item_type: isNewItem ? newItemType : undefined,
        unit: isNewItem ? (newItemType === 'raw_material' ? newItemUnit : 'unit') : undefined,
        subcategory_id: (isNewItem && newItemType === 'finished') ? newItemSubcategoryId : undefined,
        image_url: isNewItem && newItemOption !== 'icon' ? finalImageUrl : null,
        icon: isNewItem && newItemOption === 'icon' ? newItemImage : null,
        min_stock_alert: (isNewItem && newItemMinStockAlert) ? Number(newItemMinStockAlert) : null,
        barcode: (isNewItem && newItemBarcode) ? newItemBarcode.trim() : undefined,
        quantity: Number(quantity),
        unit_buy_price: Number(buyPrice),
        unit_sell_price: Number(sellPrice),
        shopping_date: new Date(shoppingDate).toISOString(),
      };

      const res = await addMarketInput(data);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        if (newItemCloudinaryUrl && newItemCloudinaryUrl.startsWith('blob:')) {
          URL.revokeObjectURL(newItemCloudinaryUrl);
        }
        setSelectedItemId('');
        setNewItemName('');
        setNewItemMinStockAlert('');
        setNewItemBarcode('');
        setQuantity('');
        setBuyPrice('');
        setSellPrice('');
        setIsNewItem(false);
        setNewItemOption('icon');
        setNewItemCloudinaryUrl(null);
        setNewItemFile(null);

        if (isModal && onSuccessModal) {
          onSuccessModal();
        } else {
          closeInputModal();
        }
      }
    });
  };

  const filteredLedger = useMemo(() => {
    if (!monthFilter) return marketInputs;
    return marketInputs.filter(m => m.shopping_date.startsWith(monthFilter));
  }, [marketInputs, monthFilter]);

  const rawMaterials = items.filter(i => i.item_type === 'raw_material');

  const filteredProductsForDisplay = useMemo(() => {
    return finishedProducts.filter(item => {
      // Stock check (original logic was item.stock_quantity > 0)
      const hasStock = item.stock_quantity > 0;
      if (!hasStock) return false;

      // Category filter
      if (filterCategoryId) {
        const sub = localSubcats.find(s => s.id === item.subcategory_id);
        if (!sub || sub.category_id !== filterCategoryId) return false;
      }

      // Subcategory filter
      if (filterSubcategoryId) {
        if (item.subcategory_id !== filterSubcategoryId) return false;
      }

      return true;
    });
  }, [finishedProducts, filterCategoryId, filterSubcategoryId, localSubcats]);

  const sortedCategoriesForFilter = useMemo(() => {
    return [...localCategories].sort((a, b) => {
      const aHasProducts = finishedProducts.some(p => {
        const sub = localSubcats.find(s => s.id === p.subcategory_id);
        return sub && sub.category_id === a.id;
      });
      const bHasProducts = finishedProducts.some(p => {
        const sub = localSubcats.find(s => s.id === p.subcategory_id);
        return sub && sub.category_id === b.id;
      });

      if (aHasProducts && !bHasProducts) return -1;
      if (!aHasProducts && bHasProducts) return 1;
      return a.position - b.position;
    });
  }, [localCategories, finishedProducts, localSubcats]);

  const sortedSubcategoriesForFilter = useMemo(() => {
    return [...localSubcats].sort((a, b) => {
      const aHasProducts = finishedProducts.some(p => p.subcategory_id === a.id);
      const bHasProducts = finishedProducts.some(p => p.subcategory_id === b.id);

      if (aHasProducts && !bHasProducts) return -1;
      if (!aHasProducts && bHasProducts) return 1;
      return a.position - b.position;
    });
  }, [localSubcats, finishedProducts]);

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditCostPrice(item.cost_price.toString());
    setEditSellPrice(item.sell_price.toString());
    setEditStockQty(item.stock_quantity.toString());
    setEditMinStockAlert(item.min_stock_alert !== undefined && item.min_stock_alert !== null ? item.min_stock_alert.toString() : '');
    setEditItemBarcode(item.barcode || '');
    setEditItemAlternateBarcodes(item.alternate_barcodes || []);
    
    // Check if image_url is an emoji (legacy data) or actual URL
    const isLegacyEmoji = item.image_url && !item.image_url.startsWith('http') && !item.image_url.startsWith('/');
    const currentIcon = item.icon || (isLegacyEmoji ? item.image_url : null);
    const currentImgUrl = item.image_url && !isLegacyEmoji ? item.image_url : null;

    const currentSub = localSubcats.find(s => s.id === item.subcategory_id);
    setEditItemCategoryId(currentSub ? currentSub.category_id : '');
    setEditItemSubcategoryId(item.subcategory_id || '');

    setEditItemIcon(currentIcon || '🛍️');
    setEditItemImageUrl(currentImgUrl);
    setEditItemOption(currentImgUrl ? 'gallery' : 'icon');
    setEditItemCloudinaryUrl(null);
    setEditItemUploading(false);
    setEditShowUploadOptions(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (editShowUploadOptions && editItemOption !== 'icon' && !editItemFile && !editItemImageUrl) {
      setError(t('market.input.uploadRequired') || 'Please upload an image first.');
      return;
    }
    setError(null);
    startEditTransition(async () => {
      const updatedData: any = {
        name: editItemName,
        cost_price: Number(editCostPrice),
        sell_price: Number(editSellPrice),
        stock_quantity: Number(editStockQty),
        min_stock_alert: editMinStockAlert ? Number(editMinStockAlert) : null,
        subcategory_id: editItemSubcategoryId || null,
        barcode: editItemBarcode || null,
        alternate_barcodes: editItemAlternateBarcodes
      };

      if (editShowUploadOptions) {
        if (editItemOption === 'icon') {
          updatedData.icon = editItemIcon;
          updatedData.image_url = null;
        } else {
          updatedData.icon = null;
          if (editItemFile) {
            setEditItemUploading(true);
            try {
              const url = await uploadProductImage(editItemFile);
              updatedData.image_url = url;
            } catch (err: any) {
              console.error(err);
              setError(tError(err.message || 'Failed to upload image.'));
              setEditItemUploading(false);
              return;
            }
            setEditItemUploading(false);
          }
        }
      }

      const res = await updateItem(editingItem.id, updatedData);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        if (editItemCloudinaryUrl && editItemCloudinaryUrl.startsWith('blob:')) {
          URL.revokeObjectURL(editItemCloudinaryUrl);
        }
        setEditItemFile(null);
        setEditingItem(null);
      }
    });
  };

  const handleDeleteItem = async (item: Item) => {
    if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this product?')) {
      startTransition(async () => {
        const res = await deleteItem(item.id);
        if (res?.error) setError(tError(res.error));
      });
    }
  };

  const handleDeleteInput = async (inputId: string) => {
    if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this purchase? This will reduce your stock.')) {
      startTransition(async () => {
        const res = await deleteMarketInput(inputId);
        if (res?.error) setError(tError(res.error));
      });
    }
  };

  const handleEditInputClick = (input: any) => {
    setEditingInput(input);
    setEditInputQuantity(input.quantity.toString());
    setEditInputBuyPrice(input.unit_buy_price.toString());
    setEditInputSellPrice(input.unit_sell_price.toString());
    setEditInputDate(input.shopping_date.split('T')[0]);

    // Find the current item to populate the current stock
    const item = items.find(i => i.id === input.item_id);
    if (item) {
      setEditInputCurrentStock(item.stock_quantity.toString());
    } else {
      setEditInputCurrentStock('');
    }
  };

  const handleUpdateInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInput) return;
    setError(null);
    startTransition(async () => {
      const res = await updateMarketInput(editingInput.id, {
        quantity: Number(editInputQuantity),
        unit_buy_price: Number(editInputBuyPrice),
        unit_sell_price: Number(editInputSellPrice),
        shopping_date: editInputDate,
        current_stock: editInputCurrentStock !== '' ? Number(editInputCurrentStock) : undefined
      });
      if (res?.error) setError(tError(res.error));
      else setEditingInput(null);
    });
  };



  return (
    <div className={`space-y-6 ${isModal ? '' : 'animate-in slide-in-from-bottom-4 duration-500'}`}>

      {!isModal && (
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-600 font-bold font-sans">{t('market.header.subtitle') || 'Inventory & Purchases'}</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{t('market.header.title') || 'Market Stock'}</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t('market.header.desc') || 'Log wholesale grocery purchases, track inventory costs, and manage house supplies.'}
          </p>
        </div>
      )}

      {/* Available Products Grid */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">{t('market.input.existingProduct') || 'Available Products'}</h2>
          {finishedProducts.filter(item => item.stock_quantity > 0).length > 5 && (
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              {showAllProducts ? t('common.showLess') || 'Show less' : t('common.loadMore') || 'Load more'}
            </button>
          )}
        </div>

        {/* Category & Subcategory Filter Tabs */}
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-3xl border border-zinc-200/50 mb-4">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setFilterCategoryId(null);
                setFilterSubcategoryId(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border ${
                filterCategoryId === null
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25'
                  : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
              }`}
            >
              📂 {t('market.input.allCategories') || 'All Categories'}
            </button>
            
            {sortedCategoriesForFilter.map((cat) => {
              const isSelected = filterCategoryId === cat.id;
              // Check if category has any products in stock
              const hasProducts = finishedProducts.some(p => {
                const sub = localSubcats.find(s => s.id === p.subcategory_id);
                return sub && sub.category_id === cat.id;
              });

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setFilterCategoryId(cat.id);
                    setFilterSubcategoryId(null); // Reset subcategory when changing category
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25'
                      : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                  } ${!hasProducts && !isSelected ? 'opacity-60 border-dashed saturate-50' : ''}`}
                >
                  <span className="text-sm select-none">{cat.icon || '📁'}</span>
                  <span>{cat.name.replace('_', ' ')}</span>
                  {!hasProducts && <span className="text-[9px] text-zinc-400 font-normal ml-0.5">(0)</span>}
                </button>
              );
            })}
          </div>

          {/* Subcategory Tabs (Render only if a category is selected) */}
          {filterCategoryId && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-dashed border-zinc-200 pt-2.5 animate-in slide-in-from-top-2 duration-200">
              <button
                type="button"
                onClick={() => setFilterSubcategoryId(null)}
                className={`px-3 py-1.5 rounded-full text-xxs font-bold transition whitespace-nowrap border ${
                  filterSubcategoryId === null
                    ? 'bg-zinc-800 text-white border-zinc-800 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                📄 {t('market.input.allSubcategories') || 'All Subcategories'}
              </button>

              {sortedSubcategoriesForFilter
                .filter((sub) => sub.category_id === filterCategoryId)
                .map((sub) => {
                  const isSelected = filterSubcategoryId === sub.id;
                  // Check if subcategory has any products in stock
                  const hasProducts = finishedProducts.some(p => p.subcategory_id === sub.id);

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setFilterSubcategoryId(sub.id)}
                      className={`px-3 py-1.5 rounded-full text-xxs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-zinc-800 text-white border-zinc-800 shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                      } ${!hasProducts && !isSelected ? 'opacity-60 border-dashed saturate-50' : ''}`}
                    >
                      <span>{sub.icon || '📁'}</span>
                      <span>{sub.name}</span>
                      {!hasProducts && <span className="text-[8px] text-zinc-400 font-normal ml-0.5">(0)</span>}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {filteredProductsForDisplay.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">{t('common.noData') || 'No products available matching the filters.'}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredProductsForDisplay.slice(0, showAllProducts ? undefined : 5).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  readonly={true}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
            {filteredProductsForDisplay.length > 5 && !showAllProducts && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowAllProducts(true)}
                  className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-full transition flex items-center gap-2"
                >
                  {t('common.loadMore') || 'Load more'}
                  <span className="text-xs">↓</span>
                </button>
              </div>
            )}
            {showAllProducts && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowAllProducts(false)}
                  className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-full transition flex items-center gap-2"
                >
                  {t('common.showLess') || 'Show less'}
                  <span className="text-xs">↑</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Quick Action Badges */}
      {!isModal && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => {
              setScannerMode('stock_entry');
              setIsScannerModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-200 transition group"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📷
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.scanner') || 'Scan Product'}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('market.tabs.scannerDesc') || 'Scan barcode'}</p>
          </button>

          <button
            onClick={() => setIsInputModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-200 transition group"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📥
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.input') || 'Stock Entry'}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('market.tabs.inputDesc') || 'Ajouter un produit ou matière'}</p>
          </button>

          <button
            onClick={() => setIsRecipesModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:amber-200 transition group"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.recipes') || 'Recipes & BOM'}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('market.tabs.recipesDesc') || 'Gérer les nomenclatures'}</p>
          </button>

          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:indigo-200 transition group"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.categories')}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('market.tabs.categoriesDesc') || 'Structurer le catalogue'}</p>
          </button>
        </div>
      )}


      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <BarcodeScanner 
            onScan={(code) => {
              const cleanCode = code.trim();
              if (scannerMode === 'stock_entry') {
                processBarcode(cleanCode);
              } else if (scannerMode === 'editItemBarcode') {
                setEditItemBarcode(cleanCode);
                setIsScannerModalOpen(false);
              } else if (scannerMode === 'newItemBarcode') {
                setNewItemBarcode(cleanCode);
                setIsScannerModalOpen(false);
              } else if (scannerMode === 'newAlternateBarcode') {
                setNewAlternateBarcode(cleanCode);
                setIsScannerModalOpen(false);
              }
            }} 
            onClose={() => setIsScannerModalOpen(false)} 
          />
        </div>
      )}

      {isInputModalOpen && (
        <div 
          onClick={closeInputModal}
          className="fixed inset-0 z-40 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-2xl max-w-2xl w-full max-h-full md:max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 my-auto"
          >
            <button onClick={closeInputModal} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold">&times;</button>

            <h2 className="text-xl font-bold text-zinc-900 mb-6">{t('market.input.title')}</h2>

            <form onSubmit={handleInputSubmit} className="space-y-6">
              <div className="flex items-center gap-4 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200/60 inline-flex">
                <button
                  type="button"
                  onClick={() => setIsNewItem(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!isNewItem ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  {t('market.input.existingProduct')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewItem(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isNewItem ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  {t('market.input.addNewProduct')}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                {!isNewItem ? (
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      {t('market.input.selectProduct')}
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={handleItemSelect}
                      required={!isNewItem}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">{t('market.input.chooseItem')}</option>

                      {rawMaterials.length > 0 && (
                        <optgroup label={t('market.recipes.rawMaterials') || 'RAW MATERIALS'}>
                          {rawMaterials.map(i => (
                            <option key={i.id} value={i.id}>{i.name} ({i.stock_quantity} {i.unit})</option>
                          ))}
                        </optgroup>
                      )}

                      {localCategories.map(cat => (
                        <optgroup key={cat.id} label={cat.name.replace('_', ' ').toUpperCase()}>
                          {finishedProducts
                            .filter(i => {
                              const sub = subcategories.find(s => s.id === i.subcategory_id);
                              return sub?.category_id === cat.id;
                            })
                            .map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({t('market.input.inStock')}: {i.stock_quantity})</option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    {selectedItemId && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm overflow-hidden shrink-0">
                          {(() => {
                            const selectedItem = items.find(i => i.id === selectedItemId);
                            if (!selectedItem) return '🛍️';
                            const hasImageUrl = selectedItem.image_url && (selectedItem.image_url.startsWith('http') || selectedItem.image_url.startsWith('/'));
                            const hasIcon = !!selectedItem.icon;
                            const isLegacyEmoji = selectedItem.image_url && !selectedItem.image_url.startsWith('http') && !selectedItem.image_url.startsWith('/');
                            if (hasImageUrl) return <img src={selectedItem.image_url!} alt={selectedItem.name} className="w-full h-full object-cover" />;
                            if (hasIcon) return selectedItem.icon;
                            if (isLegacyEmoji) return selectedItem.image_url;
                            return '🛍️';
                          })()}
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900">{items.find(i => i.id === selectedItemId)?.name}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{items.find(i => i.id === selectedItemId)?.barcode ? `Barcode: ${items.find(i => i.id === selectedItemId)?.barcode}` : ''}</p>
                          <p className="text-xs font-bold text-emerald-700 mt-1">{t('market.input.inStock') || 'In Stock'}: {items.find(i => i.id === selectedItemId)?.stock_quantity || 0}</p>
                        </div>
                      </div>
                    )}
                    {selectedItemId && lastBoughtPrice !== null && (
                      <p className="mt-2 text-xs text-emerald-700 font-medium bg-emerald-100/50 p-2 rounded-lg border border-emerald-100">
                        {t('market.input.lastBoughtFor').replace('{buyPrice}', formatDZD(lastBoughtPrice)).replace('{sellPrice}', formatDZD(lastSellPrice || 0))}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewItemType('raw_material')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${newItemType === 'raw_material' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white border border-zinc-200 text-zinc-500'}`}
                      >
                        {t('market.recipes.rawMaterialToggle') || 'Raw Material (Bulk)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemType('finished')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${newItemType === 'finished' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-white border border-zinc-200 text-zinc-500'}`}
                      >
                        {t('market.recipes.finishedProductToggle') || 'Finished Product'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        {t('market.input.newProductName')}
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        required={isNewItem}
                        placeholder={t('market.input.newProductNamePlaceholder')}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        {t('market.input.barcode') || 'Barcode (Optional)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newItemBarcode}
                          onChange={(e) => setNewItemBarcode(e.target.value)}
                          placeholder="Scan or enter barcode"
                          className="flex-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScannerMode('newItemBarcode');
                            setIsScannerModalOpen(true);
                          }}
                          className="px-4 py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-lg hover:bg-emerald-200"
                          title="Scan Barcode"
                        >
                          📷
                        </button>
                      </div>
                    </div>

                    {newItemType === 'raw_material' && (
                      <div>
                        <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                          {t('market.recipes.unitLabel') || 'Unit of Measurement'}
                        </label>
                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    )}

                    {newItemType === 'finished' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                            {t('market.input.category')}
                          </label>
                          <select
                            value={newItemCategoryId}
                            onChange={(e) => setNewItemCategoryId(e.target.value)}
                            required={isNewItem && newItemType === 'finished'}
                            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">{t('market.input.choose')}</option>
                            {localCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                            {t('market.input.subcategory')}
                          </label>
                          <select
                            value={newItemSubcategoryId}
                            onChange={(e) => setNewItemSubcategoryId(e.target.value)}
                            required={isNewItem && newItemType === 'finished'}
                            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                            disabled={!newItemCategoryId}
                          >
                            <option value="">{t('market.input.choose')}</option>
                            {filteredSubcategories.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        {t('market.input.productIdentification') || 'Product Identification'}
                      </label>
                      <div className="flex gap-2 p-1 bg-zinc-50 rounded-xl border border-zinc-200 mb-4">
                        <button
                          type="button"
                          onClick={() => setNewItemOption('icon')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${newItemOption === 'icon' ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option A: Icon
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItemOption('gallery')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${newItemOption === 'gallery' ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option B: Gallery
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItemOption('camera')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${newItemOption === 'camera' ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option C: Camera
                        </button>
                      </div>

                      {newItemOption === 'icon' && (
                        <div>
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            {t('market.input.selectIcon') || 'Select Emoji Icon'}
                          </label>
                          <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-xl border border-emerald-200 max-h-32 overflow-y-auto">
                            {PREDEFINED_ICONS.map(icon => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => setNewItemImage(icon)}
                                className={`text-2xl p-1 rounded-lg transition hover:bg-emerald-50 hover:scale-110 ${newItemImage === icon ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110' : ''}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {newItemOption === 'gallery' && (
                        <div className="space-y-3">
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Upload from Gallery
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleNewItemImageSelect(file);
                            }}
                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                          />
                          {newItemCloudinaryUrl && (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={newItemCloudinaryUrl} alt="Uploaded preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center font-bold text-emerald-600">Selected Preview</p>
                            </div>
                          )}
                        </div>
                      )}

                      {newItemOption === 'camera' && (
                        <div className="space-y-3">
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Take Photo with Camera
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                              📷 Take Photo
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleNewItemImageSelect(file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {newItemCloudinaryUrl && (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={newItemCloudinaryUrl} alt="Captured preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center font-bold text-emerald-600">Selected Preview</p>
                            </div>
                          )}
                        </div>
                      )}


                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        {t('market.input.minStockAlert') || 'Alerte Stock Minimum (Min Stock Alert)'}
                      </label>
                      <input
                        type="number"
                        value={newItemMinStockAlert}
                        onChange={(e) => setNewItemMinStockAlert(e.target.value)}
                        placeholder={t('market.input.optionalAlert') || 'e.g. 5 (Optionnel)'}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    {t('market.input.quantity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder={t('market.input.quantityPlaceholder')}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    {t('market.input.buyPrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    required
                    placeholder="DZD"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    {t('market.input.sellPrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    required={newItemType === 'finished'}
                    disabled={newItemType === 'raw_material'}
                    placeholder={newItemType === 'raw_material' ? 'N/A' : 'DZD'}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    {t('market.input.date')}
                  </label>
                  <input
                    type="date"
                    value={shoppingDate}
                    onChange={(e) => setShoppingDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 text-sm font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? t('market.input.loggingPurchase') : t('market.input.logPurchase')}
              </button>


            </form>
          </div>
        </div>
      )}

      {isRecipesModalOpen && (
        <div 
          onClick={() => setIsRecipesModalOpen(false)}
          className="fixed inset-0 z-40 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-full md:max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 my-auto"
          >
            <button onClick={() => setIsRecipesModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold z-10">&times;</button>
            <RecipesTab
              items={items}
              categories={localCategories}
              subcategories={localSubcats}
              recipes={recipes}
              recipeIngredients={recipeIngredients}
              t={t}
              tError={tError}
              isModal={isModal}
              onSuccessModal={onSuccessModal ? () => {
                setSuccessMessage(t('common.success') || 'Success!');
                setTimeout(() => onSuccessModal(), 1500);
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Ledger is always visible now */}
      {!isModal && (
        <div className="mt-12">
          <LedgerTab
            marketInputs={marketInputs}
            items={items}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            t={t}
            handleDeleteInput={handleDeleteInput}
            handleEditInputClick={handleEditInputClick}
          />
        </div>
      )}

      {isCategoriesModalOpen && (
        <div 
          onClick={() => setIsCategoriesModalOpen(false)}
          className="fixed inset-0 z-40 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-full md:max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 my-auto"
          >
            <button onClick={() => setIsCategoriesModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold z-10">&times;</button>
            <div className="mt-4">
              <CategoryManagementTab
                categories={localCategories}
                subcategories={localSubcats}
                onCategoryAdded={(cat: ServiceCategory) => setLocalCategories(prev => [...prev, cat].sort((a, b) => a.position - b.position))}
                onSubcategoryAdded={(sub: ServiceSubcategory) => setLocalSubcats(prev => [...prev, sub].sort((a, b) => a.position - b.position))}
                onCategoryDeleted={(id: string) => setLocalCategories(prev => prev.filter(c => c.id !== id))}
                onSubcategoryDeleted={(id: string) => setLocalSubcats(prev => prev.filter(s => s.id !== id))}
                onCategoryUpdated={(cat: ServiceCategory) => setLocalCategories(prev => prev.map(c => c.id === cat.id ? cat : c))}
                onSubcategoryUpdated={(sub: ServiceSubcategory) => setLocalSubcats(prev => prev.map(s => s.id === sub.id ? sub : s))}
                t={t}
                tError={tError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div 
          onClick={closeEditModal}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-xl max-h-full md:max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 my-auto"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">{t('common.edit') || 'Edit Product'}</h3>
                <button onClick={closeEditModal} className="text-zinc-400 hover:text-zinc-600 text-2xl font-bold transition">&times;</button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.input.productName') || 'Product Name'}</label>
                  <input type="text" value={editItemName} onChange={e => setEditItemName(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.input.buyPrice') || 'Buy Price'}</label>
                    <input type="number" value={editCostPrice} onChange={e => setEditCostPrice(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.input.sellPrice') || 'Sell Price'}</label>
                    <input type="number" value={editSellPrice} onChange={e => setEditSellPrice(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.input.quantity') || 'Quantity in Stock'}</label>
                  <input type="number" value={editStockQty} onChange={e => setEditStockQty(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>

                {/* Category & Subcategory Select */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      {t('market.input.category') || 'Category'}
                    </label>
                    <select
                      value={editItemCategoryId}
                      onChange={(e) => {
                        setEditItemCategoryId(e.target.value);
                        setEditItemSubcategoryId(''); // Reset subcategory when category changes
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">{t('market.input.choose') || '-- Choose --'}</option>
                      {localCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon || '📁'} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      {t('market.input.subcategory') || 'Subcategory'}
                    </label>
                    <select
                      value={editItemSubcategoryId}
                      onChange={(e) => setEditItemSubcategoryId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                      disabled={!editItemCategoryId}
                    >
                      <option value="">{t('market.input.choose') || '-- Choose --'}</option>
                      {localSubcats
                        .filter(s => s.category_id === editItemCategoryId)
                        .map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.icon || '📁'} {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.input.minStockAlert') || 'Alerte Stock Minimum (Min Stock Alert)'}</label>
                  <input type="number" value={editMinStockAlert} onChange={e => setEditMinStockAlert(e.target.value)} placeholder={t('market.input.optionalAlert') || 'e.g. 5 (Optionnel)'} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>

                {/* Linked Barcodes Section */}
                <div className="pt-2 border-t border-zinc-100">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Linked Barcodes
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editItemBarcode}
                        onChange={(e) => setEditItemBarcode(e.target.value)}
                        placeholder="Primary Barcode"
                        className="flex-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerMode('editItemBarcode');
                          setIsScannerModalOpen(true);
                        }}
                        className="px-4 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-lg hover:bg-zinc-200 transition"
                        title="Scan Barcode"
                      >
                        📷
                      </button>
                    </div>
                    {editItemAlternateBarcodes.length > 0 && (
                      <div className="space-y-2">
                        {editItemAlternateBarcodes.map((code, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={code}
                              readOnly
                              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setEditItemAlternateBarcodes(prev => prev.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAlternateBarcode}
                        onChange={(e) => setNewAlternateBarcode(e.target.value)}
                        placeholder="Add alternate barcode"
                        className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newAlternateBarcode.trim()) {
                              setEditItemAlternateBarcodes(prev => [...prev, newAlternateBarcode.trim()]);
                              setNewAlternateBarcode('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerMode('newAlternateBarcode');
                          setIsScannerModalOpen(true);
                        }}
                        className="px-3 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-lg hover:bg-zinc-200 transition"
                        title="Scan Barcode"
                      >
                        📷
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newAlternateBarcode.trim()) {
                            setEditItemAlternateBarcodes(prev => [...prev, newAlternateBarcode.trim()]);
                            setNewAlternateBarcode('');
                          }
                        }}
                        className="px-4 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-sm hover:bg-zinc-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Identification Section */}
                <div className="pt-2 border-t border-zinc-100">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Product Media
                  </label>
                  
                  {!editShowUploadOptions ? (
                    <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {editItemImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editItemImageUrl}
                            alt={editItemName}
                            className="w-12 h-12 object-cover rounded-lg border border-zinc-200"
                          />
                        ) : (
                          <span className="text-3xl select-none">{editItemIcon}</span>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-zinc-700">
                            {editItemImageUrl ? 'Image URL' : 'Emoji Icon'}
                          </p>
                          {editItemImageUrl ? (
                            <p className="text-xxs text-zinc-400 line-clamp-1">Cloudinary URL Active</p>
                          ) : (
                            <p className="text-xxs text-zinc-400">Fallback icon: {editItemIcon}</p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditShowUploadOptions(true)}
                        className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
                      >
                        {editItemImageUrl ? 'Change Image' : 'Add Photo'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 bg-zinc-50/50 border border-zinc-200 rounded-2xl animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">Edit Identification:</span>
                        <button
                          type="button"
                          onClick={() => setEditShowUploadOptions(false)}
                          className="text-xs text-rose-600 font-semibold"
                        >
                          Cancel Change
                        </button>
                      </div>

                      <div className="flex gap-2 p-1 bg-white rounded-xl border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setEditItemOption('icon')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${editItemOption === 'icon' ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option A: Icon
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditItemOption('gallery')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${editItemOption === 'gallery' ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option B: Gallery
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditItemOption('camera')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${editItemOption === 'camera' ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          Option C: Camera
                        </button>
                      </div>

                      {editItemOption === 'icon' && (
                        <div>
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Select Icon
                          </label>
                          <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-xl border border-zinc-200 max-h-32 overflow-y-auto">
                            {PREDEFINED_ICONS.map(icon => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => setEditItemIcon(icon)}
                                className={`text-2xl p-1 rounded-lg transition hover:bg-zinc-50 hover:scale-110 ${editItemIcon === icon ? 'bg-zinc-100 ring-2 ring-zinc-500 scale-110' : ''}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {editItemOption === 'gallery' && (
                        <div className="space-y-3">
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Upload from Gallery
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleEditItemImageSelect(file);
                            }}
                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                          />
                          {editItemCloudinaryUrl ? (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={editItemCloudinaryUrl} alt="Uploaded preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center font-bold text-emerald-600">Selected Preview</p>
                            </div>
                          ) : editItemImageUrl ? (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={editItemImageUrl} alt="Current preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center">Current Image</p>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {editItemOption === 'camera' && (
                        <div className="space-y-3">
                          <label className="block text-xxs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Take Photo with Camera
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-950 text-white text-xs font-bold rounded-xl shadow-sm transition">
                              📷 Take Photo
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleEditItemImageSelect(file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {editItemCloudinaryUrl ? (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={editItemCloudinaryUrl} alt="Captured preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center font-bold text-emerald-600">Selected Preview</p>
                            </div>
                          ) : editItemImageUrl ? (
                            <div className="mt-2 p-2 bg-white border border-zinc-200 rounded-xl inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={editItemImageUrl} alt="Current preview" className="h-20 w-20 object-cover rounded-lg" />
                              <p className="text-xxs text-zinc-400 mt-1 text-center">Current Image</p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeEditModal} className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200">
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button type="submit" disabled={isEditing} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                    {isEditing ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Market Input Modal */}
      {editingInput && (
        <div 
          onClick={() => setEditingInput(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-emerald-200 bg-white shadow-2xl max-h-full md:max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150 my-auto"
          >
            <div className="flex items-center justify-between border-b border-emerald-100 p-5 bg-white">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">{t('market.input.editPurchase') || 'Edit Purchase'}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{editingInput.items?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInput(null)}
                className="text-lg text-zinc-400 hover:text-zinc-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateInput} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">{t('common.date') || 'Date'}</label>
                <input
                  type="date"
                  value={editInputDate}
                  onChange={e => setEditInputDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm transition focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">{t('market.input.quantityPurchased') || 'Quantity (Purchased)'}</label>
                  <input
                    type="number"
                    value={editInputQuantity}
                    onChange={e => setEditInputQuantity(e.target.value)}
                    min="1"
                    required
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm transition focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">{t('market.input.currentStock') || 'Current Stock'}</label>
                  <input
                    type="number"
                    value={editInputCurrentStock}
                    onChange={e => setEditInputCurrentStock(e.target.value)}
                    min="0"
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm transition focus:border-amber-400 focus:outline-none font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">{t('market.input.buyPrice') || 'Buy Price'} (/u)</label>
                <input
                  type="number"
                  value={editInputBuyPrice}
                  onChange={e => setEditInputBuyPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm transition focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">{t('market.input.sellPrice') || 'Sell Price'} (/u)</label>
                <input
                  type="number"
                  value={editInputSellPrice}
                  onChange={e => setEditInputSellPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm transition focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInput(null)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENTS --- //

function RecipesTab({ items, categories, subcategories, recipes, recipeIngredients, t, tError, isModal, onSuccessModal }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<RecipeIngredient[]>([]);
  const [produceRecipeId, setProduceRecipeId] = useState<string | null>(null);

  const rawMaterials = items.filter((i: Item) => i.item_type === 'raw_material');
  const finishedProducts = items.filter((i: Item) => i.item_type === 'finished' || !i.item_type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900">{t('market.recipes.title') || 'Recipes & Bill of Materials'}</h2>
        {!isCreating && !editingRecipe && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700"
          >
            {t('market.recipes.createNew') || '+ Create Recipe'}
          </button>
        )}
      </div>

      {isCreating || editingRecipe ? (
        <RecipeForm
          finishedProducts={finishedProducts}
          allItems={items}
          categories={categories}
          subcategories={subcategories}
          editingRecipe={editingRecipe}
          editingIngredients={editingIngredients}
          onCancel={() => {
            setIsCreating(false);
            setEditingRecipe(null);
            setEditingIngredients([]);
          }}
          t={t}
          tError={tError}
          isModal={isModal}
          onSuccessModal={onSuccessModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.length === 0 ? (
            <p className="text-zinc-500 text-sm p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              {t('market.recipes.noRecipes') || 'No recipes found. Create one to enable production.'}
            </p>
          ) : (
            recipes.map((r: Recipe) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                ingredients={recipeIngredients.filter((ri: RecipeIngredient) => ri.recipe_id === r.id)}
                onProduce={() => setProduceRecipeId(r.id)}
                onEdit={() => {
                  setEditingRecipe(r);
                  setEditingIngredients(recipeIngredients.filter((ri: RecipeIngredient) => ri.recipe_id === r.id));
                }}
                t={t}
                tError={tError}
              />
            ))
          )}
        </div>
      )}

      {produceRecipeId && (
        <ProduceModal
          recipeId={produceRecipeId}
          recipe={recipes.find((r: Recipe) => r.id === produceRecipeId)}
          ingredients={recipeIngredients.filter((ri: RecipeIngredient) => ri.recipe_id === produceRecipeId)}
          rawMaterials={rawMaterials}
          categories={categories}
          subcategories={subcategories}
          onClose={() => setProduceRecipeId(null)}
          t={t}
          tError={tError}
          isModal={isModal}
          onSuccessModal={onSuccessModal}
        />
      )}
    </div>
  );
}

function RecipeForm({ finishedProducts, allItems, categories, subcategories, onCancel, t, tError, isModal, onSuccessModal, editingRecipe, editingIngredients }: any) {
  const [isPending, startTransition] = useOverlayTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [finishedProductId, setFinishedProductId] = useState(editingRecipe ? editingRecipe.finished_product_id : '');

  // Fields for new product
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductSubcategoryId, setNewProductSubcategoryId] = useState('');
  const [newProductSellPrice, setNewProductSellPrice] = useState('');

  const [batchQuantity, setBatchQuantity] = useState(editingRecipe ? editingRecipe.batch_quantity.toString() : '1');
  const [ingredients, setIngredients] = useState<{ raw_material_id: string; quantity_needed: string }[]>(
    editingRecipe && editingIngredients?.length > 0
      ? editingIngredients.map((i: any) => ({ raw_material_id: i.raw_material_id, quantity_needed: i.quantity_needed.toString() }))
      : [{ raw_material_id: '', quantity_needed: '' }]
  );

  const groupedItems = useMemo(() => {
    const rawMap: Record<string, any[]> = {};
    const finMap: Record<string, any[]> = {};
    
    allItems?.forEach((item: any) => {
      let groupName = t('market.recipes.uncategorized') || 'Uncategorized';
      if (item.category_id) {
        const cat = categories?.find((c: any) => c.id === item.category_id);
        const sub = subcategories?.find((s: any) => s.id === item.subcategory_id);
        if (cat) {
          groupName = sub ? `${cat.name} - ${sub.name}` : cat.name;
        }
      }
      
      if (item.item_type === 'raw_material') {
        if (!rawMap[groupName]) rawMap[groupName] = [];
        rawMap[groupName].push(item);
      } else {
        if (!finMap[groupName]) finMap[groupName] = [];
        finMap[groupName].push(item);
      }
    });
    return { rawMap, finMap };
  }, [allItems, categories, subcategories, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const validIngredients = ingredients.filter(i => i.raw_material_id && Number(i.quantity_needed) > 0);
      if (validIngredients.length === 0) {
        setError(t('market.recipes.errNoIngredients') || 'Add at least one valid ingredient');
        return;
      }

      const payload = validIngredients.map(i => ({
        raw_material_id: i.raw_material_id,
        quantity_needed: Number(i.quantity_needed)
      }));

      let res;
      if (editingRecipe) {
        res = await editRecipe(editingRecipe.id, Number(batchQuantity), payload);
      } else {
        const newProductData = finishedProductId === 'new' ? {
          name: newProductName,
          category_id: newProductCategoryId,
          subcategory_id: newProductSubcategoryId,
          sell_price: Number(newProductSellPrice)
        } : undefined;
        res = await addRecipe(finishedProductId, Number(batchQuantity), payload, newProductData);
      }
      if (res?.error) setError(tError(res.error));
      else {
        onCancel();
        if (isModal && onSuccessModal) {
          onSuccessModal();
        } else {
          router.refresh();
        }
      }
    });
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    const qty = Number(ing.quantity_needed) || 0;
    const item = allItems?.find((i: Item) => i.id === ing.raw_material_id);
    return sum + (qty * (item?.cost_price || 0));
  }, 0);
  const costPerUnit = Number(batchQuantity) > 0 ? totalCost / Number(batchQuantity) : 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            {t('market.recipes.finishedProduct') || 'Finished Product'}
          </label>
          <select
            value={finishedProductId}
            onChange={e => setFinishedProductId(e.target.value)}
            required
            disabled={!!editingRecipe}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-75"
          >
            <option value="">{t('market.input.choose')}</option>
            {!editingRecipe && (
              <option value="new" className="font-bold text-emerald-600">+ {t('service.createNewProduct') || 'Create New Product'}</option>
            )}
            {finishedProducts.map((p: Item) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            {t('market.recipes.batchYield') || 'Batch Yield (Units Produced)'}
          </label>
          <input
            type="number"
            min="1"
            value={batchQuantity}
            onChange={e => setBatchQuantity(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {finishedProductId === 'new' && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-emerald-800">{t('service.createNewProduct') || 'Create New Product Details'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('service.productName') || 'Product Name'}
              </label>
              <input
                type="text"
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                required={finishedProductId === 'new'}
                placeholder="e.g. Special Beef Plate"
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('service.sellPrice') || 'Selling Price (DZD)'}
              </label>
              <input
                type="number"
                min="0"
                value={newProductSellPrice}
                onChange={e => setNewProductSellPrice(e.target.value)}
                required={finishedProductId === 'new'}
                placeholder="0"
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('market.categories.title') || 'Category'}
              </label>
              <select
                value={newProductCategoryId}
                onChange={e => {
                  setNewProductCategoryId(e.target.value);
                  setNewProductSubcategoryId('');
                }}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">{t('market.input.choose')}</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('market.categories.subcatsTitle') || 'Subcategory'}
              </label>
              <select
                value={newProductSubcategoryId}
                onChange={e => setNewProductSubcategoryId(e.target.value)}
                required={finishedProductId === 'new'}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                disabled={!newProductCategoryId}
              >
                <option value="">{t('market.input.choose')}</option>
                {subcategories?.filter((s: any) => s.category_id === newProductCategoryId).map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
          {t('market.recipes.ingredientsList') || 'Ingredients Needed Per Batch'}
        </label>
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              value={ing.raw_material_id}
              onChange={e => {
                const newIng = [...ingredients];
                newIng[idx].raw_material_id = e.target.value;
                setIngredients(newIng);
              }}
              required
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">{t('market.input.chooseItem')}</option>
              
              {/* Raw Materials Group */}
              {Object.keys(groupedItems.rawMap).length > 0 && (
                <optgroup label={`── ${t('market.recipes.rawMaterials') || 'RAW MATERIALS'} ──`} className="bg-amber-50 text-amber-900 font-bold" />
              )}
              {Object.entries(groupedItems.rawMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, itemsInGroup]) => (
                  <optgroup key={`raw-${groupName}`} label={`${groupName}`}>
                    {itemsInGroup
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item: any) => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                  </optgroup>
                ))}

              {/* Finished Products Group */}
              {Object.keys(groupedItems.finMap).length > 0 && (
                <optgroup label={`── ${t('market.recipes.finishedProduct') || 'FINISHED PRODUCTS'} ──`} className="bg-emerald-50 text-emerald-900 font-bold" />
              )}
              {Object.entries(groupedItems.finMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, itemsInGroup]) => (
                  <optgroup key={`fin-${groupName}`} label={`${groupName}`}>
                    {itemsInGroup
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item: any) => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={ing.quantity_needed}
              onChange={e => {
                const newIng = [...ingredients];
                newIng[idx].quantity_needed = e.target.value;
                setIngredients(newIng);
              }}
              required
              placeholder={t('market.input.quantity')}
              className="w-32 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                className="text-rose-500 font-bold p-2 hover:bg-rose-50 rounded-lg"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIngredients([...ingredients, { raw_material_id: '', quantity_needed: '' }])}
          className="text-xs font-bold text-emerald-600 mt-2 hover:underline"
        >
          {t('market.recipes.addIngredient') || '+ Add Ingredient'}
        </button>
      </div>

      {error && <p className="text-rose-600 text-sm font-semibold bg-rose-50 p-3 rounded-xl">{error}</p>}

      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-800 uppercase">{t('market.recipes.calculatedCost') || 'Calculated Cost'}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{t('market.recipes.basedOnBuyPrice') || 'Based on ingredients buy price'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-900">{totalCost.toLocaleString()} DZD <span className="text-xs font-normal text-zinc-500">{t('market.recipes.total') || 'total'}</span></p>
          <p className="text-xs font-semibold text-emerald-700 mt-0.5">{costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DZD <span className="font-normal opacity-70">{t('market.recipes.perUnit') || 'per unit'}</span></p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-800">
          {t('market.recipes.cancel') || 'Cancel'}
        </button>
        <button type="submit" disabled={isPending} className="px-6 py-2 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 disabled:opacity-50">
          {isPending ? t('market.recipes.saving') || 'Saving...' : t('market.recipes.saveRecipe') || 'Save Recipe'}
        </button>
      </div>
    </form>
  );
}

function RecipeCard({ recipe, ingredients, onProduce, onEdit, t, tError }: any) {
  const [isPending, startTransition] = useOverlayTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm(t('market.recipes.deleteConfirm') || 'Delete this recipe?')) return;
    startTransition(async () => {
      await deleteRecipe(recipe.id);
      router.refresh();
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm relative group overflow-hidden">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex items-center gap-2">
        <button onClick={onEdit} className="text-zinc-650 hover:text-zinc-900 text-xs font-bold bg-zinc-105 px-2.5 py-1 rounded-lg transition border border-zinc-200 bg-zinc-50">
          {t('common.edit') || 'Edit'}
        </button>
        <button onClick={handleDelete} disabled={isPending} className="text-rose-400 hover:text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded-lg">
          {t('market.categories.delete')}
        </button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{recipe.finished_product?.image_url || '🥘'}</span>
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">{recipe.finished_product?.name}</h3>
          <p className="text-xs font-semibold text-zinc-500">{t('market.recipes.yields') || 'Yields'}: {recipe.batch_quantity} {recipe.finished_product?.unit || 'units'}</p>
        </div>
      </div>
      <div className="bg-zinc-50 rounded-xl p-3 mb-4 space-y-1">
        {ingredients.map((ing: any) => (
          <div key={ing.id} className="flex justify-between text-xs text-zinc-600">
            <span>• {ing.raw_material?.name}</span>
            <span className="font-bold text-zinc-900">{ing.quantity_needed} {ing.raw_material?.unit}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onProduce}
        className="w-full py-2.5 bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold text-sm rounded-xl transition"
      >
        {t('market.recipes.produceBtn') || 'Produce / Cook'}
      </button>
    </div>
  );
}

function ProduceModal({ recipeId, recipe, ingredients, rawMaterials, categories, subcategories, onClose, t, tError, isModal, onSuccessModal }: any) {
  const [batches, setBatches] = useState('1');
  const [isPending, startTransition] = useOverlayTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');

  useEffect(() => {
    if (recipe?.finished_product) {
      const subId = recipe.finished_product.subcategory_id;
      const sub = subcategories.find((s: any) => s.id === subId);
      setSelectedCategoryId(sub ? sub.category_id : '');
      setSelectedSubcategoryId(subId || '');
    }
  }, [recipe, subcategories]);

  const handleProduce = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // 1. Update subcategory destination if changed
      if (recipe?.finished_product) {
        const currentSubId = recipe.finished_product.subcategory_id || '';
        const targetSubId = selectedSubcategoryId || null;
        if (currentSubId !== (targetSubId || '')) {
          const updateRes = await updateItemSubcategory(recipe.finished_product.id, targetSubId);
          if (updateRes?.error) {
            setError(tError(updateRes.error));
            return;
          }
        }
      }

      // 2. Call produce recipe
      const res = await produceRecipe(recipeId, Number(batches));
      if (res?.error) setError(tError(res.error));
      else {
        onClose();
        if (isModal && onSuccessModal) {
          onSuccessModal();
        } else {
          router.refresh();
        }
      }
    });
  };

  const batchesNum = Number(batches) || 0;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative my-auto"
      >
        <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('market.recipes.produceTitle') || 'Produce Item'}</h2>
        <p className="text-sm text-zinc-500 mb-6">
          {recipe.finished_product?.name} • {(recipe.batch_quantity * batchesNum)} {t('market.recipes.unitsTotal') || 'units will be produced'}
        </p>

        <form onSubmit={handleProduce} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              {t('market.recipes.numberOfBatches') || 'Number of Batches'}
            </label>
            <input
              type="number"
              min="1"
              value={batches}
              onChange={e => setBatches(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Destination Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('market.input.category') || 'Destination Category'}
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedSubcategoryId(''); // Reset subcategory when category changes
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-amber-500"
              >
                <option value="">{t('market.input.choose') || '-- Choose --'}</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '📁'} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                {t('market.input.subcategory') || 'Destination Subcategory'}
              </label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-amber-500"
                disabled={!selectedCategoryId}
              >
                <option value="">{t('market.input.choose') || '-- Choose --'}</option>
                {subcategories
                  .filter((s: any) => s.category_id === selectedCategoryId)
                  .map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon || '📁'} {sub.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">{t('market.recipes.materialsToDeduct') || 'Materials to deduct'}</h4>
            <div className="space-y-2">
              {ingredients.map((ing: any) => {
                const totalNeeded = ing.quantity_needed * batchesNum;
                const raw = rawMaterials.find((r: Item) => r.id === ing.raw_material_id);
                const currentStock = raw?.stock_quantity || 0;
                const isShort = currentStock < totalNeeded;

                return (
                  <div key={ing.id} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-700 font-medium">{ing.raw_material?.name}</span>
                    <div className="text-right">
                      <span className={`font-bold ${isShort ? 'text-rose-600' : 'text-zinc-900'}`}>
                        -{totalNeeded} {ing.raw_material?.unit}
                      </span>
                      <p className="text-[10px] text-zinc-400">Stock: {currentStock}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-rose-600 text-sm font-semibold bg-rose-50 p-3 rounded-xl">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200">
              {t('market.recipes.cancel') || 'Cancel'}
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 disabled:opacity-50">
              {isPending ? t('market.recipes.producing') || 'Processing...' : t('market.recipes.confirmProduce') || 'Confirm Production'}
            </button>
          </div>
        </form>
      </div>
    </div>

  );
}

// Ledger and Category management tabs (preserved functionality)
function LedgerTab({ marketInputs, items, monthFilter, setMonthFilter, t, handleDeleteInput, handleEditInputClick }: any) {
  // Calculate FIFO remaining stock per batch dynamically
  const batchRemainingStock = useMemo(() => {
    const grouped: Record<string, any[]> = marketInputs.reduce((acc: any, input: any) => {
      if (!acc[input.item_id]) acc[input.item_id] = [];
      acc[input.item_id].push(input);
      return acc;
    }, {});

    const remainingMap: Record<string, number> = {};

    for (const itemId in grouped) {
      const item = items.find((i: any) => i.id === itemId);
      let globalStock = item?.stock_quantity ?? 0;

      // Sort from newest to oldest
      const sortedInputs = grouped[itemId].sort((a: any, b: any) =>
        new Date(b.shopping_date).getTime() - new Date(a.shopping_date).getTime()
      );

      for (const input of sortedInputs) {
        if (globalStock <= 0) {
          remainingMap[input.id] = 0;
        } else if (globalStock >= input.quantity) {
          remainingMap[input.id] = input.quantity;
          globalStock -= input.quantity;
        } else {
          remainingMap[input.id] = globalStock;
          globalStock = 0;
        }
      }
    }
    return remainingMap;
  }, [marketInputs, items]);

  const filteredLedger = useMemo(() => {
    const list = !monthFilter
      ? [...marketInputs]
      : marketInputs.filter((m: any) => m.shopping_date.startsWith(monthFilter));

    // Sort: items with stock > 0 first, then stock <= 0
    return list.sort((a: any, b: any) => {
      const stockA = batchRemainingStock[a.id] ?? 0;
      const stockB = batchRemainingStock[b.id] ?? 0;

      if (stockA > 0 && stockB <= 0) return -1;
      if (stockA <= 0 && stockB > 0) return 1;

      // Secondary sorting: date (newest first)
      return new Date(b.shopping_date).getTime() - new Date(a.shopping_date).getTime();
    });
  }, [marketInputs, monthFilter, batchRemainingStock]);

  const activeItems = useMemo(() => items.filter((i: any) => i.is_active !== false), [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900">{t('market.ledger.title')}</h2>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-emerald-500 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('market.ledger.filteredPurchasesTotal')}</p>
          <p className="text-2xl font-bold text-emerald-950 mt-1">
            {formatDZD(filteredLedger.reduce((sum: number, row: any) => sum + row.total_worth, 0))}
          </p>
          <p className="text-xs text-emerald-700 mt-1 opacity-80">{t('market.ledger.filteredPurchasesTotalDesc')}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">{t('market.ledger.currentInventoryCost')}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {formatDZD(activeItems.reduce((sum: number, item: any) => sum + (item.stock_quantity * item.cost_price), 0))}
          </p>
          <p className="text-xs text-zinc-500 mt-1 opacity-80">{t('market.ledger.currentInventoryCostDesc')}</p>
        </div>
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-pink-700 uppercase tracking-wider">{t('market.ledger.currentInventoryValue')}</p>
          <p className="text-2xl font-bold text-pink-950 mt-1">
            {formatDZD(activeItems.reduce((sum: number, item: any) => sum + (item.stock_quantity * item.sell_price), 0))}
          </p>
          <p className="text-xs text-pink-600 mt-1 opacity-80">{t('market.ledger.currentInventoryValueDesc')}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">{t('market.ledger.tableDate')}</th>
                <th className="px-6 py-4 font-bold tracking-wider">{t('market.ledger.tableItem')}</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">{t('market.ledger.tableQuantity')}</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">{t('market.ledger.tableBuyPrice')} (Total)</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">{t('market.ledger.tableSellPrice')}</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">{t('market.ledger.tableTotalWorth')}</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    {t('market.ledger.noPurchasesFound')}
                  </td>
                </tr>
              ) : (
                filteredLedger.map((row: any) => (
                  <tr key={row.id} className="transition hover:bg-zinc-50/50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-900">
                      {formatDate(row.shopping_date)}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900">
                      {row.items?.name || t('market.ledger.unknownItem')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="inline-flex items-center justify-center rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800" title="Quantité Achetée">
                          {row.quantity}
                        </span>
                        <span className="inline-flex items-center justify-center rounded-lg bg-rose-100 px-2.5 py-1 font-bold text-rose-800" title="Restant de cet achat (FIFO)">
                          {batchRemainingStock[row.id] ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-zinc-500 font-semibold">{formatDZD(row.unit_buy_price)} <span className="text-xxs">/u</span></div>
                      <div className="text-xs font-bold text-zinc-900 mt-0.5">Total: {formatDZD(row.quantity * row.unit_buy_price)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-emerald-600 font-semibold">{formatDZD(row.unit_sell_price)} <span className="text-xxs">/u</span></div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700">
                      {formatDZD(row.quantity * row.unit_sell_price)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditInputClick && handleEditInputClick(row)}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Purchase"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteInput(row.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Purchase"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryManagementTab({
  categories, subcategories, onCategoryAdded, onSubcategoryAdded,
  onCategoryDeleted, onSubcategoryDeleted,
  onCategoryUpdated, onSubcategoryUpdated,
  t, tError
}: any) {
  const [isPending, startTransition] = useOverlayTransition();
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catPos, setCatPos] = useState('');
  const [subCatName, setSubCatName] = useState('');
  const [subCatIcon, setSubCatIcon] = useState('📦');
  const [subCatPos, setSubCatPos] = useState('');
  const [parentCatId, setParentCatId] = useState('');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubIcon, setEditSubIcon] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { addCategory } = await import('@/actions/categories');
      const res = await addCategory(catName, catIcon, Number(catPos) || 1);
      if (res?.error) setError(tError(res.error));
      else if (res?.data) {
        onCategoryAdded(res.data);
        setCatName('');
        setCatPos('');
        router.refresh();
      }
    });
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { addSubcategory } = await import('@/actions/categories');
      const res = await addSubcategory(parentCatId, subCatName, subCatIcon, Number(subCatPos) || 1);
      if (res?.error) setError(tError(res.error));
      else if (res?.data) {
        onSubcategoryAdded(res.data);
        setSubCatName('');
        setSubCatPos('');
        router.refresh();
      }
    });
  };

  const handleSaveCat = async (cat: any) => {
    startTransition(async () => {
      const { updateCategory } = await import('@/actions/categories');
      const res = await updateCategory(cat.id, editCatName, editCatIcon);
      if (res?.error) setError(tError(res.error));
      else {
        onCategoryUpdated({ ...cat, name: editCatName, icon: editCatIcon });
        setEditingCatId(null);
        router.refresh();
      }
    });
  };

  const handleSaveSub = async (sub: any) => {
    startTransition(async () => {
      const { updateSubcategory } = await import('@/actions/categories');
      const res = await updateSubcategory(sub.id, editSubName, editSubIcon);
      if (res?.error) setError(tError(res.error));
      else {
        onSubcategoryUpdated({ ...sub, name: editSubName, icon: editSubIcon });
        setEditingSubId(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">{t('market.categories.createTopCategory')}</h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.categoryName')}</label>
              <input type="text" value={catName} onChange={e => setCatName(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder={t('market.categories.categoryNamePlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.iconEmoji')}</label>
                <input type="text" value={catIcon} onChange={e => setCatIcon(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.position')}</label>
                <input type="number" value={catPos} onChange={e => setCatPos(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder={t('market.categories.positionPlaceholder')} />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
              {isPending ? t('market.categories.adding') : t('market.categories.addCategory')}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">{t('market.categories.createSubcategory')}</h3>
          <form onSubmit={handleAddSubcategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.parentCategory')}</label>
              <select value={parentCatId} onChange={e => setParentCatId(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="">{t('market.categories.selectParentCategory')}</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.subcategoryName')}</label>
              <input type="text" value={subCatName} onChange={e => setSubCatName(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder={t('market.categories.subcategoryNamePlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.iconEmoji')}</label>
                <input type="text" value={subCatIcon} onChange={e => setSubCatIcon(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('market.categories.position')}</label>
                <input type="number" value={subCatPos} onChange={e => setSubCatPos(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder={t('market.categories.positionPlaceholder')} />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
              {isPending ? t('market.categories.adding') : t('market.categories.addSubcategory')}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm mt-6">
        <h3 className="text-lg font-bold text-zinc-900 mb-6">{t('market.categories.existingCategories')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat: any) => {
            const catSubcats = subcategories?.filter((s: any) => s.category_id === cat.id) || [];

            return (
              <div key={cat.id} className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50 flex flex-col">
                <div className="p-4 border-b border-zinc-200 bg-white flex justify-between items-center">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="text" value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)} className="w-12 rounded-lg border border-zinc-200 px-2 py-1 text-sm" />
                      <input type="text" value={editCatName} onChange={e => setEditCatName(e.target.value)} className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-sm" />
                      <button onClick={() => handleSaveCat(cat)} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">{t('common.save')}</button>
                      <button onClick={() => setEditingCatId(null)} className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">{t('common.cancel')}</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-bold text-zinc-900 capitalize">{cat.name.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatIcon(cat.icon); }} className="text-zinc-400 hover:text-emerald-600 text-xs font-bold">{t('common.edit')}</button>
                        <button
                          onClick={() => {
                            if (confirm(t('market.categories.deleteConfirm').replace('{name}', cat.name))) {
                              startTransition(async () => {
                                const { deleteCategory } = await import('@/actions/categories');
                                const res = await deleteCategory(cat.id);
                                if (res?.error) {
                                  setError(res.error);
                                } else {
                                  onCategoryDeleted(cat.id);
                                  router.refresh();
                                }
                              });
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                        >
                          {t('market.categories.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 space-y-2 bg-zinc-50/50 flex-1">
                  {catSubcats.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No subcategories</p>
                  ) : (
                    catSubcats.map((sub: any) => (
                      <div key={sub.id} className="flex justify-between items-center p-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                        {editingSubId === sub.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input type="text" value={editSubIcon} onChange={e => setEditSubIcon(e.target.value)} className="w-10 rounded-md border border-zinc-200 px-1 py-1 text-xs" />
                            <input type="text" value={editSubName} onChange={e => setEditSubName(e.target.value)} className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-xs" />
                            <button onClick={() => handleSaveSub(sub)} className="text-emerald-600 text-xs font-bold px-2">✓</button>
                            <button onClick={() => setEditingSubId(null)} className="text-zinc-400 text-xs font-bold px-2">×</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span>{sub.icon}</span>
                              <span className="text-sm font-semibold text-zinc-700 capitalize">{sub.name.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingSubId(sub.id); setEditSubName(sub.name); setEditSubIcon(sub.icon); }} className="text-zinc-400 hover:text-emerald-600 text-xs font-bold">{t('common.edit')}</button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete subcategory ${sub.name}?`)) {
                                    startTransition(async () => {
                                      const { deleteSubcategory } = await import('@/actions/categories');
                                      const res = await deleteSubcategory(sub.id);
                                      if (res?.error) {
                                        setError(res.error);
                                      } else {
                                        onSubcategoryDeleted(sub.id);
                                        router.refresh();
                                      }
                                    });
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-600 text-xs font-bold"
                              >
                                Del
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
