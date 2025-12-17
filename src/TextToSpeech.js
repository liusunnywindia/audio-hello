import React, { useState } from 'react';

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);

  // 初始化语音合成
  React.useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        // 默认选择第一个中文语音或第一个语音
        const chineseVoice = availableVoices.find(v => v.lang.includes('zh'));
        setVoice(chineseVoice || availableVoices[0]);
      }
    };

    // 加载语音
    loadVoices();
    
    // 有些浏览器需要事件触发后才能获取到语音列表
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) {
      alert('请输入要转换为语音的文字');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语音参数
    utterance.rate = parseFloat(rate);
    utterance.pitch = parseFloat(pitch);
    utterance.volume = parseFloat(volume);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
      setIsSpeaking(false);
      alert('语音合成出错，请重试');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsSpeaking(false);
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setIsSpeaking(true);
  };

  return (
    <div style={styles.container}>
      <h2>文字转语音</h2>
      
      <div style={styles.inputContainer}>
        <label htmlFor="textInput">输入文字:</label>
        <textarea
          id="textInput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
          placeholder="请输入要转换为语音的文字内容..."
          rows={6}
        />
      </div>

      <div style={styles.controls}>
        <button
          onClick={handleSpeak}
          style={{...styles.button, ...styles.speakButton}}
          disabled={isSpeaking && window.speechSynthesis.speaking}
        >
          {isSpeaking ? '🔊 播放中...' : '▶️ 播放'}
        </button>
        
        <button
          onClick={handlePause}
          style={{...styles.button, ...styles.pauseButton}}
          disabled={!isSpeaking}
        >
          ⏸️ 暂停
        </button>
        
        <button
          onClick={handleResume}
          style={{...styles.button, ...styles.resumeButton}}
          disabled={isSpeaking}
        >
          ▶️ 继续
        </button>
        
        <button
          onClick={handleStop}
          style={{...styles.button, ...styles.stopButton}}
        >
          ⏹️ 停止
        </button>
      </div>

      <div style={styles.settings}>
        <h3>语音设置</h3>
        
        <div style={styles.settingRow}>
          <label>语速 ({rate}): </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={styles.slider}
          />
          <span>{rate}x</span>
        </div>
        
        <div style={styles.settingRow}>
          <label>音调 ({pitch}): </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            style={styles.slider}
          />
          <span>{pitch}</span>
        </div>
        
        <div style={styles.settingRow}>
          <label>音量 ({volume}): </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={styles.slider}
          />
          <span>{Math.round(volume * 100)}%</span>
        </div>
        
        {voices.length > 0 && (
          <div style={styles.settingRow}>
            <label>语音: </label>
            <select
              value={voice ? voice.name : ''}
              onChange={(e) => {
                const selectedVoice = voices.find(v => v.name === e.target.value);
                setVoice(selectedVoice);
              }}
              style={styles.select}
            >
              {voices.map((v, index) => (
                <option key={index} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={styles.info}>
        <h4>使用说明:</h4>
        <ul>
          <li>在文本框中输入要转换为语音的文字</li>
          <li>点击"播放"按钮开始朗读</li>
          <li>可通过滑块调整语速、音调和音量</li>
          <li>可从下拉菜单选择不同的语音</li>
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
  inputContainer: {
    marginBottom: '20px'
  },
  textarea: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    resize: 'vertical',
    marginTop: '10px'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  speakButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#45a049'
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    }
  },
  pauseButton: {
    backgroundColor: '#ff9800',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#e68900'
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    }
  },
  resumeButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    '&:hover:not(:disabled)': {
      backgroundColor: '#0b7dda'
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    }
  },
  stopButton: {
    backgroundColor: '#f44336',
    color: 'white',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  settings: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  slider: {
    flex: 1,
    minWidth: '150px'
  },
  select: {
    padding: '8px',
    fontSize: '16px',
    borderRadius: '5px',
    minWidth: '200px'
  },
  info: {
    padding: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '5px'
  }
};

export default TextToSpeech;