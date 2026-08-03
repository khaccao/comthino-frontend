import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  UserRound,
  Wallet,
} from 'lucide-react';
import RevenueOtpPrompt from '../../components/admin/RevenueOtpPrompt';
import { payrollApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';

type Shift = {
  id: string;
  code: string;
  name: string;
  startTime?: string;
  endTime?: string;
  hourlyRate: number;
  description?: string;
  isActive: boolean;
};

type Employee = {
  id: string;
  code: string;
  fullName: string;
  phone?: string;
  position?: string;
  defaultShiftId?: string;
  hourlyRate?: number | null;
  note?: string;
  isActive: boolean;
  defaultShift?: Shift | null;
};

type Attendance = {
  id: string;
  employeeId: string;
  shiftId?: string;
  workDate: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  hourlyRate: number;
  totalHours: number;
  grossAmount: number;
  note?: string;
  employee: Employee;
  shift?: Shift | null;
};

type PayrollLine = {
  id: string;
  employeeCode: string;
  employeeName: string;
  position?: string;
  shiftName?: string;
  attendanceCount: number;
  totalHours: number;
  hourlyRate: number;
  grossAmount: number;
  kpiScore?: number | null;
  kpiLevelName?: string | null;
  kpiRewardAmount: number;
  bonusAmount: number;
  penaltyAmount: number;
  netAmount: number;
};

type PayrollRun = {
  id: string;
  code: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHours: number;
  totalAmount: number;
  totalKpiReward: number;
  totalBonus: number;
  totalPenalty: number;
  netAmount: number;
  note?: string;
  lines: PayrollLine[];
};

type KpiLevel = {
  id: string;
  code: string;
  name: string;
  minScore: number;
  maxScore?: number | null;
  rewardAmount: number;
  description?: string;
  isActive: boolean;
};

type KpiRecord = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  score: number;
  levelId?: string | null;
  rewardAmount: number;
  note?: string;
  status: string;
  employee: Employee;
  level?: KpiLevel | null;
};

type AdjustmentCategory = {
  id: string;
  code: string;
  name: string;
  type: 'BONUS' | 'PENALTY';
  severity?: string | null;
  defaultAmount: number;
  description?: string;
  isActive: boolean;
};

type EmployeeAdjustment = {
  id: string;
  employeeId: string;
  categoryId?: string | null;
  type: 'BONUS' | 'PENALTY';
  severity?: string | null;
  incidentDate: string;
  amount: number;
  reason: string;
  status: string;
  note?: string;
  employee: Employee;
  category?: AdjustmentCategory | null;
};

const tabs = [
  { key: 'overview', label: 'Tổng quan', icon: Wallet },
  { key: 'attendance', label: 'Chấm công', icon: Clock },
  { key: 'kpi', label: 'KPI', icon: Trophy },
  { key: 'adjustments', label: 'Thưởng/phạt', icon: Award },
  { key: 'employees', label: 'Nhân viên', icon: UserRound },
  { key: 'shifts', label: 'Ca làm', icon: CalendarClock },
  { key: 'payroll', label: 'Bảng lương', icon: Check },
  { key: 'rules', label: 'Danh mục', icon: BadgeCheck },
];

const toLocalDateKey = (value: Date | string = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const today = () => toLocalDateKey();
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return toLocalDateKey(date);
};

const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const timeInput = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const dateInput = (value?: string) => {
  if (!value) return today();
  return toLocalDateKey(value);
};

export default function Payroll() {
  const user = useAuthStore((state) => state.user);
  const payrollOtpBypassed = Boolean(user?.isSystemAdmin || user?.role === 'SUPERADMIN' || user?.roles?.includes('SUPERADMIN'));
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [payrollOtp, setPayrollOtp] = useState('');
  const [payrollOtpVerified, setPayrollOtpVerified] = useState(payrollOtpBypassed);
  const [payrollOtpError, setPayrollOtpError] = useState<string | null>(null);
  const [payrollOtpLoading, setPayrollOtpLoading] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [kpiLevels, setKpiLevels] = useState<KpiLevel[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [adjustmentCategories, setAdjustmentCategories] = useState<AdjustmentCategory[]>([]);
  const [adjustments, setAdjustments] = useState<EmployeeAdjustment[]>([]);
  const [attendanceFrom, setAttendanceFrom] = useState(today());
  const [attendanceTo, setAttendanceTo] = useState(today());
  const [periodFrom, setPeriodFrom] = useState(monthStart());
  const [periodTo, setPeriodTo] = useState(today());

  const [editingShiftId, setEditingShiftId] = useState('');
  const [shiftForm, setShiftForm] = useState({
    code: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    hourlyRate: 25000,
    description: '',
    isActive: true,
  });

  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    code: '',
    fullName: '',
    phone: '',
    position: '',
    defaultShiftId: '',
    hourlyRate: '',
    note: '',
    isActive: true,
  });

  const [editingAttendanceId, setEditingAttendanceId] = useState('');
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    shiftId: '',
    workDate: today(),
    clockIn: '08:00',
    clockOut: '17:00',
    breakMinutes: 0,
    hourlyRate: '',
    note: '',
  });

  const [runForm, setRunForm] = useState({
    periodStart: monthStart(),
    periodEnd: today(),
    note: '',
  });

  const [editingKpiLevelId, setEditingKpiLevelId] = useState('');
  const [kpiLevelForm, setKpiLevelForm] = useState({
    code: '',
    name: '',
    minScore: 0,
    maxScore: '',
    rewardAmount: 0,
    description: '',
    isActive: true,
  });

  const [editingKpiRecordId, setEditingKpiRecordId] = useState('');
  const [kpiRecordForm, setKpiRecordForm] = useState({
    employeeId: '',
    periodStart: monthStart(),
    periodEnd: today(),
    score: 80,
    levelId: '',
    rewardAmount: '',
    note: '',
    status: 'APPROVED',
  });

  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    type: 'BONUS' as 'BONUS' | 'PENALTY',
    severity: 'INFO',
    defaultAmount: 0,
    description: '',
    isActive: true,
  });

  const [editingAdjustmentId, setEditingAdjustmentId] = useState('');
  const [adjustmentForm, setAdjustmentForm] = useState({
    employeeId: '',
    categoryId: '',
    type: 'BONUS' as 'BONUS' | 'PENALTY',
    severity: '',
    incidentDate: today(),
    amount: 0,
    reason: '',
    status: 'PENDING',
    note: '',
  });

  const isPayrollOtpError = (error: any) =>
    ['INVALID_PAYROLL_OTP', 'INVALID_REVENUE_OTP', 'TWO_FACTOR_REQUIRED'].includes(error?.response?.data?.code);

  const showPayrollOtpError = (error: any) => {
    setPayrollOtpVerified(false);
    setPayrollOtpError(error?.response?.data?.message || 'Vui lòng nhập OTP Google Authenticator để xem chấm công và lương.');
  };

  const loadBootstrap = async (otpCode = payrollOtp) => {
    setIsLoading(true);
    try {
      const [data, attendanceData] = await Promise.all([
        payrollApi.getBootstrap(otpCode),
        payrollApi.getAttendances({ from: attendanceFrom, to: attendanceTo }, otpCode),
      ]);
      setShifts(data.shifts || []);
      setEmployees(data.employees || []);
      setAttendances(attendanceData || data.attendances || []);
      setRuns(data.runs || []);
      setKpiLevels(data.kpiLevels || []);
      setKpiRecords(data.kpiRecords || []);
      setAdjustmentCategories(data.adjustmentCategories || []);
      setAdjustments(data.adjustments || []);
      setPayrollOtp(otpCode);
      setPayrollOtpVerified(true);
      setPayrollOtpError(null);
    } catch (error: any) {
      if (isPayrollOtpError(error)) {
        showPayrollOtpError(error);
      } else {
        setToast(error?.response?.data?.message || 'Không tải được dữ liệu chấm công và lương.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendances = async () => {
    const data = await payrollApi.getAttendances({ from: attendanceFrom, to: attendanceTo }, payrollOtp);
    setAttendances(data || []);
  };

  const loadRuns = async () => {
    const data = await payrollApi.getRuns(payrollOtp);
    setRuns(data || []);
  };

  const loadKpiRecords = async () => {
    const data = await payrollApi.getKpiRecords({ from: periodFrom, to: periodTo }, payrollOtp);
    setKpiRecords(data || []);
  };

  const loadAdjustments = async () => {
    const data = await payrollApi.getAdjustments({ from: periodFrom, to: periodTo }, payrollOtp);
    setAdjustments(data || []);
  };

  const loadRules = async () => {
    const [levels, categories] = await Promise.all([
      payrollApi.getKpiLevels(payrollOtp),
      payrollApi.getAdjustmentCategories(payrollOtp),
    ]);
    setKpiLevels(levels || []);
    setAdjustmentCategories(categories || []);
  };

  useEffect(() => {
    if (payrollOtpBypassed) loadBootstrap('');
    else setIsLoading(false);
  }, [payrollOtpBypassed]);

  const submitPayrollOtp = async (otp: string) => {
    setPayrollOtpLoading(true);
    await loadBootstrap(otp);
    setPayrollOtpLoading(false);
  };

  const activeEmployees = employees.filter((item) => item.isActive);
  const activeShifts = shifts.filter((item) => item.isActive);
  const activeKpiLevels = kpiLevels.filter((item) => item.isActive);
  const activeAdjustmentCategories = adjustmentCategories.filter((item) => item.isActive);

  const summary = useMemo(() => {
    const totalHours = attendances.reduce((sum, item) => sum + Number(item.totalHours || 0), 0);
    const totalAmount = attendances.reduce((sum, item) => sum + Number(item.grossAmount || 0), 0);
    const openAttendance = attendances.filter((item) => !item.clockOut).length;
    const kpiReward = kpiRecords
      .filter((item) => ['APPROVED', 'APPLIED'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.rewardAmount || 0), 0);
    const bonus = adjustments
      .filter((item) => item.type === 'BONUS' && item.status === 'APPLIED')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const penalty = adjustments
      .filter((item) => item.type === 'PENALTY' && item.status === 'APPLIED')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingAdjustments = adjustments.filter((item) => item.status === 'PENDING').length;
    const latestRun = runs[0];
    return { totalHours, totalAmount, openAttendance, kpiReward, bonus, penalty, pendingAdjustments, latestRun };
  }, [adjustments, attendances, kpiRecords, runs]);

  const resetShift = () => {
    setEditingShiftId('');
    setShiftForm({ code: '', name: '', startTime: '08:00', endTime: '17:00', hourlyRate: 25000, description: '', isActive: true });
  };

  const resetEmployee = () => {
    setEditingEmployeeId('');
    setEmployeeForm({ code: '', fullName: '', phone: '', position: '', defaultShiftId: '', hourlyRate: '', note: '', isActive: true });
  };

  const resetAttendance = () => {
    setEditingAttendanceId('');
    setAttendanceForm({ employeeId: '', shiftId: '', workDate: today(), clockIn: '08:00', clockOut: '17:00', breakMinutes: 0, hourlyRate: '', note: '' });
  };

  const resetKpiLevel = () => {
    setEditingKpiLevelId('');
    setKpiLevelForm({ code: '', name: '', minScore: 0, maxScore: '', rewardAmount: 0, description: '', isActive: true });
  };

  const resetKpiRecord = () => {
    setEditingKpiRecordId('');
    setKpiRecordForm({ employeeId: '', periodStart: monthStart(), periodEnd: today(), score: 80, levelId: '', rewardAmount: '', note: '', status: 'APPROVED' });
  };

  const resetCategory = () => {
    setEditingCategoryId('');
    setCategoryForm({ code: '', name: '', type: 'BONUS', severity: 'INFO', defaultAmount: 0, description: '', isActive: true });
  };

  const resetAdjustment = () => {
    setEditingAdjustmentId('');
    setAdjustmentForm({ employeeId: '', categoryId: '', type: 'BONUS', severity: '', incidentDate: today(), amount: 0, reason: '', status: 'PENDING', note: '' });
  };

  const saveShift = async () => {
    try {
      const payload = { ...shiftForm, hourlyRate: Number(shiftForm.hourlyRate || 0) };
      if (editingShiftId) await payrollApi.updateShift(editingShiftId, payload);
      else await payrollApi.createShift(payload);
      setToast('Đã lưu ca làm.');
      resetShift();
      const data = await payrollApi.getShifts(payrollOtp);
      setShifts(data || []);
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu ca làm.');
    }
  };

  const saveEmployee = async () => {
    try {
      const payload = {
        ...employeeForm,
        defaultShiftId: employeeForm.defaultShiftId || null,
        hourlyRate: employeeForm.hourlyRate === '' ? null : Number(employeeForm.hourlyRate),
      };
      if (editingEmployeeId) await payrollApi.updateEmployee(editingEmployeeId, payload);
      else await payrollApi.createEmployee(payload);
      setToast('Đã lưu nhân viên.');
      resetEmployee();
      const data = await payrollApi.getEmployees(payrollOtp);
      setEmployees(data || []);
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu nhân viên.');
    }
  };

  const saveAttendance = async () => {
    try {
      if (!attendanceForm.employeeId) {
        setToast('Vui lòng chọn nhân viên.');
        return;
      }
      const payload = {
        ...attendanceForm,
        shiftId: attendanceForm.shiftId || null,
        hourlyRate: attendanceForm.hourlyRate === '' ? null : Number(attendanceForm.hourlyRate),
        breakMinutes: Number(attendanceForm.breakMinutes || 0),
      };
      if (editingAttendanceId) await payrollApi.updateAttendance(editingAttendanceId, payload);
      else await payrollApi.createAttendance(payload);
      setToast('Đã lưu chấm công.');
      setAttendanceFrom(attendanceForm.workDate);
      setAttendanceTo(attendanceForm.workDate);
      resetAttendance();
      const data = await payrollApi.getAttendances({ from: attendanceForm.workDate, to: attendanceForm.workDate }, payrollOtp);
      setAttendances(data || []);
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu chấm công.');
    }
  };

  const saveKpiLevel = async () => {
    try {
      const payload = {
        ...kpiLevelForm,
        minScore: Number(kpiLevelForm.minScore || 0),
        maxScore: kpiLevelForm.maxScore === '' ? null : Number(kpiLevelForm.maxScore),
        rewardAmount: Number(kpiLevelForm.rewardAmount || 0),
      };
      if (editingKpiLevelId) await payrollApi.updateKpiLevel(editingKpiLevelId, payload);
      else await payrollApi.createKpiLevel(payload);
      setToast('Đã lưu cấp KPI.');
      resetKpiLevel();
      await loadRules();
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu cấp KPI.');
    }
  };

  const saveKpiRecord = async () => {
    try {
      if (!kpiRecordForm.employeeId) {
        setToast('Vui lòng chọn nhân viên để nhập KPI.');
        return;
      }
      const payload = {
        ...kpiRecordForm,
        levelId: kpiRecordForm.levelId || null,
        score: Number(kpiRecordForm.score || 0),
        rewardAmount: kpiRecordForm.rewardAmount === '' ? null : Number(kpiRecordForm.rewardAmount),
      };
      if (editingKpiRecordId) await payrollApi.updateKpiRecord(editingKpiRecordId, payload);
      else await payrollApi.createKpiRecord(payload);
      setToast('Đã lưu KPI nhân viên.');
      setPeriodFrom(kpiRecordForm.periodStart);
      setPeriodTo(kpiRecordForm.periodEnd);
      resetKpiRecord();
      const data = await payrollApi.getKpiRecords({ from: kpiRecordForm.periodStart, to: kpiRecordForm.periodEnd }, payrollOtp);
      setKpiRecords(data || []);
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu KPI nhân viên.');
    }
  };

  const saveCategory = async () => {
    try {
      const payload = { ...categoryForm, defaultAmount: Number(categoryForm.defaultAmount || 0) };
      if (editingCategoryId) await payrollApi.updateAdjustmentCategory(editingCategoryId, payload);
      else await payrollApi.createAdjustmentCategory(payload);
      setToast('Đã lưu hạng mục thưởng/phạt.');
      resetCategory();
      await loadRules();
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu hạng mục.');
    }
  };

  const saveAdjustment = async () => {
    try {
      if (!adjustmentForm.employeeId) {
        setToast('Vui lòng chọn nhân viên.');
        return;
      }
      const payload = {
        ...adjustmentForm,
        categoryId: adjustmentForm.categoryId || null,
        amount: Number(adjustmentForm.amount || 0),
      };
      if (editingAdjustmentId) await payrollApi.updateAdjustment(editingAdjustmentId, payload);
      else await payrollApi.createAdjustment(payload);
      setToast('Đã lưu thưởng/phạt.');
      setPeriodFrom(adjustmentForm.incidentDate);
      setPeriodTo(adjustmentForm.incidentDate);
      resetAdjustment();
      const data = await payrollApi.getAdjustments({ from: adjustmentForm.incidentDate, to: adjustmentForm.incidentDate }, payrollOtp);
      setAdjustments(data || []);
    } catch (error: any) {
      setToast(error?.response?.data?.message || 'Lỗi khi lưu thưởng/phạt.');
    }
  };

  const generatePayroll = async () => {
    try {
      const res = await payrollApi.generateRun(runForm, payrollOtp);
      setToast(`Đã tính bảng lương ${res.item?.code || ''}.`);
      await loadRuns();
      setActiveTab('payroll');
    } catch (error: any) {
      if (isPayrollOtpError(error)) showPayrollOtpError(error);
      else setToast(error?.response?.data?.message || 'Lỗi khi tạo bảng lương.');
    }
  };

  const applyAdjustment = async (item: EmployeeAdjustment) => {
    await payrollApi.updateAdjustment(item.id, { status: 'APPLIED' });
    await loadAdjustments();
    setToast('Đã ghi nhận vào bảng lương.');
  };

  const statusLabel = (status: string) => ({
    PENDING: 'Chưa ghi nhận',
    APPLIED: 'Đã ghi nhận',
    APPROVED: 'Đã duyệt',
    DRAFT: 'Nháp',
    CANCELLED: 'Đã hủy',
  }[status] || status);

  const severityLabel = (severity?: string | null) => ({
    INFO: 'Thông tin',
    WARNING: 'Cảnh cáo',
    MINOR: 'Nhẹ',
    MAJOR: 'Nặng',
    CRITICAL: 'Nghiêm trọng',
  }[severity || ''] || severity || '-');

  if (!payrollOtpVerified) {
    return (
      <RevenueOtpPrompt
        title="Xác minh chấm công & lương"
        description="Nhập mã OTP Google Authenticator để xem nhân viên, giờ công, KPI, thưởng phạt và bảng lương."
        error={payrollOtpError}
        loading={payrollOtpLoading || isLoading}
        submitLabel="Xác minh và xem lương"
        onSubmit={submitPayrollOtp}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-lg">
          {toast}
          <button className="ml-4 text-emerald-700" onClick={() => setToast('')}>Đóng</button>
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">Nhân sự vận hành</p>
            <h1 className="mt-1 font-serif text-3xl font-black text-stone-950">Chấm công & tính lương</h1>
            <p className="mt-1 text-sm text-stone-500">Quản lý ca làm, nhân viên, giờ đến/giờ về và tự động tính bảng lương theo giờ.</p>
          </div>
          <button onClick={() => loadBootstrap()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-extrabold text-stone-700 hover:bg-stone-50">
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-warm [scrollbar-width:none]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                active ? 'bg-amber-600 text-white shadow' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Nhân viên đang hoạt động" value={activeEmployees.length.toString()} helper={`${employees.length} hồ sơ`} />
            <StatCard label="Tiền công tạm tính" value={formatVnd(summary.totalAmount)} helper={`${summary.totalHours.toFixed(2)} giờ công`} />
            <StatCard label="Thưởng KPI + thưởng" value={formatVnd(summary.kpiReward + summary.bonus)} helper={`${kpiRecords.length} KPI, ${adjustments.filter((i) => i.type === 'BONUS').length} thưởng`} />
            <StatCard label="Phạt / cảnh cáo" value={formatVnd(summary.penalty)} helper={`${summary.pendingAdjustments} mục chưa ghi nhận`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ca làm" value={activeShifts.length.toString()} helper="Có thể gắn cho nhân viên" />
            <StatCard label="KPI đang active" value={activeKpiLevels.length.toString()} helper="Cấp thưởng theo điểm" />
            <StatCard label="Danh mục thưởng/phạt" value={activeAdjustmentCategories.length.toString()} helper="Dùng cho order, bếp, quản lý" />
            <StatCard label="Thực nhận dự kiến" value={formatVnd(summary.totalAmount + summary.kpiReward + summary.bonus - summary.penalty)} helper={`${summary.openAttendance} ca chưa có giờ về`} />
          </div>
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-black text-stone-950">Tính nhanh bảng lương</h2>
                <p className="text-sm text-stone-500">Chọn kỳ lương, hệ thống lấy các bản chấm công đã có giờ về để tính tổng.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input label="Từ ngày" type="date" value={runForm.periodStart} onChange={(v) => setRunForm({ ...runForm, periodStart: v })} />
                <Input label="Đến ngày" type="date" value={runForm.periodEnd} onChange={(v) => setRunForm({ ...runForm, periodEnd: v })} />
                <button onClick={generatePayroll} className="self-end rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">
                  Tính bảng lương
                </button>
              </div>
            </div>
          </section>
          {summary.latestRun && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Bảng lương gần nhất</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-stone-950">{summary.latestRun.code}</h3>
                  <p className="text-sm text-stone-600">{formatDate(summary.latestRun.periodStart)} - {formatDate(summary.latestRun.periodEnd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{formatVnd(summary.latestRun.totalAmount)}</p>
                  <p className="text-sm font-bold text-emerald-700">{summary.latestRun.totalHours.toFixed(2)} giờ công</p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingAttendanceId ? 'Sửa chấm công' : 'Tạo chấm công'}>
            <div className="space-y-3">
              <Select label="Nhân viên" value={attendanceForm.employeeId} onChange={(v) => {
                const employee = employees.find((item) => item.id === v);
                setAttendanceForm({
                  ...attendanceForm,
                  employeeId: v,
                  shiftId: employee?.defaultShiftId || attendanceForm.shiftId,
                  hourlyRate: employee?.hourlyRate ? String(employee.hourlyRate) : '',
                });
              }}>
                <option value="">Chọn nhân viên</option>
                {activeEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </Select>
              <Select label="Ca làm" value={attendanceForm.shiftId} onChange={(v) => {
                const shift = shifts.find((item) => item.id === v);
                setAttendanceForm({
                  ...attendanceForm,
                  shiftId: v,
                  clockIn: shift?.startTime || attendanceForm.clockIn,
                  clockOut: shift?.endTime || attendanceForm.clockOut,
                  hourlyRate: attendanceForm.hourlyRate || (shift ? String(shift.hourlyRate) : ''),
                });
              }}>
                <option value="">Không chọn ca</option>
                {activeShifts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Input label="Ngày làm" type="date" value={attendanceForm.workDate} onChange={(v) => setAttendanceForm({ ...attendanceForm, workDate: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Giờ đến" type="time" value={attendanceForm.clockIn} onChange={(v) => setAttendanceForm({ ...attendanceForm, clockIn: v })} />
                <Input label="Giờ về" type="time" value={attendanceForm.clockOut} onChange={(v) => setAttendanceForm({ ...attendanceForm, clockOut: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Nghỉ giữa ca (phút)" type="number" value={String(attendanceForm.breakMinutes)} onChange={(v) => setAttendanceForm({ ...attendanceForm, breakMinutes: Number(v) })} />
                <Input label="Tiền/giờ" type="number" value={attendanceForm.hourlyRate} onChange={(v) => setAttendanceForm({ ...attendanceForm, hourlyRate: v })} placeholder="Theo ca/nhân viên" />
              </div>
              <Input label="Ghi chú" value={attendanceForm.note} onChange={(v) => setAttendanceForm({ ...attendanceForm, note: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveAttendance} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu</button>
                <button onClick={resetAttendance} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Danh sách chấm công">
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input label="Từ ngày" type="date" value={attendanceFrom} onChange={setAttendanceFrom} />
              <Input label="Đến ngày" type="date" value={attendanceTo} onChange={setAttendanceTo} />
              <button onClick={loadAttendances} className="self-end rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700 hover:bg-stone-50">Lọc</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                  <tr><th className="p-3">Ngày</th><th>Nhân viên</th><th>Ca</th><th>Giờ</th><th>Công</th><th>Lương</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {attendances.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-bold">{formatDate(item.workDate)}</td>
                      <td>{item.employee?.fullName}</td>
                      <td>{item.shift?.name || '-'}</td>
                      <td>{formatTime(item.clockIn)} - {formatTime(item.clockOut)}</td>
                      <td>{Number(item.totalHours || 0).toFixed(2)}h</td>
                      <td className="font-black text-emerald-700">{formatVnd(item.grossAmount)}</td>
                      <td className="space-x-2 text-right">
                        <IconButton label="Sửa" onClick={() => {
                          setEditingAttendanceId(item.id);
                          setAttendanceForm({
                            employeeId: item.employeeId,
                            shiftId: item.shiftId || '',
                            workDate: dateInput(item.workDate),
                            clockIn: timeInput(item.clockIn),
                            clockOut: timeInput(item.clockOut),
                            breakMinutes: item.breakMinutes,
                            hourlyRate: String(item.hourlyRate || ''),
                            note: item.note || '',
                          });
                        }} icon={Edit2} />
                        <IconButton label="Xóa" onClick={async () => { if (confirm('Xóa bản chấm công này?')) { await payrollApi.deleteAttendance(item.id); await loadAttendances(); } }} icon={Trash2} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'kpi' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingKpiRecordId ? 'Sửa KPI nhân viên' : 'Nhập KPI nhân viên'}>
            <div className="space-y-3">
              <Select label="Nhân viên" value={kpiRecordForm.employeeId} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, employeeId: v })}>
                <option value="">Chọn nhân viên</option>
                {activeEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName} - {item.position || 'Nhân sự'}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Từ ngày" type="date" value={kpiRecordForm.periodStart} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, periodStart: v })} />
                <Input label="Đến ngày" type="date" value={kpiRecordForm.periodEnd} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, periodEnd: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Điểm KPI" type="number" value={String(kpiRecordForm.score)} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, score: Number(v) })} />
                <Input label="Thưởng tay" type="number" value={kpiRecordForm.rewardAmount} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, rewardAmount: v })} placeholder="Trống = theo cấp" />
              </div>
              <Select label="Cấp KPI" value={kpiRecordForm.levelId} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, levelId: v })}>
                <option value="">Tự dò theo điểm</option>
                {activeKpiLevels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.minScore}-{item.maxScore ?? '∞'}) - {formatVnd(item.rewardAmount)}
                  </option>
                ))}
              </Select>
              <Select label="Trạng thái" value={kpiRecordForm.status} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, status: v })}>
                <option value="DRAFT">Nháp</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="APPLIED">Đã ghi nhận</option>
                <option value="CANCELLED">Đã hủy</option>
              </Select>
              <Input label="Ghi chú KPI" value={kpiRecordForm.note} onChange={(v) => setKpiRecordForm({ ...kpiRecordForm, note: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveKpiRecord} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu KPI</button>
                <button onClick={resetKpiRecord} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Lịch sử KPI theo kỳ">
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input label="Từ ngày" type="date" value={periodFrom} onChange={setPeriodFrom} />
              <Input label="Đến ngày" type="date" value={periodTo} onChange={setPeriodTo} />
              <button onClick={loadKpiRecords} className="self-end rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700 hover:bg-stone-50">Lọc</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                  <tr><th className="p-3">Nhân viên</th><th>Kỳ</th><th>Điểm</th><th>Cấp</th><th>Thưởng</th><th>Trạng thái</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {kpiRecords.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3"><b>{item.employee?.fullName}</b><div className="text-xs text-stone-500">{item.employee?.position || item.employee?.code}</div></td>
                      <td>{formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</td>
                      <td className="font-black">{Number(item.score || 0).toFixed(1)}</td>
                      <td>{item.level?.name || '-'}</td>
                      <td className="font-black text-emerald-700">{formatVnd(item.rewardAmount)}</td>
                      <td>{statusLabel(item.status)}</td>
                      <td className="space-x-2 text-right">
                        <IconButton label="Sửa" onClick={() => {
                          setEditingKpiRecordId(item.id);
                          setKpiRecordForm({
                            employeeId: item.employeeId,
                            periodStart: dateInput(item.periodStart),
                            periodEnd: dateInput(item.periodEnd),
                            score: item.score,
                            levelId: item.levelId || '',
                            rewardAmount: String(item.rewardAmount || ''),
                            note: item.note || '',
                            status: item.status,
                          });
                        }} icon={Edit2} />
                        <IconButton label="Xóa" onClick={async () => { if (confirm('Xóa KPI này?')) { await payrollApi.deleteKpiRecord(item.id); await loadKpiRecords(); } }} icon={Trash2} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingAdjustmentId ? 'Sửa thưởng/phạt' : 'Tạo thưởng/phạt'}>
            <div className="space-y-3">
              <Select label="Nhân viên" value={adjustmentForm.employeeId} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, employeeId: v })}>
                <option value="">Chọn nhân viên</option>
                {activeEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName} - {item.position || 'Nhân sự'}</option>)}
              </Select>
              <Select label="Hạng mục" value={adjustmentForm.categoryId} onChange={(v) => {
                const category = adjustmentCategories.find((item) => item.id === v);
                setAdjustmentForm({
                  ...adjustmentForm,
                  categoryId: v,
                  type: category?.type || adjustmentForm.type,
                  severity: category?.severity || adjustmentForm.severity,
                  amount: category ? category.defaultAmount : adjustmentForm.amount,
                  reason: category?.name || adjustmentForm.reason,
                });
              }}>
                <option value="">Chọn hạng mục</option>
                {activeAdjustmentCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.type === 'BONUS' ? 'Thưởng' : 'Phạt'} - {item.name}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Select label="Loại" value={adjustmentForm.type} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v as 'BONUS' | 'PENALTY' })}>
                  <option value="BONUS">Thưởng</option>
                  <option value="PENALTY">Phạt</option>
                </Select>
                <Select label="Mức độ" value={adjustmentForm.severity} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, severity: v })}>
                  <option value="">Không chọn</option>
                  <option value="INFO">Thông tin</option>
                  <option value="WARNING">Cảnh cáo</option>
                  <option value="MINOR">Nhẹ</option>
                  <option value="MAJOR">Nặng</option>
                  <option value="CRITICAL">Nghiêm trọng</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Ngày" type="date" value={adjustmentForm.incidentDate} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, incidentDate: v })} />
                <Input label="Số tiền" type="number" value={String(adjustmentForm.amount)} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, amount: Number(v) })} />
              </div>
              <Input label="Lý do" value={adjustmentForm.reason} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, reason: v })} />
              <Select label="Trạng thái" value={adjustmentForm.status} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, status: v })}>
                <option value="PENDING">Chưa ghi nhận</option>
                <option value="APPLIED">Đã ghi nhận vào lương</option>
                <option value="CANCELLED">Đã hủy</option>
              </Select>
              <Input label="Ghi chú" value={adjustmentForm.note} onChange={(v) => setAdjustmentForm({ ...adjustmentForm, note: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveAdjustment} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu</button>
                <button onClick={resetAdjustment} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>
          </Panel>
          <Panel title="Theo dõi thưởng/phạt">
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input label="Từ ngày" type="date" value={periodFrom} onChange={setPeriodFrom} />
              <Input label="Đến ngày" type="date" value={periodTo} onChange={setPeriodTo} />
              <button onClick={loadAdjustments} className="self-end rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700 hover:bg-stone-50">Lọc</button>
            </div>
            <div className="grid gap-3">
              {adjustments.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${item.type === 'PENALTY' ? 'border-red-100 bg-red-50/40' : 'border-emerald-100 bg-emerald-50/40'}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-stone-500">{formatDate(item.incidentDate)} · {severityLabel(item.severity)}</p>
                      <h3 className="mt-1 text-lg font-black text-stone-950">{item.employee?.fullName} - {item.reason}</h3>
                      <p className="mt-1 text-sm text-stone-500">{item.category?.name || 'Không có hạng mục'} · {statusLabel(item.status)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`text-2xl font-black ${item.type === 'PENALTY' ? 'text-red-700' : 'text-emerald-700'}`}>
                        {item.type === 'PENALTY' ? '-' : '+'}{formatVnd(item.amount)}
                      </p>
                      <div className="mt-2 flex gap-2 sm:justify-end">
                        {item.status === 'PENDING' && (
                          <button onClick={() => applyAdjustment(item)} className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-bold text-white">Ghi nhận</button>
                        )}
                        <IconButton label="Sửa" onClick={() => {
                          setEditingAdjustmentId(item.id);
                          setAdjustmentForm({
                            employeeId: item.employeeId,
                            categoryId: item.categoryId || '',
                            type: item.type,
                            severity: item.severity || '',
                            incidentDate: dateInput(item.incidentDate),
                            amount: item.amount,
                            reason: item.reason,
                            status: item.status,
                            note: item.note || '',
                          });
                        }} icon={Edit2} />
                        <IconButton label="Xóa" onClick={async () => { if (confirm('Xóa thưởng/phạt này?')) { await payrollApi.deleteAdjustment(item.id); await loadAdjustments(); } }} icon={Trash2} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingEmployeeId ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
            <div className="space-y-3">
              <Input label="Mã nhân viên" value={employeeForm.code} onChange={(v) => setEmployeeForm({ ...employeeForm, code: v })} />
              <Input label="Tên nhân viên" value={employeeForm.fullName} onChange={(v) => setEmployeeForm({ ...employeeForm, fullName: v })} />
              <Input label="Số điện thoại" value={employeeForm.phone} onChange={(v) => setEmployeeForm({ ...employeeForm, phone: v })} />
              <Input label="Vị trí" value={employeeForm.position} onChange={(v) => setEmployeeForm({ ...employeeForm, position: v })} />
              <Select label="Ca mặc định" value={employeeForm.defaultShiftId} onChange={(v) => setEmployeeForm({ ...employeeForm, defaultShiftId: v })}>
                <option value="">Chưa gán ca</option>
                {activeShifts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Input label="Lương riêng/giờ" type="number" value={employeeForm.hourlyRate} onChange={(v) => setEmployeeForm({ ...employeeForm, hourlyRate: v })} placeholder="Để trống để lấy theo ca" />
              <Input label="Ghi chú" value={employeeForm.note} onChange={(v) => setEmployeeForm({ ...employeeForm, note: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveEmployee} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu</button>
                <button onClick={resetEmployee} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>
          </Panel>
          <CardsGrid>
            {employees.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${item.isActive ? 'border-stone-200 bg-white' : 'border-stone-100 bg-stone-50 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.code}</p>
                    <h3 className="mt-1 text-xl font-black text-stone-950">{item.fullName}</h3>
                    <p className="text-sm text-stone-500">{item.position || 'Chưa có vị trí'} · {item.phone || 'Chưa có SĐT'}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{item.isActive ? 'Đang làm' : 'Đã ẩn'}</span>
                </div>
                <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
                  <div className="flex justify-between"><span>Ca mặc định</span><b>{item.defaultShift?.name || '-'}</b></div>
                  <div className="mt-2 flex justify-between"><span>Lương/giờ</span><b>{formatVnd(Number(item.hourlyRate || item.defaultShift?.hourlyRate || 0))}</b></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => {
                    setEditingEmployeeId(item.id);
                    setEmployeeForm({
                      code: item.code,
                      fullName: item.fullName,
                      phone: item.phone || '',
                      position: item.position || '',
                      defaultShiftId: item.defaultShiftId || '',
                      hourlyRate: item.hourlyRate ? String(item.hourlyRate) : '',
                      note: item.note || '',
                      isActive: item.isActive,
                    });
                  }} className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold">Sửa</button>
                  <button onClick={async () => { if (confirm('Ẩn nhân viên này?')) { await payrollApi.deleteEmployee(item.id); setEmployees(await payrollApi.getEmployees(payrollOtp)); } }} className="rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600">Ẩn</button>
                </div>
              </div>
            ))}
          </CardsGrid>
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title={editingShiftId ? 'Sửa ca làm' : 'Thêm ca làm'}>
            <div className="space-y-3">
              <Input label="Mã ca" value={shiftForm.code} onChange={(v) => setShiftForm({ ...shiftForm, code: v })} />
              <Input label="Tên ca" value={shiftForm.name} onChange={(v) => setShiftForm({ ...shiftForm, name: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Bắt đầu" type="time" value={shiftForm.startTime} onChange={(v) => setShiftForm({ ...shiftForm, startTime: v })} />
                <Input label="Kết thúc" type="time" value={shiftForm.endTime} onChange={(v) => setShiftForm({ ...shiftForm, endTime: v })} />
              </div>
              <Input label="Lương/giờ" type="number" value={String(shiftForm.hourlyRate)} onChange={(v) => setShiftForm({ ...shiftForm, hourlyRate: Number(v) })} />
              <Input label="Mô tả" value={shiftForm.description} onChange={(v) => setShiftForm({ ...shiftForm, description: v })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveShift} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu</button>
                <button onClick={resetShift} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>
          </Panel>
          <CardsGrid>
            {shifts.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${item.isActive ? 'border-stone-200 bg-white' : 'border-stone-100 bg-stone-50 opacity-70'}`}>
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.code}</p>
                <h3 className="mt-1 text-xl font-black text-stone-950">{item.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{item.startTime || '--:--'} - {item.endTime || '--:--'}</p>
                <p className="mt-4 text-2xl font-black text-emerald-700">{formatVnd(item.hourlyRate)}<span className="text-sm text-stone-500">/giờ</span></p>
                <p className="mt-2 min-h-10 text-sm text-stone-500">{item.description || 'Chưa có mô tả'}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setEditingShiftId(item.id); setShiftForm({ code: item.code, name: item.name, startTime: item.startTime || '', endTime: item.endTime || '', hourlyRate: item.hourlyRate, description: item.description || '', isActive: item.isActive }); }} className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold">Sửa</button>
                  <button onClick={async () => { if (confirm('Ẩn ca làm này?')) { await payrollApi.deleteShift(item.id); setShifts(await payrollApi.getShifts(payrollOtp)); } }} className="rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600">Ẩn</button>
                </div>
              </div>
            ))}
          </CardsGrid>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title={editingKpiLevelId ? 'Sửa cấp KPI' : 'Cấp KPI và thưởng'}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Mã cấp" value={kpiLevelForm.code} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, code: v })} />
                <Input label="Tên cấp" value={kpiLevelForm.name} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, name: v })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Điểm từ" type="number" value={String(kpiLevelForm.minScore)} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, minScore: Number(v) })} />
                <Input label="Điểm đến" type="number" value={kpiLevelForm.maxScore} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, maxScore: v })} placeholder="Trống = không giới hạn" />
                <Input label="Tiền thưởng" type="number" value={String(kpiLevelForm.rewardAmount)} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, rewardAmount: Number(v) })} />
              </div>
              <Input label="Mô tả" value={kpiLevelForm.description} onChange={(v) => setKpiLevelForm({ ...kpiLevelForm, description: v })} />
              <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={kpiLevelForm.isActive}
                  onChange={(event) => setKpiLevelForm({ ...kpiLevelForm, isActive: event.target.checked })}
                />
                Đang áp dụng
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveKpiLevel} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu cấp KPI</button>
                <button onClick={resetKpiLevel} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {kpiLevels.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${item.isActive ? 'border-amber-100 bg-amber-50/40' : 'border-stone-100 bg-stone-50 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.code}</p>
                      <h3 className="text-lg font-black text-stone-950">{item.name}</h3>
                      <p className="text-sm text-stone-500">Từ {item.minScore} đến {item.maxScore ?? 'không giới hạn'} điểm</p>
                    </div>
                    <p className="text-xl font-black text-emerald-700">{formatVnd(item.rewardAmount)}</p>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">{item.description || 'Chưa có mô tả'}</p>
                  <div className="mt-3 flex gap-2">
                    <IconButton label="Sửa" onClick={() => {
                      setEditingKpiLevelId(item.id);
                      setKpiLevelForm({
                        code: item.code,
                        name: item.name,
                        minScore: item.minScore,
                        maxScore: item.maxScore === null || item.maxScore === undefined ? '' : String(item.maxScore),
                        rewardAmount: item.rewardAmount,
                        description: item.description || '',
                        isActive: item.isActive,
                      });
                    }} icon={Edit2} />
                    <IconButton label="Ẩn" onClick={async () => { if (confirm('Ẩn cấp KPI này?')) { await payrollApi.deleteKpiLevel(item.id); await loadRules(); } }} icon={Trash2} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={editingCategoryId ? 'Sửa hạng mục' : 'Hạng mục thưởng/phạt'}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Mã hạng mục" value={categoryForm.code} onChange={(v) => setCategoryForm({ ...categoryForm, code: v })} />
                <Input label="Tên hạng mục" value={categoryForm.name} onChange={(v) => setCategoryForm({ ...categoryForm, name: v })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select label="Loại" value={categoryForm.type} onChange={(v) => setCategoryForm({ ...categoryForm, type: v as 'BONUS' | 'PENALTY' })}>
                  <option value="BONUS">Thưởng</option>
                  <option value="PENALTY">Phạt</option>
                </Select>
                <Select label="Mức độ" value={categoryForm.severity} onChange={(v) => setCategoryForm({ ...categoryForm, severity: v })}>
                  <option value="INFO">Thông tin</option>
                  <option value="WARNING">Cảnh cáo</option>
                  <option value="MINOR">Nhẹ</option>
                  <option value="MAJOR">Nặng</option>
                  <option value="CRITICAL">Nghiêm trọng</option>
                </Select>
                <Input label="Mức tiền" type="number" value={String(categoryForm.defaultAmount)} onChange={(v) => setCategoryForm({ ...categoryForm, defaultAmount: Number(v) })} />
              </div>
              <Input label="Mô tả/quy định" value={categoryForm.description} onChange={(v) => setCategoryForm({ ...categoryForm, description: v })} />
              <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })}
                />
                Đang áp dụng
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveCategory} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Lưu hạng mục</button>
                <button onClick={resetCategory} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-extrabold text-stone-700">Làm mới</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {adjustmentCategories.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${item.type === 'PENALTY' ? 'border-red-100 bg-red-50/40' : 'border-emerald-100 bg-emerald-50/40'} ${item.isActive ? '' : 'opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-stone-500">{item.code} · {severityLabel(item.severity)}</p>
                      <h3 className="text-lg font-black text-stone-950">{item.name}</h3>
                      <p className="text-sm text-stone-500">{item.type === 'BONUS' ? 'Thưởng nhân viên' : 'Phạt/cảnh cáo nhân viên'}</p>
                    </div>
                    <p className={`text-xl font-black ${item.type === 'PENALTY' ? 'text-red-700' : 'text-emerald-700'}`}>{formatVnd(item.defaultAmount)}</p>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">{item.description || 'Chưa có mô tả'}</p>
                  <div className="mt-3 flex gap-2">
                    <IconButton label="Sửa" onClick={() => {
                      setEditingCategoryId(item.id);
                      setCategoryForm({
                        code: item.code,
                        name: item.name,
                        type: item.type,
                        severity: item.severity || 'INFO',
                        defaultAmount: item.defaultAmount,
                        description: item.description || '',
                        isActive: item.isActive,
                      });
                    }} icon={Edit2} />
                    <IconButton label="Ẩn" onClick={async () => { if (confirm('Ẩn hạng mục này?')) { await payrollApi.deleteAdjustmentCategory(item.id); await loadRules(); } }} icon={Trash2} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <Panel title="Tạo bảng lương">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end">
              <Input label="Từ ngày" type="date" value={runForm.periodStart} onChange={(v) => setRunForm({ ...runForm, periodStart: v })} />
              <Input label="Đến ngày" type="date" value={runForm.periodEnd} onChange={(v) => setRunForm({ ...runForm, periodEnd: v })} />
              <Input label="Ghi chú kỳ lương" value={runForm.note} onChange={(v) => setRunForm({ ...runForm, note: v })} />
              <button onClick={generatePayroll} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-500">Tính lương</button>
            </div>
          </Panel>
          {runs.map((run) => (
            <section key={run.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-warm">
              <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">{run.code}</p>
                  <h3 className="text-xl font-black text-stone-950">{formatDate(run.periodStart)} - {formatDate(run.periodEnd)}</h3>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-black text-emerald-700">{formatVnd(run.netAmount || run.totalAmount)}</p>
                  <p className="text-sm font-bold text-stone-500">
                    Công {formatVnd(run.totalAmount)} · KPI {formatVnd(run.totalKpiReward)} · Thưởng {formatVnd(run.totalBonus)} · Phạt {formatVnd(run.totalPenalty)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                    <tr>
                      <th className="p-3">Nhân viên</th>
                      <th>Vị trí</th>
                      <th>Số ca</th>
                      <th>Giờ công</th>
                      <th>Bình quân/giờ</th>
                      <th className="text-right">Lương công</th>
                      <th className="text-right">KPI</th>
                      <th className="text-right">Thưởng</th>
                      <th className="text-right">Phạt</th>
                      <th className="pr-3 text-right">Thực lĩnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(run.lines || []).map((line) => (
                      <tr key={line.id}>
                        <td className="p-3"><b>{line.employeeName}</b><div className="text-xs text-stone-500">{line.employeeCode}</div></td>
                        <td>{line.position || line.shiftName || '-'}</td>
                        <td>{line.attendanceCount}</td>
                        <td>{Number(line.totalHours || 0).toFixed(2)}h</td>
                        <td>{formatVnd(line.hourlyRate)}</td>
                        <td className="text-right font-black">{formatVnd(line.grossAmount)}</td>
                        <td className="text-right">
                          <b className="text-emerald-700">{formatVnd(line.kpiRewardAmount)}</b>
                          <div className="text-xs text-stone-500">{line.kpiLevelName || (line.kpiScore ? `${line.kpiScore} điểm` : '-')}</div>
                        </td>
                        <td className="text-right font-black text-emerald-700">{formatVnd(line.bonusAmount)}</td>
                        <td className="text-right font-black text-red-600">{formatVnd(line.penaltyAmount)}</td>
                        <td className="pr-3 text-right text-lg font-black text-stone-950">{formatVnd(line.netAmount || line.grossAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end border-t border-stone-100 p-3">
                <button onClick={async () => { if (confirm('Xóa bảng lương này?')) { await payrollApi.deleteRun(run.id); await loadRuns(); } }} className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Xóa bảng
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-stone-500">{helper}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-warm">
      <h2 className="mb-4 font-serif text-2xl font-black text-stone-950">{title}</h2>
      {children}
    </section>
  );
}

function CardsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{children}</div>;
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
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

