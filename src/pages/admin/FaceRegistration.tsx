import { useEffect, useRef, useState } from 'react';
import { Camera, Check, RefreshCw, RotateCcw, ScanFace, ShieldCheck, Upload } from 'lucide-react';
import RevenueOtpPrompt from '../../components/admin/RevenueOtpPrompt';
import { faceApi } from '../../services/api';
import { canvasToJpegBlob, uploadToImageKit } from '../../utils/imageKitUpload';

type Employee = {
  id: string;
  code: string;
  fullName: string;
  department?: string;
  position?: string;
  avatarUrl?: string;
  faceStatus?: string;
  faceRegistrations?: any[];
};

const poses = [
  { key: 'FRONT', label: 'Chính diện', hint: 'Nhìn thẳng camera, đủ sáng' },
  { key: 'LEFT', label: 'Nghiêng trái', hint: 'Xoay nhẹ mặt sang trái' },
  { key: 'RIGHT', label: 'Nghiêng phải', hint: 'Xoay nhẹ mặt sang phải' },
] as const;

export default function FaceRegistration() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [step, setStep] = useState(0);
  const [shots, setShots] = useState<Record<string, { blob: Blob; preview: string }>>({});
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const selectedEmployee = employees.find((item) => item.id === employeeId);
  const currentPose = poses[step];

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const load = async (nextOtp = otp) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await faceApi.getRegistrationBootstrap(nextOtp);
      setEmployees(data.employees || []);
      setNeedsOtp(false);
    } catch (error: any) {
      if (['INVALID_PAYROLL_OTP', 'TWO_FACTOR_REQUIRED'].includes(error?.response?.data?.code)) {
        setNeedsOtp(true);
      }
      setMessage(error?.response?.data?.message || error.message || 'Không tải được dữ liệu khuôn mặt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    startCamera().catch((error) => setMessage(error.message || 'Không mở được camera.'));
    return stopCamera;
  }, []);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !currentPose) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpegBlob(canvas, 0.9);
    setShots((prev) => ({ ...prev, [currentPose.key]: { blob, preview: URL.createObjectURL(blob) } }));
    if (step < poses.length - 1) setStep(step + 1);
  };

  const submit = async () => {
    if (!selectedEmployee) {
      setMessage('Vui lòng chọn nhân viên.');
      return;
    }
    if (!poses.every((pose) => shots[pose.key])) {
      setMessage('Cần chụp đủ 3 góc khuôn mặt.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const uploaded = [];
      const stamp = new Date().toISOString()
        .split('-').join('')
        .split(':').join('')
        .split('.').join('')
        .split('T').join('')
        .split('Z').join('')
        .slice(0, 14);
      for (const pose of poses) {
        const shot = shots[pose.key]!;
        const result = await uploadToImageKit(
          shot.blob,
          `${pose.key.toLowerCase()}_${stamp}.jpg`,
          `/face-registration/${selectedEmployee.code}`,
        );
        uploaded.push({ pose: pose.key, imageUrl: result.url, imageKitFileId: result.fileId });
      }
      await faceApi.registerEmployeeFace({ employeeId: selectedEmployee.id, images: uploaded });
      setMessage('Đã đăng ký khuôn mặt cho nhân viên.');
      setShots({});
      setStep(0);
      await load(otp);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không đăng ký được khuôn mặt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {needsOtp && <RevenueOtpPrompt title="Xác thực chấm công & lương" onSubmit={(value) => { setOtp(value); load(value); }} loading={loading} />}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-200">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Google Authenticator + Face ID</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Đăng ký khuôn mặt nhân viên</h1>
        <p className="mt-1 text-stone-600">Chụp đủ 3 góc, lưu ảnh ở ImageKit và lưu embedding ở backend để chấm công.</p>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-950 shadow-sm">
          <div className="relative aspect-video w-full bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[64%] w-[42%] rounded-[50%] border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <p className="font-bold">{currentPose?.label || 'Hoàn tất'}</p>
              <p className="text-sm text-white/70">{currentPose?.hint || 'Kiểm tra lại ảnh trước khi lưu'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startCamera().catch((error) => setMessage(error.message))} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20">
                <RefreshCw className="h-4 w-4" /> Camera
              </button>
              <button disabled={!cameraReady || !currentPose} onClick={capture} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
                <Camera className="h-4 w-4" /> Chụp
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-5 shadow-sm border border-stone-200">
          <label className="text-xs font-bold uppercase text-stone-500">Nhân viên</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
            <option value="">Chọn nhân viên</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code} - {employee.fullName}</option>)}
          </select>
          {selectedEmployee && (
            <div className="mt-4 rounded-2xl bg-stone-50 p-4">
              <p className="font-bold text-stone-950">{selectedEmployee.fullName}</p>
              <p className="text-sm text-stone-500">{selectedEmployee.position || 'Nhân viên'} · {selectedEmployee.department || 'Chưa có bộ phận'}</p>
              <p className="mt-2 text-sm font-bold text-emerald-700">{selectedEmployee.faceStatus || 'NOT_REGISTERED'}</p>
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {poses.map((pose, index) => (
              <button key={pose.key} onClick={() => setStep(index)} className={`rounded-2xl border p-3 text-center ${step === index ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'}`}>
                <ScanFace className="mx-auto mb-2 h-5 w-5 text-amber-700" />
                <p className="text-xs font-bold">{pose.label}</p>
                {shots[pose.key] && <Check className="mx-auto mt-2 h-4 w-4 text-emerald-600" />}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {poses.map((pose) => shots[pose.key] ? (
              <img key={pose.key} src={shots[pose.key].preview} alt={pose.label} className="aspect-square rounded-xl object-cover" />
            ) : <div key={pose.key} className="aspect-square rounded-xl bg-stone-100" />)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => { setShots({}); setStep(0); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
              <RotateCcw className="h-4 w-4" /> Chụp lại
            </button>
            <button disabled={loading} onClick={submit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 font-bold text-white hover:bg-stone-800 disabled:opacity-50">
              <Upload className="h-4 w-4" /> Lưu
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mb-2 h-5 w-5" />
            Private key ImageKit chỉ nằm ở backend. Frontend nhận chữ ký upload ngắn hạn.
          </div>
        </aside>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
