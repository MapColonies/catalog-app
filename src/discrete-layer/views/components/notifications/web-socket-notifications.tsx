import { createClient } from 'graphql-ws';
import React, { useEffect } from 'react';
import CONFIG from '../../../../common/config';
import { localStore } from '../../../../common/helpers/storage';
import { CallBack } from '../../../../common/models/job-errors-summary.raster';

const WebSocketNotifications: React.FC = () => {

  useEffect(() => {
    const initWebSocket = () => {
      const wsClient = createClient({
        url: `${CONFIG.WS_PROTOCOL}${CONFIG.SERVICE_NAME}/graphql-ws`,
        connectionParams: {
        },
        on: {
          connected: () => {
            console.log("WebSocket connected");
          },
          error: (error) => {
            console.error("WebSocket error:", error);
          },
          closed: () => {
            console.log("WebSocket disconnected");
          },
        },
      });
      return wsClient;
    };

    const wsClient = initWebSocket();
    
    const subscribeToTask = () => {
      return wsClient.subscribe(
        {
          query: `subscription {
            taskUpdateDetails {
              jobId
              taskId
              jobType
              taskType
              productId
              productType
              version
              status
              progress
              message
              error
              params
            }
          }`,
        },
        {
          next: (res: { data: { taskUpdateDetails: CallBack<unknown>}, errors: Record<string, unknown>[]}) => {
            const newCount = parseInt(localStore.get('taskNotificationCount') || '0', 10) + 1;
            localStore.set('taskNotificationCount', newCount.toString());
            localStore.setObject('lastTask', res.data.taskUpdateDetails);
          },
          error: (err) => {
            console.error('Subscription error:', err);
          },
          complete: () => {
            console.log('WebSocket subscription completed');
          },
        }
      );
    };
    
    subscribeToTask();

    return () => {
      wsClient.dispose();
      localStore.remove('taskNotificationCount');
      localStore.remove('lastTask');
    };
  }, []);

  return null;
};

export default WebSocketNotifications;