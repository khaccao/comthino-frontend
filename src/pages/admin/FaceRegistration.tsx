import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
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

type FaceCheck = {
  key: string;
  label: string;
  ok: boolean;
  message: string;
};

type ShotStatus = 'pending' | 'validating' | 'valid' | 'invalid';

type Shot = {
  blob: Blob;
  preview: string;
  status: ShotStatus;
  message: string;
  checks: FaceCheck[];
  imageUrl?: string;
  imageKitFileId?: string;
};

const poses = [
  { key: 'FRONT', label: 'Chính diện', shortLabel: 'Chính diện', hint: 'Nhìn thẳng camera, mặt nằm trọn trong khung.' },
  { key: 'LEFT', label: 'Nghiêng trái', shortLabel: 'Trái', hint: 'Xoay nhẹ mặt sang trái, vẫn nhìn thấy rõ hai mắt.' },
  { key: 'RIGHT', label: 'Nghiêng phải', shortLabel: 'Phải', hint: 'Xoay nhẹ mặt sang phải, giữ máy chắc và đủ sáng.' },
] as const;

const vietnamStamp = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((item) => item.type === type)?.value || '00';
  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`;
};

const statusMeta: Record<ShotStatus, { label: string; className: string }> = {
  pending: { label: 'Chưa kiểm', className: 'bg-stone-100 text-stone-600' },
  validating: { label: 'Đang kiểm', className: 'bg-sky-100 text-sky-700' },
  valid: { label: 'Đạt', className: 'bg-emerald-100 text-emerald-700' },
  invalid: { label: 'Chụp lại', className: 'bg-rose-100 text-rose-700' },
};

export default function FaceRegistration() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [canRegisterOthers, setCanRegisterOthers] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [step, setStep] = useState(0);
  const [shots, setShots] = useState<Record<string, Shot>>({});
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const selectedEmployee = canRegisterOthers ? employees.find((item) => item.id === employeeId) : currentEmployee || employees[0];
  const currentPose = poses[step];
  const validCount = poses.filter((pose) => shots[pose.key]?.status === 'valid').length;
  const allValid = validCount === poses.length;
  const isChecking = poses.some((pose) => shots[pose.key]?.status === 'validating');

  const drawMirroredCameraFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  };

  const startCamera = async () => {
    stopCamera();
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
      const nextEmployees = data.employees || [];
      const nextCurrentEmployee = data.currentEmployee || null;
      const nextCanRegisterOthers = Boolean(data.canRegisterOthers);
      setEmployees(nextEmployees);
      setCurrentEmployee(nextCurrentEmployee);
      setCanRegisterOthers(nextCanRegisterOthers);
      if (!nextCanRegisterOthers) {
        setEmployeeId(nextCurrentEmployee?.id || nextEmployees[0]?.id || '');
      } else if (!employeeId && nextEmployees.length === 1) {
        setEmployeeId(nextEmployees[0].id);
      }
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

  const resetShots = () => {
    Object.values(shots).forEach((shot) => URL.revokeObjectURL(shot.preview));
    setShots({});
    setStep(0);
    setMessage('');
  };

  const validateCapturedShot = async (poseKey: string, shot: Shot, employee: Employee) => {
    try {
      const stamp = vietnamStamp();
      const uploaded = await uploadToImageKit(
        shot.blob,
        `${poseKey.toLowerCase()}_${stamp}.jpg`,
        `/com-thi-no/hr/face-registration/${employee.code}/draft`,
      );
      const validation = await faceApi.validateRegistrationImage({
        pose: poseKey,
        imageUrl: uploaded.url,
      });

      setShots((prev) => ({
        ...prev,
        [poseKey]: {
          ...prev[poseKey],
          imageUrl: uploaded.url,
          imageKitFileId: uploaded.fileId,
          checks: validation.checks || [],
          status: validation.isValid ? 'valid' : 'invalid',
          message: validation.message || (validation.isValid ? 'Ảnh đạt điều kiện nhận diện.' : 'Ảnh chưa đạt, cần chụp lại.'),
        },
      }));

      if (validation.isValid) {
        const nextIndex = Math.min(step + 1, poses.length - 1);
        const nextPose = poses[nextIndex];
        if (nextPose && poseKey === currentPose.key && step < poses.length - 1) {
          setStep(nextIndex);
        }
      }
    } catch (error: any) {
      setShots((prev) => ({
        ...prev,
        [poseKey]: {
          ...prev[poseKey],
          status: 'invalid',
          message: error?.response?.data?.message || error.message || 'Không kiểm tra được ảnh. Vui lòng chụp lại.',
          checks: [],
        },
      }));
    }
  };

  const capture = async () => {
    if (!selectedEmployee) {
      setMessage(canRegisterOthers ? 'Vui lòng chọn nhân viên trước khi chụp.' : 'Tài khoản này chưa được gán với hồ sơ nhân viên.');
      return;
    }
    if (!videoRef.current || !canvasRef.current || !currentPose) return;

    setCapturing(true);
    setMessage('');
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!drawMirroredCameraFrame(video, canvas)) throw new Error('Không lấy được khung hình camera.');
      const blob = await canvasToJpegBlob(canvas, 0.92);
      const preview = URL.createObjectURL(blob);
      const nextShot: Shot = {
        blob,
        preview,
        status: 'validating',
        message: 'Đang kiểm tra khuôn mặt, ánh sáng và độ nét...',
        checks: [],
      };
      setShots((prev) => {
        if (prev[currentPose.key]?.preview) URL.revokeObjectURL(prev[currentPose.key].preview);
        return { ...prev, [currentPose.key]: nextShot };
      });
      await validateCapturedShot(currentPose.key, nextShot, selectedEmployee);
    } catch (error: any) {
      setMessage(error.message || 'Không chụp được ảnh.');
    } finally {
      setCapturing(false);
    }
  };

  const submit = async () => {
    if (!selectedEmployee) {
      setMessage(canRegisterOthers ? 'Vui lòng chọn nhân viên.' : 'Tài khoản này chưa được gán với hồ sơ nhân viên.');
      return;
    }
    if (!poses.every((pose) => shots[pose.key]?.status === 'valid' && shots[pose.key]?.imageUrl)) {
      setMessage('Cần đủ 3 ảnh đã đạt điều kiện nhận diện trước khi lưu.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const images = poses.map((pose) => ({
        pose: pose.key,
        imageUrl: shots[pose.key].imageUrl,
        imageKitFileId: shots[pose.key].imageKitFileId,
      }));
      await faceApi.registerEmployeeFace({ employeeId: canRegisterOthers ? selectedEmployee.id : undefined, images });
      setMessage('Đã đăng ký khuôn mặt thành công. Nhân viên có thể dùng chấm công khuôn mặt.');
      resetShots();
      await load(otp);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không đăng ký được khuôn mặt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-24 sm:space-y-5 sm:pb-0">
      {needsOtp && <RevenueOtpPrompt title="Xác thực chấm công & lương" onSubmit={(value) => { setOtp(value); load(value); }} loading={loading} />}

      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Google Authenticator + Face ID</p>
            <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-stone-950 sm:text-3xl">Đăng ký khuôn mặt nhân viên</h1>
            <p className="mt-1 max-w-3xl text-sm text-stone-600 sm:text-base">
              Chụp đủ 3 góc. Mỗi ảnh sẽ được kiểm tra trước khi lưu để tránh ảnh mờ, thiếu mặt hoặc nhiều người trong khung.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900">
            <p className="text-xs font-bold uppercase">Tiến độ</p>
            <p className="text-2xl font-black">{validCount}/3 ảnh đạt</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-950 shadow-sm">
          <div className="relative aspect-[3/4] w-full bg-black sm:aspect-[4/3] lg:aspect-video">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[58%] w-[68%] rounded-[50%] border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)] sm:h-[62%] sm:w-[44%]" />
            </div>
            <div className="absolute inset-x-3 top-3 rounded-2xl bg-black/55 px-4 py-3 text-white backdrop-blur sm:left-4 sm:right-auto">
              <div className="flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-amber-300" />
                <p className="font-bold">{currentPose?.label || 'Hoàn tất'}</p>
              </div>
              <p className="mt-1 text-sm text-white/80">{currentPose?.hint || 'Kiểm tra lại ảnh trước khi lưu.'}</p>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-4">
            <div className="rounded-2xl bg-white/5 p-3 text-white">
              <p className="text-sm font-bold">{selectedEmployee?.fullName || 'Chưa chọn nhân viên'}</p>
              <p className="text-xs text-white/65">{cameraReady ? 'Camera đã sẵn sàng' : 'Đang chờ camera'} · Chụp từng góc theo hướng dẫn</p>
            </div>
            <button
              onClick={() => startCamera().catch((error) => setMessage(error.message))}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" /> Mở lại camera
            </button>
            <button
              disabled={!cameraReady || !currentPose || capturing || isChecking}
              onClick={capture}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {capturing || isChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              Chụp & kiểm ảnh
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            {canRegisterOthers ? (
              <>
                <label className="text-xs font-bold uppercase text-stone-500">Nhân viên</label>
                <select
                  value={employeeId}
                  onChange={(event) => {
                    setEmployeeId(event.target.value);
                    resetShots();
                  }}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-3 py-3 font-semibold outline-none focus:border-amber-500"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code} - {employee.fullName}</option>)}
                </select>
              </>
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="text-xs font-bold uppercase tracking-wide">Tài khoản đang đăng nhập</p>
                <p className="mt-1 font-semibold">Hệ thống tự đăng ký khuôn mặt cho nhân viên đã gán với tài khoản này.</p>
              </div>
            )}

            {selectedEmployee && (
              <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                <p className="font-bold text-stone-950">{selectedEmployee.fullName}</p>
                <p className="text-sm text-stone-500">{selectedEmployee.position || 'Nhân viên'} · {selectedEmployee.department || 'Chưa có bộ phận'}</p>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{selectedEmployee.faceStatus || 'NOT_REGISTERED'}</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-950">3 ảnh bắt buộc</h2>
                <p className="text-sm text-stone-500">Ấn từng ảnh để chụp lại góc đó.</p>
              </div>
              {allValid && <BadgeCheck className="h-8 w-8 text-emerald-600" />}
            </div>

            <div className="space-y-3">
              {poses.map((pose, index) => {
                const shot = shots[pose.key];
                const meta = statusMeta[shot?.status || 'pending'];
                const active = step === index;
                return (
                  <button
                    type="button"
                    key={pose.key}
                    onClick={() => setStep(index)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="grid grid-cols-[72px_1fr] gap-3">
                      {shot ? (
                        <img src={shot.preview} alt={pose.label} className="h-[72px] w-[72px] rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                          <ScanFace className="h-7 w-7" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-stone-950">{pose.shortLabel}</p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${meta.className}`}>{meta.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">{shot?.message || pose.hint}</p>
                        {shot?.status === 'validating' && (
                          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-sky-700">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi ảnh lên Face AI...
                          </div>
                        )}
                        {shot?.checks?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {shot.checks.map((check) => (
                              <div key={check.key} className={`flex items-start gap-2 text-xs font-semibold ${check.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {check.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                                <span>{check.label}: {check.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={resetShots}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50"
              >
                <RotateCcw className="h-4 w-4" /> Chụp lại
              </button>
              <button
                disabled={loading || !allValid}
                onClick={submit}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 font-black text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Lưu
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <ShieldCheck className="mb-2 h-5 w-5" />
              Ảnh đạt sẽ được lưu theo thư mục nhân viên. Ảnh chưa đạt cần chụp lại trước khi hoàn tất đăng ký.
            </div>
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-12px_35px_rgba(28,25,23,0.12)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-stone-500">Sẵn sàng lưu</p>
            <p className="font-black text-stone-950">{validCount}/3 ảnh đạt</p>
          </div>
          <button
            disabled={loading || !allValid}
            onClick={submit}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {allValid ? <Check className="h-5 w-5" /> : <ScanFace className="h-5 w-5" />}
            Lưu
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
