import { getApiBaseUrl } from './queryClient';

// 保活间隔时间 - 设为14分钟 (Render休眠时间为15分钟)
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14分钟

/**
 * 保活服务 - 定期ping后端以防止Render免费tier休眠
 */
export class KeepAliveService {
  private intervalId: number | null = null;
  private isActive = false;

  /**
   * 启动保活服务
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('启动后端保活服务...');
    
    // 立即执行一次，然后开始定期执行
    this.pingBackend();
    
    this.intervalId = window.setInterval(() => {
      this.pingBackend();
    }, KEEP_ALIVE_INTERVAL);
  }

  /**
   * 停止保活服务
   */
  stop(): void {
    if (!this.isActive) return;
    
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isActive = false;
    console.log('停止后端保活服务');
  }

  /**
   * 发送ping请求到后端健康检查API
   */
  private async pingBackend(): Promise<void> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`后端保活: 成功ping (${data.environment}, ${data.timestamp})`);
      } else {
        console.warn(`后端保活: 失败 (状态码: ${response.status})`);
      }
    } catch (error) {
      console.error('后端保活: 请求失败', error);
    }
  }
}

// 创建单例实例
export const keepAliveService = new KeepAliveService();

// 导出默认实例
export default keepAliveService;
