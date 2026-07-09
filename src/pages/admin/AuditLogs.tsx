import React, { useEffect, useState } from 'react';
import { auditApi } from '../../services/api';
import { History, Eye, Search, X } from 'lucide-react';
import PermissionGuard from '../../components/PermissionGuard';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const MENU_CODE = 'AUDIT_LOG';

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await auditApi.getLogs();
      setLogs(data);
    } catch (err: any) {
      setError('Lỗi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Nhật ký hệ thống</h1>
          <p className="text-sm text-stone-500 mt-1">Lưu vết các thao tác quan trọng trong hệ thống</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
                <th className="p-4">Thời gian</th>
                <th className="p-4">Hành động</th>
                <th className="p-4">Bảng / Đối tượng</th>
                <th className="p-4">Người thực hiện</th>
                <th className="p-4">IP / User Agent</th>
                <th className="p-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-stone-50">
                  <td className="p-4 whitespace-nowrap text-stone-500">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-stone-100 text-stone-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-stone-900">
                    {log.tableName} <span className="text-stone-400 font-normal">({log.recordId})</span>
                  </td>
                  <td className="p-4">
                    {log.user ? (
                      <div>
                        <div>{log.user.fullName}</div>
                        <div className="text-xs text-stone-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-stone-400">Hệ thống</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-xs">{log.ipAddress || '-'}</div>
                    <div className="text-xs text-stone-500 truncate max-w-[150px]" title={log.userAgent}>
                      {log.userAgent || '-'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-blue-600 rounded hover:bg-stone-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    Không có dữ liệu nhật ký
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between">
              <h2 className="text-xl font-bold">Chi tiết Nhật ký</h2>
              <button onClick={() => setSelectedLog(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="block text-sm text-stone-500">Hành động</span>
                  <span className="font-medium">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="block text-sm text-stone-500">Bảng</span>
                  <span className="font-medium">{selectedLog.tableName}</span>
                </div>
                <div>
                  <span className="block text-sm text-stone-500">Record ID</span>
                  <span className="font-medium">{selectedLog.recordId}</span>
                </div>
                <div>
                  <span className="block text-sm text-stone-500">Thời gian</span>
                  <span className="font-medium">{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              
              {selectedLog.oldValueJson && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-stone-700 mb-2">Giá trị cũ (Before)</h3>
                  <pre className="bg-stone-100 p-4 rounded-lg text-xs overflow-x-auto text-stone-800 font-mono">
                    {JSON.stringify(JSON.parse(selectedLog.oldValueJson), null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.newValueJson && (
                <div>
                  <h3 className="text-sm font-bold text-stone-700 mb-2">Giá trị mới (After)</h3>
                  <pre className="bg-stone-100 p-4 rounded-lg text-xs overflow-x-auto text-stone-800 font-mono">
                    {JSON.stringify(JSON.parse(selectedLog.newValueJson), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}