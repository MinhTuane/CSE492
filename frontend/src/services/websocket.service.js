import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../store/authStore';

let stompClient = null;

export const connectWebSocket = (onMessageReceived) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const socket = new SockJS('http://localhost:8091/ws');
  
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: function (str) {
      // console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = function (frame) {
    const user = useAuthStore.getState().user;
    
    if (user?.role === 'ADMIN') {
      stompClient.subscribe('/topic/admin/notifications', (message) => {
        onMessageReceived(JSON.parse(message.body));
      });
    }

    if (user?.id) {
      stompClient.subscribe(`/topic/user/${user.id}/notifications`, (message) => {
        onMessageReceived(JSON.parse(message.body));
      });
    }
  };

  stompClient.onStompError = function (frame) {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
  }
};