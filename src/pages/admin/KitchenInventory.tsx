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

export default function KitchenInventory() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [date, setDate] = useState(todayKey());
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [data, setData] = useState<any>({});
  const [editingIngredientId, setEditingIngredientId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState('');
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
    ingredientId: '',
    quantityPerItem: 0,
    wastePercent: 0,
    note: '',
    isActive: true,
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
    await (editingRecipeId ? kitchenInventoryApi.updateRecipe(editingRecipeId, recipeForm) : kitchenInventoryApi.createRecipe(recipeForm));
    setToast('Đã lưu định lượng món.');
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
    setEditingRecipeId('');
    setRecipeForm({ menuItemId: '', ingredientId: '', quantityPerItem: 0, wastePercent: 0, note: '', isActive: true });
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
                      setRecipeForm((prev) => ({ ...prev, menuItemId: item.Id }));
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
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                  <tr><th className="p-3">Nguyên liệu</th><th>Nhóm</th><th>Đơn vị</th><th>Đầu/hiện tại</th><th>Nhập hôm nay</th><th>Xuất hôm nay</th><th>Cảnh báo</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stock.map((item) => (
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
        <div className="grid gap-4 xl:grid-cols-[400px_1fr]">
          <Panel title={editingRecipeId ? 'Sửa định lượng' : 'Thêm định lượng món'}>
            <div className="space-y-3">
              <Select label="Món POS" value={recipeForm.menuItemId} onChange={(v) => setRecipeForm({ ...recipeForm, menuItemId: v })}>
                <option value="">Chọn món</option>
                {menuItems.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.Code})</option>)}
              </Select>
              <Select label="Nguyên liệu trừ kho" value={recipeForm.ingredientId} onChange={(v) => setRecipeForm({ ...recipeForm, ingredientId: v })}>
                <option value="">Chọn nguyên liệu</option>
                {ingredients.map((item) => <option key={item.Id} value={item.Id}>{item.Name} ({item.UnitName})</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Định lượng/1 món" type="number" value={String(recipeForm.quantityPerItem)} onChange={(v) => setRecipeForm({ ...recipeForm, quantityPerItem: Number(v) })} />
                <Input label="Hao hụt %" type="number" value={String(recipeForm.wastePercent)} onChange={(v) => setRecipeForm({ ...recipeForm, wastePercent: Number(v) })} />
              </div>
              <Input label="Ghi chú bếp" value={recipeForm.note} onChange={(v) => setRecipeForm({ ...recipeForm, note: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveRecipe} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Lưu định lượng</button>
                <button onClick={resetRecipe} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-black">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Danh sách định lượng">
            <div className="grid gap-2">
              {recipes.map((item) => (
                <div key={item.Id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.MenuItemCode}</p>
                      <h3 className="text-lg font-black text-stone-950">{item.MenuItemName}</h3>
                      <p className="text-sm text-stone-500">{item.IngredientName}: <b>{qty(item.QuantityPerItem)} {item.UnitName}</b>/món · hao hụt {qty(item.WastePercent)}%</p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton icon={Edit2} label="Sửa" onClick={() => {
                        setEditingRecipeId(item.Id);
                        setRecipeForm({ menuItemId: item.MenuItemId, ingredientId: item.IngredientId, quantityPerItem: item.QuantityPerItem, wastePercent: item.WastePercent, note: item.Note || '', isActive: true });
                      }} />
                      <IconButton icon={Trash2} label="Ẩn" onClick={async () => { if (confirm('Ẩn định lượng này?')) { await kitchenInventoryApi.deleteRecipe(item.Id); await loadData(); } }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          <CardsGrid>
            {ingredients.map((item) => (
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
          <CardsGrid>
            {units.map((item) => (
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
