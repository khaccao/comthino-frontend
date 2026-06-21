import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { MediaFile } from '../../types';
import { Plus, Trash2, Copy, FileImage, ExternalLink, RefreshCw, Check } from 'lucide-react';

export default function MediaManager() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getMedia();
      if (res.success) setMediaFiles(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg('');

    try {
      const fileForm = new FormData();
      fileForm.append('image', selectedFile);
      const res = await adminApi.uploadImage(fileForm);
      if (res.success) {
        setSelectedFile(null);
        // Reset file input element
        const input = document.getElementById('media-upload-input') as HTMLInputElement;
        if (input) input.value = '';
        loadData();
      } else {
        setErrorMsg(res.message || 'Tải ảnh lên thất bại.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này? Các trang đang dùng ảnh này có thể bị lỗi hiển thị.')) return;
    try {
      const res = await adminApi.deleteMedia(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Xóa file thất bại.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    // Generate absolute path
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Quản Lý Thư Viện Media</h1>
          <p className="text-sm text-stone-500 mt-1">Upload và lưu trữ ảnh phục vụ trang trí website, món ăn.</p>
        </div>
        <button
          onClick={loadData}
          className="border border-stone-300 hover:bg-stone-100 text-stone-700 py-2 px-3 rounded-lg flex items-center space-x-1.5 text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 p-6 max-w-xl">
        <h2 className="text-sm font-bold text-stone-700 mb-4">Tải ảnh mới lên</h2>
        
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            id="media-upload-input"
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="block w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
          />
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider disabled:opacity-50 transition shrink-0"
          >
            {uploading ? 'Đang tải...' : 'Tải lên'}
          </button>
        </form>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {mediaFiles.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-xl overflow-hidden border border-stone-200/60 shadow-warm flex flex-col group"
          >
            {/* Thumbnail */}
            <div className="h-32 bg-stone-100 relative overflow-hidden flex items-center justify-center border-b">
              <img
                src={file.fileUrl}
                alt={file.originalName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity duration-200">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white text-stone-700 hover:bg-stone-100 rounded shadow"
                  title="Mở tab mới"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Info details */}
            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div className="truncate">
                <p className="text-xs font-bold text-stone-700 truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">{formatSize(file.size)}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dashed">
                <button
                  onClick={() => copyToClipboard(file.fileUrl, file.id)}
                  className="p-1 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition flex items-center space-x-1"
                  title="Copy URL"
                >
                  {copiedId === file.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px]">{copiedId === file.id ? 'Copied' : 'Copy URL'}</span>
                </button>

                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition"
                  title="Xóa tệp"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {mediaFiles.length === 0 && (
          <div className="col-span-full text-center py-16 text-stone-400">
            <FileImage className="w-12 h-12 mx-auto mb-2 text-stone-300" />
            <p className="text-sm">Chưa có ảnh nào được tải lên hệ thống.</p>
          </div>
        )}
      </div>
    </div>
  );
}
