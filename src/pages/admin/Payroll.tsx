import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  CalendarClock,
  Check,
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react';
import { payrollApi } from '../../services/api';

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
};

type PayrollRun = {
  id: string;
  code: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHours: number;
  totalAmount: number;
  note?: string;
  lines: PayrollLine[];
};

const tabs = [
  { key: 'overview', label: 'Tổng quan', icon: Wallet },
  { key: 'attendance', label: 'Chấm công', icon: Clock },
  { key: 'employees', label: 'Nhân viên', icon: UserRound },
  { key: 'shifts', label: 'Ca làm', icon: CalendarClock },
  { key: 'payroll', label: 'Bảng lương', icon: Check },
];

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
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
  return new Date(value).toISOString().slice(0, 10);
};

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [attendanceFrom, setAttendanceFrom] = useState(today());
  const [attendanceTo, setAttendanceTo] = useState(today());

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

  const loadBootstrap = async () => {
    setIsLoading(true);
    try {
      const data = await payrollApi.getBootstrap();
      setShifts(data.shifts || []);
      setEmployees(data.employees || []);
      setAttendances(data.attendances || []);
      setRuns(data.runs || []);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendances = async () => {
    const data = await payrollApi.getAttendances({ from: attendanceFrom, to: attendanceTo });
    setAttendances(data || []);
  };

  const loadRuns = async () => {
    const data = await payrollApi.getRuns();
    setRuns(data || []);
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  const activeEmployees = employees.filter((item) => item.isActive);
  const activeShifts = shifts.filter((item) => item.isActive);

  const summary = useMemo(() => {
    const totalHours = attendances.reduce((sum, item) => sum + Number(item.totalHours || 0), 0);
    const totalAmount = attendances.reduce((sum, item) => sum + Number(item.grossAmount || 0), 0);
    const openAttendance = attendances.filter((item) => !item.clockOut).length;
    const latestRun = runs[0];
    return { totalHours, totalAmount, openAttendance, latestRun };
  }, [attendances, runs]);

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

  const saveShift = async () => {
    const payload = { ...shiftForm, hourlyRate: Number(shiftForm.hourlyRate || 0) };
    if (editingShiftId) await payrollApi.updateShift(editingShiftId, payload);
    else await payrollApi.createShift(payload);
    setToast('Đã lưu ca làm.');
    resetShift();
    const data = await payrollApi.getShifts();
    setShifts(data || []);
  };

  const saveEmployee = async () => {
    const payload = {
      ...employeeForm,
      defaultShiftId: employeeForm.defaultShiftId || null,
      hourlyRate: employeeForm.hourlyRate === '' ? null : Number(employeeForm.hourlyRate),
    };
    if (editingEmployeeId) await payrollApi.updateEmployee(editingEmployeeId, payload);
    else await payrollApi.createEmployee(payload);
    setToast('Đã lưu nhân viên.');
    resetEmployee();
    const data = await payrollApi.getEmployees();
    setEmployees(data || []);
  };

  const saveAttendance = async () => {
    const payload = {
      ...attendanceForm,
      shiftId: attendanceForm.shiftId || null,
      hourlyRate: attendanceForm.hourlyRate === '' ? null : Number(attendanceForm.hourlyRate),
      breakMinutes: Number(attendanceForm.breakMinutes || 0),
    };
    if (editingAttendanceId) await payrollApi.updateAttendance(editingAttendanceId, payload);
    else await payrollApi.createAttendance(payload);
    setToast('Đã lưu chấm công.');
    resetAttendance();
    await loadAttendances();
  };

  const generatePayroll = async () => {
    const res = await payrollApi.generateRun(runForm);
    setToast(`Đã tính bảng lương ${res.item?.code || ''}.`);
    await loadRuns();
    setActiveTab('payroll');
  };

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
          <button onClick={loadBootstrap} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-extrabold text-stone-700 hover:bg-stone-50">
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
            <StatCard label="Ca làm" value={activeShifts.length.toString()} helper="Có thể gắn cho nhân viên" />
            <StatCard label="Giờ công đang xem" value={`${summary.totalHours.toFixed(2)}h`} helper={`${attendances.length} bản chấm công`} />
            <StatCard label="Tiền công tạm tính" value={formatVnd(summary.totalAmount)} helper={`${summary.openAttendance} ca chưa có giờ về`} />
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
                  <button onClick={async () => { if (confirm('Ẩn nhân viên này?')) { await payrollApi.deleteEmployee(item.id); setEmployees(await payrollApi.getEmployees()); } }} className="rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600">Ẩn</button>
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
                  <button onClick={async () => { if (confirm('Ẩn ca làm này?')) { await payrollApi.deleteShift(item.id); setShifts(await payrollApi.getShifts()); } }} className="rounded-xl border border-red-100 px-3 py-2 text-sm font-bold text-red-600">Ẩn</button>
                </div>
              </div>
            ))}
          </CardsGrid>
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
                  <p className="text-2xl font-black text-emerald-700">{formatVnd(run.totalAmount)}</p>
                  <p className="text-sm font-bold text-stone-500">{Number(run.totalHours || 0).toFixed(2)} giờ · {run.lines?.length || 0} nhân viên</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                    <tr><th className="p-3">Nhân viên</th><th>Vị trí</th><th>Số ca</th><th>Giờ công</th><th>Bình quân/giờ</th><th className="text-right">Lương</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(run.lines || []).map((line) => (
                      <tr key={line.id}>
                        <td className="p-3"><b>{line.employeeName}</b><div className="text-xs text-stone-500">{line.employeeCode}</div></td>
                        <td>{line.position || line.shiftName || '-'}</td>
                        <td>{line.attendanceCount}</td>
                        <td>{Number(line.totalHours || 0).toFixed(2)}h</td>
                        <td>{formatVnd(line.hourlyRate)}</td>
                        <td className="text-right font-black text-emerald-700">{formatVnd(line.grossAmount)}</td>
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
