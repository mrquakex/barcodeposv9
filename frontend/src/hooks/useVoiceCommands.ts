import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface VoiceCommand {
  command: string;
  callback: () => void;
  keywords: string[];
}

export function useVoiceCommands(commands: VoiceCommand[]) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const commandsRef = useRef(commands);
  const isListeningRef = useRef(isListening);

  // Ref'leri güncelle
  useEffect(() => {
    commandsRef.current = commands;
    isListeningRef.current = isListening;
  });

  // Recognition'ı sadece mount'ta oluştur
  useEffect(() => {
    // Check browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'tr-TR'; // Türkçe

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log('Voice input:', transcript);

      // Ref'ten güncel komutları al
      for (const cmd of commandsRef.current) {
        const matched = cmd.keywords.some(keyword => 
          transcript.includes(keyword.toLowerCase())
        );

        if (matched) {
          toast.success(`Komut algılandı: ${cmd.command}`, {
            icon: '🎤',
            duration: 2000,
          });
          cmd.callback();
          break;
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('Ses algılanamadı');
      }
    };

    recognitionInstance.onend = () => {
      // Ref'ten güncel state'i al
      if (isListeningRef.current) {
        try {
          recognitionInstance.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []); // Sadece mount'ta çalış

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
        toast.success('Sesli komutlar aktif', {
          icon: '🎤',
          duration: 2000,
        });
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      toast('Sesli komutlar kapatıldı', {
        icon: '🔇',
        duration: 2000,
      });
    }
  }, [recognition, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    isSupported: !!recognition,
  };
}

