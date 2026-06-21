import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { ContactMessage } from '../../types';
import { Trash2, CheckCircle2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getContactMessages();
      if (res.success) setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id: string, currentStatus: string) => {
    let nextStatus: 'CONTACTED' | 'DONE' = 'CONTACTED';
    if (currentStatus === 'CONTACTED') nextStatus = 'DONE';

    try {
      const res = await adminApi.updateContactMessage(id, nextStatus);
      if (res.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thư liên hệ này?')) return;
    try {
      const res = await adminApi.deleteContactMessage(id);
      if (res.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Danh Sách Liên Hệ</h1>
          <p className="text-sm text-stone-500 mt-1">Thông tin khách hàng đăng ký đặt cơm đoàn hoặc đặt bàn tiệc.</p>
        </div>
        <button
          onClick={loadData}
          className="border border-stone-300 hover:bg-stone-100 text-stone-700 py-2 px-3 rounded-lg flex items-center space-x-1.5 text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600 border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-700 uppercase text-xs tracking-wider border-b border-stone-200">
                <th className="py-4 px-6 font-bold">Khách hàng</th>
                <th className="py-4 px-6 font-bold">Liên hệ</th>
                <th className="py-4 px-6 font-bold">Nội dung tin nhắn</th>
                <th className="py-4 px-6 font-bold">Ngày gửi</th>
                <th className="py-4 px-6 font-bold text-center">Trạng thái</th>
                <th className="py-4 px-6 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-stone-800">{msg.fullName}</td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-stone-700">{msg.phone}</p>
                    {msg.email && <p className="text-xs text-stone-400">{msg.email}</p>}
                  </td>
                  <td className="py-4 px-6 max-w-sm">
                    <p className="text-stone-600 whitespace-pre-wrap text-xs leading-relaxed">{msg.message}</p>
                  </td>
                  <td className="py-4 px-6 text-xs text-stone-400">
                    {new Date(msg.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => msg.status !== 'DONE' && updateStatus(msg.id, msg.status)}
                      disabled={msg.status === 'DONE'}
                      className={`inline-flex px-2.5 py-1 rounded text-xs font-bold transition-all border ${
                        msg.status === 'NEW'
                          ? 'bg-rose-50 border-rose-200 text-rose-800 cursor-pointer hover:bg-rose-100'
                          : msg.status === 'CONTACTED'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-pointer hover:bg-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-90 cursor-default'
                      }`}
                    >
                      {msg.status === 'NEW' ? 'Mới nhận (Click LH)' : msg.status === 'CONTACTED' ? 'Đã LH (Click Xong)' : 'Hoàn thành'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-rose-600 rounded transition-colors inline-block"
                      title="Xóa liên hệ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <span>Hòm thư trống, chưa có liên hệ nào từ khách.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
