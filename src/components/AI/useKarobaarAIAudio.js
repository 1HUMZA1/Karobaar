import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useKarobaarAIAudio
 * Real Web Audio API & Speech Recognition / Synthesis Hook for Karobaar AI
 * 
 * - Only requests microphone after explicit user interaction
 * - Calculates real-time RMS audio levels (0.0 to 1.0) via AnalyserNode
 * - Provides live speech-to-text transcripts with interim feedback
 * - Manages speech synthesis with natural cadence and clean state transitions
 * - Ensures 100% resource cleanup on unmount
 */
export const useKarobaarAIAudio = ({ onFinalTranscript } = {}) => {
  const [visualizerState, setVisualizerState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking' | 'done' | 'error'
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);

  // Audio Context & Stream Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check Speech Recognition Support
  useEffect(() => {
    isMountedRef.current = true;
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasSpeechRecognition && !hasMediaDevices) {
      setIsVoiceSupported(false);
    }

    return () => {
      isMountedRef.current = false;
      cleanupAudio();
    };
  }, []);

  // Cleanup all audio resources safely
  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      micStreamRef.current = null;
    }

    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (e) {}
      analyserRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }

    if (isMountedRef.current) {
      setAudioLevel(0);
      setIsListening(false);
    }
  }, []);

  // Start Real Microphone Capture with Live Audio Analyzer
  const startListening = useCallback(async () => {
    setErrorMessage('');
    setInterimTranscript('');

    // Cancel speech synthesis if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    try {
      // 1. Request microphone permission explicitly
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio capture is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      micStreamRef.current = stream;

      // 2. Set up Web Audio API AnalyserNode for real audio volume measurement
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioMeter = () => {
          if (!analyserRef.current || !isMountedRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average energy / RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0.0 - 1.0 with a sensible sensitivity floor
          const normalized = Math.min(1.0, Math.max(0.0, (avg - 10) / 75));

          setAudioLevel(prev => prev * 0.4 + normalized * 0.6); // smooth lerp
          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };

        updateAudioMeter();
      }

      // 3. Set up SpeechRecognition
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          if (isMountedRef.current) {
            setIsListening(true);
            setVisualizerState('listening');
          }
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (isMountedRef.current) {
            setInterimTranscript(interim || final);
          }

          if (final && final.trim()) {
            const cleanFinal = final.trim();
            stopListening();
            if (onFinalTranscript) {
              onFinalTranscript(cleanFinal);
            }
          }
        };

        recognition.onerror = (e) => {
          console.warn('[Karobaar AI Speech Error]:', e.error);
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
            setVisualizerState('error');
          }
          stopListening();
        };

        recognition.onend = () => {
          if (isMountedRef.current && isListening) {
            stopListening();
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback when SpeechRecognition is unavailable
        setIsListening(true);
        setVisualizerState('listening');
      }

    } catch (err) {
      console.error('[Audio Capture Error]:', err);
      cleanupAudio();
      if (isMountedRef.current) {
        setErrorMessage(err.message || 'Could not access microphone.');
        setVisualizerState('error');
        setTimeout(() => {
          if (isMountedRef.current && visualizerState === 'error') {
            setVisualizerState('idle');
          }
        }, 3500);
      }
    }
  }, [cleanupAudio, onFinalTranscript, visualizerState, isListening]);

  // Stop Listening cleanly
  const stopListening = useCallback(() => {
    cleanupAudio();
    if (isMountedRef.current) {
      setIsListening(false);
      if (visualizerState === 'listening') {
        setVisualizerState('idle');
      }
    }
  }, [cleanupAudio, visualizerState]);

  // Toggle Listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Speech Output Helper with Natural Human Cadence
  const speakText = useCallback((text, onFinish) => {
    if (!('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return;
    }

    stopListening();
    window.speechSynthesis.cancel();

    // Clean markdown for clear speech
    const clean = String(text || '')
      .replace(/```[\s\S]*?```/g, 'Code block output.')
      .replace(/[*#_`]/g, '')
      .replace(/•/g, '')
      .replace(/\|.*?\|/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const isHindi = /[\u0900-\u097F]/.test(clean) || /(namaste|dhanyawad|aapka|shukriya|kar diya|kardo|bikri|dukan|hisab)/i.test(clean);

    if (isHindi) {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    setIsSpeaking(true);
    setVisualizerState('speaking');

    const handleSpeechEnd = () => {
      if (isMountedRef.current) {
        setIsSpeaking(false);
        setVisualizerState('done');
        setTimeout(() => {
          if (isMountedRef.current) {
            setVisualizerState('idle');
          }
        }, 1600);
      }
      if (onFinish) onFinish();
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

    // Safety timeout in case speech engine stalls
    const maxDuration = Math.min(12000, Math.max(2000, clean.length * 75));
    const timer = setTimeout(() => {
      if (isMountedRef.current && isSpeaking) {
        handleSpeechEnd();
      }
    }, maxDuration);

    utterance.onstart = () => {
      try { window.speechSynthesis.resume(); } catch (e) {}
    };

    window.speechSynthesis.speak(utterance);

    return () => clearTimeout(timer);
  }, [stopListening, isSpeaking]);

  // Stop Speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (isMountedRef.current) {
      setIsSpeaking(false);
      setVisualizerState('idle');
    }
  }, []);

  return {
    visualizerState,
    setVisualizerState,
    audioLevel,
    isListening,
    isSpeaking,
    interimTranscript,
    errorMessage,
    isVoiceSupported,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking
  };
};

export default useKarobaarAIAudio;
