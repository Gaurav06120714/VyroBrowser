export class SessionService {
  async getActiveSession(taskId: string): Promise<{ taskId: string; status: string } | null> {
    
    return { taskId, status: 'active' };
  }
}
