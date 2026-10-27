import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Scan,
  Camera,
  CameraOff,
  Copy,
  Check,
  Download,
  Share2,
  X,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
  Upload,
  User as UserIcon,
  Search,
  Wallet,
  CheckCircle2,
  FileText,
  Flame,
  CreditCard,
  Maximize2,
} from 'lucide-react';
import { User, Transaction } from '../types';
import { DoubleEntryLedgerEngine } from '../services/ledger';

export interface QRTransferPayload {
  protocol: '3plea-pay';
  type: 'internal_transfer';
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  accountTag: string;
  amount?: number;
  note?: string;
  timestamp?: number;
}

interface QRCodePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTransferSuccess: (
    newTx: Transaction,
    newBalance: number,
    senderLedgerTx: any
  ) => void;
  onViewReceipt: (tx: Transaction) => void;
  initialMode?: 'scan' | 'generate';
  language: 'en' | 'ha';
}

// Audio synthesizer for scan beep
const playScanChime = (type: 'success' | 'click' = 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      const now = ctx.currentTime;
      // Multi-tone cheerful chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
};

export const QRCodePaymentModal: React.FC<QRCodePaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTransferSuccess,
  onViewReceipt,
  initialMode = 'generate',
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>(initialMode);

  // Sync mode when opened with specific initialMode
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setTransferStep('scan');
      setScannedRecipient(null);
      setTransferAmount('');
      setTransferNote('');
      setCompletedTx(null);
      setCameraError(null);
    }
  }, [isOpen, initialMode]);

  // Generator State
  const [requestedAmount, setRequestedAmount] = useState<string>('');
  const [requestNote, setRequestNote] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // User account tag formatting (e.g. 3PA-803123)
  const cleanPhone = currentUser.phone.replace(/[^0-9]/g, '');
  const userTag = `3PA-${cleanPhone.slice(-6) || '803123'}`;

  // Build Generator QR Payload
  const currentQRPayload: QRTransferPayload = {
    protocol: '3plea-pay',
    type: 'internal_transfer',
    recipientId: currentUser.id,
    recipientName: currentUser.name,
    recipientPhone: currentUser.phone,
    accountTag: userTag,
    amount: requestedAmount ? parseFloat(requestedAmount) : undefined,
    note: requestNote || undefined,
    timestamp: Date.now(),
  };

  const qrString = JSON.stringify(currentQRPayload);

  // Scanner & Transfer Execution State
  const [transferStep, setTransferStep] = useState<
    'scan' | 'confirm' | 'processing' | 'success'
  >('scan');
  const [scannedRecipient, setScannedRecipient] =
    useState<QRTransferPayload | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Demo contacts for quick simulation/testing
  const demoRecipients: QRTransferPayload[] = [
    {
      protocol: '3plea-pay',
      type: 'internal_transfer',
      recipientId: 'usr_retailer_02',
      recipientName: 'Tarauni Telecoms Hub',
      recipientPhone: '+234 814 999 8811',
      accountTag: '3PA-998811',
      amount: 2500,
      note: 'Wholesale VTU top-up settlement',
    },
    {
      protocol: '3plea-pay',
      type: 'internal_transfer',
      recipientId: 'usr_amina_03',
      recipientName: 'Amina Sani (Estates FCT)',
      recipientPhone: '+234 802 111 3344',
      accountTag: '3PA-113344',
      amount: 10000,
      note: 'Apartment viewing deposit',
    },
    {
      protocol: '3plea-pay',
      type: 'internal_transfer',
      recipientId: 'usr_musa_04',
      recipientName: 'Alhaji Musa Sulaiman',
      recipientPhone: '+234 809 555 4321',
      accountTag: '3PA-554321',
      note: 'Personal reimbursement',
    },
  ];

  // Stop video stream safely
  const stopCameraStream = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreamActive(false);
  };

  // Start Camera Stream
  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setCameraError(
        'Camera API is not supported in this browser window. You can upload a QR image or select a recipient below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsStreamActive(true);
        setHasCameraPermission(true);
        // Start scanner loop
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream request error:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera access was blocked or denied. Please enable camera permissions or upload a QR image.'
          : 'Unable to open camera hardware. Try using file upload or choose from quick contacts.'
      );
    }
  };

  // Continuous scanner frame loop
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
      ) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleQRDecoded(code.data);
          return; // Stop scan loop on success
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Toggle Torch if supported
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
        if ((capabilities as any).torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any],
          });
          setTorchOn(!torchOn);
        }
      } catch (e) {
        console.warn('Torch not supported or failed to toggle', e);
      }
    }
  };

  // Switch between front/back cameras
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle successful QR detection
  const handleQRDecoded = (rawText: string) => {
    stopCameraStream();

    // Haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 100]);
      } catch {}
    }

    playScanChime('success');

    let parsedPayload: QRTransferPayload | null = null;

    try {
      // 1. Attempt JSON parsing
      const json = JSON.parse(rawText);
      if (json && (json.protocol === '3plea-pay' || json.recipientName || json.recipientPhone)) {
        parsedPayload = {
          protocol: '3plea-pay',
          type: 'internal_transfer',
          recipientId: json.recipientId || `usr_${Date.now()}`,
          recipientName: json.recipientName || 'Verified 3PLEA User',
          recipientPhone: json.recipientPhone || '08000000000',
          accountTag: json.accountTag || `3PA-${(json.recipientPhone || '').slice(-6) || 'PAY'}`,
          amount: typeof json.amount === 'number' ? json.amount : undefined,
          note: json.note || '',
        };
      }
    } catch {
      // 2. URL or plain text scheme parsing
      if (rawText.startsWith('3plea://') || rawText.startsWith('pay://')) {
        try {
          const url = new URL(rawText.replace('3plea://', 'http://3plea/'));
          const phone = url.searchParams.get('to') || '08031234567';
          const name = url.searchParams.get('name') || '3PLEA Payee';
          const amt = url.searchParams.get('amount');
          parsedPayload = {
            protocol: '3plea-pay',
            type: 'internal_transfer',
            recipientId: `usr_${Date.now()}`,
            recipientName: name,
            recipientPhone: phone,
            accountTag: `3PA-${phone.slice(-6)}`,
            amount: amt ? parseFloat(amt) : undefined,
            note: url.searchParams.get('note') || '',
          };
        } catch {}
      } else if (rawText.length >= 8) {
        // Plain phone or account number fallback
        const clean = rawText.trim();
        parsedPayload = {
          protocol: '3plea-pay',
          type: 'internal_transfer',
          recipientId: `usr_${Date.now()}`,
          recipientName: '3PLEA Internal Account',
          recipientPhone: clean,
          accountTag: clean.startsWith('3PA-') ? clean : `3PA-${clean.slice(-6)}`,
          note: 'Direct Transfer',
        };
      }
    }

    if (!parsedPayload) {
      setCameraError('Unrecognized QR code format. Please scan a valid 3PLEA payment QR code.');
      // Restart camera after a short delay
      setTimeout(() => {
        startCameraStream();
      }, 1800);
      return;
    }

    // Set recipient and move to confirmation step
    setScannedRecipient(parsedPayload);
    setTransferAmount(parsedPayload.amount ? parsedPayload.amount.toString() : '');
    setTransferNote(parsedPayload.note || '');
    setTransferStep('confirm');
  };

  // Image Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleQRDecoded(code.data);
          } else {
            setCameraError(
              'Could not find a valid QR code in this uploaded image. Please try another image or enter manually.'
            );
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  // Effect to manage camera stream when tab/step changes
  useEffect(() => {
    if (isOpen && activeTab === 'scan' && transferStep === 'scan') {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, transferStep, facingMode]);

  // Copy Account Info
  const handleCopyDetails = () => {
    const textToCopy = `3PLEA Pay Account\nName: ${currentUser.name}\nTag / Account: ${userTag}\nPhone: ${currentUser.phone}\n${
      requestedAmount ? `Requested Amount: ₦${parseFloat(requestedAmount).toLocaleString()}\n` : ''
    }Bank: 3PLE A Platform Internal (Instant)`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    playScanChime('click');
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Download QR Code as Branded Image
  const handleDownloadQR = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Create a nice branded card canvas
      const width = 600;
      const height = 750;
      canvas.width = width;
      canvas.height = height;

      // Dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Card Header
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3PLE A PAY · INSTANT TRANSFER', width / 2, 60);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Zero-fee peer-to-peer wallet transfer', width / 2, 85);

      // White QR Box
      const qrBoxSize = 380;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 120;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fill();

      // Draw QR image
      const padding = 30;
      ctx.drawImage(
        img,
        qrBoxX + padding,
        qrBoxY + padding,
        qrBoxSize - padding * 2,
        qrBoxSize - padding * 2
      );

      // User details at bottom
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(currentUser.name, width / 2, 545);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`TAG: ${userTag}  ·  ${currentUser.phone}`, width / 2, 575);

      if (requestedAmount) {
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText(`Amount: ₦${parseFloat(requestedAmount).toLocaleString()}`, width / 2, 615);
      }

      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Scan with any camera or 3PLE A App to pay instantly', width / 2, 675);

      // Download trigger
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `3PLEA_QR_${userTag}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `3PLEA Pay - ${currentUser.name}`,
          text: `Pay ${currentUser.name} instantly on 3PLEA Pay. Tag: ${userTag}`,
          url: window.location.href,
        });
      } catch (err) {
        handleCopyDetails();
      }
    } else {
      handleCopyDetails();
    }
  };

  // Execute Transfer
  const handleExecuteTransfer = () => {
    if (!scannedRecipient) return;

    const amt = parseFloat(transferAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (amt > currentUser.walletBalance) {
      alert(
        `Insufficient balance. You have ₦${currentUser.walletBalance.toLocaleString()} available.`
      );
      return;
    }

    setIsSubmitting(true);
    setTransferStep('processing');

    setTimeout(() => {
      const ref = `3PA-QR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const newTx: Transaction = {
        id: `tx_qr_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_qr_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        type: 'wallet_transfer',
        amount: amt,
        fee: 0,
        discount: 0,
        totalDebited: amt,
        status: 'successful',
        provider: '3PLE A Instant QR Network',
        providerReference: `QR_SETTLE_${Math.floor(100000 + Math.random() * 900000)}`,
        productName: `Instant Transfer to ${scannedRecipient.recipientName}`,
        recipient: `${scannedRecipient.recipientName} (${scannedRecipient.accountTag || scannedRecipient.recipientPhone})`,
        metadata: {
          channel: 'QR_CODE_SCANNER',
          recipientTag: scannedRecipient.accountTag,
          recipientPhone: scannedRecipient.recipientPhone,
          recipientId: scannedRecipient.recipientId,
          narration: transferNote || 'Internal QR Transfer',
          zeroFeeInternal: true,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const ledgerEntries = DoubleEntryLedgerEngine.recordWalletTransfer(
        newTx,
        currentUser.name,
        scannedRecipient.recipientName
      );

      const newBalance = currentUser.walletBalance - amt;

      onTransferSuccess(newTx, newBalance, ledgerEntries);
      setCompletedTx(newTx);
      setIsSubmitting(false);
      setTransferStep('success');

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {}

      playScanChime('success');
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Hidden canvas for image and video QR frame decoding */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-xs font-black">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>{language === 'ha' ? 'Biyan Kudi ta QR' : '3PLE A QR Pay'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Zero Fee
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ha'
                  ? 'Biyan kudi da karbar kudi nan take tsakanin asusu'
                  : 'Instant internal wallet transfer & invoice generation'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Scan vs My QR) - Only visible when not in active transfer steps */}
        {transferStep === 'scan' && (
          <div className="px-5 pt-3 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('generate');
                  stopCameraStream();
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'generate'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>{language === 'ha' ? 'Lambar QR Dina' : 'My QR (Receive)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('scan');
                  startCameraStream();
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'scan'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scan className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ha' ? 'Duba QR (Biyan Kudi)' : 'Scan to Pay'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: GENERATE / RECEIVE QR */}
          {activeTab === 'generate' && transferStep === 'scan' && (
            <div className="space-y-4">
              {/* QR Display Card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-center text-white border border-slate-800 shadow-lg overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Account info pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-slate-200 border border-white/10 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>3PLE A Verified Account</span>
                </div>

                <h3 className="text-lg font-extrabold text-white">{currentUser.name}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-0.5 text-xs text-amber-400 font-mono font-bold">
                  <span>{userTag}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-sans">{currentUser.phone}</span>
                </div>

                {/* QR Code Canvas Box */}
                <div
                  ref={qrContainerRef}
                  className="my-5 mx-auto w-56 h-56 bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-102"
                >
                  <QRCodeSVG
                    value={qrString}
                    size={195}
                    level="H"
                    includeMargin={false}
                    className="w-full h-full"
                  />
                </div>

                {/* Custom Amount Display if set */}
                {requestedAmount && parseFloat(requestedAmount) > 0 ? (
                  <div className="inline-block px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-sm tabular-nums">
                    Requesting: ₦{parseFloat(requestedAmount).toLocaleString()}
                    {requestNote && (
                      <span className="text-xs text-slate-300 block font-normal mt-0.5">
                        "{requestNote}"
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Scan to send any amount directly into my wallet
                  </p>
                )}
              </div>

              {/* Action Buttons: Copy, Download, Share */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Tag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Optional: Customize Request Amount */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Set Specific Invoice Amount (Optional)</span>
                  </span>
                  {requestedAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        setRequestedAmount('');
                        setRequestNote('');
                      }}
                      className="text-[11px] text-rose-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Note: e.g. Lunch, Data recharge"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[1000, 2000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRequestedAmount(amt.toString())}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                    >
                      +₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Simulator Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleQRDecoded(qrString);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-400/10 hover:bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/30 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Scan this QR Code (Instant Simulator)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CAMERA SCANNER (STEP: SCAN) */}
          {activeTab === 'scan' && transferStep === 'scan' && (
            <div className="space-y-4">
              {/* Camera Viewfinder View */}
              <div className="relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Scanner Viewfinder Box Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                  {/* Outer dark vignette */}
                  <div className="relative w-64 h-64 border-2 border-dashed border-emerald-400/60 rounded-3xl overflow-hidden flex items-center justify-center shadow-[0_0_0_9999px_rgba(2,6,23,0.65)]">
                    {/* Targeting Corner Brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-2xl" />

                    {/* Animated Scanning Laser Line */}
                    {isStreamActive && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24] animate-bounce" />
                    )}

                    <div className="text-center p-4">
                      {!isStreamActive && (
                        <div className="space-y-2 text-slate-400">
                          <Camera className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
                          <p className="text-xs font-semibold">Starting camera feed...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Helper */}
                  <p className="text-[11px] font-medium text-white/90 bg-slate-950/80 px-3 py-1 rounded-full mt-4 border border-white/10 backdrop-blur-sm">
                    Center the 3PLE A QR code within the frame
                  </p>
                </div>

                {/* Viewfinder Controls: Torch & Camera Switch */}
                {isStreamActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        torchOn
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900/80 text-white hover:bg-slate-800 border border-white/20'
                      }`}
                      title="Toggle Torch"
                    >
                      <Flame className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={switchCamera}
                      className="w-9 h-9 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-white/20 flex items-center justify-center transition-all"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Error / Permission Fallback Alert */}
              {cameraError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                      You can instantly upload an image of a QR code or choose from pre-verified demo
                      accounts below.
                    </p>
                  </div>
                </div>
              )}

              {/* Image Upload & Retry Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload QR Code Image</span>
                </button>

                {cameraError && (
                  <button
                    type="button"
                    onClick={startCameraStream}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                )}
              </div>

              {/* Quick Select Pre-Verified Recipient (Sandbox Testing Utility) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Or Select Verified Contact (Simulation):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {demoRecipients.map((rec) => (
                    <button
                      key={rec.recipientId}
                      type="button"
                      onClick={() => handleQRDecoded(JSON.stringify(rec))}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                          {rec.recipientName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400">
                            {rec.recipientName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {rec.accountTag} · {rec.recipientPhone}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        {rec.amount ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                            ₦{rec.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span>Any Amount</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TRANSFER CONFIRMATION FORM */}
          {transferStep === 'confirm' && scannedRecipient && (
            <div className="space-y-4 animate-fadeIn">
              {/* Recipient Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
                <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block mb-1">
                  Recipient Details Confirmed
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-base shadow-xs">
                      {scannedRecipient.recipientName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{scannedRecipient.recipientName}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Tag: <span className="text-amber-600 dark:text-amber-400 font-bold">{scannedRecipient.accountTag}</span> · {scannedRecipient.recipientPhone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Transfer Amount (₦ NGN)
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Wallet: <strong className="text-slate-800 dark:text-white">₦{currentUser.walletBalance.toLocaleString()}</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-9 pr-4 py-3 text-lg font-bold font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick amount increment chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[1000, 2000, 5000, 10000, 20000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTransferAmount(chip.toString())}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      ₦{chip.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Narration Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Narration / Note
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Settlement, refund, or bill payment"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white"
                />
              </div>

              {/* Fee and Settlement Details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Network:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    3PLE A Double-Entry Internal
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Transfer Fee:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₦0.00 (Zero Fee)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Delivery Speed:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Instant (Real-time Settlement)
                  </span>
                </div>
              </div>

              {/* Actions: Confirm or Rescan */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTransferStep('scan');
                    startCameraStream();
                  }}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors"
                >
                  Rescan
                </button>

                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={
                    !transferAmount ||
                    parseFloat(transferAmount) <= 0 ||
                    parseFloat(transferAmount) > currentUser.walletBalance
                  }
                  className="flex-1 py-3 px-4 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-2 active:scale-98"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>
                    Pay ₦{parseFloat(transferAmount || '0').toLocaleString()} Now
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING STATE */}
          {transferStep === 'processing' && (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/10 border-2 border-amber-400 border-t-transparent animate-spin" />
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Executing Instant Transfer...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verifying ledger entries and crediting recipient wallet.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {transferStep === 'success' && completedTx && (
            <div className="py-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-4 border-emerald-200 dark:border-emerald-800 shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                  Transfer Successful!
                </span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  ₦{completedTx.amount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sent to <strong className="text-slate-800 dark:text-slate-200">{completedTx.recipient}</strong>
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Ref: {completedTx.reference}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">From:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">3PLE A Instant QR Network</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Narration:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {completedTx.metadata.narration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Settled (Zero Fee)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onViewReceipt(completedTx)}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Detailed Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
