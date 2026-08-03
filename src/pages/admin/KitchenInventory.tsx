import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  AlertTriangle,
  Bot,
  ChefHat,
  ClipboardList,
  Edit2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { kitchenInventoryApi } from '../../services/api';

type Unit = {
  Id: string;
  Code: string;
  Name: string;
  Description?: string;
  SortOrder: number;
};

type Ingredient = {
  Id: string;
  Code: string;
  Name: string;
  Category?: string;
  UnitId?: string;
  UnitName: string;
  CurrentStock: number;
  MinStock: number;
  LastCost: number;
};

type MenuItem = {
  Id: string;
  Code: string;
  Name: string;
  Unit: string;
  Price: number;
};

type Recipe = {
  Id: string;
  MenuItemId: string;
  MenuItemCode?: string;
  MenuItemName: string;
  IngredientId: string;
  IngredientName: string;
  UnitName: string;
  QuantityPerItem: number;
  WastePercent: number;
  Note?: string;
};

type RecipeLineForm = {
  id?: string;
  ingredientId: string;
  quantityPerItem: number;
  wastePercent: number;
  note: string;
};

type RecipeGroup = {
  MenuItemId: string;
  MenuItemCode?: string;
  MenuItemName: string;
  lines: Recipe[];
};

type StockRow = Ingredient & {
  InToday: number;
  OutToday: number;
};

type AiInsight = {
  tone: 'good' | 'info' | 'warning' | 'danger';
  title: string;
  message: string;
};

const tabs = [
  { key: 'dashboard', label: 'Dashboard kho', icon: Bot },
  { key: 'import', label: 'Nhập hàng ngày', icon: ClipboardList },
  { key: 'recipes', label: 'Định lượng món', icon: ChefHat },
  { key: 'ingredients', label: 'Nguyên liệu', icon: Package },
  { key: 'units', label: 'Đơn vị', icon: Plus },
];

const todayKey = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const qty = (value: number) => Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
const PAGE_SIZE = 12;

const normalizeText = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const uniqueOptions = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));

const paginate = <T,>(items: T[], page: number, pageSize = PAGE_SIZE) => {
  const pageCount = Math.max(Math.ceil(items.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageCount,
  };
};

export default function KitchenInventory() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [date, setDate] = useState(todayKey());
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [data, setData] = useState<any>({});
  const [editingIngredientId, setEditingIngredientId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState('');
  const [editingRecipeMenuId, setEditingRecipeMenuId] = useState('');
  const [stockFilters, setStockFilters] = useState({ search: '', category: '', status: 'all' });
  const [stockPage, setStockPage] = useState(1);
  const [recipeFilters, setRecipeFilters] = useState({ search: '', menuItemId: '', ingredientId: '' });
  const [recipePage, setRecipePage] = useState(1);
  const [ingredientFilters, setIngredientFilters] = useState({ search: '', category: '', unitId: '', status: 'all' });
  const [ingredientPage, setIngredientPage] = useState(1);
  const [unitFilters, setUnitFilters] = useState({ search: '' });
  const [unitPage, setUnitPage] = useState(1);
  const [ingredientForm, setIngredientForm] = useState({
    code: '',
    name: '',
    category: 'Thực phẩm tươi',
    unitId: '',
    currentStock: 0,
    minStock: 0,
    lastCost: 0,
    isActive: true,
  });
  const [unitForm, setUnitForm] = useState({ code: '', name: '', description: '', sortOrder: 0, isActive: true });
  const [recipeForm, setRecipeForm] = useState({
    menuItemId: '',
    lines: [{ ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }] as RecipeLineForm[],
  });
  const [entryForm, setEntryForm] = useState({
    entryDate: todayKey(),
    supplierName: '',
    note: '',
    lines: [{ ingredientId: '', quantity: 0, unitCost: 0, note: '' }],
  });

  const units: Unit[] = data.units || [];
  const ingredients: Ingredient[] = data.ingredients || [];
  const menuItems: MenuItem[] = data.menuItems || [];
  const recipes: Recipe[] = data.recipes || [];
  const stock: StockRow[] = data.stock || [];
  const aiInsights: AiInsight[] = data.aiInsights || [];
  const missingRecipes: MenuItem[] = data.missingRecipes || [];
  const categories = useMemo(() => uniqueOptions(ingredients.map((item) => item.Category)), [ingredients]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await kitchenInventoryApi.getBootstrap(date);
      setData(res || {});
    } catch (error: any) {
      setToast(error.response?.data?.message || 'Không tải được kho bếp.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const summary = useMemo(() => {
    const stockValue = ingredients.reduce((sum, item) => sum + Number(item.CurrentStock || 0) * Number(item.LastCost || 0), 0);
    const lowStock = ingredients.filter((item) => Number(item.CurrentStock || 0) <= Number(item.MinStock || 0)).length;
    const outToday = stock.reduce((sum, item) => sum + Number(item.OutToday || 0), 0);
    return { stockValue, lowStock, outToday, recipeCount: recipes.length };
  }, [ingredients, recipes.length, stock]);

  const filteredStock = useMemo(() => {
    const keyword = normalizeText(stockFilters.search);
    return stock.filter((item) => {
      const matchesSearch = !keyword || normalizeText(`${item.Code} ${item.Name} ${item.Category} ${item.UnitName}`).includes(keyword);
      const matchesCategory = !stockFilters.category || item.Category === stockFilters.category;
      const matchesStatus = stockFilters.status === 'all'
        || (stockFilters.status === 'low' && Number(item.CurrentStock || 0) <= Number(item.MinStock || 0))
        || (stockFilters.status === 'usedToday' && Number(item.OutToday || 0) > 0)
        || (stockFilters.status === 'noMove' && Number(item.InToday || 0) <= 0 && Number(item.OutToday || 0) <= 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stock, stockFilters]);

  const filteredRecipes = useMemo(() => {
    const keyword = normalizeText(recipeFilters.search);
    return recipes.filter((item) => {
      const matchesSearch = !keyword || normalizeText(`${item.MenuItemCode} ${item.MenuItemName} ${item.IngredientName} ${item.UnitName} ${item.Note}`).includes(keyword);
      const matchesMenu = !recipeFilters.menuItemId || item.MenuItemId === recipeFilters.menuItemId;
      const matchesIngredient = !recipeFilters.ingredientId || item.IngredientId === recipeFilters.ingredientId;
      return matchesSearch && matchesMenu && matchesIngredient;
    });
  }, [recipes, recipeFilters]);

  const recipeGroups = useMemo<RecipeGroup[]>(() => {
    const map = new Map<string, RecipeGroup>();
    filteredRecipes.forEach((item) => {
      if (!map.has(item.MenuItemId)) {
        map.set(item.MenuItemId, {
          MenuItemId: item.MenuItemId,
          MenuItemCode: item.MenuItemCode,
          MenuItemName: item.MenuItemName,
          lines: [],
        });
      }
      map.get(item.MenuItemId)!.lines.push(item);
    });
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        lines: group.lines.sort((a, b) => a.IngredientName.localeCompare(b.IngredientName, 'vi')),
      }))
      .sort((a, b) => a.MenuItemName.localeCompare(b.MenuItemName, 'vi'));
  }, [filteredRecipes]);

  const filteredIngredients = useMemo(() => {
    const keyword = normalizeText(ingredientFilters.search);
    return ingredients.filter((item) => {
      const matchesSearch = !keyword || normalizeText(`${item.Code} ${item.Name} ${item.Category} ${item.UnitName}`).includes(keyword);
      const matchesCategory = !ingredientFilters.category || item.Category === ingredientFilters.category;
      const matchesUnit = !ingredientFilters.unitId || item.UnitId === ingredientFilters.unitId;
      const matchesStatus = ingredientFilters.status === 'all'
        || (ingredientFilters.status === 'low' && Number(item.CurrentStock || 0) <= Number(item.MinStock || 0))
        || (ingredientFilters.status === 'ok' && Number(item.CurrentStock || 0) > Number(item.MinStock || 0));
      return matchesSearch && matchesCategory && matchesUnit && matchesStatus;
    });
  }, [ingredients, ingredientFilters]);

  const filteredUnits = useMemo(() => {
    const keyword = normalizeText(unitFilters.search);
    return units.filter((item) => !keyword || normalizeText(`${item.Code} ${item.Name} ${item.Description}`).includes(keyword));
  }, [units, unitFilters.search]);

  const stockPageData = useMemo(() => paginate(filteredStock, stockPage, 10), [filteredStock, stockPage]);
  const recipePageData = useMemo(() => paginate(recipeGroups, recipePage, 8), [recipeGroups, recipePage]);
  const ingredientPageData = useMemo(() => paginate(filteredIngredients, ingredientPage), [filteredIngredients, ingredientPage]);
  const unitPageData = useMemo(() => paginate(filteredUnits, unitPage), [filteredUnits, unitPage]);

  useEffect(() => setStockPage(1), [stockFilters]);
  useEffect(() => setRecipePage(1), [recipeFilters]);
  useEffect(() => setIngredientPage(1), [ingredientFilters]);
  useEffect(() => setUnitPage(1), [unitFilters]);

  const saveIngredient = async () => {
    const payload = { ...ingredientForm };
    if (editingIngredientId) await kitchenInventoryApi.updateIngredient(editingIngredientId, payload);
    else await kitchenInventoryApi.createIngredient(payload);
    setToast('Đã lưu nguyên liệu.');
    resetIngredient();
    await loadData();
  };

  const saveUnit = async () => {
    if (editingUnitId) await kitchenInventoryApi.updateUnit(editingUnitId, unitForm);
    else await kitchenInventoryApi.createUnit(unitForm);
    setToast('Đã lưu đơn vị.');
    resetUnit();
    await loadData();
  };

  const saveRecipe = async () => {
    if (!recipeForm.menuItemId) {
      setToast('Vui lòng chọn món POS.');
      return;
    }
    const lines = recipeForm.lines
      .map((line) => ({
        ingredientId: line.ingredientId,
        quantityPerItem: Number(line.quantityPerItem || 0),
        wastePercent: Number(line.wastePercent || 0),
        note: line.note || '',
      }))
      .filter((line) => line.ingredientId && line.quantityPerItem > 0);
    if (!lines.length) {
      setToast('Vui lòng nhập ít nhất một nguyên liệu có định lượng lớn hơn 0.');
      return;
    }
    const duplicateIngredient = lines.find((line, index) => lines.findIndex((item) => item.ingredientId === line.ingredientId) !== index);
    if (duplicateIngredient) {
      setToast('Một nguyên liệu chỉ nên nhập một lần trong cùng món.');
      return;
    }
    await kitchenInventoryApi.saveRecipeSet(recipeForm.menuItemId, { lines });
    setToast(`Đã lưu ${lines.length} nguyên liệu cho món.`);
    resetRecipe();
    await loadData();
  };

  const saveStockEntry = async () => {
    await kitchenInventoryApi.createStockEntry(entryForm);
    setToast('Đã nhập kho bếp.');
    setEntryForm({ entryDate: todayKey(), supplierName: '', note: '', lines: [{ ingredientId: '', quantity: 0, unitCost: 0, note: '' }] });
    await loadData();
  };

  const resetIngredient = () => {
    setEditingIngredientId('');
    setIngredientForm({ code: '', name: '', category: 'Thực phẩm tươi', unitId: units[0]?.Id || '', currentStock: 0, minStock: 0, lastCost: 0, isActive: true });
  };

  const resetUnit = () => {
    setEditingUnitId('');
    setUnitForm({ code: '', name: '', description: '', sortOrder: 0, isActive: true });
  };

  const resetRecipe = () => {
    setEditingRecipeMenuId('');
    setRecipeForm({ menuItemId: '', lines: [{ ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }] });
  };

  const buildRecipeLinesForMenu = (menuItemId: string): RecipeLineForm[] => {
    const currentLines = recipes.filter((item) => item.MenuItemId === menuItemId);
    if (!currentLines.length) return [{ ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }];
    return currentLines.map((item) => ({
      id: item.Id,
      ingredientId: item.IngredientId,
      quantityPerItem: Number(item.QuantityPerItem || 0),
      wastePercent: Number(item.WastePercent || 0),
      note: item.Note || '',
    }));
  };

  const selectRecipeMenu = (menuItemId: string) => {
    setEditingRecipeMenuId(menuItemId);
    setRecipeForm({ menuItemId, lines: buildRecipeLinesForMenu(menuItemId) });
  };

  const updateRecipeLine = (index: number, patch: Partial<RecipeLineForm>) => {
    setRecipeForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  };

  const addRecipeLine = () => {
    setRecipeForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }],
    }));
  };

  const removeRecipeLine = (index: number) => {
    setRecipeForm((prev) => ({
      ...prev,
      lines: prev.lines.length <= 1
        ? [{ ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }]
        : prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const updateEntryLine = (index: number, patch: any) => {
    setEntryForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  };

  const toneClass = (tone: AiInsight['tone']) => {
    if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-800';
    if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900';
    if (tone === 'good') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    return 'border-blue-200 bg-blue-50 text-blue-800';
  };

  if (isLoading) {
    return <div className="flex h-72 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-b-amber-700" /></div>;
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed right-5 top-20 z-50 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 shadow-lg">
          {toast}
          <button className="ml-4 text-stone-400" onClick={() => setToast('')}>Đóng</button>
        </div>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-700">Com Thi No Restaurant</p>
            <h1 className="mt-2 font-serif text-3xl font-black text-stone-950">Kho bếp & định lượng</h1>
            <p className="mt-2 max-w-3xl text-sm text-stone-500">
              Nhập hàng theo giấy bếp, gắn công thức định lượng cho từng món POS và tự trừ tồn kho khi bill hoàn tất thanh toán.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold" />
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-bold hover:bg-stone-50">
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${activeTab === key ? 'bg-amber-600 text-white shadow' : 'text-stone-600 hover:bg-stone-50'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Giá trị tồn" value={money(summary.stockValue)} helper="Theo giá nhập gần nhất" />
            <Metric label="Nguyên liệu thấp" value={summary.lowStock.toString()} helper="Cần kiểm tra hoặc nhập thêm" />
            <Metric label="Tiêu hao hôm nay" value={qty(summary.outToday)} helper="Tính theo định lượng POS" />
            <Metric label="Dòng định lượng" value={summary.recipeCount.toString()} helper="Đã gắn món với nguyên liệu" />
          </section>

          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <Panel title="Trợ lý kho bếp">
              <div className="grid gap-3">
                {aiInsights.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`rounded-2xl border p-4 ${toneClass(item.tone)}`}>
                    <div className="flex gap-3">
                      <Bot className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="mt-1 text-sm font-semibold opacity-85">{item.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Món chưa có định lượng">
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {missingRecipes.length ? missingRecipes.map((item) => (
                  <button
                    key={item.Id}
                    onClick={() => {
                      setActiveTab('recipes');
                      setEditingRecipeMenuId(item.Id);
                      setRecipeForm({ menuItemId: item.Id, lines: [{ ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '' }] });
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-3 text-left hover:border-amber-300 hover:bg-amber-50"
                  >
                    <span><b>{item.Name}</b><span className="ml-2 text-xs text-stone-500">{item.Code}</span></span>
                    <Plus className="h-4 w-4 text-amber-700" />
                  </button>
                )) : <p className="text-sm text-stone-500">Tất cả món đang bán đã có định lượng.</p>}
              </div>
            </Panel>
          </div>

          <Panel title="Tồn kho hôm nay">
            <FilterGrid>
              <SearchInput
                label="Tìm nguyên liệu"
                value={stockFilters.search}
                onChange={(value) => setStockFilters({ ...stockFilters, search: value })}
                placeholder="Tên, mã, nhóm, đơn vị..."
              />
              <Select label="Nhóm" value={stockFilters.category} onChange={(value) => setStockFilters({ ...stockFilters, category: value })}>
                <option value="">Tất cả nhóm</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select label="Trạng thái" value={stockFilters.status} onChange={(value) => setStockFilters({ ...stockFilters, status: value })}>
                <option value="all">Tất cả trạng thái</option>
                <option value="low">Thấp tồn</option>
                <option value="usedToday">Có xuất hôm nay</option>
                <option value="noMove">Chưa phát sinh</option>
              </Select>
            </FilterGrid>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                  <tr><th className="p-3">Nguyên liệu</th><th>Nhóm</th><th>Đơn vị</th><th>Đầu/hiện tại</th><th>Nhập hôm nay</th><th>Xuất hôm nay</th><th>Cảnh báo</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stockPageData.items.map((item) => (
                    <tr key={item.Id}>
                      <td className="p-3 font-black">{item.Name}<div className="text-xs text-stone-400">{item.Code}</div></td>
                      <td>{item.Category || '-'}</td>
                      <td>{item.UnitName}</td>
                      <td className="font-black">{qty(item.CurrentStock)}</td>
                      <td className="text-emerald-700">{qty(item.InToday)}</td>
                      <td className="text-red-600">{qty(item.OutToday)}</td>
                      <td>{Number(item.CurrentStock) <= Number(item.MinStock) ? <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"><AlertTriangle className="h-3 w-3" />Thấp tồn</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Ổn</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filteredStock.length && <EmptyState text="Không có nguyên liệu nào khớp bộ lọc." />}
            <Pagination page={stockPageData.page} pageCount={stockPageData.pageCount} total={filteredStock.length} onPageChange={setStockPage} />
          </Panel>
        </div>
      )}

      {activeTab === 'import' && (
        <Panel title="Nhập hàng theo giấy bếp">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr]">
            <Input label="Ngày nhập" type="date" value={entryForm.entryDate} onChange={(v) => setEntryForm({ ...entryForm, entryDate: v })} />
            <Input label="Nhà cung cấp/người mua" value={entryForm.supplierName} onChange={(v) => setEntryForm({ ...entryForm, supplierName: v })} />
            <Input label="Ghi chú" value={entryForm.note} onChange={(v) => setEntryForm({ ...entryForm, note: v })} />
          </div>
          <div className="mt-4 space-y-2">
            {entryForm.lines.map((line, index) => {
              const ingredient = ingredients.find((item) => item.Id === line.ingredientId);
              return (
                <div key={index} className="grid gap-2 rounded-2xl border border-stone-200 p-3 lg:grid-cols-[1.4fr_120px_130px_1fr_40px]">
                  <Select label="Mặt hàng" value={line.ingredientId} onChange={(v) => updateEntryLine(index, { ingredientId: v })}>
                    <option value="">Chọn nguyên liệu</option>
                    {ingredients.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.UnitName})</option>)}
                  </Select>
                  <Input label={`SL ${ingredient?.UnitName || ''}`} type="number" value={String(line.quantity)} onChange={(v) => updateEntryLine(index, { quantity: Number(v) })} />
                  <Input label="Đơn giá" type="number" value={String(line.unitCost)} onChange={(v) => updateEntryLine(index, { unitCost: Number(v) })} />
                  <Input label="Ghi chú dòng" value={line.note} onChange={(v) => updateEntryLine(index, { note: v })} />
                  <button
                    onClick={() => setEntryForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }))}
                    className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600"
                    title="Xóa dòng"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setEntryForm((prev) => ({ ...prev, lines: [...prev.lines, { ingredientId: '', quantity: 0, unitCost: 0, note: '' }] }))} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-black">
              <Plus className="h-4 w-4" />
              Thêm dòng
            </button>
            <button onClick={saveStockEntry} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-500">
              <Save className="h-4 w-4" />
              Lưu phiếu nhập
            </button>
          </div>
        </Panel>
      )}

      {activeTab === 'recipes' && (
        <div className="grid gap-4 xl:grid-cols-[520px_1fr]">
          <Panel title={editingRecipeMenuId ? 'Sửa bộ định lượng món' : 'Thêm bộ định lượng món'}>
            <div className="space-y-3">
              <Select label="Món POS" value={recipeForm.menuItemId} onChange={(v) => selectRecipeMenu(v)}>
                <option value="">Chọn món</option>
                {menuItems.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.Code})</option>)}
              </Select>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
                Nhập theo đơn vị tồn kho của nguyên liệu. Ví dụ nguyên liệu đơn vị kg thì 200g nhập là <b>0.2</b>; 1 bìa đậu nhập là <b>1</b>.
              </div>
              <div className="space-y-3">
                {recipeForm.lines.map((line, index) => {
                  const ingredient = ingredients.find((item) => item.Id === line.ingredientId);
                  return (
                    <div key={`${line.id || 'new'}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <b className="text-sm text-stone-900">Nguyên liệu {index + 1}</b>
                        <button
                          type="button"
                          onClick={() => removeRecipeLine(index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 hover:bg-red-50"
                          title="Xóa nguyên liệu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Select label="Nguyên liệu trừ kho" value={line.ingredientId} onChange={(v) => updateRecipeLine(index, { ingredientId: v })}>
                        <option value="">Chọn nguyên liệu</option>
                        {ingredients.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.UnitName})</option>)}
                      </Select>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          label={`Định lượng/1 món ${ingredient?.UnitName ? `(${ingredient.UnitName})` : ''}`}
                          type="number"
                          value={String(line.quantityPerItem)}
                          onChange={(v) => updateRecipeLine(index, { quantityPerItem: Number(v) })}
                        />
                        <Input
                          label="Hao hụt %"
                          type="number"
                          value={String(line.wastePercent)}
                          onChange={(v) => updateRecipeLine(index, { wastePercent: Number(v) })}
                        />
                      </div>
                      <Input label="Ghi chú riêng cho nguyên liệu" value={line.note} onChange={(v) => updateRecipeLine(index, { note: v })} />
                    </div>
                  );
                })}
              </div>
              <button onClick={addRecipeLine} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-black hover:bg-stone-50">
                <Plus className="h-4 w-4" />
                Thêm nguyên liệu cho món
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveRecipe} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Lưu bộ định lượng</button>
                <button onClick={resetRecipe} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-black">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Danh sách định lượng">
            <FilterGrid>
              <SearchInput
                label="Tìm định lượng"
                value={recipeFilters.search}
                onChange={(value) => setRecipeFilters({ ...recipeFilters, search: value })}
                placeholder="Tên món, mã món, nguyên liệu..."
              />
              <Select label="Món POS" value={recipeFilters.menuItemId} onChange={(value) => setRecipeFilters({ ...recipeFilters, menuItemId: value })}>
                <option value="">Tất cả món</option>
                {menuItems.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.Code})</option>)}
              </Select>
              <Select label="Nguyên liệu" value={recipeFilters.ingredientId} onChange={(value) => setRecipeFilters({ ...recipeFilters, ingredientId: value })}>
                <option value="">Tất cả nguyên liệu</option>
                {ingredients.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.UnitName})</option>)}
              </Select>
            </FilterGrid>
            <div className="grid gap-2">
              {recipePageData.items.map((group) => (
                <div key={group.MenuItemId} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700">{group.MenuItemCode}</p>
                      <h3 className="text-lg font-black text-stone-950">{group.MenuItemName}</h3>
                      <p className="text-sm text-stone-500">{group.lines.length} nguyên liệu sẽ tự trừ kho khi bán món này.</p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton icon={Edit2} label="Sửa" onClick={() => {
                        setEditingRecipeMenuId(group.MenuItemId);
                        setRecipeForm({
                          menuItemId: group.MenuItemId,
                          lines: buildRecipeLinesForMenu(group.MenuItemId),
                        });
                      }} />
                      <IconButton icon={Trash2} label="Ẩn" onClick={async () => {
                        if (confirm(`Ẩn toàn bộ định lượng của món ${group.MenuItemName}?`)) {
                          await Promise.all(group.lines.map((item) => kitchenInventoryApi.deleteRecipe(item.Id)));
                          await loadData();
                        }
                      }} />
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-[640px] w-full text-left text-sm">
                      <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                        <tr><th className="p-2">Nguyên liệu</th><th>Định lượng/1 món</th><th>Hao hụt</th><th>Ghi chú</th></tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {group.lines.map((line) => (
                          <tr key={line.Id}>
                            <td className="p-2 font-black">{line.IngredientName}</td>
                            <td><b>{qty(line.QuantityPerItem)} {line.UnitName}</b></td>
                            <td>{qty(line.WastePercent)}%</td>
                            <td className="text-stone-500">{line.Note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            {!filteredRecipes.length && <EmptyState text="Không có dòng định lượng nào khớp bộ lọc." />}
            <Pagination page={recipePageData.page} pageCount={recipePageData.pageCount} total={recipeGroups.length} onPageChange={setRecipePage} />
          </Panel>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingIngredientId ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Mã" value={ingredientForm.code} onChange={(v) => setIngredientForm({ ...ingredientForm, code: v })} />
                <Input label="Tên" value={ingredientForm.name} onChange={(v) => setIngredientForm({ ...ingredientForm, name: v })} />
              </div>
              <Input label="Nhóm" value={ingredientForm.category} onChange={(v) => setIngredientForm({ ...ingredientForm, category: v })} />
              <Select label="Đơn vị" value={ingredientForm.unitId} onChange={(v) => setIngredientForm({ ...ingredientForm, unitId: v })}>
                <option value="">Chọn đơn vị</option>
                {units.map((item) => <option key={item.Id} value={item.Id}>{item.Name}</option>)}
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Tồn hiện tại" type="number" value={String(ingredientForm.currentStock)} onChange={(v) => setIngredientForm({ ...ingredientForm, currentStock: Number(v) })} />
                <Input label="Tồn tối thiểu" type="number" value={String(ingredientForm.minStock)} onChange={(v) => setIngredientForm({ ...ingredientForm, minStock: Number(v) })} />
                <Input label="Giá gần nhất" type="number" value={String(ingredientForm.lastCost)} onChange={(v) => setIngredientForm({ ...ingredientForm, lastCost: Number(v) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveIngredient} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Lưu</button>
                <button onClick={resetIngredient} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-black">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Danh sách nguyên liệu">
            <FilterGrid>
              <SearchInput
                label="Tìm nguyên liệu"
                value={ingredientFilters.search}
                onChange={(value) => setIngredientFilters({ ...ingredientFilters, search: value })}
                placeholder="Tên, mã, nhóm..."
              />
              <Select label="Nhóm" value={ingredientFilters.category} onChange={(value) => setIngredientFilters({ ...ingredientFilters, category: value })}>
                <option value="">Tất cả nhóm</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select label="Đơn vị" value={ingredientFilters.unitId} onChange={(value) => setIngredientFilters({ ...ingredientFilters, unitId: value })}>
                <option value="">Tất cả đơn vị</option>
                {units.map((item) => <option key={item.Id} value={item.Id}>{item.Name}</option>)}
              </Select>
              <Select label="Trạng thái tồn" value={ingredientFilters.status} onChange={(value) => setIngredientFilters({ ...ingredientFilters, status: value })}>
                <option value="all">Tất cả</option>
                <option value="low">Thấp tồn</option>
                <option value="ok">Còn ổn</option>
              </Select>
            </FilterGrid>
            <CardsGrid>
              {ingredientPageData.items.map((item) => (
                <div key={item.Id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-stone-400">{item.Code}</p>
                      <h3 className="text-lg font-black text-stone-950">{item.Name}</h3>
                      <p className="text-sm text-stone-500">{item.Category || '-'} · {item.UnitName}</p>
                    </div>
                    {Number(item.CurrentStock) <= Number(item.MinStock) && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
                    <div className="flex justify-between"><span>Tồn</span><b>{qty(item.CurrentStock)} {item.UnitName}</b></div>
                    <div className="mt-2 flex justify-between"><span>Tối thiểu</span><b>{qty(item.MinStock)} {item.UnitName}</b></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <IconButton icon={Edit2} label="Sửa" onClick={() => {
                      setEditingIngredientId(item.Id);
                      setIngredientForm({ code: item.Code, name: item.Name, category: item.Category || '', unitId: item.UnitId || '', currentStock: item.CurrentStock, minStock: item.MinStock, lastCost: item.LastCost, isActive: true });
                    }} />
                    <IconButton icon={Trash2} label="Ẩn" onClick={async () => { if (confirm('Ẩn nguyên liệu này?')) { await kitchenInventoryApi.deleteIngredient(item.Id); await loadData(); } }} />
                  </div>
                </div>
              ))}
            </CardsGrid>
            {!filteredIngredients.length && <EmptyState text="Không có nguyên liệu nào khớp bộ lọc." />}
            <Pagination page={ingredientPageData.page} pageCount={ingredientPageData.pageCount} total={filteredIngredients.length} onPageChange={setIngredientPage} />
          </Panel>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingUnitId ? 'Sửa đơn vị' : 'Thêm đơn vị'}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Mã" value={unitForm.code} onChange={(v) => setUnitForm({ ...unitForm, code: v })} />
                <Input label="Tên" value={unitForm.name} onChange={(v) => setUnitForm({ ...unitForm, name: v })} />
              </div>
              <Input label="Mô tả" value={unitForm.description} onChange={(v) => setUnitForm({ ...unitForm, description: v })} />
              <Input label="Thứ tự" type="number" value={String(unitForm.sortOrder)} onChange={(v) => setUnitForm({ ...unitForm, sortOrder: Number(v) })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveUnit} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Lưu</button>
                <button onClick={resetUnit} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-black">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Danh sách đơn vị">
            <FilterGrid>
              <SearchInput
                label="Tìm đơn vị"
                value={unitFilters.search}
                onChange={(value) => setUnitFilters({ search: value })}
                placeholder="Mã, tên, mô tả..."
              />
            </FilterGrid>
            <CardsGrid>
              {unitPageData.items.map((item) => (
                <div key={item.Id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.Code}</p>
                  <h3 className="mt-1 text-xl font-black text-stone-950">{item.Name}</h3>
                  <p className="mt-2 min-h-10 text-sm text-stone-500">{item.Description || 'Đơn vị bếp'}</p>
                  <div className="mt-3 flex gap-2">
                    <IconButton icon={Edit2} label="Sửa" onClick={() => { setEditingUnitId(item.Id); setUnitForm({ code: item.Code, name: item.Name, description: item.Description || '', sortOrder: item.SortOrder || 0, isActive: true }); }} />
                    <IconButton icon={Trash2} label="Ẩn" onClick={async () => { if (confirm('Ẩn đơn vị này?')) { await kitchenInventoryApi.deleteUnit(item.Id); await loadData(); } }} />
                  </div>
                </div>
              ))}
            </CardsGrid>
            {!filteredUnits.length && <EmptyState text="Không có đơn vị nào khớp bộ lọc." />}
            <Pagination page={unitPageData.page} pageCount={unitPageData.pageCount} total={filteredUnits.length} onPageChange={setUnitPage} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-stone-500">{helper}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-serif text-2xl font-black text-stone-950">{title}</h2>
      {children}
    </section>
  );
}

function CardsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{children}</div>;
}

function FilterGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid gap-3 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

function SearchInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm font-bold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
        />
      </div>
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm font-bold text-stone-500">{text}</div>;
}

function Pagination({ page, pageCount, total, onPageChange }: { page: number; pageCount: number; total: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) {
    return <p className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-400">{total} dòng</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-stone-500">
        Trang {page}/{pageCount} · {total} dòng
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      >
        {children}
      </select>
    </label>
  );
}

function IconButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: React.ElementType }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
