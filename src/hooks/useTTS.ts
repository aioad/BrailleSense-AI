import { useCallback, useRef, useState } from 'react';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export function useTTS(defaultOptions: TTSOptions = {}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    const text = queueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = defaultOptions.rate ?? 0.9;
    utterance.pitch = defaultOptions.pitch ?? 1;
    utterance.volume = defaultOptions.volume ?? 1;
    utterance.lang = defaultOptions.lang ?? 'en-US';

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      processingRef.current = false;
      processQueue();
    };
    utterance.onerror = () => {
      processingRef.current = false;
      processQueue();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [defaultOptions.rate, defaultOptions.pitch, defaultOptions.volume, defaultOptions.lang]);

  const speak = useCallback((text: string, priority = false) => {
    if (!supported || !text.trim()) return;
    if (priority) {
      window.speechSynthesis.cancel();
      queueRef.current = [text];
      processingRef.current = false;
    } else {
      queueRef.current.push(text);
    }
    processQueue();
  }, [supported, processQueue]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    processingRef.current = false;
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
