import { useState, useEffect, useCallback } from 'react';

export function useChat(userId: number) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Record<number, any[]>>({});
  
  useEffect(() => {
    if (!userId) return;
    
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ 
          type: 'authenticate', 
          userId 
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'authenticated':
            setConnected(true);
            break;
            
          case 'new_message':
            const message = data.message;
            setMessages(prev => ({
              ...prev,
              [message.conversationId]: [
                ...(prev[message.conversationId] || []),
                message
              ]
            }));
            break;
            
          case 'error':
            console.error('WebSocket error:', data.error);
            break;
        }
      };
      
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after delay
        setTimeout(connect, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(ws);
    };
    
    connect();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [userId]);
  
  const sendMessage = useCallback((conversationId: number, body: string, attachments?: any[]) => {
    if (!socket || !connected) return false;
    
    socket.send(JSON.stringify({
      type: 'chat_message',
      conversationId,
      body,
      attachments: attachments || []
    }));
    
    return true;
  }, [socket, connected]);
  
  const getMessages = useCallback((conversationId: number) => {
    return messages[conversationId] || [];
  }, [messages]);
  
  return {
    connected,
    sendMessage,
    getMessages,
    messages: Object.values(messages).flat()
  };
}