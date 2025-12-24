import React, { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

function Steam() {
  const [input, setInput] = useState("");
  const [content, setContent] = useState(""); // 用于显示AI回答的内容
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = "http://localhost:3001/api";

  const handleSend = async () => {
    if (!input) return;
    
    setIsLoading(true);
    setContent(""); // 开启新对话时清空旧内容

    const url = `${API_BASE_URL}/tiwen`;
    
    await fetchEventSource(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input }),
     async onopen(response) {
        if (response.ok) {
          console.log("连接建立成功");
        }
      },
      onmessage(msg) {
        console.log(msg,'msg')
        // DeepSeek 返回的是 SSE 标准格式，数据在 msg.data 中
        if (msg.data === "[DONE]") {
          setIsLoading(false);
          return;
        }
        
        try {
          const json = JSON.parse(msg.data);
          const delta = json.choices[0].delta?.content;
          if (delta) {
            setContent((prev) => prev + delta); // 实时追加文字
          }
        } catch (e) {
          console.error("解析出错", e);
        }
      },
      onclose() {
        setIsLoading(false);
      },
      onerror(err) {
        console.log("出错了", err);
        setIsLoading(false);
        throw err;
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="问问客服..."
        disabled={isLoading}
      />
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? "回复中..." : "发送"}
      </button>

      {/* 显示区域 */}
      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap", border: "1px solid #ccc", padding: "10px" }}>
        <strong>回复：</strong>
        {content}
      </div>
    </div>
  );
}

export default Steam;