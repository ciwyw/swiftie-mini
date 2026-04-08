declare namespace WechatMiniprogram {
  interface IAnyObject {
    [key: string]: unknown;
  }

  interface ComponentTriggerEventOption {
    bubbles?: boolean;
    composed?: boolean;
    capturePhase?: boolean;
  }
}

type DataRecord = object;
type MethodRecord = Record<string, (...args: any[]) => unknown>;

interface PageInstance<D> {
  data: D;
  setData(data: Partial<D>): void;
}

interface ComponentInstance<D, M extends MethodRecord> {
  data: D;
  setData(data: Partial<D>): void;
  triggerEvent(
    name: string,
    detail?: WechatMiniprogram.IAnyObject,
    option?: WechatMiniprogram.ComponentTriggerEventOption
  ): void;
}

declare function App<T>(options: T): void;
declare function getApp<T = { globalData: DataRecord }>(): T;
declare function Page<D>(
  options: {
    data: D;
    [key: string]: unknown;
  } & ThisType<PageInstance<D> & MethodRecord>
): void;
declare function Component<D>(
  options: {
    properties?: Record<string, unknown>;
    data?: D;
    methods?: MethodRecord;
    [key: string]: unknown;
  } & ThisType<ComponentInstance<D, MethodRecord> & MethodRecord>
): void;

declare const wx: {
  navigateTo(options: { url: string }): void;
  switchTab(options: { url: string }): void;
  showToast(options: { title: string; icon?: 'none' | 'success' | 'error'; duration?: number }): void;
  setStorageSync(key: string, data: unknown): void;
  getStorageSync<T = unknown>(key: string): T | unknown;
  getUserProfile?(options: {
    desc: string;
    success?: (result: {
      userInfo: {
        avatarUrl: string;
        nickName: string;
      };
    }) => void;
    fail?: () => void;
  }): void;
};
