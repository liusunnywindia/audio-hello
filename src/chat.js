import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './chat.css';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [projectConfig, setProjectConfig] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  
  const messagesEndRef = useRef(null);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载项目模板
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/templates`);
      setTemplates(Object.entries(response.data.templates));
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // 添加用户消息
    const newUserMessage = { 
      type: 'user', 
      text: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        userId,
        message: userMessage
      });

      const aiMessage = { 
        type: 'assistant', 
        text: response.data.reply,
        action: response.data.action,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
       if (response.data.collectedData) {
        console.log(response.data.collectedData,'response.data.collectedData')
        setProjectConfig(response.data.collectedData);
      }

      // 如果配置完成
      if (response.data.action === 'complete' && response.data.config) {
        setProjectConfig(response.data.config);
        
        // 自动创建项目
        await createProject(response.data.config);
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: '抱歉，我遇到了问题。请稍后再试。',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (config) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/create-project`, {
        config
      });

      setMessages(prev => [...prev, {
        type: 'system',
        text: `✅ 项目创建成功！\n项目名称: ${response.data.projectName}\n路径: ${response.data.path}`,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('创建项目失败:', error);
      setMessages(prev => [...prev, {
        type: 'system',
        text: '❌ 项目创建失败，请检查配置或稍后再试。',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleQuickStart = (templateType, templateName) => {
    setInput(`我想创建一个${templateName}，类型是${templateType}`);
    setShowTemplates(false);
  };

  const handleExampleInput = () => {
    setInput('帮我创建一个React项目，用Vite构建，使用TypeScript和Tailwind CSS');
  };

  const resetConversation = () => {
    setMessages([]);
    setProjectConfig(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 智能项目创建助手</h1>
        <p>告诉我你的想法，我会引导你完成项目创建</p>
      </header>

      <div className="main-container">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>💡 快速开始</h3>
            <button 
              className="quick-start-btn"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? '隐藏模板' : '查看项目模板'}
            </button>
            
            {showTemplates && (
              <div className="templates-list">
                {templates.map(([type, template]) => (
                  <div 
                    key={type}
                    className="template-card"
                    onClick={() => handleQuickStart(type, template.name)}
                  >
                    <h4>{template.name}</h4>
                    <p>类型: {type}</p>
                    <p>需要: {template.requiredFields.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="example-btn"
              onClick={handleExampleInput}
            >
              使用示例
            </button>
          </div>

          {projectConfig && (
            <div className="sidebar-section">
              <h3>📋 当前配置</h3>
              <pre className="config-preview">
                {JSON.stringify(projectConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>👋 你好！我是项目创建助手</h2>
                <p>你可以对我说：</p>
                <ul className="suggestions">
                  <li>"帮我创建一个React项目"</li>
                  <li>"我想创建一个Node.js API"</li>
                  <li>"创建一个Vue应用"</li>
                  <li>"帮我初始化一个全栈项目"</li>
                </ul>
                <p>我会一步步引导你提供所需的信息。</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-type">
                      {msg.type === 'user' ? '👤 你' : 
                       msg.type === 'assistant' ? '🤖 助手' : '⚙️ 系统'}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="message assistant">
                <div className="message-header">
                  <span className="message-type">🤖 助手</span>
                </div>
                <div className="message-content loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的需求，例如：帮我创建一个React项目..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? '发送中...' : '发送'}
            </button>
            <button 
              type="button" 
              onClick={resetConversation}
              className="reset-btn"
            >
              重置对话
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;