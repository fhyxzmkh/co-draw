import { create } from "zustand/react";

interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
}

interface UserStore {
  userInfo: UserInfo | null;

  setUserInfo: (userInfo: UserInfo) => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  userInfo: {
    id: "Iki5Z4FRET2k69cAop15dUpmVa8LZKv4",
    username: "test-user",
    createdAt: "20xx-xx-xx",
  },

  setUserInfo: (userInfo: UserInfo) => set({ userInfo }),
}));
