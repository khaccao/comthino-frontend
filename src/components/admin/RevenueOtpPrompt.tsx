import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  error?: string | null;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (otp: string) => Promise<void> | void;
}

export default function RevenueOtpPrompt({
  title = 'Xác minh doanh thu',
  description = 'Nhập mã OTP 6 số từ Google Authenticator của tài khoản đang đăng nhập để xem doanh thu.',
  error,
  loading,
  submitLabel = 'Xác minh và xem doanh thu',
  onSubmit,
}: Props) {
  const [otp, setOtp] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = otp.replace(/\s+/g, '');
    if (code.length !== 6) return;
    await onSubmit(code);
  };

  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-black text-stone-950">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-stone-500">{description}</p>
        </div>
        <input
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="mt-6 w-full rounded-2xl border border-stone-300 px-4 py-4 text-center text-3xl font-black tracking-[0.35em] text-stone-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-4 font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldCheck className="h-5 w-5" />
          {loading ? 'Đang xác minh...' : submitLabel}
        </button>
      </form>
    </div>
  );
}
