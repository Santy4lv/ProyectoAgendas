export interface ScrollCraftInstance {
  layout: () => void;
  read: () => void;
  destroy: () => void;
  acts: unknown[];
  worlds: unknown[];
  clips: unknown[];
  lerp: number;
}

export interface ScrollCraftMountOptions {
  lerp?: number;
}

export interface ScrollCraftGlobal {
  mount: (
    root?: Element | Document | string | null,
    opts?: ScrollCraftMountOptions,
  ) => ScrollCraftInstance;
  reduce: boolean;
  instances: ScrollCraftInstance[];
}

declare global {
  interface Window {
    ScrollCraft?: ScrollCraftGlobal;
  }
}

declare module './scrollcraft.js' {}
