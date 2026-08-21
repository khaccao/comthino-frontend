import { useEffect, useMemo, useState } from 'react';
import { Database, Eye, RefreshCw, Search, Table2 } from 'lucide-react';
import { caoRestaurantApi } from '../../services/api';

type CaoColumn = {
  columnName: string;
  dataType: string;
  maxLength?: number | null;
};

type CaoTable = {
  schemaName: string;
  tableName: string;
  totalRows?: number | null;
  group: string;
  columns: CaoColumn[];
};

export default function CaoRestaurantData() {
  const [catalog, setCatalog] = useState<any>(null);
  const [tables, setTables] = useState<CaoTable[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('Tất cả');
  const [keyword, setKeyword] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const groups = useMemo(() => ['Tất cả', ...Array.from(new Set(tables.map((item) => item.group)))], [tables]);
  const filteredTables = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return tables.filter((table) => {
      const inGroup = selectedGroup === 'Tất cả' || table.group === selectedGroup;
      const inKeyword = !key ||
        table.tableName.toLowerCase().includes(key) ||
        table.columns.some((column) => column.columnName.toLowerCase().includes(key));
      return inGroup && inKeyword;
    });
  }, [keyword, selectedGroup, tables]);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await caoRestaurantApi.getCatalog();
      setCatalog(data);
      const flat = Object.values(data.groups || {}).flat() as CaoTable[];
      setTables(flat);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không tải được dữ liệu CAO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openPreview = async (table: CaoTable) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await caoRestaurantApi.previewTable(table.tableName, { schema: table.schemaName, limit: 30 });
      setPreview(data);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không preview được bảng CAO.');
    } finally {
      setLoading(false);
    }
  };

  const previewRows = preview?.rows || [];
  const previewColumns = previewRows.length ? Object.keys(previewRows[0]) : [];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">CAO_BNHHotelManagement</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Dữ liệu nhà hàng CAO</h1>
            <p className="mt-1 max-w-3xl text-stone-600">
              Catalog đọc trực tiếp từ CaoConnection để rà soát các bảng POS, menu, kho bếp, order và dữ liệu PMS cũ trước khi đưa ra web.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
          </button>
        </div>
      </section>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-stone-500">Database</p>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-950">{catalog?.database || 'CAO'}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-stone-500">Số bảng liên quan</p>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-950">{catalog?.tableCount || 0}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
          <p className="text-xs font-bold uppercase text-stone-500">Nhóm dữ liệu chính</p>
          <p className="mt-2 text-sm font-semibold text-stone-700">{groups.filter((item) => item !== 'Tất cả').join(' · ') || '-'}</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_520px]">
        <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm bảng, cột..." className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-3 outline-none focus:border-amber-500" />
              </label>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-3 font-semibold outline-none focus:border-amber-500">
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
          </div>
          <div className="max-h-[680px] overflow-auto p-4">
            <div className="grid gap-3 2xl:grid-cols-2">
              {filteredTables.map((table) => (
                <article key={`${table.schemaName}.${table.tableName}`} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-stone-950">{table.tableName}</p>
                      <p className="mt-1 text-xs font-semibold text-stone-500">{table.schemaName} · {table.group} · {table.totalRows ?? '-'} dòng</p>
                    </div>
                    <button onClick={() => openPreview(table)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold hover:bg-stone-50">
                      <Eye className="h-4 w-4" /> Xem
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {table.columns.slice(0, 10).map((column) => (
                      <span key={column.columnName} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                        {column.columnName}:{column.dataType}
                      </span>
                    ))}
                    {table.columns.length > 10 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">+{table.columns.length - 10}</span>}
                  </div>
                </article>
              ))}
            </div>
            {!filteredTables.length && <div className="rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-500">Không có bảng nào khớp bộ lọc.</div>}
          </div>
        </section>

        <aside className="rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Table2 className="h-5 w-5" /></div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-950">Preview bảng</h2>
                <p className="text-sm text-stone-500">Tối đa 30 dòng, cột nhạy cảm được che.</p>
              </div>
            </div>
          </div>
          {!preview ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center text-stone-500">
              <Database className="mb-3 h-10 w-10 text-stone-300" />
              Chọn một bảng để xem dữ liệu mẫu.
            </div>
          ) : (
            <div className="p-4">
              <p className="mb-3 font-bold text-stone-950">{preview.table?.schemaName}.{preview.table?.tableName}</p>
              <div className="max-h-[560px] overflow-auto rounded-2xl border border-stone-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-stone-100 text-stone-600">
                    <tr>
                      {previewColumns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-bold">{column}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row: any, index: number) => (
                      <tr key={index} className="border-t border-stone-100">
                        {previewColumns.map((column) => (
                          <td key={column} className="max-w-[220px] truncate px-3 py-2 text-stone-700">{String(row[column] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!previewRows.length && <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-stone-500">Bảng chưa có dữ liệu.</div>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
