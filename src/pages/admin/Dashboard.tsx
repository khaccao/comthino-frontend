import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import {
  Utensils,
  Layers,
  Sparkles,
  Mail,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  activePromotions: number;
  newMessages: number;
  visibleItems: number;
  hiddenItems: number;
  recentLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch((err) => console.error('Error fetching dashboard stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng số món ăn', value: stats?.totalItems || 0, icon: Utensils, color: 'bg-blue-500', link: '/admin/menu-items' },
    { label: 'Danh mục thực đơn', value: stats?.totalCategories || 0, icon: Layers, color: 'bg-emerald-500', link: '/admin/menu-categories' },
    { label: 'Khuyến mãi đang chạy', value: stats?.activePromotions || 0, icon: Sparkles, color: 'bg-amber-500', link: '/admin/promotions' },
    { label: 'Tin nhắn liên hệ mới', value: stats?.newMessages || 0, icon: Mail, color: 'bg-rose-500', link: '/admin/contact-messages' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 font-sans">Tổng Quan Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">
          Theo dõi tổng thể trạng thái dữ liệu và các liên hệ gửi từ khách hàng.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-warm p-6 border border-stone-200/60 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{card.label}</p>
                <p className="text-3xl font-extrabold text-stone-900">{card.value}</p>
                <Link to={card.link} className="inline-flex items-center text-xs font-medium text-amber-600 hover:text-amber-700 pt-1">
                  <span>Chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Details breakdown & audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-warm border border-stone-200/60 p-6">
          <h2 className="text-lg font-bold text-stone-800 mb-6 font-sans">Trạng thái món ăn</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-stone-700">Đang hiển thị công khai</span>
              </div>
              <span className="font-bold text-lg text-emerald-600">{stats?.visibleItems || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <EyeOff className="w-5 h-5 text-stone-500" />
                <span className="text-sm font-semibold text-stone-700">Đang tạm ẩn / Hết món</span>
              </div>
              <span className="font-bold text-lg text-stone-500">{stats?.hiddenItems || 0}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-stone-200">
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>Tỉ lệ hiển thị thực đơn</span>
                <span className="font-semibold text-stone-700">
                  {stats?.totalItems ? Math.round(((stats.visibleItems) / stats.totalItems) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${stats?.totalItems ? (stats.visibleItems / stats.totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent logs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-warm border border-stone-200/60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-stone-800 font-sans">Nhật ký thay đổi gần đây</h2>
            <span className="flex items-center text-xs text-stone-400 font-medium">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Tự động ghi nhận
            </span>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== stats.recentLogs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-stone-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-xs font-bold text-white uppercase ${
                            log.action === 'CREATE' ? 'bg-emerald-500' : log.action === 'DELETE' || log.action === 'DELETE_MEDIA' ? 'bg-rose-500' : 'bg-blue-500'
                          }`}>
                            {log.action.substring(0, 3)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-stone-600">
                              Hành động <span className="font-semibold text-stone-900">{log.action}</span> trên bảng{' '}
                              <span className="font-semibold text-amber-700">{log.entity}</span>
                            </p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-stone-400">
                            {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-stone-400 text-center py-12 text-sm">Chưa ghi nhận hoạt động hệ thống nào.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
