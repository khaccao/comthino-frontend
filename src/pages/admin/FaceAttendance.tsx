import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock, ImagePlus, MapPin, RefreshCw, ScanFace, Upload } from 'lucide-react';
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
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    stamp: `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`,
  };
};

export default function FaceAttendance() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [action, setAction] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [handoverFiles, setHandoverFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number; text?: string }>({});

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

  const readLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          text: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        };
        setLocation(next);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    startCamera().catch((error) => setMessage(error.message || 'Không mở được camera.'));
    readLocation();
    return stopCamera;
  }, []);

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (action === 'CHECK_OUT' && handoverFiles.length < 3) {
      setMessage('Giờ về cần chụp ít nhất 3 ảnh bàn giao cuối ca.');
      return;
    }
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
      const date = vietnamStamp();
      const baseFolder = `/com-thi-no/hr/attendance/${date.year}/${date.month}/${date.day}`;
      const faceUpload = await uploadToImageKit(blob, `face_${action.toLowerCase()}_${date.stamp}.jpg`, `${baseFolder}/face-pending`);
      const handoverImages = [];
      if (action === 'CHECK_OUT') {
        for (let index = 0; index < handoverFiles.length; index += 1) {
          const file = handoverFiles[index];
          const uploaded = await uploadToImageKit(file, `handover_${date.stamp}_${index + 1}.jpg`, `${baseFolder}/handover`);
          handoverImages.push({
            imageUrl: uploaded.url,
            imageKitFileId: uploaded.fileId,
            caption: `Ảnh bàn giao ${index + 1}`,
          });
        }
      }
      const data = await faceApi.recognizeAttendance({
        imageUrl: faceUpload.url,
        imageKitFileId: faceUpload.fileId,
        action,
        deviceId: navigator.userAgent.slice(0, 120),
        locationId: 'ADMIN_CAMERA',
        locationText: location.text || null,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        handoverImages,
      });
      setResult(data);
      setHandoverFiles([]);
      setMessage(data.attendanceType === 'CHECK_OUT' ? 'Đã chấm giờ về và lưu ảnh bàn giao.' : 'Đã chấm giờ đến.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không chấm công được.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Face attendance</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Chấm công khuôn mặt</h1>
        <p className="mt-1 text-stone-600">Nhận diện nhân viên, áp ca đã xếp, lưu giờ, vị trí và ảnh bàn giao cuối ca.</p>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm sm:grid-cols-2">
        <button
          onClick={() => setAction('CHECK_IN')}
          className={`rounded-2xl px-4 py-4 text-left font-bold ${action === 'CHECK_IN' ? 'bg-emerald-600 text-white' : 'bg-stone-50 text-stone-700'}`}
        >
          <Clock className="mb-2 h-5 w-5" /> Giờ đến
        </button>
        <button
          onClick={() => setAction('CHECK_OUT')}
          className={`rounded-2xl px-4 py-4 text-left font-bold ${action === 'CHECK_OUT' ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-700'}`}
        >
          <ImagePlus className="mb-2 h-5 w-5" /> Giờ về + ảnh bàn giao
        </button>
      </div>

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
            <p className="text-sm text-white/70">{location.text ? `Vị trí: ${location.text}` : 'Trình duyệt sẽ xin quyền lấy vị trí nếu được phép.'}</p>
          </div>
          <button onClick={() => startCamera().catch((error) => setMessage(error.message))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20">
            <RefreshCw className="h-4 w-4" /> Mở lại camera
          </button>
          <button disabled={!cameraReady || loading} onClick={captureAndRecognize} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
            {loading ? <Upload className="h-4 w-4 animate-pulse" /> : <Camera className="h-4 w-4" />} Chấm công
          </button>
        </div>
      </section>

      {action === 'CHECK_OUT' && (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ImagePlus className="h-5 w-5 text-amber-700" />
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-950">Ảnh bàn giao cuối ca</h2>
              <p className="text-sm text-stone-600">Bếp, phục vụ, order... đều cần tối thiểu 3 ảnh để superadmin đối soát.</p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => setHandoverFiles(Array.from(event.target.files || []))}
            className="mt-4 w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm font-semibold"
          />
          <p className="mt-2 text-sm font-bold text-stone-600">Đã chọn {handoverFiles.length} ảnh.</p>
        </section>
      )}

      {result && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{result.attendanceType === 'CHECK_OUT' ? 'Giờ về' : 'Giờ đến'}</p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">{result.employee?.fullName}</h2>
              <p className="mt-1 text-sm text-stone-600">{result.employee?.code} · Độ tin cậy {Math.round(Number(result.confidence || 0) * 100)}%</p>
              {result.ruleSummary && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-amber-800">{result.ruleSummary}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                <div className="rounded-2xl bg-white p-4">
                  <MapPin className="mb-2 h-5 w-5 text-emerald-700" />
                  <p className="text-xs font-bold uppercase text-stone-500">Vị trí</p>
                  <p className="font-bold">{result.attendance?.locationText || location.text || '--'}</p>
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
