import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

const DEFAULT_SETTINGS = {
  backupReminderEnabled: true,
  lastBackupAt: '',
  lastBackupFileUri: '',
};

export async function loadTurtles() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.TURTLES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTurtles(turtles) {
  await AsyncStorage.setItem(STORAGE_KEYS.TURTLES, JSON.stringify(turtles));
}

export async function loadRecords() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecords(records) {
  await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

export async function loadSettings() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  const parsed = raw ? JSON.parse(raw) : {};
  return { ...DEFAULT_SETTINGS, ...parsed };
}

export async function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  return merged;
}

export async function markBackupCompleted(fileUri = '') {
  const settings = await loadSettings();
  return saveSettings({
    ...settings,
    lastBackupAt: new Date().toISOString(),
    lastBackupFileUri: fileUri || settings.lastBackupFileUri || '',
  });
}

export async function exportAppData() {
  const [turtles, records, settings] = await Promise.all([loadTurtles(), loadRecords(), loadSettings()]);
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      turtles,
      records,
      settings,
    },
    null,
    2
  );
}

export async function importAppData(rawText) {
  const parsed = JSON.parse(rawText);
  const turtles = Array.isArray(parsed?.turtles) ? parsed.turtles : [];
  const records = Array.isArray(parsed?.records) ? parsed.records : [];
  const settings = { ...DEFAULT_SETTINGS, ...(parsed?.settings || {}) };

  await Promise.all([saveTurtles(turtles), saveRecords(records), saveSettings(settings)]);

  return {
    turtles,
    records,
    settings,
  };
}
