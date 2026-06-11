import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../store/authStore';

let stompClient = null;
const activeSubscriptions = new Map();

export const connectWebSocket = (onMessageReceived) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Connect using the app's current origin (handled by Vite proxy in dev, Nginx in prod)
  const socketUrl = `${window.location.origin}/api/ws`;
  const socket = new SockJS(socketUrl);
  
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: () => {},  // suppress STOMP debug logs in production
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = function (frame) {
    const user = useAuthStore.getState().user;
    
    if (user?.role === 'ADMIN') {
      stompClient.subscribe('/topic/admin/notifications', (message) => {
        if (onMessageReceived) onMessageReceived(JSON.parse(message.body));
      });
    }

    if (user?.id) {
      stompClient.subscribe(`/topic/user/${user.id}/notifications`, (message) => {
        if (onMessageReceived) onMessageReceived(JSON.parse(message.body));
      });
    }

    // Resubscribe or subscribe to any registered dynamic topics
    activeSubscriptions.forEach((val, topic) => {
      const callback = typeof val === 'function' ? val : val.callback;
      const sub = stompClient.subscribe(topic, (message) => {
        callback(JSON.parse(message.body));
      });
      activeSubscriptions.set(topic, { sub, callback });
    });
  };

  stompClient.onStompError = function (frame) {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const subscribeTopic = (topic, callback) => {
  if (stompClient && stompClient.connected) {
    const sub = stompClient.subscribe(topic, (message) => {
      callback(JSON.parse(message.body));
    });
    activeSubscriptions.set(topic, { sub, callback });
    return sub;
  } else {
    activeSubscriptions.set(topic, callback);
    return {
      unsubscribe: () => {
        activeSubscriptions.delete(topic);
      }
    };
  }
};

export const unsubscribeTopic = (topic) => {
  const entry = activeSubscriptions.get(topic);
  if (entry) {
    if (entry.sub) {
      entry.sub.unsubscribe();
    }
    activeSubscriptions.delete(topic);
  }
};

export const disconnectWebSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
  }
  activeSubscriptions.clear();
};