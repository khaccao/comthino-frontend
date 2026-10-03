import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CalendarDays, Check, RefreshCw, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import RevenueOtpPrompt from '../../components/admin/RevenueOtpPrompt';
import { hrmApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '--';
const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ';

type Employee = { id: string; code: string; fullName: string; position?: string };
type Shift = { id: string; code: string; name: string; startTime?: string; endTime?: string; hourlyRate: number };
type Assignment = { id: string; employee: Employee; shift: Shift; workDate: string; status: string; source: string; note?: string; conflictWarning?: string };
type AttendanceRule = { id: string; code: string; name: string; type: string; thresholdMinutes: number; amount: number; rateMultiplier: number; requiresApproval: boolean; description?: string; isActive: boolean };

const ruleTypes = [
  ['LATE', 'Đi muộn'],
  ['EARLY_LEAVE', 'Về sớm'],
  ['EARLY_IN', 'Đến sớm'],
  ['OVERTIME', 'Tăng ca'],
  ['MISSING_CHECKOUT', 'Thiếu giờ về'],
  ['MISSING_SHIFT', 'Không có ca duyệt'],
];

export default function HRMOperations() {
  const { user } = useAuthStore();
  const otpBypassed = Boolean(user?.isSystemAdmin || user?.role === 'SUPERADMIN' || user?.roles?.includes('SUPERADMIN'));
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'rules' | 'approvals'>('schedule');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(addDays(today(), 6));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rules, setRules] = useState<AttendanceRule[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [scheduleForm, setScheduleForm] = useState({ employeeId: '', shiftId: '', workDate: today(), source: 'MANAGER_PLAN', note: '' });
  const [ruleForm, setRuleForm] = useState({ id: '', code: '', name: '', type: 'LATE', thresholdMinutes: 0, amount: 0, rateMultiplier: 1, requiresApproval: false, description: '', isActive: true });

  const load = async (nextOtp = otp) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await hrmApi.getBootstrap({ from, to }, nextOtp);
      setEmployees(data.employees || []);
      setShifts(data.shifts || []);
      setAssignments(data.assignments || []);
      setRules(data.rules || []);
      setApprovals(data.approvalRequests || []);
      setSummary(data.summary || {});
      setNeedsOtp(false);
    } catch (error: any) {
      if (['INVALID_PAYROLL_OTP', 'TWO_FACTOR_REQUIRED'].includes(error?.response?.data?.code)) setNeedsOtp(true);
      setMessage(error?.response?.data?.message || error.message || 'Không tải được HRM vận hành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const groupedAssignments = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const item of assignments) {
      const key = item.workDate.slice(0, 10);
      map.set(key, [...(map.get(key) || []), item]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assignments]);

  const saveSchedule = async () => {
    try {
      if (!scheduleForm.employeeId || !scheduleForm.shiftId) {
        setMessage('Chọn nhân viên và ca làm trước khi lưu.');
        return;
      }
      await hrmApi.createShiftAssignment(scheduleForm);
      setScheduleForm({ employeeId: '', shiftId: '', workDate: scheduleForm.workDate, source: 'MANAGER_PLAN', note: '' });
      await load(otp);
      setMessage('Đã xếp ca.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không xếp được ca.');
    }
  };

  const setAssignmentStatus = async (id: string, status: string) => {
    try {
      await hrmApi.updateShiftAssignmentStatus(id, { status });
      await load(otp);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không cập nhật được ca.');
    }
  };

  const saveRule = async () => {
    try {
      const payload = { ...ruleForm, code: ruleForm.code.toUpperCase(), thresholdMinutes: Number(ruleForm.thresholdMinutes || 0), amount: Number(ruleForm.amount || 0), rateMultiplier: Number(ruleForm.rateMultiplier || 1) };
      if (ruleForm.id) await hrmApi.updateAttendanceRule(ruleForm.id, payload);
      else await hrmApi.createAttendanceRule(payload);
      setRuleForm({ id: '', code: '', name: '', type: 'LATE', thresholdMinutes: 0, amount: 0, rateMultiplier: 1, requiresApproval: false, description: '', isActive: true });
      await load(otp);
      setMessage('Đã lưu rule chấm công.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được rule.');
    }
  };

  const decideApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await hrmApi.decideAttendanceApproval(id, { status });
      await load(otp);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không duyệt được ngoại lệ.');
    }
  };

  if (needsOtp && !otpBypassed) {
    return <RevenueOtpPrompt title="Xác thực HRM & lương" error={message} loading={loading} onSubmit={(value) => { setOtp(value); load(value); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">HRM operations</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-950">Xếp ca, chấm công & duyệt ngoại lệ</h1>
            <p className="mt-1 text-stone-600">Quản lý ca tuần, rule đi muộn/về sớm/tăng ca và các yêu cầu cần superadmin xác nhận.</p>
          </div>
          <button onClick={() => load(otp)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Nhân viên" value={summary.activeEmployees || 0} />
        <StatCard label="Ca đang dùng" value={summary.activeShifts || 0} />
        <StatCard label="Ca chờ duyệt" value={summary.pendingAssignments || 0} />
        <StatCard label="Ngoại lệ" value={summary.pendingApprovals || 0} danger={Number(summary.pendingApprovals || 0) > 0} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
        {[
          ['schedule', CalendarDays, 'Xếp ca tuần'],
          ['rules', SlidersHorizontal, 'Rule phạt/tăng ca'],
          ['approvals', ShieldCheck, 'Duyệt ngoại lệ'],
        ].map(([key, Icon, label]: any) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold ${activeTab === key ? 'bg-amber-600 text-white' : 'text-stone-700 hover:bg-stone-50'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Panel title="Xếp ca / đăng ký ca">
            <div className="grid gap-3">
              <Select label="Nhân viên" value={scheduleForm.employeeId} onChange={(v) => setScheduleForm({ ...scheduleForm, employeeId: v })}>
                <option value="">Chọn nhân viên</option>
                {employees.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.fullName}</option>)}
              </Select>
              <Select label="Ca làm" value={scheduleForm.shiftId} onChange={(v) => setScheduleForm({ ...scheduleForm, shiftId: v })}>
                <option value="">Chọn ca</option>
                {shifts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.startTime || '--'} - {item.endTime || '--'})</option>)}
              </Select>
              <Input label="Ngày làm" type="date" value={scheduleForm.workDate} onChange={(v) => setScheduleForm({ ...scheduleForm, workDate: v })} />
              <Select label="Nguồn xếp ca" value={scheduleForm.source} onChange={(v) => setScheduleForm({ ...scheduleForm, source: v })}>
                <option value="MANAGER_PLAN">Quản lý xếp</option>
                <option value="STAFF_REQUEST">Nhân viên đăng ký</option>
              </Select>
              <Input label="Ghi chú" value={scheduleForm.note} onChange={(v) => setScheduleForm({ ...scheduleForm, note: v })} />
              <button onClick={saveSchedule} className="rounded-xl bg-amber-600 px-4 py-3 font-extrabold text-white hover:bg-amber-500">Lưu ca</button>
            </div>
          </Panel>
          <Panel title="Lịch ca trong khoảng ngày">
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input label="Từ ngày" type="date" value={from} onChange={setFrom} />
              <Input label="Đến ngày" type="date" value={to} onChange={setTo} />
              <button onClick={() => load(otp)} className="self-end rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">Lọc</button>
            </div>
            <div className="space-y-4">
              {groupedAssignments.map(([date, rows]) => (
                <div key={date} className="rounded-2xl border border-stone-200 p-4">
                  <h3 className="font-serif text-xl font-bold text-stone-950">{formatDate(date)}</h3>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {rows.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-stone-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-950">{item.employee.fullName}</p>
                            <p className="text-sm text-stone-600">{item.shift.name} · {item.shift.startTime || '--'} - {item.shift.endTime || '--'}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        {item.conflictWarning && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{item.conflictWarning}</p>}
                        {item.status === 'PENDING' && (
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => setAssignmentStatus(item.id, 'APPROVED')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" /> Duyệt</button>
                            <button onClick={() => setAssignmentStatus(item.id, 'REJECTED')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600"><X className="h-4 w-4" /> Từ chối</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {groupedAssignments.length === 0 && <Empty text="Chưa có ca trong khoảng ngày này." />}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Panel title={ruleForm.id ? 'Sửa rule' : 'Thêm rule'}>
            <div className="grid gap-3">
              <Input label="Mã rule" value={ruleForm.code} onChange={(v) => setRuleForm({ ...ruleForm, code: v })} />
              <Input label="Tên rule" value={ruleForm.name} onChange={(v) => setRuleForm({ ...ruleForm, name: v })} />
              <Select label="Loại" value={ruleForm.type} onChange={(v) => setRuleForm({ ...ruleForm, type: v })}>
                {ruleTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Input label="Ngưỡng phút" type="number" value={String(ruleForm.thresholdMinutes)} onChange={(v) => setRuleForm({ ...ruleForm, thresholdMinutes: Number(v) })} />
              <Input label="Tiền phạt / mức tiền" type="number" value={String(ruleForm.amount)} onChange={(v) => setRuleForm({ ...ruleForm, amount: Number(v) })} />
              <Input label="Hệ số tăng ca" type="number" value={String(ruleForm.rateMultiplier)} onChange={(v) => setRuleForm({ ...ruleForm, rateMultiplier: Number(v) })} />
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                <input type="checkbox" checked={ruleForm.requiresApproval} onChange={(e) => setRuleForm({ ...ruleForm, requiresApproval: e.target.checked })} />
                Cần superadmin duyệt
              </label>
              <Input label="Mô tả" value={ruleForm.description} onChange={(v) => setRuleForm({ ...ruleForm, description: v })} />
              <button onClick={saveRule} className="rounded-xl bg-amber-600 px-4 py-3 font-extrabold text-white hover:bg-amber-500">Lưu rule</button>
            </div>
          </Panel>
          <Panel title="Danh sách rule">
            <div className="grid gap-3 lg:grid-cols-2">
              {rules.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-stone-950">{item.name}</p>
                      <p className="text-sm text-stone-500">{item.code} · {item.type}</p>
                    </div>
                    <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span>Ngưỡng: <b>{item.thresholdMinutes} phút</b></span>
                    <span>Tiền: <b>{formatVnd(item.amount)}</b></span>
                    <span>Hệ số: <b>{item.rateMultiplier}</b></span>
                    <span>Duyệt: <b>{item.requiresApproval ? 'Có' : 'Không'}</b></span>
                  </div>
                  <button onClick={() => setRuleForm({ ...item, description: item.description || '' })} className="mt-3 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold">Sửa</button>
                </div>
              ))}
              {rules.length === 0 && <Empty text="Chưa có rule nào." />}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'approvals' && (
        <Panel title="Ngoại lệ cần duyệt">
          <div className="grid gap-3">
            {approvals.map((item) => (
              <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-stone-950">{item.attendance?.employee?.fullName || item.employeeId}</p>
                    <p className="text-sm text-stone-700">{item.type} · {formatDate(item.createdAt)} · {item.attendance?.ruleSummary || 'Cần kiểm tra'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => decideApproval(item.id, 'APPROVED')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Duyệt</button>
                    <button onClick={() => decideApproval(item.id, 'REJECTED')} className="rounded-xl border border-red-100 px-4 py-2 text-sm font-bold text-red-600">Từ chối</button>
                  </div>
                </div>
              </div>
            ))}
            {approvals.length === 0 && <Empty text="Không có ngoại lệ đang chờ duyệt." />}
          </div>
        </Panel>
      )}
    </div>
  );
}

function StatCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${danger ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}>
      <p className="text-xs font-bold uppercase text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-serif text-2xl font-bold text-stone-950">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-stone-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500" />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-stone-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
        {children}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'APPROVED' || status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600';
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${color}`}>{status}</span>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm font-bold text-stone-500">
      <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
      {text}
    </div>
  );
}
