import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  attachments?: any;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export function useChat(conversationId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch messages for the conversation
  const { data: messagesData } = useQuery<{ messages: Message[] }>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId && !!user,
  });

  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages.reverse()); // Show oldest first
    }
  }, [messagesData]);

  // WebSocket connection
  useEffect(() => {
    if (!user || !conversationId) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        
        // Authenticate
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'authenticated':
              console.log('WebSocket authenticated');
              break;
              
            case 'new_message':
              if (data.message.conversationId === conversationId) {
                setMessages(prev => [...prev, data.message]);
                queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', data.error);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user, conversationId, queryClient]);

  const sendMessage = async (body: string, attachments?: any) => {
    if (!socket || !isConnected || !conversationId) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const messageData = {
        type: 'chat_message',
        conversationId,
        body,
        attachments
      };

      socket.send(JSON.stringify(messageData));
      
      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message_sent') {
            socket.removeEventListener('message', handleResponse);
            resolve(data.message);
          } else if (data.type === 'error') {
            socket.removeEventListener('message', handleResponse);
            reject(new Error(data.error));
          }
        } catch (error) {
          reject(error);
        }
      };

      socket.addEventListener('message', handleResponse);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        socket.removeEventListener('message', handleResponse);
        reject(new Error('Message send timeout'));
      }, 10000);
    });
  };

  return {
    messages,
    sendMessage,
    isConnected,
    socket
  };
}