// NativeSpeechToText.jsx
import React, { useState, useEffect, useRef } from 'react';

const NativeSpeechToText = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('zh-CN');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 检查浏览器是否支持
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // 初始化语音识别
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript + (interimTranscript ? ` [${interimTranscript}]` : ''));
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      setError(`错误: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('无法启动语音识别，请确保已授予麦克风权限');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <div style={styles.container}>
        <h2>语音转文字</h2>
        <div style={styles.error}>
          您的浏览器不支持语音识别功能。请使用最新版本的Chrome、Edge或Safari浏览器。
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>语音转文字 (原生API)</h2>
      
      {error && (
        <div style={styles.errorAlert}>
          ⚠️ {error}
        </div>
      )}
      
      <div style={styles.status}>
        状态: {isListening ? '🎤 正在录音...' : '⏸️ 已停止'}
      </div>

      <div style={styles.controls}>
        <button
          onClick={startListening}
          style={{...styles.button, ...styles.startButton}}
          disabled={isListening}
        >
          开始录音
        </button>
        
        <button
          onClick={stopListening}
          style={{...styles.button, ...styles.stopButton}}
          disabled={!isListening}
        >
          停止录音
        </button>
        
        <button
          onClick={clearTranscript}
          style={{...styles.button, ...styles.resetButton}}
        >
          清除文字
        </button>
      </div>

      <div style={styles.languageSelector}>
        <label>选择语言: </label>
        <select 
          value={language} 
          onChange={(e) => {
            setLanguage(e.target.value);
            clearTranscript();
          }}
          style={styles.select}
          disabled={isListening}
        >
          <option value="zh-CN">中文（普通话）</option>
          <option value="en-US">英语（美国）</option>
          <option value="en-GB">英语（英国）</option>
          <option value="ja-JP">日语</option>
          <option value="ko-KR">韩语</option>
        </select>
      </div>

      <div style={styles.transcriptContainer}>
        <h3>识别结果：</h3>
        <div style={styles.textDisplay}>
          {transcript || '语音识别结果将显示在这里...'}
        </div>
      </div>

      <div style={styles.instructions}>
        <h4>使用说明：</h4>
        <ul>
          <li>点击"开始录音"按钮开始语音识别</li>
          <li>请使用清晰的普通话发音</li>
          <li>在安静的环境下使用效果更佳</li>
          <li>确保已授予浏览器麦克风权限</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  error: {
    color: '#f44336',
    padding: '20px',
    backgroundColor: '#ffebee',
    borderRadius: '5px',
    margin: '20px 0'
  },
  errorAlert: {
    color: '#d32f2f',
    padding: '10px',
    backgroundColor: '#fde7e9',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  },
  status: {
    fontSize: '18px',
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '5px',
    fontWeight: 'bold'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontWeight: 'bold'
  },
  startButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#0b7dda'
    },
    '&:disabled': {
      backgroundColor: '#bbdefb',
      cursor: 'not-allowed'
    }
  },
  stopButton: {
    backgroundColor: '#ff5722',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#e64a19'
    },
    '&:disabled': {
      backgroundColor: '#ffccbc',
      cursor: 'not-allowed'
    }
  },
  resetButton: {
    backgroundColor: '#9c27b0',
    color: 'white',
    '&:hover': {
      backgroundColor: '#7b1fa2'
    }
  },
  languageSelector: {
    margin: '20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  transcriptContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    border: '1px solid #eee'
  },
  textDisplay: {
    minHeight: '200px',
    padding: '20px',
    fontSize: '16px',
    lineHeight: '1.6',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  instructions: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f0f7ff',
    borderRadius: '5px'
  }
};

export default NativeSpeechToText;