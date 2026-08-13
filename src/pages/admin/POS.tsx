import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  CreditCard,
  Edit2,
  Minus,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Smartphone,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import RevenueOtpPrompt from '../../components/admin/RevenueOtpPrompt';
import { useAuthStore } from '../../utils/authStore';

type PosTable = {
  Id: string;
  Code: string;
  Name: string;
  AreaName?: string;
  SeatCount: number;
  PositionX: number;
  PositionY: number;
  Width: number;
  Height: number;
  Shape: 'RECT' | 'ROUND';
  SortOrder: number;
  Status: 'AVAILABLE' | 'OCCUPIED';
  IsActive: boolean;
  SourceGuid?: string;
  SourceTable?: string;
};

type PosCategory = {
  Id: string;
  Name: string;
  Description?: string;
  SortOrder: number;
  IsActive: boolean;
};

type PosMenuItem = {
  Id: string;
  CategoryId?: string;
  Code: string;
  Name: string;
  Unit: string;
  Price: number;
  ImageUrl?: string;
  Description?: string;
  SortOrder: number;
  IsActive: boolean;
};

type PosOrderItem = {
  Id: string;
  OrderId: string;
  MenuItemId?: string;
  Code?: string;
  Name: string;
  UnitPrice: number;
  Quantity: number;
  Note?: string;
  Status: 'NEW' | 'SENT' | 'CHANGED';
};

type PosOrder = {
  Id: string;
  OrderNo: string;
  TableId: string;
  TableName: string;
  Status: 'OPEN' | 'ORDERED' | 'PAID' | 'CANCELLED';
  Note?: string;
  SubTotal: number;
  DiscountType?: 'AMOUNT' | 'PERCENT';
  DiscountValue?: number;
  DiscountAmount: number;
  ServiceCharge: number;
  VatAmount: number;
  TotalAmount: number;
  PaymentQrUrl?: string;
  PaymentMethod?: string;
  CreatedAt: string;
  PaidAt?: string;
  ItemCount?: number;
  items?: PosOrderItem[];
};

type PosPaymentSetting = {
  Id?: string;
  BankBin: string;
  BankCode: string;
  BankName: string;
  AccountNo: string;
  AccountName: string;
  QrTemplate: string;
  IsActive?: boolean;
};

type PrintTemplate = {
  Code: string;
  Name: string;
  Content: string;
};

type PosDashboardData = {
  summary: {
    Revenue?: number;
    PaidOrders?: number;
    OpenOrders?: number;
    AverageBill?: number;
    DiscountAmount?: number;
    PreviousRevenue?: number;
    PreviousPaidOrders?: number;
  };
  topItems: Array<{ Name: string; Quantity: number; Amount: number }>;
  hourly: Array<{ Hour: number; Revenue: number; Orders: number }>;
  statusBreakdown?: Array<{ Status: string; Count: number; Revenue: number }>;
};

const today = () => new Date().toISOString().slice(0, 10);

const formatVnd = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return `${hour}:${minute} ${day}/${month}/${year}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const formatVietnamPrintTime = (value: Date = new Date()) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(value).replace(',', '');

const formatShortDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

const calcGrowth = (current?: number, previous?: number) => {
  const now = Number(current || 0);
  const before = Number(previous || 0);
  if (before <= 0) return now > 0 ? 100 : 0;
  return ((now - before) / before) * 100;
};

const formatGrowth = (value: number) => `${value >= 0 ? '+' : ''}${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với ngày trước`;

const replaceToken = (content: string, token: string, value: string) => content.split(token).join(value);

const isOrderInUse = (order?: PosOrder | null) =>
  Boolean(order && order.Status !== 'PAID' && (order.Status === 'ORDERED' || Number(order.ItemCount || 0) > 0 || Number(order.items?.length || 0) > 0));

const cleanTransferInfo = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 100);

const buildVietQrUrl = (setting: typeof emptyPaymentForm, amount: number | string, addInfo: string) => {
  const bankBin = String(setting.bankBin || '').trim();
  const accountNo = String(setting.accountNo || '').replace(/\s+/g, '');
  const template = String(setting.qrTemplate || 'compact2').trim() || 'compact2';
  const safeAmount = Math.max(0, Math.round(Number(amount || 0)));
  if (!bankBin || !accountNo || safeAmount <= 0) return '';
  const params = new URLSearchParams();
  params.set('amount', String(safeAmount));
  params.set('addInfo', cleanTransferInfo(addInfo || 'COMTHINO'));
  if (setting.accountName) params.set('accountName', setting.accountName.trim());
  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.jpg?${params.toString()}`;
};

const calcDiscountAmount = (subTotal: number, type: 'AMOUNT' | 'PERCENT', value: number) => {
  const safeValue = Math.max(0, Number(value || 0));
  const raw = type === 'PERCENT' ? Number(subTotal || 0) * Math.min(100, safeValue) / 100 : safeValue;
  return Math.min(Number(subTotal || 0), Math.max(0, raw));
};

const tabs = [
  { key: 'pos', label: 'Máy POS', icon: Utensils },
  { key: 'setup', label: 'Setup bàn/menu', icon: Edit2 },
  { key: 'templates', label: 'Mẫu in', icon: Printer },
  { key: 'dashboard', label: 'Doanh thu', icon: BarChart3 },
] as const;

type TabKey = typeof tabs[number]['key'];

const emptyTableForm = {
  code: '',
  name: '',
  areaName: 'Nhà hàng',
  seatCount: 4,
  positionX: 24,
  positionY: 24,
  width: 130,
  height: 100,
  shape: 'RECT',
  sortOrder: 0,
  isActive: true,
};
const emptyCategoryForm = { name: '', description: '', sortOrder: 0, isActive: true };
const emptyMenuForm = {
  code: '',
  name: '',
  categoryId: '',
  unit: 'phần',
  price: 0,
  imageUrl: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};
const emptyPaymentForm = {
  id: '',
  bankBin: '970407',
  bankCode: 'TCB',
  bankName: 'Techcombank',
  accountNo: '19035748277012',
  accountName: 'NGUYEN KHAC CAO',
  qrTemplate: 'compact2',
};

export default function POS() {
  const user = useAuthStore((state) => state.user);
  const revenueOtpBypassed = Boolean(user?.isSystemAdmin || user?.role === 'SUPERADMIN' || user?.roles?.includes('SUPERADMIN'));
  const [activeTab, setActiveTab] = useState<TabKey>('pos');
  const [tables, setTables] = useState<PosTable[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [openOrders, setOpenOrders] = useState<PosOrder[]>([]);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<PosOrder | null>(null);
  const [mobilePaymentOrder, setMobilePaymentOrder] = useState<PosOrder | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPage, setMenuPage] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [historyDate, setHistoryDate] = useState(today());
  const [history, setHistory] = useState<PosOrder[]>([]);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<PosOrder | null>(null);
  const [dashboard, setDashboard] = useState<PosDashboardData | null>(null);
  const [revenueOtp, setRevenueOtp] = useState('');
  const [revenueOtpVerified, setRevenueOtpVerified] = useState(revenueOtpBypassed);
  const [revenueOtpError, setRevenueOtpError] = useState<string | null>(null);
  const [revenueOtpLoading, setRevenueOtpLoading] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [tableEditingId, setTableEditingId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuEditingId, setMenuEditingId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentSetting, setPaymentSetting] = useState<PosPaymentSetting | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PosPaymentSetting[]>([]);
  const [itemNoteDrafts, setItemNoteDrafts] = useState<Record<string, string>>({});
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const loadBootstrap = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPosBootstrap();
      if (res.success) {
        setTables(res.data.tables || []);
        setCategories(res.data.categories || []);
        setMenuItems(res.data.menuItems || []);
        setOpenOrders(res.data.openOrders || []);
        setTemplates(res.data.templates || []);
        setPaymentSettings(res.data.paymentSettings || (res.data.paymentSetting ? [res.data.paymentSetting] : []));
        if (res.data.paymentSetting) {
          setPaymentSetting(res.data.paymentSetting);
          setPaymentForm({
            id: res.data.paymentSetting.Id || '',
            bankBin: res.data.paymentSetting.BankBin || emptyPaymentForm.bankBin,
            bankCode: res.data.paymentSetting.BankCode || emptyPaymentForm.bankCode,
            bankName: res.data.paymentSetting.BankName || emptyPaymentForm.bankName,
            accountNo: res.data.paymentSetting.AccountNo || emptyPaymentForm.accountNo,
            accountName: res.data.paymentSetting.AccountName || emptyPaymentForm.accountName,
            qrTemplate: res.data.paymentSetting.QrTemplate || emptyPaymentForm.qrTemplate,
          });
        }
        setEditingTemplate((res.data.templates || [])[0] || null);
      }
    } catch (error) {
      console.error(error);
      const message =
        (error as any)?.response?.data?.message ||
        'Không tải được dữ liệu POS. Kiểm tra cấu hình CaoConnection ở backend.';
      setToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async (otpCode = revenueOtp) => {
    try {
      const [historyRes, dashboardRes] = await Promise.all([
        adminApi.getPosHistory(historyDate, otpCode),
        adminApi.getPosDashboard(historyDate, otpCode),
      ]);
      if (historyRes.success) setHistory(historyRes.data || []);
      if (dashboardRes.success) setDashboard(dashboardRes.data);
      setRevenueOtp(otpCode);
      setRevenueOtpVerified(true);
      setRevenueOtpError(null);
    } catch (error) {
      console.error(error);
      const err = error as any;
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || 'Không tải được dữ liệu doanh thu POS.';
      if (code === 'INVALID_REVENUE_OTP' || code === 'TWO_FACTOR_REQUIRED') {
        setRevenueOtpVerified(false);
        setRevenueOtpError(message);
        setDashboard(null);
        setHistory([]);
      } else {
        setToast(message);
      }
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && revenueOtpVerified) loadReports();
  }, [activeTab, historyDate, revenueOtpVerified]);

  useEffect(() => {
    if (revenueOtpBypassed) setRevenueOtpVerified(true);
  }, [revenueOtpBypassed]);

  useEffect(() => {
    setMenuPage(1);
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    const nextType = currentOrder?.DiscountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT';
    setDiscountType(nextType);
    setDiscount(Number(currentOrder?.DiscountValue ?? currentOrder?.DiscountAmount ?? 0));
  }, [currentOrder?.Id, currentOrder?.DiscountAmount, currentOrder?.DiscountType, currentOrder?.DiscountValue]);

  useEffect(() => {
    setItemNoteDrafts((current) => {
      if (!currentOrder?.items?.length) return {};
      return currentOrder.items.reduce<Record<string, string>>((result, item) => {
        result[item.Id] = current[item.Id] ?? item.Note ?? '';
        return result;
      }, {});
    });
  }, [currentOrder?.Id, currentOrder?.items?.length]);

  const tableOrderMap = useMemo(() => {
    const result = new Map<string, PosOrder>();
    openOrders.filter(isOrderInUse).forEach((order) => result.set(order.TableId, order));
    return result;
  }, [openOrders]);

  const syncOpenOrder = (order: PosOrder) => {
    setOpenOrders((orders) => {
      const rest = orders.filter((item) => item.Id !== order.Id);
      if (!isOrderInUse(order)) return rest;
      return [order, ...rest];
    });
  };

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchCategory = selectedCategory === 'ALL' || item.CategoryId === selectedCategory;
      const matchKeyword =
        !keyword ||
        item.Name.toLowerCase().includes(keyword) ||
        item.Code.toLowerCase().includes(keyword);
      return matchCategory && matchKeyword;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const pageSize = 12;
  const pagedItems = filteredItems.slice((menuPage - 1) * pageSize, menuPage * pageSize);
  const maxMenuPage = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const hasKitchenChanges = currentOrder?.items?.some((item) => item.Status === 'NEW' || item.Status === 'CHANGED');

  const normalizeTableLayout = (table: PosTable) => ({
    positionX: Number(table.PositionX || 0),
    positionY: Number(table.PositionY || 0),
    width: Number(table.Width || 130),
    height: Number(table.Height || 100),
    shape: table.Shape || 'RECT',
  });

  const updateLocalTableLayout = (id: string, patch: Partial<PosTable>) => {
    setTables((current) => current.map((table) => (table.Id === id ? { ...table, ...patch } : table)));
  };

  const beginTableDrag = (event: React.PointerEvent<HTMLButtonElement>, table: PosTable) => {
    if (activeTab !== 'setup') return;
    const layout = normalizeTableLayout(table);
    const canvas = event.currentTarget.closest('[data-pos-canvas]');
    const rect = canvas?.getBoundingClientRect();
    setDragState({
      id: table.Id,
      offsetX: event.clientX - (rect?.left || 0) - layout.positionX,
      offsetY: event.clientY - (rect?.top || 0) - layout.positionY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveTableOnCanvas = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const table = tables.find((item) => item.Id === dragState.id);
    if (!table) return;
    const layout = normalizeTableLayout(table);
    const nextX = Math.max(8, Math.min(event.clientX - rect.left - dragState.offsetX, rect.width - layout.width - 8));
    const nextY = Math.max(8, Math.min(event.clientY - rect.top - dragState.offsetY, rect.height - layout.height - 8));
    updateLocalTableLayout(dragState.id, {
      PositionX: Math.round(nextX),
      PositionY: Math.round(nextY),
    } as Partial<PosTable>);
  };

  const saveTableLayout = async () => {
    const payload = tables.map((table) => {
      const layout = normalizeTableLayout(table);
      return {
        id: table.Id,
        positionX: layout.positionX,
        positionY: layout.positionY,
        width: layout.width,
        height: layout.height,
        shape: layout.shape,
      };
    });
    const res = await adminApi.updatePosTableLayout(payload);
    if (res.success) {
      setToast('Đã lưu sơ đồ bàn.');
      await loadBootstrap();
    }
  };

  const selectTable = async (table: PosTable) => {
    setSelectedTable(table);
    setCurrentOrder(null);
    try {
      const res = await adminApi.openPosOrder(table.Id);
      if (res.success) {
        setCurrentOrder(res.data);
        syncOpenOrder(res.data);
      }
    } catch (error) {
      console.error(error);
      setToast('Không mở được bàn.');
    }
  };

  const refreshCurrentOrder = async (orderId = currentOrder?.Id) => {
    if (!orderId) return;
    const res = await adminApi.getPosOrder(orderId);
    if (res.success) {
      setCurrentOrder(res.data);
      syncOpenOrder(res.data);
    }
  };

  const addItem = async (item: PosMenuItem) => {
    if (!currentOrder) return;
    setIsSaving(true);
    try {
      const res = await adminApi.addPosOrderItem(currentOrder.Id, { menuItemId: item.Id, quantity: 1 });
      if (res.success) {
        setCurrentOrder(res.data);
        syncOpenOrder(res.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async (item: PosOrderItem, patch: Partial<PosOrderItem>) => {
    if (!currentOrder) return;
    const quantity = patch.Quantity ?? item.Quantity;
    const unitPrice = patch.UnitPrice ?? item.UnitPrice;
    const note = patch.Note ?? item.Note ?? '';
    const res = await adminApi.updatePosOrderItem(currentOrder.Id, item.Id, { quantity, unitPrice, note });
    if (res.success) {
      setCurrentOrder(res.data);
      syncOpenOrder(res.data);
    }
  };

  const saveItemNote = async (item: PosOrderItem) => {
    const note = itemNoteDrafts[item.Id] ?? '';
    if (note === (item.Note || '')) return;
    await updateItem(item, { Note: note });
  };

  const saveDirtyItemNotes = async () => {
    if (!currentOrder) return null;
    let latestOrder = currentOrder;
    for (const item of currentOrder.items || []) {
      const note = itemNoteDrafts[item.Id] ?? '';
      if (note !== (item.Note || '')) {
        const res = await adminApi.updatePosOrderItem(currentOrder.Id, item.Id, {
          quantity: item.Quantity,
          unitPrice: item.UnitPrice,
          note,
        });
        if (res.success) latestOrder = res.data;
      }
    }
    if (latestOrder !== currentOrder) {
      setCurrentOrder(latestOrder);
      syncOpenOrder(latestOrder);
    }
    return latestOrder;
  };

  const deleteItem = async (itemId: string) => {
    if (!currentOrder) return;
    const res = await adminApi.deletePosOrderItem(currentOrder.Id, itemId);
    if (res.success) {
      setCurrentOrder(res.data);
      syncOpenOrder(res.data);
    }
  };

  const saveOrderMeta = async (silent = false) => {
    if (!currentOrder) return null;
    const res = await adminApi.updatePosOrder(currentOrder.Id, {
      note: currentOrder.Note || '',
      discountType,
      discountValue: Math.max(0, Number(discount || 0)),
    });
    if (res.success) {
      setCurrentOrder(res.data);
      syncOpenOrder(res.data);
      if (!silent) setToast('Đã cập nhật giảm giá.');
      return res.data as PosOrder;
    }
    return currentOrder;
  };

  const confirmKitchen = async () => {
    if (!currentOrder || !currentOrder.items?.length) return;
    const orderToConfirm = await saveDirtyItemNotes();
    if (!orderToConfirm) return;
    const res = await adminApi.confirmPosKitchen(orderToConfirm.Id);
    if (res.success) {
      setCurrentOrder(res.data);
      syncOpenOrder(res.data);
      setToast('Đã xác nhận order gửi bếp.');
    }
  };

  const returnToTableMapAfterPayment = async (orderNo: string, warning?: string | null) => {
    setMobilePaymentOrder(null);
    setCurrentOrder(null);
    setSelectedTable(null);
    setSelectedCategory('ALL');
    setSearchTerm('');
    setMenuPage(1);
    setActiveTab('pos');
    setToast(warning ? `Đã thanh toán ${orderNo}. Đã quay về sơ đồ bàn. Cảnh báo kho: ${warning}` : `Đã thanh toán ${orderNo}. Đã quay về sơ đồ bàn.`);
    await loadBootstrap();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const payOrder = async () => {
    if (!currentOrder || !currentOrder.items?.length) return;
    setIsSaving(true);
    try {
      setToast('Đang hoàn tất thanh toán...');
      const orderToPay = (await saveDirtyItemNotes()) || currentOrder;
      const savedOrder = await saveOrderMeta(true);
      const paidOrder = savedOrder || orderToPay;
      const res = await adminApi.payPosOrder(paidOrder.Id, 'QR_OR_CASH');
      if (res.success) {
        await returnToTableMapAfterPayment(paidOrder.OrderNo, res.stockWarning);
        if (revenueOtpVerified) await loadReports();
      }
    } catch (error: any) {
      console.error(error);
      setToast(error.response?.data?.message || 'Không hoàn tất được thanh toán.');
    } finally {
      setIsSaving(false);
    }
  };

  const openMobilePayment = async () => {
    if (!currentOrder || !currentOrder.items?.length) return;
    setIsSaving(true);
    try {
      await saveDirtyItemNotes();
      const order = (await saveOrderMeta(true)) || currentOrder;
      setMobilePaymentOrder(order);
    } finally {
      setIsSaving(false);
    }
  };

  const printOrder = (type: 'KITCHEN' | 'TEMPORARY' | 'PAYMENT') => {
    if (!currentOrder) return;
    const template = templates.find((item) => item.Code === type);
    const rows = (currentOrder.items || [])
      .map((item) => {
        const note = itemNoteDrafts[item.Id] ?? item.Note ?? '';
        if (type === 'KITCHEN') {
          return `<tr><td>${item.Name}</td><td>${item.Quantity}</td><td>${note || ''}</td></tr>`;
        }
        return `<tr><td>${item.Name}${note ? `<br><small>${note}</small>` : ''}</td><td>${item.Quantity}</td><td>${formatVnd(item.UnitPrice)}</td><td>${formatVnd(Number(item.UnitPrice) * Number(item.Quantity))}</td></tr>`;
      })
      .join('');
    let html = template?.Content || '';
    html = replaceToken(html, '{{OrderNo}}', currentOrder.OrderNo);
    html = replaceToken(html, '{{TableName}}', currentOrder.TableName);
    html = replaceToken(html, '{{CreatedAt}}', formatVietnamPrintTime());
    html = replaceToken(html, '{{Items}}', rows);
    html = replaceToken(html, '{{OrderNote}}', currentOrder.Note || '');
    html = replaceToken(html, '{{SubTotal}}', formatVnd(currentOrder.SubTotal));
    html = replaceToken(html, '{{ServiceCharge}}', formatVnd(currentOrder.ServiceCharge));
    html = replaceToken(html, '{{VatAmount}}', formatVnd(currentOrder.VatAmount));
    html = replaceToken(html, '{{DiscountAmount}}', formatVnd(currentOrder.DiscountAmount));
    html = replaceToken(html, '{{TotalAmount}}', formatVnd(currentOrder.TotalAmount));
    html = replaceToken(
      html,
      '{{PaymentQrUrl}}',
      buildVietQrUrl(paymentForm, currentOrder.TotalAmount, currentOrder.OrderNo) || currentOrder.PaymentQrUrl || '',
    );
    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${currentOrder.OrderNo}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;color:#1c1917}
        .pos-print{width:72mm;margin:0 auto;padding:5mm}
        header{text-align:center;display:flex;flex-direction:column;gap:2mm}
        header b{font-size:16px} header strong{font-size:14px}
        table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:11px}
        th,td{border-bottom:1px dashed #999;padding:2mm 0;text-align:left}
        th:nth-child(n+2),td:nth-child(n+2){text-align:right}
        footer{margin-top:4mm;font-size:13px}
        footer div{display:flex;justify-content:space-between;margin:1.5mm 0}
        .total{font-size:15px;font-weight:700;border-top:1px solid #111;padding-top:2mm}
        img{display:block;width:38mm;height:38mm;margin:3mm auto;object-fit:contain}
        .qr-text{text-align:center;font-weight:700;font-size:12px}
        @page{size:72mm auto;margin:0}
      </style></head><body>${html}
      <script>
        (function(){
          var printed = false;
          function doPrint(){
            if (printed) return;
            printed = true;
            window.focus();
            window.print();
          }
          function waitForImages(){
            var images = Array.prototype.slice.call(document.images || []);
            if (!images.length) {
              doPrint();
              return;
            }
            var pending = images.length;
            var done = function(){
              pending -= 1;
              if (pending <= 0) setTimeout(doPrint, 120);
            };
            images.forEach(function(img){
              var settled = false;
              var settle = function(){
                if (settled) return;
                settled = true;
                done();
              };
              if (img.complete && img.naturalWidth > 0) {
                settle();
                return;
              }
              img.addEventListener('load', settle, { once: true });
              img.addEventListener('error', settle, { once: true });
              if (img.decode) {
                img.decode().then(settle).catch(function(){});
              }
            });
            setTimeout(doPrint, 5000);
          }
          if (document.readyState === 'complete') waitForImages();
          else window.addEventListener('load', waitForImages, { once: true });
          window.onafterprint = function(){ setTimeout(function(){ window.close(); }, 250); };
        })();
      </script></body></html>
    `);
    printWindow.document.close();
  };

  const saveTable = async () => {
    if (!tableForm.name.trim()) return;
    const res = await adminApi.upsertPosTable(tableForm, tableEditingId || undefined);
    if (res.success) {
      setTableForm(emptyTableForm);
      setTableEditingId(null);
      loadBootstrap();
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    const res = await adminApi.upsertPosMenuCategory(categoryForm, categoryEditingId || undefined);
    if (res.success) {
      setCategoryForm(emptyCategoryForm);
      setCategoryEditingId(null);
      loadBootstrap();
    }
  };

  const saveMenuItem = async () => {
    if (!menuForm.name.trim()) return;
    const res = await adminApi.upsertPosMenuItem(menuForm, menuEditingId || undefined);
    if (res.success) {
      setMenuForm(emptyMenuForm);
      setMenuEditingId(null);
      loadBootstrap();
    }
  };

  const savePaymentSetting = async () => {
    const res = await adminApi.updatePosPaymentSetting(paymentForm);
    if (res.success) {
      const activeSetting = res.data?.paymentSetting || res.data;
      const settingList = res.data?.paymentSettings || (activeSetting ? [activeSetting] : []);
      setPaymentSetting(activeSetting);
      setPaymentSettings(settingList);
      setPaymentForm({
        id: activeSetting?.Id || '',
        bankBin: activeSetting?.BankBin || emptyPaymentForm.bankBin,
        bankCode: activeSetting?.BankCode || emptyPaymentForm.bankCode,
        bankName: activeSetting?.BankName || emptyPaymentForm.bankName,
        accountNo: activeSetting?.AccountNo || emptyPaymentForm.accountNo,
        accountName: activeSetting?.AccountName || emptyPaymentForm.accountName,
        qrTemplate: activeSetting?.QrTemplate || emptyPaymentForm.qrTemplate,
      });
      setToast('Đã lưu cấu hình QR thanh toán.');
      await loadBootstrap();
      if (currentOrder?.Id) await refreshCurrentOrder(currentOrder.Id);
    }
  };

  const activatePaymentSetting = async (settingId: string) => {
    const selected = paymentSettings.find((item) => item.Id === settingId);
    if (!selected) return;
    const nextForm = {
      id: selected.Id || '',
      bankBin: selected.BankBin || emptyPaymentForm.bankBin,
      bankCode: selected.BankCode || emptyPaymentForm.bankCode,
      bankName: selected.BankName || emptyPaymentForm.bankName,
      accountNo: selected.AccountNo || emptyPaymentForm.accountNo,
      accountName: selected.AccountName || emptyPaymentForm.accountName,
      qrTemplate: selected.QrTemplate || emptyPaymentForm.qrTemplate,
    };
    setPaymentForm(nextForm);
    const res = await adminApi.updatePosPaymentSetting(nextForm);
    if (res.success) {
      const activeSetting = res.data?.paymentSetting || res.data;
      setPaymentSetting(activeSetting);
      setPaymentSettings(res.data?.paymentSettings || (activeSetting ? [activeSetting] : []));
      if (activeSetting) {
        setPaymentForm({
          id: activeSetting.Id || '',
          bankBin: activeSetting.BankBin || emptyPaymentForm.bankBin,
          bankCode: activeSetting.BankCode || emptyPaymentForm.bankCode,
          bankName: activeSetting.BankName || emptyPaymentForm.bankName,
          accountNo: activeSetting.AccountNo || emptyPaymentForm.accountNo,
          accountName: activeSetting.AccountName || emptyPaymentForm.accountName,
          qrTemplate: activeSetting.QrTemplate || emptyPaymentForm.qrTemplate,
        });
      }
      setToast(`Đã chọn QR ${selected.AccountNo}.`);
      if (currentOrder?.Id) await refreshCurrentOrder(currentOrder.Id);
    }
  };

  const editTable = (table: PosTable) => {
    setTableEditingId(table.Id);
    setTableForm({
      code: table.Code,
      name: table.Name,
      areaName: table.AreaName || '',
      seatCount: table.SeatCount || 4,
      positionX: table.PositionX || 0,
      positionY: table.PositionY || 0,
      width: table.Width || 130,
      height: table.Height || 100,
      shape: table.Shape || 'RECT',
      sortOrder: table.SortOrder || 0,
      isActive: table.IsActive,
    });
  };

  const editCategory = (category: PosCategory) => {
    setCategoryEditingId(category.Id);
    setCategoryForm({
      name: category.Name,
      description: category.Description || '',
      sortOrder: category.SortOrder || 0,
      isActive: category.IsActive,
    });
  };

  const editMenuItem = (item: PosMenuItem) => {
    setMenuEditingId(item.Id);
    setMenuForm({
      code: item.Code,
      name: item.Name,
      categoryId: item.CategoryId || '',
      unit: item.Unit || 'phần',
      price: Number(item.Price || 0),
      imageUrl: item.ImageUrl || '',
      description: item.Description || '',
      sortOrder: item.SortOrder || 0,
      isActive: item.IsActive,
    });
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    const res = await adminApi.updatePosPrintTemplate(editingTemplate.Code, editingTemplate.Content);
    if (res.success) {
      setToast('Đã lưu mẫu in.');
      loadBootstrap();
    }
  };

  const openHistoryDetail = async (order: PosOrder) => {
    const res = await adminApi.getPosOrder(order.Id);
    if (res.success) setSelectedHistoryOrder(res.data);
  };

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const found = dashboard?.hourly?.find((item) => Number(item.Hour) === hour);
    return {
      Hour: hour,
      Revenue: Number(found?.Revenue || 0),
      Orders: Number(found?.Orders || 0),
    };
  });
  const maxHourlyRevenue = Math.max(1, ...hourlyData.map((item) => item.Revenue));
  const revenueGrowth = calcGrowth(dashboard?.summary.Revenue, dashboard?.summary.PreviousRevenue);
  const paidOrdersGrowth = calcGrowth(dashboard?.summary.PaidOrders, dashboard?.summary.PreviousPaidOrders);
  const templatePreviewHtml = useMemo(() => {
    const isKitchen = editingTemplate?.Code === 'KITCHEN';
    const sampleItems = isKitchen
      ? `<tr><td>Cơm 60K thịt rang</td><td>Ít cay</td><td>60.000 đ</td></tr>
         <tr><td>Cá trắm kho riềng</td><td></td><td>65.000 đ</td></tr>`
      : `<tr><td>Cơm 60K thịt rang</td><td>1</td><td>60.000 đ</td><td>60.000 đ</td></tr>
         <tr><td>Cá trắm kho riềng</td><td>1</td><td>65.000 đ</td><td>65.000 đ</td></tr>`;
    let html = editingTemplate?.Content || '<section class="pos-print"><header><b>Chọn mẫu in</b></header></section>';
    html = replaceToken(html, '{{OrderNo}}', 'POS260705-001');
    html = replaceToken(html, '{{TableName}}', 'H2');
    html = replaceToken(html, '{{CreatedAt}}', '11:03 05/07/2026');
    html = replaceToken(html, '{{PrintType}}', isKitchen ? 'Bếp' : editingTemplate?.Code === 'PAYMENT' ? 'Thanh toán' : 'Tạm tính');
    html = replaceToken(html, '{{Items}}', sampleItems);
    html = replaceToken(html, '{{OrderNote}}', 'Khách ngồi bàn H2');
    html = replaceToken(html, '{{SubTotal}}', '125.000 đ');
    html = replaceToken(html, '{{ServiceCharge}}', '0 đ');
    html = replaceToken(html, '{{VatAmount}}', '0 đ');
    html = replaceToken(html, '{{DiscountAmount}}', '0 đ');
    html = replaceToken(html, '{{TotalAmount}}', '125.000 đ');
    html = replaceToken(html, '{{PaymentQrUrl}}', buildVietQrUrl(paymentForm, 125000, 'POS260705-001'));
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body{margin:0;background:#f4f1eb;font-family:Arial,sans-serif;color:#111}
  .preview-wrap{min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:18px}
  .pos-print{width:80mm;background:#fff;border:1px solid #1f2937;padding:4mm;box-sizing:border-box}
  .pos-print header{text-align:center;font-size:13px;line-height:1.35}
  .pos-print table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}
  .pos-print th,.pos-print td{border-bottom:1px dashed #cbd5e1;padding:3px 2px;text-align:left;vertical-align:top}
  .pos-print th:nth-child(n+2),.pos-print td:nth-child(n+2){text-align:right}
  .pos-print footer{margin-top:8px;font-size:12px}
  .pos-print footer div{display:flex;justify-content:space-between;gap:8px;margin:3px 0}
  .pos-print .total{border-top:1px solid #111;padding-top:6px;font-weight:700}
  .pos-print img{display:block;max-width:46mm;max-height:46mm;margin:8px auto 3px;object-fit:contain}
</style>
</head>
<body><div class="preview-wrap">${html}</div></body>
</html>`;
  }, [editingTemplate?.Code, editingTemplate?.Content, paymentForm]);

  const submitRevenueOtp = async (otp: string) => {
    setRevenueOtpLoading(true);
    await loadReports(otp);
    setRevenueOtpLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    );
  }

  const mobileQrUrl = mobilePaymentOrder
    ? buildVietQrUrl(paymentForm, mobilePaymentOrder.TotalAmount, mobilePaymentOrder.OrderNo) || mobilePaymentOrder.PaymentQrUrl || ''
    : '';
  const mobilePaymentAccount = paymentForm.accountNo
    ? `${paymentForm.bankName} - ${paymentForm.accountNo}`
    : `${paymentSetting?.BankName || ''} - ${paymentSetting?.AccountNo || ''}`;
  const currentSubTotal = Number(currentOrder?.SubTotal || 0);
  const currentDiscountAmount = currentOrder
    ? calcDiscountAmount(currentSubTotal, discountType, discount)
    : 0;
  const currentPreviewTotal = currentOrder ? Math.max(0, currentSubTotal - currentDiscountAmount) : 0;
  const currentDiscountLabel = discountType === 'PERCENT'
    ? `${Number(discount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`
    : formatVnd(discount);

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] space-y-3 bg-stone-100 p-2 animate-fade-in sm:-m-6 sm:space-y-4 sm:p-4 lg:-m-8 lg:p-5">
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-lg">
          {toast}
          <button className="ml-4 text-amber-700" onClick={() => setToast('')}>Đóng</button>
        </div>
      )}

      {mobilePaymentOrder && (
        <div className="fixed inset-0 z-[70] flex items-end bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(92vh,860px)] sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 bg-white p-3 sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Thanh toán mobile</p>
                <h2 className="mt-1 text-2xl font-black text-stone-950">{mobilePaymentOrder.TableName}</h2>
                <p className="text-sm font-bold text-amber-700">{mobilePaymentOrder.OrderNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobilePaymentOrder(null)}
                className="rounded-full border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
                aria-label="Đóng thanh toán mobile"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="rounded-2xl bg-emerald-50 p-3 text-center sm:rounded-3xl sm:p-4">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Tổng cần thanh toán</p>
                <p className="mt-1 text-3xl font-black text-emerald-800 sm:text-4xl">{formatVnd(mobilePaymentOrder.TotalAmount)}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">{mobilePaymentAccount}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3 sm:mt-4 sm:rounded-3xl sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black text-stone-950">Món đã gọi</h3>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                    {mobilePaymentOrder.items?.length || 0} món
                  </span>
                </div>
                <div className="mt-2 max-h-[28dvh] divide-y divide-stone-100 overflow-y-auto pr-1 sm:mt-3 sm:max-h-none sm:overflow-visible sm:pr-0">
                  {(mobilePaymentOrder.items || []).map((item) => {
                    const note = itemNoteDrafts[item.Id] ?? item.Note ?? '';
                    return (
                      <div key={item.Id} className="grid grid-cols-[1fr_auto] gap-3 py-2.5 sm:py-3">
                        <div>
                          <div className="font-extrabold text-stone-950">{item.Name}</div>
                          <div className="mt-0.5 text-xs font-semibold text-stone-500">
                            {item.Quantity} x {formatVnd(item.UnitPrice)}
                          </div>
                          {note && <div className="mt-1 text-xs font-semibold text-amber-700">Ghi chú: {note}</div>}
                        </div>
                        <div className="text-right font-black text-stone-950">
                          {formatVnd(Number(item.UnitPrice) * Number(item.Quantity))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:mt-4 sm:grid-cols-[1fr_220px] sm:items-center sm:rounded-3xl sm:p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">Tạm tính</span>
                    <b>{formatVnd(mobilePaymentOrder.SubTotal)}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">Phí dịch vụ</span>
                    <b>{formatVnd(mobilePaymentOrder.ServiceCharge)}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">VAT</span>
                    <b>{formatVnd(mobilePaymentOrder.VatAmount)}</b>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">Giảm giá</span>
                    <b>{formatVnd(mobilePaymentOrder.DiscountAmount)}</b>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-stone-200 pt-3 text-lg">
                    <span className="font-black text-stone-950">Tổng tiền</span>
                    <b className="text-emerald-700">{formatVnd(mobilePaymentOrder.TotalAmount)}</b>
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3 text-center">
                  {mobileQrUrl ? (
                    <img src={mobileQrUrl} alt="QR thanh toán" className="mx-auto aspect-square w-full max-w-[260px] object-contain" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-stone-300 text-sm font-bold text-stone-400">
                      Chưa có QR
                    </div>
                  )}
                  <p className="mt-2 text-xs font-black uppercase text-stone-600">Quét QR để thanh toán</p>
                </div>
              </div>
            </div>

            <div className="grid shrink-0 gap-2 border-t border-stone-100 bg-white p-3 sm:grid-cols-2 sm:p-4">
              <button
                type="button"
                onClick={() => setMobilePaymentOrder(null)}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={payOrder}
                disabled={isSaving}
                className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSaving ? 'Đang hoàn tất...' : 'Đã nhận tiền - hoàn tất'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-warm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Cơm Thị Nở Restaurant</p>
          <h1 className="mt-1 text-xl font-extrabold text-stone-950 sm:text-2xl">Máy POS nhà hàng</h1>
          <p className="mt-1 text-sm text-stone-500">Chọn bàn, ghi món, xác nhận bếp, in bill và theo dõi doanh thu trong ngày.</p>
        </div>
        <button
          onClick={() => {
            loadBootstrap();
            if (activeTab === 'dashboard' && revenueOtpVerified) loadReports();
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-100 sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-warm [scrollbar-width:none]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition sm:px-4 ${
                active ? 'bg-amber-600 text-white shadow' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'pos' && (
        <div className={selectedTable ? "grid gap-3 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_430px]" : "grid gap-3 lg:gap-4"}>
          <section className={`rounded-2xl border border-stone-200 bg-white shadow-warm xl:min-h-[calc(100vh-13rem)] ${selectedTable ? 'hidden' : ''}`}>
            <div className="border-b border-stone-100 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Sơ đồ bàn</p>
              <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">{selectedTable ? `Bàn ${selectedTable.Name}` : 'Chọn bàn'}</h2>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {tables.map((table) => {
                  const activeOrder = tableOrderMap.get(table.Id);
                  return (
                    <button
                      key={table.Id}
                      onClick={() => selectTable(table)}
                      className={`min-h-[112px] rounded-2xl border p-4 text-left transition active:scale-[.99] ${
                        activeOrder
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-stone-200 bg-stone-50 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-2xl font-extrabold text-stone-950">{table.Name}</span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${activeOrder ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                          {activeOrder ? 'Đang dùng' : 'Trống'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-stone-500">{table.AreaName || 'Khu vực chính'}</p>
                      {activeOrder && <p className="mt-1 truncate text-sm font-bold text-emerald-700">{activeOrder.OrderNo}</p>}
                    </button>
                  );
                })}
              </div>
              <div className="hidden overflow-auto lg:block">
                <div className="relative h-[calc(100vh-18rem)] min-h-[620px] min-w-[1120px] rounded-2xl border border-dashed border-stone-300 bg-[linear-gradient(90deg,rgba(214,211,209,.55)_1px,transparent_1px),linear-gradient(rgba(214,211,209,.55)_1px,transparent_1px)] bg-[size:32px_32px]">
                {tables.map((table) => {
                  const activeOrder = tableOrderMap.get(table.Id);
                  const active = selectedTable?.Id === table.Id;
                  const layout = normalizeTableLayout(table);
                  return (
                    <button
                      key={table.Id}
                      onClick={() => selectTable(table)}
                      style={{
                        left: layout.positionX,
                        top: layout.positionY,
                        width: layout.width,
                        height: layout.height,
                      }}
                      className={`absolute rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                          : activeOrder
                            ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-400'
                            : 'border-stone-200 bg-stone-50 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xl font-extrabold text-stone-950">{table.Name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${activeOrder ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                          {activeOrder ? 'Đang dùng' : 'Trống'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-stone-500">{table.AreaName || 'Khu vực chính'}</p>
                      {activeOrder && <p className="mt-1 text-xs text-emerald-700">{activeOrder.OrderNo}</p>}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          </section>

          <section className={`min-w-0 rounded-2xl border border-stone-200 bg-white shadow-warm ${!selectedTable ? 'hidden' : ''}`}>
            <div className="border-b border-stone-100 p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Menu order</p>
                  <h2 className="text-xl font-extrabold text-stone-950 sm:text-2xl">
                    {selectedTable ? `Chọn món cho bàn ${selectedTable.Name}` : 'Chọn bàn để bắt đầu'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTable(null);
                      setCurrentOrder(null);
                    }}
                    className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-extrabold text-stone-700 transition hover:bg-stone-100"
                  >
                    Sơ đồ bàn
                  </button>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-[1fr_180px] lg:max-w-xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm món, mã món..."
                      className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold outline-none focus:border-amber-500"
                  >
                    <option value="ALL">Tất cả nhóm</option>
                    {categories.map((category) => (
                      <option key={category.Id} value={category.Id}>{category.Name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 sm:gap-3 sm:p-4 2xl:grid-cols-3">
              {pagedItems.map((item) => (
                <button
                  key={item.Id}
                  disabled={!currentOrder || isSaving}
                  onClick={() => addItem(item)}
                  className="group min-h-[96px] rounded-xl border border-stone-200 bg-white p-2.5 text-left transition active:scale-[.99] hover:border-amber-400 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[138px] sm:rounded-2xl sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 sm:px-2.5 sm:py-1 sm:text-xs">{item.Code}</span>
                    <Plus className="h-4 w-4 text-stone-300 transition group-hover:text-amber-600 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-tight text-stone-950 sm:mt-3 sm:text-base">{item.Name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-stone-500 sm:mt-2 sm:text-sm">{item.Description || item.Unit}</p>
                  <p className="mt-2 text-base font-extrabold text-emerald-700 sm:mt-3 sm:text-xl">{formatVnd(item.Price)}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-100 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <span className="font-semibold text-stone-500">{filteredItems.length} món, 10 món/trang</span>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                <button disabled={menuPage <= 1} onClick={() => setMenuPage((p) => p - 1)} className="rounded-lg border border-stone-200 px-3 py-2 font-bold disabled:opacity-40">Trước</button>
                <span className="font-bold text-stone-700">{menuPage}/{maxMenuPage}</span>
                <button disabled={menuPage >= maxMenuPage} onClick={() => setMenuPage((p) => p + 1)} className="rounded-lg border border-stone-200 px-3 py-2 font-bold disabled:opacity-40">Sau</button>
              </div>
            </div>
          </section>

          <section className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-warm xl:sticky xl:top-4 xl:self-start ${!selectedTable ? 'hidden' : ''}`}>
            <div className="sticky top-0 z-20 border-b border-stone-100 bg-white/95 p-3 backdrop-blur sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Order hiện tại</p>
              <h2 className="text-xl font-extrabold text-stone-950 sm:text-2xl">{currentOrder ? currentOrder.TableName : 'Chưa chọn bàn'}</h2>
              <p className="text-sm font-semibold text-amber-700">{currentOrder?.OrderNo || 'Mở bàn để tạo order'}</p>
            </div>

            {!currentOrder ? (
              <div className="flex min-h-[240px] items-center justify-center p-6 text-center text-stone-500 sm:min-h-[360px] sm:p-8">
                Chọn một bàn trống hoặc đang dùng để order.
              </div>
            ) : (
              <div className="flex min-h-0 flex-col sm:min-h-[520px]">
                <div className="space-y-3 p-3 sm:p-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-stone-400">Tạm tính</p>
                        <p className="text-lg font-extrabold text-stone-900">{formatVnd(currentSubTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-stone-400">Tổng tiền</p>
                        <p className="text-lg font-extrabold text-emerald-700">{formatVnd(currentPreviewTotal)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-stone-600">
                      <span>Giảm giá ({currentDiscountLabel})</span>
                      <b className="text-rose-600">-{formatVnd(currentDiscountAmount)}</b>
                    </div>
                  </div>
                  <label className="block rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold uppercase text-amber-900">
                    QR chuyển tiền
                    <select
                      value={paymentForm.id || paymentSetting?.Id || ''}
                      onChange={(e) => activatePaymentSetting(e.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-extrabold normal-case text-stone-900 outline-none focus:border-amber-500"
                    >
                      {paymentSettings.map((setting) => (
                        <option key={setting.Id || `${setting.BankBin}-${setting.AccountNo}`} value={setting.Id || ''}>
                          {setting.BankName} - {setting.AccountNo} - {setting.AccountName}
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-[11px] font-semibold normal-case text-amber-800">
                      Bill thanh toán sẽ in QR theo tài khoản đang chọn.
                    </span>
                  </label>
                  <div className="rounded-2xl border border-stone-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wide text-stone-500">Giảm giá</span>
                      <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-xs font-extrabold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('AMOUNT')}
                          className={`rounded-lg px-3 py-1.5 ${discountType === 'AMOUNT' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}
                        >
                          VNĐ
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('PERCENT')}
                          className={`rounded-lg px-3 py-1.5 ${discountType === 'PERCENT' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <input
                          type="number"
                          min={0}
                          max={discountType === 'PERCENT' ? 100 : undefined}
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value || 0))}
                          className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 pr-12 text-base font-extrabold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          placeholder="0"
                        />
                        <span className="pointer-events-none absolute right-3 top-3 text-xs font-black text-stone-400">
                          {discountType === 'PERCENT' ? '%' : 'đ'}
                        </span>
                      </div>
                      <button onClick={() => saveOrderMeta()} className="rounded-xl bg-stone-900 px-4 text-sm font-bold text-white">Lưu</button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      Hệ thống tự tính: {currentDiscountLabel} = {formatVnd(currentDiscountAmount)}.
                    </p>
                  </div>
                  <textarea
                    value={currentOrder.Note || ''}
                    onChange={(e) => setCurrentOrder({ ...currentOrder, Note: e.target.value })}
                    placeholder="Ghi chú order..."
                    rows={2}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-[38vh] flex-1 space-y-2 overflow-y-auto border-y border-stone-100 bg-stone-50/40 p-3 sm:max-h-[420px] sm:space-y-3 sm:p-4 xl:max-h-[calc(100vh-33rem)]">
                  {currentOrder.items?.length ? (
                    currentOrder.items.map((item) => (
                      <div key={item.Id} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-extrabold text-stone-950">{item.Name}</h3>
                            <p className="text-xs font-semibold text-stone-500">{formatVnd(item.UnitPrice)}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${item.Status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                            {item.Status === 'SENT' ? 'Đã gửi' : 'Cần xác nhận'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateItem(item, { Quantity: Number(item.Quantity) - 1 })} className="rounded-lg border border-stone-200 p-2.5"><Minus className="h-4 w-4" /></button>
                            <input
                              type="number"
                              min={0}
                              value={item.Quantity}
                              onChange={(e) => updateItem(item, { Quantity: Number(e.target.value || 0) })}
                              className="h-10 w-20 rounded-lg border border-stone-200 text-center text-base font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            />
                            <button onClick={() => updateItem(item, { Quantity: Number(item.Quantity) + 1 })} className="rounded-lg border border-stone-200 p-2.5"><Plus className="h-4 w-4" /></button>
                            <div className="flex-1" />
                            <button onClick={() => deleteItem(item.Id)} className="rounded-lg border border-rose-100 p-2.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <div
                            className="rounded-xl border border-stone-200 bg-stone-50 p-1 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100"
                            onClick={(event) => {
                              const input = event.currentTarget.querySelector('input');
                              input?.focus();
                            }}
                          >
                            <input
                              value={itemNoteDrafts[item.Id] ?? item.Note ?? ''}
                              onChange={(e) => setItemNoteDrafts((current) => ({ ...current, [item.Id]: e.target.value }))}
                              onBlur={() => saveItemNote(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              placeholder="Ghi chú món"
                              className="h-12 w-full rounded-lg bg-transparent px-3 text-base font-semibold text-stone-900 outline-none placeholder:text-stone-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-40 items-center justify-center text-center text-stone-500">Bàn này chưa có món nào.</div>
                  )}
                </div>

                <div className="sticky bottom-0 z-20 space-y-3 border-t border-stone-100 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(28,25,23,.08)] backdrop-blur sm:static sm:border-t-0 sm:p-4 sm:shadow-none">
                  <button
                    onClick={confirmKitchen}
                    disabled={!hasKitchenChanges}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white transition ${
                      hasKitchenChanges ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-300'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    Xác nhận order gửi bếp
                  </button>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button onClick={() => printOrder('KITCHEN')} className="rounded-xl border border-stone-200 px-2 py-3 text-xs font-extrabold text-stone-700">Bếp</button>
                    <button onClick={() => printOrder('TEMPORARY')} className="rounded-xl border border-stone-200 px-2 py-3 text-xs font-extrabold text-stone-700">Tạm tính</button>
                    <button onClick={() => printOrder('PAYMENT')} className="rounded-xl border border-stone-200 bg-stone-900 px-2 py-3 text-xs font-extrabold text-white">Thanh toán</button>
                  </div>
                  <button
                    onClick={openMobilePayment}
                    disabled={!currentOrder.items?.length || isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-stone-300 sm:hidden"
                  >
                    <Smartphone className="h-4 w-4" />
                    Thanh toán mobile / QR
                  </button>
                  <button
                    onClick={openMobilePayment}
                    disabled={!currentOrder.items?.length || isSaving}
                    className="hidden w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
                  >
                    <QrCode className="h-4 w-4" />
                    Hiển thị hóa đơn QR
                  </button>
                  <button
                    onClick={payOrder}
                    disabled={!currentOrder.items?.length || isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    <CreditCard className="h-4 w-4" />
                    {isSaving ? 'Đang hoàn tất...' : 'Hoàn tất thanh toán'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Thiết lập mặt bằng</p>
                <h2 className="text-xl font-extrabold text-stone-950">Kéo thả vị trí bàn</h2>
                <p className="mt-1 text-sm text-stone-500">Dữ liệu vị trí được đồng bộ với bảng POS gốc trong CAO_BNHHotelManagement.</p>
              </div>
              <button onClick={saveTableLayout} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-amber-500">
                <Save className="h-4 w-4" />
                Lưu sơ đồ bàn
              </button>
            </div>
            <div className="mt-4 overflow-auto">
              <div
                data-pos-canvas
                onPointerMove={moveTableOnCanvas}
                onPointerUp={() => setDragState(null)}
                onPointerLeave={() => setDragState(null)}
                className="relative h-[620px] min-w-[1100px] rounded-2xl border border-dashed border-stone-300 bg-stone-50 bg-[linear-gradient(90deg,rgba(214,211,209,.75)_1px,transparent_1px),linear-gradient(rgba(214,211,209,.75)_1px,transparent_1px)] bg-[size:32px_32px]"
              >
                <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-stone-500 shadow-sm">
                  Prime Restaurant floor plan
                </div>
                {tables.map((table) => {
                  const activeOrder = tableOrderMap.get(table.Id);
                  const layout = normalizeTableLayout(table);
                  return (
                    <button
                      key={table.Id}
                      type="button"
                      onPointerDown={(event) => beginTableDrag(event, table)}
                      onDoubleClick={() => editTable(table)}
                      style={{
                        left: layout.positionX,
                        top: layout.positionY,
                        width: layout.width,
                        height: layout.height,
                        borderRadius: layout.shape === 'ROUND' ? 999 : 16,
                        touchAction: 'none',
                      }}
                      className={`absolute cursor-grab select-none border p-3 text-left shadow-sm transition active:cursor-grabbing ${
                        activeOrder ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-white hover:border-amber-500'
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <p className="text-xl font-extrabold text-stone-950">{table.Name}</p>
                          <p className="text-xs font-semibold text-stone-500">{table.AreaName || table.Code}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-stone-400">{layout.width}x{layout.height}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${activeOrder ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                            {activeOrder ? 'Đang dùng' : 'Trống'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-3">
          <SetupCard title="Setup bàn">
            <FormGrid>
              <Input label="Mã bàn" value={tableForm.code} onChange={(value) => setTableForm({ ...tableForm, code: value })} />
              <Input label="Tên bàn" value={tableForm.name} onChange={(value) => setTableForm({ ...tableForm, name: value })} />
              <Input label="Khu vực" value={tableForm.areaName} onChange={(value) => setTableForm({ ...tableForm, areaName: value })} />
              <Input label="Số ghế" type="number" value={tableForm.seatCount} onChange={(value) => setTableForm({ ...tableForm, seatCount: Number(value) })} />
              <Input label="X" type="number" value={tableForm.positionX} onChange={(value) => setTableForm({ ...tableForm, positionX: Number(value) })} />
              <Input label="Y" type="number" value={tableForm.positionY} onChange={(value) => setTableForm({ ...tableForm, positionY: Number(value) })} />
              <Input label="Rộng" type="number" value={tableForm.width} onChange={(value) => setTableForm({ ...tableForm, width: Number(value) })} />
              <Input label="Cao" type="number" value={tableForm.height} onChange={(value) => setTableForm({ ...tableForm, height: Number(value) })} />
              <label className="text-xs font-bold uppercase text-stone-500">
                Hình dạng
                <select value={tableForm.shape} onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm normal-case outline-none">
                  <option value="RECT">Vuông/chữ nhật</option>
                  <option value="ROUND">Tròn</option>
                </select>
              </label>
              <Input label="Thứ tự" type="number" value={tableForm.sortOrder} onChange={(value) => setTableForm({ ...tableForm, sortOrder: Number(value) })} />
            </FormGrid>
            <SaveButton onClick={saveTable} label={tableEditingId ? 'Cập nhật bàn' : 'Thêm bàn'} />
            <SimpleList items={tables.map((item) => ({ id: item.Id, title: item.Name, subtitle: item.AreaName || item.Code }))} onEdit={(id) => editTable(tables.find((item) => item.Id === id)!)} />
          </SetupCard>

          <SetupCard title="Nhóm món POS">
            <FormGrid>
              <Input label="Tên nhóm" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} />
              <Input label="Mô tả" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} />
              <Input label="Thứ tự" type="number" value={categoryForm.sortOrder} onChange={(value) => setCategoryForm({ ...categoryForm, sortOrder: Number(value) })} />
            </FormGrid>
            <SaveButton onClick={saveCategory} label={categoryEditingId ? 'Cập nhật nhóm' : 'Thêm nhóm'} />
            <SimpleList items={categories.map((item) => ({ id: item.Id, title: item.Name, subtitle: item.Description || 'Đang hoạt động' }))} onEdit={(id) => editCategory(categories.find((item) => item.Id === id)!)} />
          </SetupCard>

          <SetupCard title="Món bán tại POS">
            <FormGrid>
              <Input label="Mã món" value={menuForm.code} onChange={(value) => setMenuForm({ ...menuForm, code: value })} />
              <Input label="Tên món" value={menuForm.name} onChange={(value) => setMenuForm({ ...menuForm, name: value })} />
              <label className="text-xs font-bold uppercase text-stone-500">
                Nhóm món
                <select value={menuForm.categoryId} onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm normal-case outline-none">
                  <option value="">Chưa phân nhóm</option>
                  {categories.map((category) => <option key={category.Id} value={category.Id}>{category.Name}</option>)}
                </select>
              </label>
              <Input label="Đơn vị" value={menuForm.unit} onChange={(value) => setMenuForm({ ...menuForm, unit: value })} />
              <Input label="Giá bán" type="number" value={menuForm.price} onChange={(value) => setMenuForm({ ...menuForm, price: Number(value) })} />
              <Input label="Thứ tự" type="number" value={menuForm.sortOrder} onChange={(value) => setMenuForm({ ...menuForm, sortOrder: Number(value) })} />
            </FormGrid>
            <SaveButton onClick={saveMenuItem} label={menuEditingId ? 'Cập nhật món' : 'Thêm món'} />
            <SimpleList items={menuItems.slice(0, 12).map((item) => ({ id: item.Id, title: item.Name, subtitle: `${item.Code} - ${formatVnd(item.Price)}` }))} onEdit={(id) => editMenuItem(menuItems.find((item) => item.Id === id)!)} />
          </SetupCard>

          <SetupCard title="Tài khoản QR thanh toán">
            <FormGrid>
              <label className="text-xs font-bold uppercase text-stone-500 sm:col-span-2">
                Tài khoản đang dùng
                <select
                  value={paymentForm.id || ''}
                  onChange={(e) => {
                    const selected = paymentSettings.find((item) => item.Id === e.target.value);
                    if (!selected) {
                      setPaymentForm(emptyPaymentForm);
                      return;
                    }
                    setPaymentForm({
                      id: selected.Id || '',
                      bankBin: selected.BankBin || emptyPaymentForm.bankBin,
                      bankCode: selected.BankCode || emptyPaymentForm.bankCode,
                      bankName: selected.BankName || emptyPaymentForm.bankName,
                      accountNo: selected.AccountNo || emptyPaymentForm.accountNo,
                      accountName: selected.AccountName || emptyPaymentForm.accountName,
                      qrTemplate: selected.QrTemplate || emptyPaymentForm.qrTemplate,
                    });
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm normal-case outline-none"
                >
                  <option value="">Thêm tài khoản mới</option>
                  {paymentSettings.map((setting) => (
                    <option key={setting.Id || `${setting.BankBin}-${setting.AccountNo}`} value={setting.Id || ''}>
                      {setting.IsActive ? 'Đang dùng - ' : ''}{setting.BankName} - {setting.AccountNo} - {setting.AccountName}
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Bank BIN" value={paymentForm.bankBin} onChange={(value) => setPaymentForm({ ...paymentForm, bankBin: value })} />
              <Input label="Mã ngân hàng" value={paymentForm.bankCode} onChange={(value) => setPaymentForm({ ...paymentForm, bankCode: value })} />
              <Input label="Tên ngân hàng" value={paymentForm.bankName} onChange={(value) => setPaymentForm({ ...paymentForm, bankName: value })} />
              <Input label="Số tài khoản" value={paymentForm.accountNo} onChange={(value) => setPaymentForm({ ...paymentForm, accountNo: value })} />
              <Input label="Tên tài khoản" value={paymentForm.accountName} onChange={(value) => setPaymentForm({ ...paymentForm, accountName: value })} />
              <label className="text-xs font-bold uppercase text-stone-500">
                Mẫu QR
                <select value={paymentForm.qrTemplate} onChange={(e) => setPaymentForm({ ...paymentForm, qrTemplate: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm normal-case outline-none">
                  <option value="compact2">compact2 - Có logo VietQR</option>
                  <option value="compact">compact</option>
                  <option value="qr_only">qr_only</option>
                  <option value="print">print</option>
                </select>
              </label>
            </FormGrid>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                <div className="rounded-xl bg-white p-2">
                  {buildVietQrUrl(paymentForm, 110000, 'POS-DEMO') ? (
                    <img src={buildVietQrUrl(paymentForm, 110000, 'POS-DEMO')} alt="VietQR preview" className="h-36 w-full object-contain" />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-center text-xs font-bold text-stone-400">Nhập đủ thông tin để xem QR</div>
                  )}
                </div>
                <div className="text-sm text-stone-600">
                  <p className="font-extrabold text-stone-950">{paymentForm.bankName || paymentSetting?.BankName}</p>
                  <p className="mt-1">Số TK: <b>{paymentForm.accountNo || paymentSetting?.AccountNo}</b></p>
                  <p>Tên TK: <b>{paymentForm.accountName || paymentSetting?.AccountName}</b></p>
                  <p>Nội dung mẫu: <b>POS-DEMO</b></p>
                  <p>Số tiền mẫu: <b>{formatVnd(110000)}</b></p>
                </div>
              </div>
            </div>
            <SaveButton onClick={savePaymentSetting} label="Lưu QR thanh toán" />
          </SetupCard>
        </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
            <h2 className="text-lg font-extrabold text-stone-900">Mẫu in</h2>
            <div className="mt-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.Code}
                  onClick={() => setEditingTemplate(template)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition ${editingTemplate?.Code === template.Code ? 'bg-amber-600 text-white' : 'bg-stone-50 text-stone-700 hover:bg-stone-100'}`}
                >
                  {template.Name}
                  <span className="block text-xs opacity-70">{template.Code}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">HTML template</p>
                <h2 className="text-xl font-extrabold text-stone-900">{editingTemplate?.Name || 'Chọn mẫu'}</h2>
              </div>
              <button onClick={saveTemplate} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">
                <Save className="h-4 w-4" />
                Lưu mẫu
              </button>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <textarea
                value={editingTemplate?.Content || ''}
                onChange={(e) => editingTemplate && setEditingTemplate({ ...editingTemplate, Content: e.target.value })}
                className="min-h-[620px] w-full rounded-xl border border-stone-200 bg-stone-950 p-4 font-mono text-sm text-amber-50 outline-none focus:border-amber-500"
              />
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Hình ảnh mẫu in</p>
                    <h3 className="text-sm font-extrabold text-stone-900">Preview 80mm</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">Dữ liệu mẫu</span>
                </div>
                <iframe
                  title="POS print template preview"
                  srcDoc={templatePreviewHtml}
                  className="h-[620px] w-full rounded-lg border border-stone-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && !revenueOtpVerified && (
        <RevenueOtpPrompt
          title="Xác minh doanh thu POS"
          description="Nhập OTP Google Authenticator để xem doanh thu, lịch sử bill và top món bán trong POS."
          error={revenueOtpError}
          loading={revenueOtpLoading}
          onSubmit={submitRevenueOtp}
        />
      )}

      {activeTab === 'dashboard' && revenueOtpVerified && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-warm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Dashboard POS</p>
              <h2 className="mt-2 text-2xl font-extrabold text-stone-950 sm:text-4xl">{formatShortDate(historyDate)}</h2>
              <p className="mt-2 text-sm font-semibold text-stone-600">Doanh thu, lịch sử đơn và món bán chạy theo dữ liệu CAO_BNHHotelManagement.</p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-extrabold text-stone-800 shadow-sm" />
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-emerald-700 sm:text-4xl">{formatVnd(dashboard?.summary.Revenue)}</p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-stone-500">Doanh thu trong ngày</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Doanh thu" value={formatVnd(dashboard?.summary.Revenue)} hint={formatGrowth(revenueGrowth)} tone={revenueGrowth >= 0 ? 'up' : 'down'} />
            <Metric label="Bill đã trả" value={dashboard?.summary.PaidOrders || 0} hint={formatGrowth(paidOrdersGrowth)} tone={paidOrdersGrowth >= 0 ? 'up' : 'down'} />
            <Metric label="Order mở" value={dashboard?.summary.OpenOrders || 0} hint="Đang phục vụ tại bàn" />
            <Metric label="Trung bình bill" value={formatVnd(dashboard?.summary.AverageBill)} hint={`Discount ${formatVnd(dashboard?.summary.DiscountAmount)}`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-2xl border border-stone-200 bg-white shadow-warm">
              <div className="border-b border-stone-100 p-4">
                <h3 className="text-lg font-extrabold text-stone-900">Doanh thu theo giờ</h3>
                <p className="mt-1 text-sm text-stone-500">Tính theo thời điểm thanh toán.</p>
              </div>
              <div className="overflow-x-auto p-4">
                <div className="grid min-w-[1040px] gap-2" style={{ gridTemplateColumns: 'repeat(24, minmax(36px, 1fr))' }}>
                  {hourlyData.map((item) => {
                    const height = Math.max(8, Math.round((item.Revenue / maxHourlyRevenue) * 210));
                    const active = item.Revenue > 0;
                    return (
                      <div key={item.Hour} className="flex min-w-0 flex-col items-center">
                        <div className="flex h-56 w-full items-end overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`w-full rounded-full transition ${active ? 'bg-gradient-to-t from-emerald-700 to-emerald-400' : 'bg-stone-200'}`}
                            style={{ height }}
                            title={`${item.Hour}:00 - ${formatVnd(item.Revenue)}`}
                          />
                        </div>
                        <span className="mt-2 text-xs font-extrabold tabular-nums text-stone-700">{item.Hour.toString().padStart(2, '0')}</span>
                        <span className="mt-1 h-8 w-full text-center text-[10px] font-bold leading-tight text-stone-500">
                          {formatVnd(item.Revenue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white shadow-warm">
              <div className="border-b border-stone-100 p-4">
                <h3 className="text-lg font-extrabold text-stone-900">Top món trong ngày</h3>
                <p className="mt-1 text-sm text-stone-500">Theo order đã thanh toán.</p>
              </div>
              <div className="max-h-[390px] space-y-3 overflow-y-auto p-4">
                {(dashboard?.topItems || []).map((item, index) => (
                  <div key={item.Name} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-700">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-stone-950">{item.Name}</p>
                      <p className="text-xs font-semibold text-stone-500">Số lượng {Number(item.Quantity || 0).toLocaleString('vi-VN')}</p>
                    </div>
                    <p className="text-right font-extrabold text-stone-950">{formatVnd(item.Amount)}</p>
                  </div>
                ))}
                {!dashboard?.topItems?.length && <div className="py-10 text-center text-sm text-stone-500">Chưa có món bán trong ngày này.</div>}
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-2xl border border-stone-200 bg-white shadow-warm">
              <div className="border-b border-stone-100 p-4">
                <h3 className="text-lg font-extrabold text-stone-900">Lịch sử đơn trong ngày</h3>
                <p className="mt-1 text-sm text-stone-500">Click một đơn để xem chi tiết món, giờ order và tổng tiền.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Check No</th>
                      <th className="px-4 py-3">Bàn</th>
                      <th className="px-4 py-3">Giờ order</th>
                      <th className="px-4 py-3">Món</th>
                      <th className="px-4 py-3 text-right">Tổng tiền</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {history.map((order) => (
                      <tr key={order.Id} onClick={() => openHistoryDetail(order)} className={`cursor-pointer hover:bg-amber-50/60 ${selectedHistoryOrder?.Id === order.Id ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-stone-900">{order.OrderNo}</td>
                        <td className="px-4 py-3">{order.TableName}</td>
                        <td className="px-4 py-3">{formatDateTime(order.CreatedAt)}</td>
                        <td className="px-4 py-3">{order.ItemCount || 0}</td>
                        <td className="px-4 py-3 text-right font-extrabold">{formatVnd(order.TotalAmount)}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold">{order.Status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!history.length && <div className="p-12 text-center text-stone-500">Chưa có đơn nào trong ngày này.</div>}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
                <h3 className="text-lg font-extrabold text-stone-900">Chi tiết đơn</h3>
                {selectedHistoryOrder ? (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="font-extrabold text-stone-950">{selectedHistoryOrder.OrderNo}</p>
                      <p className="text-sm text-stone-600">Bàn {selectedHistoryOrder.TableName} - {formatDateTime(selectedHistoryOrder.CreatedAt)}</p>
                    </div>
                    {selectedHistoryOrder.items?.map((item) => (
                      <div key={item.Id} className="flex justify-between gap-3 rounded-xl border border-stone-100 p-3 text-sm">
                        <div>
                          <p className="font-bold text-stone-900">{item.Name}</p>
                          <p className="text-stone-500">SL {item.Quantity} x {formatVnd(item.UnitPrice)}</p>
                        </div>
                        <p className="font-extrabold">{formatVnd(Number(item.Quantity) * Number(item.UnitPrice))}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-stone-500">Click một đơn trong bảng để xem món ăn và giờ order.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
      <h2 className="text-lg font-extrabold text-stone-950">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Input({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-bold uppercase text-stone-500">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm normal-case outline-none focus:border-amber-500"
      />
    </label>
  );
}

function SaveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500">
      <Save className="h-4 w-4" />
      {label}
    </button>
  );
}

function SimpleList({
  items,
  onEdit,
}: {
  items: Array<{ id: string; title: string; subtitle: string }>;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-stone-900">{item.title}</p>
            <p className="truncate text-xs text-stone-500">{item.subtitle}</p>
          </div>
          <button onClick={() => onEdit(item.id)} className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-amber-600">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'neutral' | 'up' | 'down';
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-warm">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-stone-950 sm:text-2xl">{value}</p>
      {hint && (
        <p className={`mt-3 text-xs font-extrabold ${tone === 'up' ? 'text-emerald-700' : tone === 'down' ? 'text-rose-600' : 'text-stone-500'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
