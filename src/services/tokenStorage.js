import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_TOKEN_KEY = 'morph.admin.token';
const ADMIN_PROFILE_KEY = 'morph.admin.profile';
const STUDENT_TOKEN_KEY = 'morph.student.token';
const STUDENT_PROFILE_KEY = 'morph.student.profile';

async function safeSet(key, value) {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.warn(`tokenStorage: failed to set ${key}`, error);
  }
}

async function safeGet(key, parseJson = false) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return parseJson ? JSON.parse(value) : value;
  } catch (error) {
    console.warn(`tokenStorage: failed to get ${key}`, error);
    return null;
  }
}

export const tokenStorage = {
  // --- Admin / staff session ---
  setAdminSession: async (token, admin) => {
    await safeSet(ADMIN_TOKEN_KEY, token);
    await safeSet(ADMIN_PROFILE_KEY, admin);
  },
  getAdminToken: () => safeGet(ADMIN_TOKEN_KEY),
  getAdminProfile: () => safeGet(ADMIN_PROFILE_KEY, true),
  clearAdminSession: async () => {
    await safeSet(ADMIN_TOKEN_KEY, null);
    await safeSet(ADMIN_PROFILE_KEY, null);
  },

  // --- Student portal session ---
  setStudentSession: async (token, student) => {
    await safeSet(STUDENT_TOKEN_KEY, token);
    await safeSet(STUDENT_PROFILE_KEY, student);
  },
  getStudentToken: () => safeGet(STUDENT_TOKEN_KEY),
  getStudentProfile: () => safeGet(STUDENT_PROFILE_KEY, true),
  clearStudentSession: async () => {
    await safeSet(STUDENT_TOKEN_KEY, null);
    await safeSet(STUDENT_PROFILE_KEY, null);
  },
};
