const fs = require('fs');
const path = 'components/market/MarketStockClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. State changes
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'input' | 'recipes' | 'ledger' | 'categories'>('input');`,
  `const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isRecipesModalOpen, setIsRecipesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);`
);

// 2. Remove success message early return logic
content = content.replace(
  /if \(successMessage\) \{\s*return \([\s\S]*?zoom-in duration-300[\s\S]*?\);\s*\}/m,
  ''
);

// Remove successMessage from handleInputSubmit
content = content.replace(
  `        if (isModal && onSuccessModal) {
          setSuccessMessage(t('common.success') || 'Success!');
          setTimeout(() => onSuccessModal(), 1500);
        } else {
          setActiveTab('ledger');
        }`,
  `        if (isModal && onSuccessModal) {
          onSuccessModal();
        } else {
          setIsInputModalOpen(false);
        }`
);

// 3. Replace Tabs with Badge Cards and rearrange structure
const tabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-px">[\s\S]*?<\/div>/m;

const badgeCardsHTML = `
      {/* Quick Action Badges */}
      {!isModal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setIsInputModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-200 transition group"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📥
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.input') || 'Stock Entry'}</h3>
            <p className="text-xs text-zinc-500 mt-1">Ajouter un produit ou matière</p>
          </button>
          
          <button
            onClick={() => setIsRecipesModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:amber-200 transition group"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.recipes') || 'Recipes & BOM'}</h3>
            <p className="text-xs text-zinc-500 mt-1">Gérer les nomenclatures</p>
          </button>

          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md hover:indigo-200 transition group"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="font-bold text-zinc-900">{t('market.tabs.categories')}</h3>
            <p className="text-xs text-zinc-500 mt-1">Structurer le catalogue</p>
          </button>
        </div>
      )}
`;

content = content.replace(tabsRegex, badgeCardsHTML);

// 4. Wrap Input Form in Modal
const inputFormRegex = /\{activeTab === 'input' && \([\s\S]*?<div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-\[0_15px_40px_rgba\(16,185,129,0\.04\)\] max-w-2xl">([\s\S]*?)<\/form>\s*<\/div>\s*\)\}/m;
content = content.replace(inputFormRegex, (match, p1) => {
  return `{isInputModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsInputModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold">&times;</button>
            ${p1}
          </form>
          </div>
        </div>
      )}`;
});

// 5. Wrap Recipes in Modal
content = content.replace(
  /\{activeTab === 'recipes' && \(\s*<RecipesTab([\s\S]*?)\/>\s*\)\}/m,
  `{isRecipesModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsRecipesModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold z-10">&times;</button>
            <RecipesTab$1/>
          </div>
        </div>
      )}`
);

// 6. Make Ledger Always Visible
content = content.replace(
  /\{activeTab === 'ledger' && \(\s*<LedgerTab([\s\S]*?)\/>\s*\)\}/m,
  `{/* Ledger is always visible now */}
      {!isModal && (
        <div className="mt-12">
          <LedgerTab$1/>
        </div>
      )}`
);

// 7. Wrap Categories in Modal
content = content.replace(
  /\{activeTab === 'categories' && \(\s*<CategoryManagementTab([\s\S]*?)\/>\s*\)\}/m,
  `{isCategoriesModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsCategoriesModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold z-10">&times;</button>
            <div className="mt-4">
              <CategoryManagementTab$1/>
            </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync(path, content);
console.log('Refactored successfully.');
