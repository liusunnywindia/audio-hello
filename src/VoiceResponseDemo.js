import React, { useState, useEffect, useRef } from 'react';
import { fetchEventSource } from "@microsoft/fetch-event-source";

// 语音播放控制模块
const SpeechController = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);
  const speechQueueRef = useRef([]);

  // 初始化语音合成
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // 默认选择第一个中文语音或第一个语音
        const chineseVoice = availableVoices.find(v => v.lang.includes('zh'));
        setSelectedVoice(chineseVoice || availableVoices[0]);
      }
    };

    loadVoices();
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  // 分析文本并计算情感参数
  const analyzeTextForEmotion = (text) => {
    let rate = 1.2;
    let pitch = 1.0;
    let volume = 1.0;
    
    // 检查是否有感叹号
    if (text.includes('！') || text.includes('!')) {
      rate = 1.1; // 稍微快一点表达兴奋
      pitch = 1.2; // 提高音调表达强调
      volume = 1.1; // 稍微提高音量
    }
    
    // 检查是否有问号
    if (text.includes('？') || text.includes('?')) {
      pitch = 1.15; // 提高结尾音调表达疑问
    }
    
    // 检查是否有省略号
    if (text.includes('...') || text.includes('……')) {
      rate = 0.9; // 放慢语速表达沉思
      pitch = 0.9; // 降低音调
      volume = 0.9; // 降低音量
    }
    
    // 检查积极情感词汇
    const positiveWords = ['好', '棒', '优秀', '完美', '喜欢', '爱', '开心', '快乐', '美好', '赞', '厉害', '赞'];
    const hasPositive = positiveWords.some(word => text.includes(word));
    if (hasPositive) {
      pitch = 1.1; // 提高音调表达积极情感
    }
    
    // 检查消极情感词汇
    const negativeWords = ['难过', '伤心', '痛苦', '讨厌', '恨', '糟糕', '不好', '差', '悲', '愁', '怕', '担心'];
    const hasNegative = negativeWords.some(word => text.includes(word));
    if (hasNegative) {
      rate = 0.95; // 稍微放慢语速
      pitch = 0.9; // 降低音调表达消极情感
    }
    
    // 限制参数范围
    rate = Math.max(0.5, Math.min(2.0, rate));
    pitch = Math.max(0.5, Math.min(2.0, pitch));
    volume = Math.max(0.5, Math.min(1.0, volume));
    
    return { rate, pitch, volume };
  };
  
  // 播放文本
  const speakText = (text, defaultRate = 1.2, defaultPitch = 1.0, defaultVolume = 1.0) => {
    if (!text || !text.trim()) return;

    return new Promise((resolve) => {
      // 分析文本情感并调整参数
      const emotionParams = analyzeTextForEmotion(text);
      
      // 如果提供了默认参数，则使用默认参数作为基础
      const rate = emotionParams.rate;
      const pitch = emotionParams.pitch;
      const volume = emotionParams.volume;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        resolve(true);
      };

      utterance.onerror = (event) => {
        console.error('语音合成错误:', event);
        setIsPlaying(false);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
      utteranceRef.current = utterance;
    });
  };

  // 暂停播放
  const pause = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
  };

  // 继续播放
  const resume = () => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
  };

  // 停止播放
  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    speechQueueRef.current = [];
  };

  return {
    speakText,
    pause,
    resume,
    stop,
    isPlaying,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
};

// 流式文本接收模块
const StreamReceiver = ({ onMessage, onStreamEnd, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = "http://localhost:3001/api";

  const sendRequest = async (inputText) => {
    if (!inputText) return;

    setIsLoading(true);
    
    try {
      await fetchEventSource(`${API_BASE_URL}/tiwen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputText }),
        async onopen(response) {
          if (response.ok) {
            console.log("连接建立成功");
          }
        },
        onmessage(msg) {
          if (msg.data === "[DONE]") {
            onStreamEnd();
            setIsLoading(false);
            return;
          }

          try {
            const json = JSON.parse(msg.data);
            const delta = json.choices[0].delta?.content;
            if (delta) {
              onMessage(delta); // 实时传递新接收到的文本
            }
          } catch (e) {
            console.error("解析出错", e);
            onError && onError(e);
          }
        },
        onclose() {
          setIsLoading(false);
        },
        onerror(err) {
          console.log("出错了", err);
          onError && onError(err);
          setIsLoading(false);
          throw err;
        },
      });
    } catch (error) {
      console.error("请求失败:", error);
      onError && onError(error);
      setIsLoading(false);
    }
  };

  return { sendRequest, isLoading };
};

// 文本缓冲管理模块
const TextBufferManager = ({ chunkSize = 20, sentenceEndings = ['。', '！', '？', '.', '!', '?', '\n'] }) => {
  const [textQueue, setTextQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreamEnd, setIsStreamEnd] = useState(false);
  const bufferRef = useRef('');
  const playQueueRef = useRef([]);
  const playInProgressRef = useRef(false);

  // 添加文本到缓冲区
  const addToBuffer = (text, onQueueUpdate) => {
    bufferRef.current += text;
    
    // 检查是否达到句子结束符或批量播放的条件
    const shouldProcess = isStreamEnd || 
                  sentenceEndings.some(ending => bufferRef.current.includes(ending)) ||
                  bufferRef.current.length >= chunkSize;
    
    if (shouldProcess) {
      // 查找句子结束符位置
      let splitIndex = -1;
      for (const ending of sentenceEndings) {
        const lastIndex = bufferRef.current.lastIndexOf(ending);
        if (lastIndex !== -1 && lastIndex > splitIndex) {
          splitIndex = lastIndex + 1; // 包含结束符
        }
      }
      
      if (splitIndex > 0) {
        // 提取完整句子部分
        const sentencePart = bufferRef.current.substring(0, splitIndex);
        playQueueRef.current.push(sentencePart);
        bufferRef.current = bufferRef.current.substring(splitIndex);
        
        // 触发播放队列更新
        if (onQueueUpdate && typeof onQueueUpdate === 'function') {
          onQueueUpdate();
        }
      } else if (bufferRef.current.length >= chunkSize) {
        // 如果没有找到句子结束符但达到了大小限制，则推送全部内容
        playQueueRef.current.push(bufferRef.current);
        bufferRef.current = '';
        
        // 触发播放队列更新
        if (onQueueUpdate && typeof onQueueUpdate === 'function') {
          onQueueUpdate();
        }
      }
    }
  };

  // 处理播放队列
  const processPlayQueue = (speechController) => {
    if (playQueueRef.current.length === 0 || !speechController || playInProgressRef.current) {
      return;
    }

    playInProgressRef.current = true;
    
    // 合并队列中的文本以提高流畅性
    const combinedText = playQueueRef.current.join(' ');
    playQueueRef.current = []; // 清空队列
    
    // 播放合并后的文本
    speechController.speakText(combinedText).then(() => {
      // 检查是否还有剩余内容
      if (isStreamEnd && bufferRef.current) {
        speechController.speakText(bufferRef.current);
        bufferRef.current = '';
      }
      playInProgressRef.current = false;
    });
  };

  // 标记流结束
  const markStreamEnd = (onQueueUpdate) => {
    setIsStreamEnd(true);
    // 如果缓冲区还有内容，添加到播放队列
    if (bufferRef.current) {
      playQueueRef.current.push(bufferRef.current);
      bufferRef.current = '';
      // 立即处理剩余内容
      if (onQueueUpdate && typeof onQueueUpdate === 'function') {
        onQueueUpdate();
      }
    }
  };

  // 重置缓冲区
  const reset = () => {
    bufferRef.current = '';
    playQueueRef.current = [];
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsStreamEnd(false);
    playInProgressRef.current = false;
  };

  return {
    addToBuffer,
    processPlayQueue,
    markStreamEnd,
    reset,
    textQueue,
    isStreamEnd,
  };
};

// 主组件
const VoiceResponseDemo = () => {
  const [input, setInput] = useState("");
  const [fullText, setFullText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.2);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState(null);
  
  const speechController = SpeechController();
  const bufferManager = TextBufferManager({ chunkSize: 20 });
  const streamReceiver = StreamReceiver({
    onMessage: (delta) => {
      setFullText(prev => prev + delta);
      setDisplayedText(prev => prev + delta);
      bufferManager.addToBuffer(delta, () => {
        bufferManager.processPlayQueue(speechController);
      });
    },
    onStreamEnd: () => {
      setIsReceiving(false);
      bufferManager.markStreamEnd(() => {
        bufferManager.processPlayQueue(speechController);
      });
    },
    onError: (err) => {
      setError(err.message || '发生错误');
      setIsReceiving(false);
    }
  });

  // 处理发送请求
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setError(null);
    setIsReceiving(true);
    setFullText("");
    setDisplayedText("");
    bufferManager.reset();
    
    // 开始流式接收
    await streamReceiver.sendRequest(input);
  };

  // 暂停播放
  const handlePause = () => {
    speechController.pause();
    setIsPaused(true);
  };

  // 继续播放
  const handleResume = () => {
    speechController.resume();
    setIsPaused(false);
  };

  // 停止播放
  const handleStop = () => {
    speechController.stop();
    setIsPaused(false);
    bufferManager.reset();
  };

  // 重置所有状态
  const resetAll = () => {
    handleStop();
    setInput("");
    setFullText("");
    setDisplayedText("");
    setError(null);
    setIsReceiving(false);
    setIsPaused(false);
  };

  // 当播放状态变化时，更新播放队列处理
  useEffect(() => {
    if (!speechController.isPlaying && !isPaused) {
      bufferManager.processPlayQueue(speechController);
    }
  }, [speechController.isPlaying, isPaused]);

  return (
    <div style={styles.container}>
      <h2>流式语音回复 Demo</h2>
      
      {error && (
        <div style={styles.error}>
          ⚠️ 错误: {error}
        </div>
      )}
      
      <div style={styles.inputContainer}>
        <label htmlFor="userInput">请输入问题:</label>
        <input
          id="userInput"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          disabled={isReceiving}
          style={styles.input}
        />
        <button
          onClick={handleSend}
          disabled={isReceiving || !input.trim()}
          style={{...styles.button, ...styles.sendButton}}
        >
          {isReceiving ? "发送中..." : "发送"}
        </button>
      </div>

      <div style={styles.controls}>
        <button
          onClick={handlePause}
          disabled={!speechController.isPlaying}
          style={{...styles.button, ...styles.pauseButton}}
        >
          ⏸️ 暂停
        </button>
        
        <button
          onClick={handleResume}
          disabled={speechController.isPlaying || !isPaused}
          style={{...styles.button, ...styles.resumeButton}}
        >
          ▶️ 继续
        </button>
        
        <button
          onClick={handleStop}
          style={{...styles.button, ...styles.stopButton}}
        >
          ⏹️ 停止
        </button>
        
        <button
          onClick={resetAll}
          style={{...styles.button, ...styles.resetButton}}
        >
          🔄 重置
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
            onChange={(e) => setRate(parseFloat(e.target.value))}
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
            onChange={(e) => setPitch(parseFloat(e.target.value))}
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
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span>{Math.round(volume * 100)}%</span>
        </div>
        
        {speechController.voices.length > 0 && (
          <div style={styles.settingRow}>
            <label>语音: </label>
            <select
              value={speechController.selectedVoice ? speechController.selectedVoice.name : ''}
              onChange={(e) => {
                const selected = speechController.voices.find(v => v.name === e.target.value);
                speechController.setSelectedVoice(selected);
              }}
              style={styles.select}
            >
              {speechController.voices.map((v, index) => (
                <option key={index} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={styles.textDisplayContainer}>
        <h3>流式文本显示:</h3>
        <div style={styles.textDisplay}>
          {displayedText || <span style={styles.placeholder}>等待接收文本...</span>}
        </div>
      </div>

      <div style={styles.status}>
        <div>状态: {isReceiving ? '🔄 接收中' : '⏸️ 等待中'}</div>
        <div>语音播放: {speechController.isPlaying ? '🔊 播放中' : isPaused ? '⏸️ 已暂停' : '🔇 未播放'}</div>
        <div>已接收字符: {fullText.length}</div>
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
  input: {
    width: '70%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginRight: '10px'
  },
  button: {
    padding: '10px 15px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    margin: '0 5px'
  },
  sendButton: {
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
  stopButton: {
    backgroundColor: '#f44336',
    color: 'white',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  resetButton: {
    backgroundColor: '#9c27b0',
    color: 'white',
    '&:hover': {
      backgroundColor: '#7b1fa2'
    }
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
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
  textDisplayContainer: {
    marginBottom: '20px'
  },
  textDisplay: {
    minHeight: '150px',
    padding: '15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflow: 'auto'
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic'
  },
  status: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  error: {
    color: '#d32f2f',
    padding: '10px',
    backgroundColor: '#fde7e9',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  }
};

export default VoiceResponseDemo;