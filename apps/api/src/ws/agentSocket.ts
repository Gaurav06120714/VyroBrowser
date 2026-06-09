import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { WsMessage } from '@vyro/shared-types';

const taskConnections = new Map<string, Set<WebSocket>>();

export function broadcastToTask(taskId: string, message: WsMessage): void {
  const connections = taskConnections.get(taskId);
  if (!connections || connections.size === 0) return;

  const serialized = JSON.stringify(message);
  for (const ws of connections) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(serialized);
      }
    } catch {
      
    }
  }
}

export async function agentSocketRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { taskId?: string } }>(
    '/ws',
    { websocket: true },
    (socket, request) => {
      const { taskId } = request.query;

      if (!taskId) {
        socket.send(JSON.stringify({ error: 'taskId query parameter required' }));
        socket.close(1008, 'Missing taskId');
        return;
      }

      request.log.info({ taskId }, 'WebSocket client connected');

      if (!taskConnections.has(taskId)) {
        taskConnections.set(taskId, new Set());
      }
      taskConnections.get(taskId)!.add(socket);

      socket.send(
        JSON.stringify({
          type: 'ping',
          taskId,
          payload: { connected: true },
          timestamp: new Date().toISOString(),
        })
      );

      socket.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString()) as WsMessage;

          if (msg.type === 'task:approval:response') {
            const payload = msg.payload as { stepId: string; approved: boolean };
            const callbacks = pendingApprovals.get(msg.taskId);
            if (callbacks) {
              const callback = callbacks.get(payload.stepId);
              if (callback) {
                callback(payload.approved);
                callbacks.delete(payload.stepId);
              }
            }
          }

          if (msg.type === 'ping') {
            socket.send(
              JSON.stringify({
                type: 'pong',
                taskId,
                payload: {},
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch {
          
        }
      });

      socket.on('close', () => {
        request.log.info({ taskId }, 'WebSocket client disconnected');
        taskConnections.get(taskId)?.delete(socket);
        if (taskConnections.get(taskId)?.size === 0) {
          taskConnections.delete(taskId);
        }
      });

      socket.on('error', (err: Error) => {
        request.log.error({ err, taskId }, 'WebSocket error');
      });
    }
  );
}

type ApprovalCallback = (approved: boolean) => void;
const pendingApprovals = new Map<string, Map<string, ApprovalCallback>>();

export function requestApproval(
  taskId: string,
  stepId: string,
  action: Record<string, unknown>,
  reason: string,
  timeoutMs = 120000
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!pendingApprovals.has(taskId)) {
      pendingApprovals.set(taskId, new Map());
    }

    let resolved = false;
    const wrappedResolve = (approved: boolean) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(approved);
      }
    };

    pendingApprovals.get(taskId)!.set(stepId, wrappedResolve);

    broadcastToTask(taskId, {
      type: 'task:approval:required',
      taskId,
      payload: { stepId, action, reason, timeoutMs },
      timestamp: new Date().toISOString(),
    });

    const timer = setTimeout(() => {
      const callbacks = pendingApprovals.get(taskId);
      if (callbacks?.has(stepId)) {
        callbacks.delete(stepId);
        wrappedResolve(false);
      }
    }, timeoutMs);
  });
}
