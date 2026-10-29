import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type FC,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
import {
  parseEndTimeToday,
  getDurationPreview,
  getDefaultEndTime,
} from "../../utils/time";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { TimeInput } from "../../components/ui/TimeInput";
import { NumberInput } from "../../components/ui/NumberInput";
import { SelectInput } from "../../components/ui/SelectInput";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { SLIDES } from "../presentation/slides.registry";
import type { AppTheme, TalkConfig } from "../../types";
import {
  PlayIcon,
  CheckIcon,
  RefreshIcon,
  ArrowRightIcon,
  CloseIcon,
  AnalyticsIcon,
  DownloadIcon,
  TrashIcon,
  FinishIcon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  SpeakerNoteIcon,
  TranscriptIcon,
  PdfIcon,
} from "../../components/icons";
import {
  isFileSystemAccessSupported,
  promptVideoSaveFilePicker,
} from "../../utils/videoRecording";
import { transcriptionManager } from "../../services/transcriptionService";
import { useSpeakerWindow } from "../speaker/useSpeakerWindow";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { useOfflineCache } from "../../hooks/useOfflineCache";
import { SlidePdfExportModal } from "../presentation/export/SlidePdfExportModal";
import styles from "./ConfigView.module.scss";

export const ConfigView: FC = () => {
  const navigate = useNavigate();
  const {
    config,
    session,
    game,
    theme,
    setTheme,
    navOnSlide,
    setNavOnSlide,
    showRecIndicator,
    setShowRecIndicator,
    updateConfig,
    startTalk,
    endTalk,
    setMode,
    resetSlideAndGame,
    isSessionActive,
    isRecordingAudio,
    stopAudioRecording,
    isRecordingVideo,
    stopVideoRecording,
    videoRecordedFileName,
    isTranscribing,
  } = useAppState();
  const { requestFullscreen } = useFullscreen();
  const { openSpeakerWindow, isWindowOpen: isSpeakerOpen } = useSpeakerWindow(
    session,
    game,
    { disableNavHandling: true, isSessionActive },
  );
  const { isInstallable, isInstalled, installApp } = usePwaInstall();
  const {
    total: cacheTotal,
    completed: cacheCompleted,
    percent: cachePercent,
    isComplete: cacheIsComplete,
    inProgress: cacheInProgress,
    recache: triggerRecache,
    isOnline,
  } = useOfflineCache();

  // Initialize selected theme
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(
    () => config.theme || theme || "dark",
  );

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  // Initialize input with stored config endTime or a default calculated time
  const [timeValue, setTimeValue] = useState<string>(() => {
    if (config.endTime) return config.endTime;
    return getDefaultEndTime();
  });

  const [conclusionMinutes, setConclusionMinutes] = useState<number>(() => {
    return typeof config.conclusionMinutes === "number"
      ? config.conclusionMinutes
      : 5;
  });

  const [introEndSlide, setIntroEndSlide] = useState<number>(() => {
    return typeof config.introEndSlide === "number" ? config.introEndSlide : 10;
  });

  const [isPdfExportOpen, setIsPdfExportOpen] = useState<boolean>(false);

  // Audio Recording configuration state
  const [audioRecordingEnabled, setAudioRecordingEnabled] = useState<boolean>(
    () => config.audioRecordingEnabled ?? false,
  );
  const [audioDeviceId, setAudioDeviceId] = useState<string>(
    () => config.audioDeviceId ?? "default",
  );
  const [availableMics, setAvailableMics] = useState<
    Array<{ deviceId: string; label: string }>
  >([]);
  const [micPermissionState, setMicPermissionState] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Audio Transcription state
  const [transcriptionEnabled, setTranscriptionEnabled] = useState<boolean>(
    () => config.transcriptionEnabled ?? false,
  );
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<
    "it" | "en"
  >(() => config.transcriptionLanguage ?? "it");
  const [modelState, setModelState] = useState<
    "idle" | "loading" | "ready" | "error"
  >(() => (transcriptionManager.isModelReady() ? "ready" : "idle"));
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [modelStatusText, setModelStatusText] = useState<string>("");
  const [isModelCached, setIsModelCached] = useState<boolean | null>(null);
  const [isAutoLoadingModel, setIsAutoLoadingModel] = useState<boolean>(false);
  const [autoLoadProgress, setAutoLoadProgress] = useState<number>(0);
  const [autoLoadStatusText, setAutoLoadStatusText] = useState<string>("");
  const pendingStartArgsRef = useRef<{
    config: TalkConfig;
    videoFileHandle: FileSystemFileHandle | null;
  } | null>(null);
  const bypassAutoLoadRef = useRef<boolean>(false);

  // Check cache status on mount
  useEffect(() => {
    let isMounted = true;
    transcriptionManager.isModelCached().then((cached) => {
      if (isMounted) {
        setIsModelCached(cached);
        if (cached && !transcriptionManager.isModelReady()) {
          setModelStatusText(
            "Modello presente nella cache locale del dispositivo (non caricato in memoria RAM).",
          );
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePreloadModel = useCallback(async () => {
    setModelState("loading");
    const wasCached = isModelCached ?? false;
    setModelStatusText(
      wasCached
        ? "Caricamento modello dalla cache locale in WebAssembly..."
        : "Download modello Whisper ONNX e memorizzazione in cache...",
    );
    setModelProgress(5);
    try {
      await transcriptionManager.preloadModel((info) => {
        if (typeof info.progress === "number") {
          setModelProgress(info.progress);
        }
        if (info.message) {
          setModelStatusText(info.message);
        } else if (info.status) {
          if (wasCached) {
            setModelStatusText(
              info.file
                ? `Caricamento file dalla cache: ${info.file}`
                : "Caricamento dalla cache locale in corso...",
            );
          } else {
            setModelStatusText(
              info.file
                ? `Download file: ${info.file}`
                : "Download file modello...",
            );
          }
        }
        if (info.status === "ready") {
          setModelState("ready");
          setIsModelCached(true);
        }
      });
      setModelState("ready");
      setIsModelCached(true);
      setModelStatusText(
        "Modello Whisper Base caricato in memoria RAM e pronto all'uso locale",
      );
    } catch (err: unknown) {
      setModelState("error");
      setModelStatusText(
        (err as Error)?.message ||
          "Errore durante l'inizializzazione del modello Whisper",
      );
    }
  }, [isModelCached]);

  const handleClearModelCache = useCallback(async () => {
    if (
      !window.confirm(
        "Vuoi davvero eliminare i file del modello Whisper dalla cache locale del browser (~150MB)?",
      )
    ) {
      return;
    }
    await transcriptionManager.clearModelCache();
    setIsModelCached(false);
    setModelState("idle");
    setModelProgress(0);
    setModelStatusText("Cache del modello Whisper rimossa.");
  }, []);

  // Video Recording configuration state
  const [videoRecordingEnabled, setVideoRecordingEnabled] = useState<boolean>(
    () => config.videoRecordingEnabled ?? false,
  );
  const [videoDeviceId, setVideoDeviceId] = useState<string>(
    () => config.videoDeviceId ?? "default",
  );
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ deviceId: string; label: string }>
  >([]);
  const [cameraPermissionState, setCameraPermissionState] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const testVideoStreamRef = useRef<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const testStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const refreshMicrophones = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.enumerateDevices
    )
      return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microfono ${index + 1}`,
        }));
      setAvailableMics(audioInputs);
      const hasLabels = audioInputs.some((d) => Boolean(d.label));
      if (hasLabels) {
        setMicPermissionState("granted");
      }
    } catch (err) {
      console.warn("Error enumerating audio devices:", err);
    }
  }, []);

  const requestMicPermission = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionState("granted");
      stream.getTracks().forEach((t) => t.stop());
      await refreshMicrophones();
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      setMicPermissionState("denied");
    }
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      refreshMicrophones();
      navigator.mediaDevices.addEventListener?.(
        "devicechange",
        refreshMicrophones,
      );
      return () => {
        navigator.mediaDevices.removeEventListener?.(
          "devicechange",
          refreshMicrophones,
        );
      };
    }
  }, [refreshMicrophones]);

  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setAudioLevel(0);
  }, []);

  const startMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio:
          audioDeviceId && audioDeviceId !== "default"
            ? { deviceId: { exact: audioDeviceId } }
            : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;
      setMicPermissionState("granted");
      refreshMicrophones();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] ?? 0;
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.round((average / 128) * 100 * 1.5));
        setAudioLevel(level);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      console.warn("Microphone test error:", err);
      setMicPermissionState("denied");
      stopMicTest();
    }
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, [stopMicTest]);

  const refreshCameras = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.enumerateDevices
    )
      return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Videocamera ${index + 1}`,
        }));
      setAvailableCameras(videoInputs);
      const hasLabels = videoInputs.some((d) => Boolean(d.label));
      if (hasLabels) {
        setCameraPermissionState("granted");
      }
    } catch (err) {
      console.warn("Error enumerating video devices:", err);
    }
  }, []);

  const requestCameraPermission = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionState("granted");
      stream.getTracks().forEach((t) => t.stop());
      await refreshCameras();
    } catch (err) {
      console.warn("Camera permission denied:", err);
      setCameraPermissionState("denied");
    }
  };

  const attachVideoStream = useCallback(
    (videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
      if (!videoEl) return;
      if (stream) {
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
        }
        videoEl.muted = true;
        videoEl.play().catch((err) => {
          console.warn("Video preview play error:", err);
        });
      } else {
        videoEl.srcObject = null;
      }
    },
    [],
  );

  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoPreviewRef.current = node;
      if (node && testVideoStreamRef.current) {
        attachVideoStream(node, testVideoStreamRef.current);
      }
    },
    [attachVideoStream],
  );

  const stopCameraTest = useCallback(() => {
    if (testVideoStreamRef.current) {
      testVideoStreamRef.current.getTracks().forEach((t) => t.stop());
      testVideoStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsTestingCamera(false);
  }, []);

  const startCameraTest = async () => {
    if (isTestingCamera) {
      stopCameraTest();
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video:
          videoDeviceId && videoDeviceId !== "default"
            ? { deviceId: { exact: videoDeviceId } }
            : true,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (deviceErr) {
        if (videoDeviceId && videoDeviceId !== "default") {
          console.warn(
            "Camera test with selected device failed, retrying with default video constraints:",
            deviceErr,
          );
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw deviceErr;
        }
      }

      testVideoStreamRef.current = stream;
      setCameraPermissionState("granted");
      refreshCameras();
      setIsTestingCamera(true);

      if (videoPreviewRef.current) {
        attachVideoStream(videoPreviewRef.current, stream);
      }
    } catch (err) {
      console.warn("Camera test error:", err);
      setCameraPermissionState("denied");
      stopCameraTest();
    }
  };

  useEffect(() => {
    if (
      isTestingCamera &&
      videoPreviewRef.current &&
      testVideoStreamRef.current
    ) {
      attachVideoStream(videoPreviewRef.current, testVideoStreamRef.current);
    }
  }, [isTestingCamera, attachVideoStream]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      refreshCameras();
      navigator.mediaDevices.addEventListener?.("devicechange", refreshCameras);
      return () => {
        navigator.mediaDevices.removeEventListener?.(
          "devicechange",
          refreshCameras,
        );
      };
    }
  }, [refreshCameras]);

  useEffect(() => {
    return () => {
      stopCameraTest();
    };
  }, [stopCameraTest]);

  const [hasSavedToast, setHasSavedToast] = useState<boolean>(false);
  const [hasResetToast, setHasResetToast] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [confirmPastOpen, setConfirmPastOpen] = useState<boolean>(false);
  const [pendingPastAction, setPendingPastAction] = useState<"save" | "start">(
    "save",
  );

  const handleThemeChange = (newTheme: AppTheme) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  // Compute parsed target
  const parsedTarget = useMemo(() => {
    if (!timeValue) return null;
    return parseEndTimeToday(timeValue);
  }, [timeValue]);

  const durationPreview = useMemo(() => {
    if (!parsedTarget) return "Inserisci un orario valido";
    if (parsedTarget.isPast) {
      return "Attenzione: questo orario risulta già trascorso per oggi.";
    }

    const talkEndMs = parsedTarget.timestamp;
    const cleanConclusionMin = Math.max(0, conclusionMinutes || 0);
    const conclusionMs = cleanConclusionMin * 60 * 1000;
    const gameEndMs = talkEndMs - conclusionMs;

    const gameEndDate = new Date(gameEndMs);
    const gameEndTimeStr = `${String(gameEndDate.getHours()).padStart(2, "0")}:${String(gameEndDate.getMinutes()).padStart(2, "0")}`;

    return `Fine gioco: ${gameEndTimeStr} (Stop alle telefonate a -${cleanConclusionMin} min) • Fine intro: Slide #${introEndSlide} • Fine talk: ${timeValue} • ${getDurationPreview(talkEndMs)}`;
  }, [parsedTarget, conclusionMinutes, introEndSlide, timeValue]);

  const hasActiveSession = isSessionActive;

  const handleSave = (skipPastCheck = false) => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast && !skipPastCheck) {
      setPendingPastAction("save");
      setConfirmPastOpen(true);
      return;
    }

    updateConfig({
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
      conclusionMinutes: Math.max(0, conclusionMinutes || 0),
      introEndSlide,
      navOnSlide,
      showRecIndicator,
      audioRecordingEnabled,
      audioDeviceId,
      transcriptionEnabled,
      transcriptionLanguage,
      videoRecordingEnabled,
      videoDeviceId,
    });

    setHasSavedToast(true);
    setTimeout(() => setHasSavedToast(false), 2500);
  };

  const proceedStart = async () => {
    if (!parsedTarget) return;
    stopMicTest();
    stopCameraTest();

    let videoFileHandle: FileSystemFileHandle | null = null;
    if (videoRecordingEnabled) {
      if (!isFileSystemAccessSupported()) {
        alert(
          "La registrazione video su disco richiede un browser con supporto File System Access API (es. Chrome, Edge su desktop).",
        );
        return;
      }
      try {
        const formattedDate = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19);
        videoFileHandle = await promptVideoSaveFilePicker(
          `talk-video-${formattedDate}.webm`,
        );
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          // L'utente ha chiuso o annullato la scelta del file
          return;
        }
        console.error("Errore selezione file video:", err);
        alert("Impossibile selezionare il file di destinazione per il video.");
        return;
      }
    }

    const newConfigData = {
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
      conclusionMinutes: Math.max(0, conclusionMinutes || 0),
      introEndSlide,
      navOnSlide,
      showRecIndicator,
      audioRecordingEnabled,
      audioDeviceId,
      transcriptionEnabled,
      transcriptionLanguage,
      videoRecordingEnabled,
      videoDeviceId,
    };

    pendingStartArgsRef.current = {
      config: newConfigData,
      videoFileHandle,
    };

    // If transcription is enabled and the Whisper model is not yet loaded in RAM, load it automatically
    if (transcriptionEnabled && !transcriptionManager.isModelReady()) {
      bypassAutoLoadRef.current = false;
      setIsAutoLoadingModel(true);
      setAutoLoadProgress(5);
      setAutoLoadStatusText(
        isModelCached
          ? "Caricamento modello dalla cache locale in WebAssembly..."
          : "Download modello Whisper ONNX e memorizzazione in cache...",
      );

      try {
        await transcriptionManager.preloadModel((info) => {
          if (typeof info.progress === "number") {
            setAutoLoadProgress(info.progress);
          }
          if (info.message) {
            setAutoLoadStatusText(info.message);
          } else if (info.status) {
            setAutoLoadStatusText(
              isModelCached
                ? info.file
                  ? `Caricamento da cache: ${info.file}`
                  : "Caricamento dalla cache locale in corso..."
                : info.file
                  ? `Download file: ${info.file}`
                  : "Download in corso...",
            );
          }
        });
        setModelState("ready");
        setIsModelCached(true);
      } catch (err) {
        console.error("Errore caricamento automatico modello Whisper:", err);
        if (!bypassAutoLoadRef.current) {
          const proceedWithout = window.confirm(
            `Impossibile caricare il modello Whisper: ${(err as Error)?.message || "Errore sconosciuto"}.\n\nVuoi avviare comunque il talk senza trascrizione vocale?`,
          );
          if (!proceedWithout) {
            setIsAutoLoadingModel(false);
            return;
          }
          newConfigData.transcriptionEnabled = false;
        }
      } finally {
        setIsAutoLoadingModel(false);
      }

      if (bypassAutoLoadRef.current) {
        return;
      }
    }

    // Save configuration
    updateConfig(newConfigData);

    // Start presentation session (resets previous talk session, cards and progress like "Ricomincia da capo")
    startTalk(newConfigData, videoFileHandle);
    navigate("/presentation");
  };

  const handleStart = async () => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast) {
      setPendingPastAction("start");
      setConfirmPastOpen(true);
      return;
    }

    await proceedStart();
  };

  const handleResume = async () => {
    stopMicTest();
    stopCameraTest();
    await requestFullscreen();
    if (session.mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const handleEndSession = () => {
    endTalk();
    navigate("/analytics");
  };

  const handleResetClick = () => {
    setConfirmResetOpen(true);
  };

  const handleResetConfirm = () => {
    resetSlideAndGame();
    setHasResetToast(true);
    setTimeout(() => setHasResetToast(false), 2500);
    setConfirmResetOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={styles.brandHeader}>
          <h1 className={styles.title}>
            Pannello <span className={styles.highlight}>Talk dal Vivo</span>
          </h1>
          <p className={styles.subtitle}>
            Configura l'orario di fine del tuo talk, avvia lo stage a 16:9 ed
            entra nella presentazione.
          </p>
          <div className={styles.headerLinks}>
            <Button
              variant={isSpeakerOpen ? "primary" : "secondary"}
              size="md"
              onClick={openSpeakerWindow}
              leftIcon={<SpeakerNoteIcon size={18} />}
              title="Apri finestra con le note e il testo pensato da dire, sincronizzata con slide e gioco"
            >
              {isSpeakerOpen ? "Note Speaker Aperte" : "Apri Note Speaker"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/script")}
              leftIcon={<SpeakerNoteIcon size={18} />}
              title="Apri il copione / note delle slide in modalità standalone (non sincronizzata con la presentazione)"
            >
              Script
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/analytics")}
              leftIcon={<AnalyticsIcon size={18} />}
            >
              Statistiche & Analytics Talk
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsPdfExportOpen(true)}
              leftIcon={<PdfIcon size={18} />}
              title="Esporta tutte le slide (senza gioco) in PDF, creando una pagina per ogni animazione"
            >
              Esporta Slide in PDF
            </Button>
            {isInstallable && !isInstalled && (
              <Button
                variant="secondary"
                size="md"
                onClick={installApp}
                leftIcon={<DownloadIcon size={18} />}
              >
                Installa App (PWA)
              </Button>
            )}
            {isInstalled && <Badge variant="accent">App PWA Installata</Badge>}

            {/* Offline Cache Status and Action */}
            {cacheInProgress ? (
              <Badge variant="accent">
                Download cache offline: {cachePercent}% ({cacheCompleted}/
                {cacheTotal})
              </Badge>
            ) : cacheIsComplete ? (
              <Button
                variant="secondary"
                size="md"
                onClick={triggerRecache}
                title="Tutti i file multimediali sono salvati in cache. Clicca per sincronizzare di nuovo."
                leftIcon={<CheckIcon size={18} />}
              >
                100% Offline ({cacheCompleted}/{cacheTotal} in cache)
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={triggerRecache}
                title="Scarica tutte le immagini e dati in locale per l'offline"
                leftIcon={<DownloadIcon size={18} />}
              >
                Scarica Cache Offline ({cacheCompleted}/{cacheTotal})
              </Button>
            )}

            {!isOnline && <Badge variant="danger">Dispositivo Offline</Badge>}
          </div>
        </header>

        <div className={styles.cardGrid}>
          {/* Status & Session Card - Always visible with Reset Button */}
          <Card
            raised
            className={`${styles.sessionCard} ${hasActiveSession ? styles.sessionCardActive : ""}`}
          >
            <div className={styles.cardHeading}>
              <span>
                {hasActiveSession
                  ? "Sessione in corso"
                  : "Stato Talk & Presentazione"}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  alignItems: "center",
                }}
              >
                {hasResetToast && (
                  <span className={styles.savedToast}>
                    <CheckIcon size={18} /> Resettato
                  </span>
                )}
                {hasActiveSession && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => navigate("/analytics")}
                    leftIcon={<AnalyticsIcon size={16} />}
                  >
                    Analytics
                  </Button>
                )}
                <Badge variant={hasActiveSession ? "accent" : "default"}>
                  {hasActiveSession ? "Attiva" : "Pronto"}
                </Badge>
              </div>
            </div>

            <div className={styles.sessionStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {session.currentSlideIndex + 1}
                </span>
                <span className={styles.statLabel}>Slide attuale</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{game.discussedCount}</span>
                <span className={styles.statLabel}>Provocazioni</span>
              </div>
              <div className={styles.statItem}>
                <span
                  className={styles.statValue}
                  style={{ textTransform: "capitalize" }}
                >
                  {session.mode === "game"
                    ? game.step === "IDLE"
                      ? "Gioco (IDLE)"
                      : "Gioco"
                    : "Slide"}
                </span>
                <span className={styles.statLabel}>Modalità</span>
              </div>
            </div>

            {/* Monitor Registrazioni & Trascrizione */}
            <div className={styles.recordingMonitorSection}>
              <div className={styles.recordingMonitorHeader}>
                <span>Stato Registrazioni & Trascrizione</span>
                {(isRecordingAudio || isRecordingVideo || isTranscribing) && (
                  <span className={styles.liveRecTag}>
                    <span className={styles.recPulseDot} /> LIVE
                  </span>
                )}
              </div>

              <div className={styles.recordingMonitorGrid}>
                {/* Audio */}
                <div
                  className={`${styles.recordingMonitorCard} ${
                    isRecordingAudio ? styles.recordingMonitorCardActive : ""
                  }`}
                >
                  <div className={styles.recordingMonitorTitle}>
                    <MicIcon size={16} />
                    <span>Audio Microfono</span>
                  </div>
                  <div className={styles.recordingMonitorStatus}>
                    {isRecordingAudio ? (
                      <span className={styles.badgeRecording}>
                        <span className={styles.recDot} /> Registrazione in
                        corso
                      </span>
                    ) : hasActiveSession ? (
                      <span className={styles.badgeInactive}>Non in corso</span>
                    ) : audioRecordingEnabled ? (
                      <span className={styles.badgeReady}>
                        Abilitata al via
                      </span>
                    ) : (
                      <span className={styles.badgeDisabled}>Disabilitata</span>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div
                  className={`${styles.recordingMonitorCard} ${
                    isRecordingVideo ? styles.recordingMonitorCardActive : ""
                  }`}
                >
                  <div className={styles.recordingMonitorTitle}>
                    <VideoIcon size={16} />
                    <span>Video Webcam</span>
                  </div>
                  <div className={styles.recordingMonitorStatus}>
                    {isRecordingVideo ? (
                      <span className={styles.badgeRecording}>
                        <span className={styles.recDot} /> Registrazione su
                        disco
                      </span>
                    ) : hasActiveSession ? (
                      <span className={styles.badgeInactive}>Non in corso</span>
                    ) : videoRecordingEnabled ? (
                      <span className={styles.badgeReady}>
                        Abilitata al via
                      </span>
                    ) : (
                      <span className={styles.badgeDisabled}>Disabilitata</span>
                    )}
                  </div>
                </div>

                {/* Transcription */}
                <div
                  className={`${styles.recordingMonitorCard} ${
                    isTranscribing
                      ? styles.recordingMonitorCardTranscribing
                      : ""
                  }`}
                >
                  <div className={styles.recordingMonitorTitle}>
                    <TranscriptIcon size={16} />
                    <span>Trascrizione Live</span>
                  </div>
                  <div className={styles.recordingMonitorStatus}>
                    {isTranscribing ? (
                      <span className={styles.badgeTranscribing}>
                        <span className={styles.transcribingDot} /> Trascrizione
                        attiva
                      </span>
                    ) : hasActiveSession ? (
                      <span className={styles.badgeInactive}>Non in corso</span>
                    ) : transcriptionEnabled ? (
                      <span className={styles.badgeReady}>
                        Abilitata al via
                      </span>
                    ) : (
                      <span className={styles.badgeDisabled}>Disabilitata</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              {hasActiveSession && isRecordingAudio && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={stopAudioRecording}
                  leftIcon={<MicOffIcon size={18} />}
                  title="Interrompi e salva subito la registrazione audio in corso"
                >
                  Ferma audio
                </Button>
              )}
              {hasActiveSession && isRecordingVideo && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={stopVideoRecording}
                  leftIcon={<VideoOffIcon size={18} />}
                  title="Interrompi e salva subito la registrazione video in corso"
                >
                  Ferma video
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={handleResetClick}
                leftIcon={<RefreshIcon size={18} />}
                title="Imposta la slide alla numero 1 e il gioco allo stato IDLE (KlippySaw)"
              >
                Reset
              </Button>
              {hasActiveSession && (
                <IconButton
                  aria-label="Concludi talk e sessione"
                  size="lg"
                  onClick={handleEndSession}
                  title="Concludi sessione talk"
                  style={{ color: "var(--color-mint)" }}
                >
                  <FinishIcon size={24} />
                </IconButton>
              )}
              {hasActiveSession ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleResume}
                  rightIcon={<ArrowRightIcon size={20} />}
                >
                  Riprendi Talk
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setMode("presentation");
                    navigate("/presentation");
                  }}
                  rightIcon={<ArrowRightIcon size={18} />}
                >
                  Vai alle Slide
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsPdfExportOpen(true)}
                leftIcon={<PdfIcon size={18} />}
                title="Esporta tutte le slide (senza gioco) in PDF con animazioni"
              >
                Esporta Slide (PDF)
              </Button>
            </div>
          </Card>

          {/* Configuration block */}
          <Card className={styles.configCard}>
            <div className={styles.cardHeading}>
              <span>Configurazione Talk</span>
              {hasSavedToast && (
                <span className={styles.savedToast}>
                  <CheckIcon size={18} /> Salvato
                </span>
              )}
            </div>

            {/* Theme selector */}
            <div className={styles.themeSection}>
              <label className={styles.themeLabel} id="theme-selector-label">
                Tema interfaccia
              </label>
              <SegmentedControl<AppTheme>
                options={[
                  { value: "dark", label: "🌙 Dark" },
                  { value: "light", label: "☀️ Light" },
                ]}
                value={selectedTheme}
                onChange={handleThemeChange}
                ariaLabel="Seleziona tema dell'applicazione"
              />
              <span className={styles.themeHint}>
                {selectedTheme === "light"
                  ? "Tema Light attivo: cornice blu chiaro (#1e66fa) e accenti arancioni."
                  : "Tema Dark attivo: visual ad alto contrasto per ambienti bui e proiettori."}
              </span>
            </div>

            {/* Nav arrows position selector */}
            <div className={styles.themeSection}>
              <label className={styles.themeLabel} id="nav-position-label">
                Posizione frecce di navigazione
              </label>
              <SegmentedControl<"slide" | "header">
                options={[
                  { value: "slide", label: "🖥️ Sopra la slide" },
                  { value: "header", label: "🔝 Nell'intestazione" },
                ]}
                value={navOnSlide ? "slide" : "header"}
                onChange={(val) => setNavOnSlide(val === "slide")}
                ariaLabel="Seleziona posizione frecce di navigazione"
              />
              <span className={styles.themeHint}>
                {navOnSlide
                  ? "Frecce visibili sopra la slide: controlli grandi e facili da premere a schermo."
                  : "Frecce nell'intestazione: massimizza lo spazio della slide con controlli compatti in alto."}
              </span>
            </div>

            {/* Rec indicator visibility selector */}
            <div className={styles.themeSection}>
              <label className={styles.themeLabel} id="rec-indicator-label">
                Segnale di registrazione (REC) nella barra superiore
              </label>
              <SegmentedControl<"visible" | "hidden">
                options={[
                  { value: "visible", label: "🔴 Visibile" },
                  { value: "hidden", label: "👁️‍🗨️ Nascosto" },
                ]}
                value={showRecIndicator ? "visible" : "hidden"}
                onChange={(val) => setShowRecIndicator(val === "visible")}
                ariaLabel="Visibilità del segnale di registrazione nella barra superiore"
              />
              <span className={styles.themeHint}>
                {showRecIndicator
                  ? "Il segnale 'REC' compare nella barra superiore se è attiva la registrazione audio o video."
                  : "Il segnale 'REC' rimane nascosto nella barra superiore anche durante la registrazione."}
              </span>
            </div>

            <TimeInput
              label="Orario previsto per la fine del talk"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              hint="Inserisci l'ora di fine (formato HH:mm). Il countdown calcolerà la durata residua esatta senza drift."
              error={
                parsedTarget?.isPast ? "Orario nel passato per oggi" : undefined
              }
            />

            <NumberInput
              id="talk-conclusion-minutes"
              label="Minuti dedicati alla conclusione"
              value={conclusionMinutes}
              onChange={(e) =>
                setConclusionMinutes(
                  Math.max(0, parseInt(e.target.value, 10) || 0),
                )
              }
              min={0}
              max={180}
              step={1}
              suffix="min"
              hint="Numero di minuti dalla fine del gioco alla fine della presentazione. Triggera lo 'Stop alle telefonate'."
            />

            <SelectInput
              id="talk-intro-end-slide"
              label="Slide di fine intro"
              value={introEndSlide}
              onChange={(e) =>
                setIntroEndSlide(parseInt(e.target.value, 10) || 10)
              }
              options={SLIDES.map((s, idx) => ({
                value: idx + 1,
                label: `${idx + 1}: ${s.title}`,
              }))}
              hint={`La slide selezionata è l'ultima slide dell'introduzione (default #10). Lo 'Stop alle telefonate' passerà alla slide successiva (#${introEndSlide + 1}${SLIDES[introEndSlide] ? `: ${SLIDES[introEndSlide].title}` : ""}).`}
            />

            {/* Audio Recording Section */}
            <div className={styles.themeSection}>
              <div className={styles.micHeader}>
                <label className={styles.themeLabel} id="audio-recording-label">
                  Registrazione audio
                </label>
                {isRecordingAudio ? (
                  <Badge variant="danger">● Registrazione in corso</Badge>
                ) : audioRecordingEnabled ? (
                  <Badge variant="accent">
                    {isTestingMic ? "Test in corso" : "Attiva al via"}
                  </Badge>
                ) : null}
              </div>
              <SegmentedControl<"enabled" | "disabled">
                options={[
                  { value: "disabled", label: "Disabilitata" },
                  { value: "enabled", label: "🎙️ Abilitata" },
                ]}
                value={audioRecordingEnabled ? "enabled" : "disabled"}
                onChange={(val) => {
                  const enabled = val === "enabled";
                  setAudioRecordingEnabled(enabled);
                  if (enabled && micPermissionState === "prompt") {
                    requestMicPermission();
                  }
                  if (!enabled) {
                    if (isTestingMic) {
                      stopMicTest();
                    }
                    if (isRecordingAudio) {
                      stopAudioRecording();
                    }
                  }
                }}
                ariaLabel="Abilita o disabilita registrazione audio"
              />
              <span className={styles.themeHint}>
                {audioRecordingEnabled
                  ? "Registra l'audio dal microfono selezionato da 'Inizia il talk' fino alla conclusione. Salvataggio locale in memoria browser (IndexedDB)."
                  : "Nessun audio verrà registrato durante il talk."}
              </span>

              {isRecordingAudio && (
                <div className={styles.recordingActiveNotice}>
                  <div className={styles.recordingActiveInfo}>
                    <span className={styles.recordingActiveDot} />
                    <div className={styles.recordingActiveText}>
                      <strong>Registrazione audio attualmente in corso</strong>
                      <span>
                        Il microfono sta catturando l'audio del talk in tempo
                        reale.
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={stopAudioRecording}
                    leftIcon={<MicOffIcon size={16} />}
                  >
                    Ferma Registrazione
                  </Button>
                </div>
              )}

              {audioRecordingEnabled && (
                <div className={styles.micSettingsWrapper}>
                  {micPermissionState === "denied" && (
                    <div className={styles.permissionErrorBanner} role="alert">
                      <MicOffIcon size={18} />
                      <span>
                        Accesso al microfono negato nel browser. Abilita il
                        permesso per registrare l'audio.
                      </span>
                    </div>
                  )}

                  <div className={styles.permissionActionRow}>
                    <div className={styles.permissionStatusInfo}>
                      <span className={styles.permissionStatusLabel}>
                        Permesso Microfono:
                      </span>
                      <Badge
                        variant={
                          micPermissionState === "granted"
                            ? "accent"
                            : micPermissionState === "denied"
                              ? "danger"
                              : "default"
                        }
                      >
                        {micPermissionState === "granted"
                          ? "✓ Concesso"
                          : micPermissionState === "denied"
                            ? "✗ Negato"
                            : "Da autorizzare"}
                      </Badge>
                    </div>
                    <Button
                      variant={
                        micPermissionState === "granted" ? "ghost" : "secondary"
                      }
                      size="md"
                      onClick={requestMicPermission}
                      leftIcon={<MicIcon size={16} />}
                      title="Richiedi o rinnova esplicitamente l'accesso al microfono prima di avviare il talk"
                    >
                      {micPermissionState === "granted"
                        ? "Rinnova / Verifica Permesso"
                        : "Autorizza Microfono Ora"}
                    </Button>
                  </div>

                  <SelectInput
                    id="talk-audio-device"
                    label="Microfono da utilizzare"
                    value={audioDeviceId}
                    onChange={(e) => {
                      setAudioDeviceId(e.target.value);
                      if (isTestingMic) {
                        stopMicTest();
                      }
                    }}
                    options={[
                      {
                        value: "default",
                        label: "Microfono predefinito di sistema",
                      },
                      ...availableMics
                        .filter((m) => m.deviceId !== "default")
                        .map((m) => ({
                          value: m.deviceId,
                          label: m.label,
                        })),
                    ]}
                    hint="Scegli la sorgente microfonica da cui catturare l'audio del talk."
                  />

                  <div className={styles.micTestRow}>
                    <Button
                      variant={isTestingMic ? "primary" : "secondary"}
                      size="md"
                      onClick={startMicTest}
                      leftIcon={
                        isTestingMic ? (
                          <MicOffIcon size={16} />
                        ) : (
                          <MicIcon size={16} />
                        )
                      }
                    >
                      {isTestingMic ? "Ferma Test" : "Testa Microfono"}
                    </Button>
                    <div className={styles.meterWrapper}>
                      <div className={styles.meterTrack}>
                        <div
                          className={styles.meterFill}
                          style={{ width: `${isTestingMic ? audioLevel : 0}%` }}
                        />
                      </div>
                      <span className={styles.meterLabel}>
                        {isTestingMic ? `Livello: ${audioLevel}%` : "Inattivo"}
                      </span>
                    </div>
                  </div>

                  {/* Automatic Speech Transcription (Whisper AI) */}
                  <div className={styles.transcriptionBox}>
                    <div className={styles.transcriptionHeader}>
                      <label
                        className={styles.transcriptionTitle}
                        id="transcription-label"
                      >
                        <TranscriptIcon size={18} />
                        Trascrizione vocale AI in tempo reale (Whisper)
                      </label>
                      {transcriptionEnabled ? (
                        <Badge
                          variant={
                            modelState === "ready" ? "accent" : "default"
                          }
                        >
                          {modelState === "ready"
                            ? "AI Pronta offline"
                            : "Attiva al via"}
                        </Badge>
                      ) : null}
                    </div>

                    <SegmentedControl<"enabled" | "disabled">
                      options={[
                        { value: "disabled", label: "Disattivata" },
                        { value: "enabled", label: "🎙️ Trascrivi Talk" },
                      ]}
                      value={transcriptionEnabled ? "enabled" : "disabled"}
                      onChange={(val) => {
                        const enabled = val === "enabled";
                        setTranscriptionEnabled(enabled);
                      }}
                      ariaLabel="Abilita o disabilita trascrizione automatica del talk"
                    />

                    <span className={styles.themeHint}>
                      {transcriptionEnabled
                        ? "Trascrive in tempo reale le frasi pronunciate dal relatore usando Whisper di OpenAI/HuggingFace via WebAssembly e Web Worker. Nessun dato inviato a server cloud."
                        : "Nessuna trascrizione automatica verrà eseguita."}
                    </span>

                    {transcriptionEnabled && (
                      <>
                        <SelectInput
                          id="transcription-language"
                          label="Lingua del parlato per Whisper"
                          value={transcriptionLanguage}
                          onChange={(e) =>
                            setTranscriptionLanguage(
                              e.target.value as "it" | "en",
                            )
                          }
                          options={[
                            { value: "it", label: "Italiano (it)" },
                            { value: "en", label: "Inglese (en)" },
                          ]}
                          hint="Scegli la lingua principale utilizzata durante la presentazione."
                        />

                        <div className={styles.modelCard}>
                          <div className={styles.modelCardHeader}>
                            <div className={styles.modelTitle}>
                              Modello: Xenova/whisper-base (ONNX locale)
                            </div>
                            {modelState === "ready" ? (
                              <Badge variant="accent">✓ Pronto in RAM</Badge>
                            ) : modelState === "loading" ? (
                              <Badge variant="accent">
                                {isModelCached ? "Caricamento RAM" : "Download"}{" "}
                                {modelProgress > 0 ? `${modelProgress}%` : ""}
                              </Badge>
                            ) : isModelCached ? (
                              <Badge variant="accent">✓ In Cache Locale</Badge>
                            ) : (
                              <Badge variant="default">Non in cache</Badge>
                            )}
                          </div>
                          <p className={styles.modelDesc}>
                            {modelState === "ready"
                              ? "Il modello Whisper è istanziato nella memoria WebAssembly e pronto per la trascrizione vocale in tempo reale (funziona al 100% offline)."
                              : isModelCached
                                ? "I file del modello (~150MB) sono già memorizzati nella cache locale del dispositivo. Puoi caricarli in memoria RAM per la trascrizione immediata, oppure verranno caricati automaticamente all'inizio della sessione."
                                : "Per consentire il funzionamento offline (es. sul palco o senza Wi-Fi), puoi scaricare e salvare nella cache locale del browser il modello Whisper prima del talk."}
                          </p>

                          {modelState === "loading" && (
                            <div className={styles.modelProgressTrack}>
                              <div
                                className={styles.modelProgressFill}
                                style={{
                                  width: `${Math.max(5, modelProgress)}%`,
                                }}
                              />
                            </div>
                          )}

                          {modelStatusText && (
                            <span className={styles.modelStatusMessage}>
                              {modelStatusText}
                            </span>
                          )}

                          <div className={styles.modelActions}>
                            <Button
                              variant={
                                modelState === "ready" ? "ghost" : "secondary"
                              }
                              size="md"
                              disabled={modelState === "loading"}
                              onClick={handlePreloadModel}
                              leftIcon={
                                isModelCached ? (
                                  <RefreshIcon size={14} />
                                ) : (
                                  <DownloadIcon size={14} />
                                )
                              }
                            >
                              {modelState === "ready"
                                ? "Ricarica / Verifica Modello"
                                : modelState === "loading"
                                  ? isModelCached
                                    ? `Caricamento RAM (${modelProgress}%)...`
                                    : `Download in corso (${modelProgress}%)...`
                                  : isModelCached
                                    ? "Carica Modello in Memoria (RAM)"
                                    : "Scarica e Salva Modello in Cache (~150MB)"}
                            </Button>

                            {isModelCached && modelState !== "loading" && (
                              <Button
                                variant="ghost"
                                size="md"
                                onClick={handleClearModelCache}
                                leftIcon={<TrashIcon size={14} />}
                                title="Elimina i file del modello Whisper dalla cache locale del browser"
                              >
                                Svuota Cache
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Video Recording Section */}
            <div className={styles.themeSection}>
              <div className={styles.micHeader}>
                <label className={styles.themeLabel} id="video-recording-label">
                  Registrazione video webcam
                </label>
                {isRecordingVideo ? (
                  <Badge variant="danger">● Registrazione in corso</Badge>
                ) : videoRecordingEnabled ? (
                  <Badge variant="accent">
                    {isTestingCamera
                      ? "Anteprima in corso"
                      : "Attiva su disco al via"}
                  </Badge>
                ) : null}
              </div>
              <SegmentedControl<"enabled" | "disabled">
                options={[
                  { value: "disabled", label: "Disabilitata" },
                  { value: "enabled", label: "📹 Abilitata" },
                ]}
                value={videoRecordingEnabled ? "enabled" : "disabled"}
                onChange={(val) => {
                  const enabled = val === "enabled";
                  setVideoRecordingEnabled(enabled);
                  if (enabled && cameraPermissionState === "prompt") {
                    requestCameraPermission();
                  }
                  if (!enabled) {
                    if (isTestingCamera) {
                      stopCameraTest();
                    }
                    if (isRecordingVideo) {
                      stopVideoRecording();
                    }
                  }
                }}
                ariaLabel="Abilita o disabilita registrazione video"
              />
              <span className={styles.themeHint}>
                {videoRecordingEnabled
                  ? isFileSystemAccessSupported()
                    ? "Registra il video dalla sorgente/webcam selezionata e lo scrive in streaming continuo su un file a scelta sul tuo disco via File System Access API. Zero consumo di RAM."
                    : "⚠️ Questo browser non supporta la File System Access API. Per salvare il video direttamente su disco senza saturare la memoria è necessario un browser desktop basato su Chromium (es. Chrome, Edge)."
                  : "Nessun video verrà registrato durante il talk."}
              </span>

              {isRecordingVideo && (
                <div className={styles.recordingActiveNotice}>
                  <div className={styles.recordingActiveInfo}>
                    <span className={styles.recordingActiveDot} />
                    <div className={styles.recordingActiveText}>
                      <strong>
                        Registrazione video webcam attiva su disco
                      </strong>
                      <span>
                        File in scrittura:{" "}
                        {videoRecordedFileName || "video.webm"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={stopVideoRecording}
                    leftIcon={<VideoOffIcon size={16} />}
                  >
                    Ferma Registrazione Video
                  </Button>
                </div>
              )}

              {videoRecordingEnabled && (
                <div className={styles.micSettingsWrapper}>
                  {!isFileSystemAccessSupported() && (
                    <div className={styles.permissionErrorBanner} role="alert">
                      <VideoOffIcon size={18} />
                      <span>
                        File System Access API non supportata su questo browser.
                        Usa Google Chrome o Microsoft Edge su desktop per lo
                        streaming del video su disco.
                      </span>
                    </div>
                  )}

                  {cameraPermissionState === "denied" && (
                    <div className={styles.permissionErrorBanner} role="alert">
                      <VideoOffIcon size={18} />
                      <span>
                        Accesso alla videocamera negato nel browser. Abilita il
                        permesso per selezionare e registrare la webcam.
                      </span>
                    </div>
                  )}

                  <div className={styles.permissionActionRow}>
                    <div className={styles.permissionStatusInfo}>
                      <span className={styles.permissionStatusLabel}>
                        Permesso Videocamera:
                      </span>
                      <Badge
                        variant={
                          cameraPermissionState === "granted"
                            ? "accent"
                            : cameraPermissionState === "denied"
                              ? "danger"
                              : "default"
                        }
                      >
                        {cameraPermissionState === "granted"
                          ? "✓ Concesso"
                          : cameraPermissionState === "denied"
                            ? "✗ Negato"
                            : "Da autorizzare"}
                      </Badge>
                    </div>
                    <Button
                      variant={
                        cameraPermissionState === "granted"
                          ? "ghost"
                          : "secondary"
                      }
                      size="md"
                      onClick={requestCameraPermission}
                      leftIcon={<VideoIcon size={16} />}
                      title="Richiedi o rinnova esplicitamente l'accesso alla webcam prima di avviare il talk"
                    >
                      {cameraPermissionState === "granted"
                        ? "Rinnova / Verifica Permesso"
                        : "Autorizza Videocamera Ora"}
                    </Button>
                  </div>

                  <SelectInput
                    id="talk-video-device"
                    label="Videocamera da utilizzare"
                    value={videoDeviceId}
                    onChange={(e) => {
                      setVideoDeviceId(e.target.value);
                      if (isTestingCamera) {
                        stopCameraTest();
                      }
                    }}
                    options={[
                      {
                        value: "default",
                        label: "Videocamera predefinita di sistema",
                      },
                      ...availableCameras
                        .filter((c) => c.deviceId !== "default")
                        .map((c) => ({
                          value: c.deviceId,
                          label: c.label,
                        })),
                    ]}
                    hint="Scegli la webcam o sorgente video esterna (es. camlink, capture card) da cui catturare lo speaker."
                  />

                  <div className={styles.videoPreviewWrapper}>
                    <Button
                      variant={isTestingCamera ? "primary" : "secondary"}
                      size="md"
                      onClick={startCameraTest}
                      leftIcon={
                        isTestingCamera ? (
                          <VideoOffIcon size={16} />
                        ) : (
                          <VideoIcon size={16} />
                        )
                      }
                    >
                      {isTestingCamera
                        ? "Chiudi Anteprima"
                        : "Testa Videocamera"}
                    </Button>

                    {isTestingCamera && (
                      <video
                        ref={handleVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={styles.videoPreview}
                        aria-label="Anteprima videocamera in tempo reale"
                        onLoadedMetadata={(e) => {
                          const el = e.currentTarget;
                          el.play().catch(() => {});
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.previewText} aria-live="polite">
              {durationPreview}
            </div>

            <div className={styles.actionsRow}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleSave(false)}
                disabled={!timeValue}
              >
                Salva configurazione
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleStart}
                disabled={!timeValue}
                leftIcon={<PlayIcon size={20} />}
              >
                Inizia Talk
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal: Reset session */}
      <Modal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        ariaLabel="Conferma reset slide e gioco"
      >
        <h2
          style={{
            fontSize: "1.8rem",
            marginBottom: "var(--space-4)",
            color: "var(--color-text)",
          }}
        >
          Resettare slide e gioco?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-8)",
            fontSize: "1.1rem",
          }}
        >
          Questa operazione imposterà la slide alla numero 1 (Titolo) e il gioco
          allo stato IDLE (KlippySaw). La configurazione dell'orario del talk
          rimarrà invariata.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-4)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmResetOpen(false)}
          >
            Annulla
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleResetConfirm}
            leftIcon={<RefreshIcon size={18} />}
          >
            Sì, resetta
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal: Past time */}
      <Modal
        isOpen={confirmPastOpen}
        onClose={() => setConfirmPastOpen(false)}
        ariaLabel="Conferma orario nel passato"
      >
        <h2
          style={{
            fontSize: "1.8rem",
            marginBottom: "var(--space-4)",
            color: "var(--color-warning)",
          }}
        >
          Orario già trascorso
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-8)",
            fontSize: "1.1rem",
          }}
        >
          L'orario <strong>{timeValue}</strong> risulta precedente all'ora
          attuale di oggi. Vuoi confermarlo comunque?
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-4)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmPastOpen(false)}
            leftIcon={<CloseIcon size={18} />}
          >
            Correggi orario
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              setConfirmPastOpen(false);
              if (pendingPastAction === "start") {
                await proceedStart();
              } else {
                handleSave(true);
              }
            }}
          >
            Conferma comunque
          </Button>
        </div>
      </Modal>

      {/* Modal: Automatic Model Preload before Talk */}
      <Modal
        isOpen={isAutoLoadingModel}
        onClose={() => {}}
        ariaLabel="Caricamento Modello Whisper"
      >
        <h2
          style={{
            fontSize: "1.6rem",
            marginBottom: "var(--space-3)",
            color: "var(--color-text)",
          }}
        >
          Preparazione Trascrizione Vocale (Whisper)
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-4)",
            fontSize: "0.95rem",
            lineHeight: 1.4,
          }}
        >
          {isModelCached
            ? "I file del modello sono presenti nella cache locale. Caricamento in corso nella memoria RAM WebAssembly prima dell'inizio del talk..."
            : "Download del modello Whisper ONNX (~150MB) e memorizzazione in cache locale per consentire la trascrizione..."}
        </p>

        <div
          className={styles.modelProgressTrack}
          style={{ marginBottom: "var(--space-3)" }}
        >
          <div
            className={styles.modelProgressFill}
            style={{ width: `${Math.max(5, autoLoadProgress)}%` }}
          />
        </div>

        {autoLoadStatusText && (
          <p
            className={styles.modelStatusMessage}
            style={{ marginBottom: "var(--space-6)" }}
          >
            {autoLoadStatusText}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              bypassAutoLoadRef.current = true;
              setIsAutoLoadingModel(false);
              const args = pendingStartArgsRef.current;
              if (args) {
                updateConfig(args.config);
                startTalk(args.config, args.videoFileHandle);
                navigate("/presentation");
              }
            }}
          >
            Inizia comunque senza attendere
          </Button>
        </div>
      </Modal>

      {/* Slide PDF Export Modal */}
      <SlidePdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
      />
    </div>
  );
};
