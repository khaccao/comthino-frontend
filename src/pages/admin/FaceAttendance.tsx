import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock, RefreshCw, ScanFace, Upload } from 'lucide-react';
import { faceApi } from '../../services/api';
import { canvasToJpegBlob, uploadToImageKit } from '../../utils/imageKitUpload';

const formatTime = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value)) : '--';

export default function FaceAttendance() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

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

  useEffect(() => {
    startCamera().catch((error) => setMessage(error.message || 'Không mở được camera.'));
    return stopCamera;
  }, []);

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không lấy được khung hình camera.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToJpegBlob(canvas, 0.9);
      const stamp = new Date().toISOString()
        .split('-').join('')
        .split(':').join('')
        .split('.').join('')
        .split('T').join('')
        .split('Z').join('')
        .slice(0, 14);
      const upload = await uploadToImageKit(blob, `attendance_${stamp}.jpg`, `/attendance/${stamp.slice(0, 4)}/${stamp.slice(4, 6)}/${stamp.slice(6, 8)}`);
      const data = await faceApi.recognizeAttendance({
        imageUrl: upload.url,
        imageKitFileId: upload.fileId,
        deviceId: navigator.userAgent.slice(0, 120),
        locationId: 'ADMIN_CAMERA',
      });
      setResult(data);
      setMessage(data.attendanceType === 'CHECK_OUT' ? 'Đã chấm giờ về.' : 'Đã chấm giờ đến.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không chấm công được.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-200">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Face attendance</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Chấm công bằng nhận diện khuôn mặt</h1>
        <p className="mt-1 text-stone-600">Nhân viên đứng trước camera, hệ thống nhận diện và tự xác định vào ca hay ra ca.</p>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-950 shadow-sm">
        <div className="relative aspect-[4/5] bg-black sm:aspect-video">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[58%] w-[62%] rounded-[50%] border-4 border-white/75 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)] sm:w-[36%]" />
          </div>
          <div className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-sm font-bold text-white backdrop-blur">
            <ScanFace className="mr-2 inline h-4 w-4" /> Đặt mặt trong khung
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="text-white">
            <p className="font-bold">Camera chấm công</p>
            <p className="text-sm text-white/70">Ảnh được lưu ImageKit để đối soát khi cần.</p>
          </div>
          <button onClick={() => startCamera().catch((error) => setMessage(error.message))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20">
            <RefreshCw className="h-4 w-4" /> Mở lại camera
          </button>
          <button disabled={!cameraReady || loading} onClick={captureAndRecognize} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
            {loading ? <Upload className="h-4 w-4 animate-pulse" /> : <Camera className="h-4 w-4" />} Chấm công
          </button>
        </div>
      </section>

      {result && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{result.attendanceType === 'CHECK_OUT' ? 'Giờ về' : 'Giờ đến'}</p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">{result.employee?.fullName}</h2>
              <p className="mt-1 text-sm text-stone-600">{result.employee?.code} · Độ tin cậy {Math.round(Number(result.confidence || 0) * 100)}%</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <Clock className="mb-2 h-5 w-5 text-emerald-700" />
                  <p className="text-xs font-bold uppercase text-stone-500">Giờ vào</p>
                  <p className="font-bold">{formatTime(result.attendance?.clockIn)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <Clock className="mb-2 h-5 w-5 text-emerald-700" />
                  <p className="text-xs font-bold uppercase text-stone-500">Giờ ra</p>
                  <p className="font-bold">{formatTime(result.attendance?.clockOut)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
