// App.js
import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import TextToSpeech from './TextToSpeech';

const App = () => {
  const [activeTab, setActiveTab] = useState('speechToText');

  return (
    <div style={appStyles.container}>
      <h1 style={appStyles.title}>语音处理工具</h1>
      
      <div style={appStyles.tabContainer}>
        <button
          onClick={() => setActiveTab('speechToText')}
          style={{
            ...appStyles.tabButton,
            ...(activeTab === 'speechToText' ? appStyles.activeTab : {})
          }}
        >
          语音转文字
        </button>
        <button
          onClick={() => setActiveTab('textToSpeech')}
          style={{
            ...appStyles.tabButton,
            ...(activeTab === 'textToSpeech' ? appStyles.activeTab : {})
          }}
        >
          文字转语音
        </button>
      </div>

      <div style={appStyles.content}>
        {activeTab === 'speechToText' ? <SpeechToTextComponent /> : <TextToSpeech />}
      </div>
    </div>
  );
};

const SpeechToTextComponent = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [language, setLanguage] = useState('zh-CN');

  if (!browserSupportsSpeechRecognition) {
    return <div>您的浏览器不支持语音识别功能</div>;
  }

  return (
    <div style={speechToTextStyles.container}>
      <h2>语音转文字</h2>
      
      <div style={speechToTextStyles.status}>
        状态: {listening ? '🎤 正在录音...' : '⏸️ 已停止'}
      </div>

      <div style={speechToTextStyles.controls}>
        <button
          onClick={() => SpeechRecognition.startListening({ 
            language: language,
            continuous: true 
          })}
          style={{...speechToTextStyles.button, ...speechToTextStyles.startButton}}
          disabled={listening}
        >
          开始录音
        </button>
        
        <button
          onClick={SpeechRecognition.stopListening}
          style={{...speechToTextStyles.button, ...speechToTextStyles.stopButton}}
          disabled={!listening}
        >
          停止录音
        </button>
        
        <button
          onClick={resetTranscript}
          style={{...speechToTextStyles.button, ...speechToTextStyles.resetButton}}
        >
          清除文字
        </button>
      </div>

      <div style={speechToTextStyles.languageSelector}>
        <label>选择语言: </label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={speechToTextStyles.select}
        >
          <option value="zh-CN">中文（普通话）</option>
          <option value="en-US">英语（美国）</option>
          <option value="ja-JP">日语</option>
          <option value="ko-KR">韩语</option>
          <option value="fr-FR">法语</option>
        </select>
      </div>

      <div style={speechToTextStyles.transcriptContainer}>
        <h3>识别结果：</h3>
        <textarea
          value={transcript}
          readOnly
          style={speechToTextStyles.textarea}
          placeholder="语音识别结果将显示在这里..."
        />
      </div>

      <div style={speechToTextStyles.stats}>
        字数: {transcript.length} | 词数: {transcript.split(' ').filter(word => word.length > 0).length}
      </div>
    </div>
  );
};

const appStyles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #eee'
  },
  tabButton: {
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s'
  },
  activeTab: {
    borderBottom: '3px solid #2196F3',
    fontWeight: 'bold',
    color: '#2196F3'
  },
  content: {
    minHeight: '500px'
  }
};

const speechToTextStyles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  status: {
    fontSize: '18px',
    margin: '20px 0',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    '&:hover': {
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
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    }
  },
  resetButton: {
    backgroundColor: '#ff9800',
    color: 'white',
    '&:hover': {
      backgroundColor: '#e68900'
    }
  },
  languageSelector: {
    margin: '20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    padding: '8px',
    fontSize: '16px',
    borderRadius: '5px'
  },
  transcriptContainer: {
    marginTop: '20px'
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    resize: 'vertical',
    marginTop: '10px'
  },
  stats: {
    marginTop: '10px',
    color: '#666',
    fontSize: '14px'
  }
};

export default App;