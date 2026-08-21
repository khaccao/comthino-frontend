import { FormEvent, useEffect, useState } from 'react';
import { Activity, BrainCircuit, CheckCircle2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { faceApi } from '../../services/api';

const emptyForm = {
  provider: 'EXTERNAL',
  apiUrl: '',
  apiKey: '',
  threshold: 0.75,
  duplicateWindowSeconds: 10,
  isActive: true,
};

export default function FaceRecognitionSettings() {
  const [form, setForm] = useState(emptyForm);
  const [config, setConfig] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await faceApi.getConfig();
      setConfig(data);
      setForm({
        provider: data.provider || 'EXTERNAL',
        apiUrl: data.apiUrl || '',
        apiKey: '',
        threshold: Number(data.threshold || 0.75),
        duplicateWindowSeconds: Number(data.duplicateWindowSeconds || 10),
        isActive: data.isActive !== false,
      });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không tải được cấu hình Face AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload: any = {
        provider: form.provider,
        apiUrl: form.apiUrl,
        threshold: Number(form.threshold),
        duplicateWindowSeconds: Number(form.duplicateWindowSeconds),
        isActive: form.isActive,
      };
      if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim();
      const data = await faceApi.updateConfig(payload);
      setConfig(data);
      setForm((prev) => ({ ...prev, apiKey: '' }));
      setMessage('Đã lưu cấu hình Face AI.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được cấu hình Face AI.');
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setLoading(true);
    setMessage('');
    setHealth(null);
    try {
      const data = await faceApi.checkHealth();
      setHealth(data);
      setMessage(data.healthy ? 'Dịch vụ Face AI đang phản hồi tốt.' : 'Dịch vụ Face AI phản hồi lỗi.');
      await load();
    } catch (error: any) {
      if (error?.response?.data?.data) setHealth(error.response.data.data);
      setMessage(error?.response?.data?.message || error.message || 'Không kiểm tra được dịch vụ Face AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Face recognition API</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Cấu hình Face AI</h1>
            <p className="mt-1 max-w-3xl text-stone-600">
              Nhập endpoint dịch vụ nhận diện khuôn mặt. Backend sẽ gọi <b>/analyze</b> để lấy embedding và <b>/health</b> để kiểm tra trạng thái.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
          </button>
        </div>
      </section>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <form onSubmit={save} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><BrainCircuit className="h-5 w-5" /></div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-950">Endpoint nhận diện</h2>
              <p className="text-sm text-stone-500">Có thể dùng env hoặc cấu hình database.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase text-stone-500">Provider</span>
              <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-stone-500">FACE_RECOGNITION_API_URL</span>
              <input value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://face-api.example.com" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-stone-500">API key</span>
              <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={config?.hasApiKey ? 'Để trống nếu giữ key cũ' : 'Nhập Bearer token nếu có'} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase text-stone-500">Ngưỡng nhận diện</span>
                <input type="number" step="0.01" min="0.1" max="0.99" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-stone-500">Chống chấm trùng (giây)</span>
                <input type="number" min="3" max="3600" value={form.duplicateWindowSeconds} onChange={(e) => setForm({ ...form, duplicateWindowSeconds: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
              </label>
            </div>
            <label className="inline-flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 accent-amber-600" />
              <span className="font-bold text-stone-800">Kích hoạt cấu hình database</span>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 font-bold text-white hover:bg-stone-800 disabled:opacity-50">
              <Save className="h-4 w-4" /> Lưu cấu hình
            </button>
            <button type="button" disabled={loading} onClick={checkHealth} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50 disabled:opacity-50">
              <Activity className="h-4 w-4" /> Kiểm tra
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-950">Runtime</h2>
                <p className="text-sm text-stone-500">Nguồn cấu hình đang được backend ưu tiên.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Nguồn</dt><dd className="font-bold">{config?.runtime?.source || '-'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Env URL</dt><dd className="font-bold">{config?.runtime?.envConfigured ? 'Đã có' : 'Chưa có'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">DB URL</dt><dd className="font-bold">{config?.apiUrl ? 'Đã có' : 'Chưa có'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">API key</dt><dd className="font-bold">{config?.hasApiKey || config?.runtime?.envHasApiKey ? 'Đã có' : 'Chưa có'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Health</dt><dd className="font-bold">{config?.lastHealthStatus || '-'}</dd></div>
            </dl>
          </div>
          {health && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" /> Kết quả kiểm tra</div>
              <pre className="mt-3 overflow-auto rounded-2xl bg-white/70 p-3 text-xs">{JSON.stringify(health, null, 2)}</pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
