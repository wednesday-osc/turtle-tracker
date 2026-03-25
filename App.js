import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AddTurtleScreen from './src/screens/AddTurtleScreen';
import AddRecordScreen from './src/screens/AddRecordScreen';
import {
  exportAppData,
  importAppData,
  loadRecords,
  loadSettings,
  loadTurtles,
  markBackupCompleted,
  saveRecords,
  saveSettings,
  saveTurtles,
} from './src/storage/storage';
import { demoRecords, demoTurtles } from './src/data/demo';
import { RECORD_TYPES } from './src/constants';
import { formatDateKey, getDaysDiffFromNow } from './src/utils/date';

const Stack = createNativeStackNavigator();
const BACKUP_REMINDER_NOTIFICATION_ID = 'backup-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getLatestRecord(records, turtleId, type) {
  return records
    .filter((r) => r.turtleId === turtleId && r.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted;
}

async function scheduleBackupReminder(enabled) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: BACKUP_REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Turtle Tracker 备份提醒',
      body: '建议你备份一下龟龟数据，避免换机或误删后丢失记录。',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 7,
      repeats: true,
    },
  });
}

async function shareBackupFile(fileUri) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('当前设备不支持系统分享');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: '导出 Turtle Tracker 备份文件',
  });
}

async function saveBackupToDownloadDirectory(fileName, content) {
  const { StorageAccessFramework } = FileSystem;
  if (!StorageAccessFramework) {
    return { ok: false, reason: '当前环境不支持下载目录写入' };
  }

  try {
    const downloadRootUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadRootUri);
    if (!permission.granted || !permission.directoryUri) {
      return { ok: false, reason: '未授予下载目录权限' };
    }

    const safFileUri = await StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      fileName.replace(/\.json$/i, ''),
      'application/json'
    );
    await StorageAccessFramework.writeAsStringAsync(safFileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { ok: true, fileUri: safFileUri };
  } catch (error) {
    return { ok: false, reason: error?.message || '保存到下载目录失败' };
  }
}

export default function App() {
  const [turtles, setTurtles] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState({ backupReminderEnabled: true, lastBackupAt: '', lastBackupFileUri: '' });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const savedTurtles = await loadTurtles();
      const savedRecords = await loadRecords();
      const savedSettings = await loadSettings();
      const finalTurtles = savedTurtles.length ? savedTurtles : demoTurtles;
      const finalRecords = savedRecords.length ? savedRecords : demoRecords;
      setTurtles(finalTurtles);
      setRecords(finalRecords);
      setSettings(savedSettings);
      if (!savedTurtles.length) await saveTurtles(finalTurtles);
      if (!savedRecords.length) await saveRecords(finalRecords);
      await scheduleBackupReminder(savedSettings.backupReminderEnabled);
      setReady(true);
    }
    init();
  }, []);

  const navigateToQuickRecord = (navigation, turtleId, presetType) => {
    navigation.navigate('AddRecord', { turtleId, presetType });
  };

  const todoItems = useMemo(() => {
    return turtles.flatMap((turtle) => {
      const items = [];
      const latestFeeding = getLatestRecord(records, turtle.id, RECORD_TYPES.FEEDING);
      const latestWater = getLatestRecord(records, turtle.id, RECORD_TYPES.WATER);
      const latestWeight = getLatestRecord(records, turtle.id, RECORD_TYPES.WEIGHT);
      const latestStatus = getLatestRecord(records, turtle.id, RECORD_TYPES.STATUS);
      const weightRecords = records
        .filter((r) => r.turtleId === turtle.id && r.type === RECORD_TYPES.WEIGHT)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const daysSinceWater = getDaysDiffFromNow(latestWater?.createdAt);

      if (!latestFeeding) {
        items.push({
          id: `${turtle.id}-feed-empty`,
          turtleId: turtle.id,
          turtleName: turtle.name,
          level: 'high',
          text: `${turtle.name} 最近没有喂食记录`,
          cta: '点我去记喂食',
          targetType: RECORD_TYPES.FEEDING,
        });
      }

      if (!latestWeight) {
        items.push({
          id: `${turtle.id}-weight-empty`,
          turtleId: turtle.id,
          turtleName: turtle.name,
          level: 'medium',
          text: `${turtle.name} 最近没有体重记录`,
          cta: '点我去记体重',
          targetType: RECORD_TYPES.WEIGHT,
        });
      }

      if (weightRecords.length >= 2) {
        const latest = Number(weightRecords[0].value);
        const previous = Number(weightRecords[1].value);
        if (!Number.isNaN(latest) && !Number.isNaN(previous) && previous > 0 && latest < previous) {
          const dropRatio = (previous - latest) / previous;
          if (dropRatio > 0.2) {
            const dropPercent = Math.round(dropRatio * 100);
            items.push({
              id: `${turtle.id}-weight-drop`,
              turtleId: turtle.id,
              turtleName: turtle.name,
              level: 'high',
              text: `${turtle.name} 近期体重下降${dropPercent}%`,
              cta: '点我去记状态',
              targetType: RECORD_TYPES.STATUS,
            });
          }
        }
      }

      if (daysSinceWater === null || daysSinceWater > 15) {
        items.push({
          id: `${turtle.id}-water-stale`,
          turtleId: turtle.id,
          turtleName: turtle.name,
          level: 'medium',
          text: `${turtle.name} 最近没有换水记录`,
          cta: '点我去记换水',
          targetType: RECORD_TYPES.WATER,
        });
      }

      if (latestStatus && !['正常', '其它'].includes(latestStatus.status || '')) {
        items.push({
          id: `${turtle.id}-status-abnormal`,
          turtleId: turtle.id,
          turtleName: turtle.name,
          level: 'high',
          text: `${turtle.name} 状态异常`,
          cta: '点我去记状态',
          targetType: RECORD_TYPES.STATUS,
        });
      }

      return items;
    });
  }, [records, turtles]);

  const handleAddTurtle = async (turtle) => {
    const next = [...turtles, turtle];
    setTurtles(next);
    await saveTurtles(next);
  };

  const handleUpdateTurtle = async (turtle) => {
    const next = turtles.map((item) => (item.id === turtle.id ? turtle : item));
    setTurtles(next);
    await saveTurtles(next);
  };

  const syncLatestWeightForTurtle = async (targetTurtleId, nextRecords, sourceTurtles = turtles) => {
    const turtleWeightRecords = nextRecords
      .filter((item) => item.turtleId === targetTurtleId && item.type === RECORD_TYPES.WEIGHT)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestWeight = turtleWeightRecords[0]?.value || '';
    const nextTurtles = sourceTurtles.map((t) =>
      t.id === targetTurtleId ? { ...t, weight: latestWeight } : t
    );
    setTurtles(nextTurtles);
    await saveTurtles(nextTurtles);
  };

  const handleDeleteTurtle = async (turtleId) => {
    const target = turtles.find((item) => item.id === turtleId);
    if (!target) return;

    Alert.alert('删除龟档案', `确定删除 ${target.name} 吗？相关记录也会一起删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const nextTurtles = turtles.filter((item) => item.id !== turtleId);
          const nextRecords = records.filter((item) => item.turtleId !== turtleId);
          setTurtles(nextTurtles);
          setRecords(nextRecords);
          await saveTurtles(nextTurtles);
          await saveRecords(nextRecords);
        },
      },
    ]);
  };

  const handleAddRecord = async (record) => {
    const nextRecords = [record, ...records];
    setRecords(nextRecords);
    await saveRecords(nextRecords);

    if (record.type === RECORD_TYPES.WEIGHT) {
      await syncLatestWeightForTurtle(record.turtleId, nextRecords);
    }
  };

  const handleUpdateRecord = async (record) => {
    const previousRecord = records.find((item) => item.id === record.id);
    const nextRecords = records.map((item) => (item.id === record.id ? record : item));
    setRecords(nextRecords);
    await saveRecords(nextRecords);

    if (record.type === RECORD_TYPES.WEIGHT || previousRecord?.type === RECORD_TYPES.WEIGHT) {
      await syncLatestWeightForTurtle(record.turtleId, nextRecords);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const target = records.find((r) => r.id === recordId);
    Alert.alert('删除记录', '确定删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const nextRecords = records.filter((r) => r.id !== recordId);
          setRecords(nextRecords);
          await saveRecords(nextRecords);

          if (target?.type === RECORD_TYPES.WEIGHT) {
            await syncLatestWeightForTurtle(target.turtleId, nextRecords);
          }
        },
      },
    ]);
  };

  const handleExportData = async () => {
    try {
      const content = await exportAppData();
      const fileName = `turtle-tracker-backup-${formatDateKey(new Date())}.json`;
      const cacheFileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(cacheFileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

      const downloadResult = await saveBackupToDownloadDirectory(fileName, content);
      if (downloadResult.ok) {
        const nextSettings = await markBackupCompleted(downloadResult.fileUri);
        setSettings(nextSettings);
        Alert.alert('导出完成', '备份文件已保存到指定目录。');
        return;
      }

      await shareBackupFile(cacheFileUri);
      const nextSettings = await markBackupCompleted(cacheFileUri);
      setSettings(nextSettings);
      Alert.alert('导出完成', '备份文件已保存到指定目录。');
    } catch (error) {
      Alert.alert('导出失败', error?.message || '未能导出备份文件');
    }
  };

  const handleImportData = async (rawText) => {
    try {
      const next = await importAppData(rawText);
      setTurtles(next.turtles);
      setRecords(next.records);
      setSettings(next.settings);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || '导入失败，请检查备份文件' };
    }
  };

  const handlePickImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { ok: false, canceled: true };
      }

      const pickedFile = result.assets?.[0];
      if (!pickedFile?.uri) {
        return { ok: false, message: '没有读取到备份文件' };
      }

      const rawText = await FileSystem.readAsStringAsync(pickedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return await handleImportData(rawText);
    } catch (error) {
      return { ok: false, message: error?.message || '读取备份文件失败' };
    }
  };

  const handleToggleBackupReminder = async (enabled) => {
    const next = await saveSettings({ ...settings, backupReminderEnabled: enabled });
    setSettings(next);
    await scheduleBackupReminder(enabled);
  };

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" backgroundColor="#f7f9fc" translucent={false} />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {(props) => (
              <HomeScreen
                {...props}
                turtles={turtles}
                records={records}
                todoItems={todoItems.map((item) => ({
                  ...item,
                  action: () => navigateToQuickRecord(props.navigation, item.turtleId, item.targetType),
                }))}
                onExportData={handleExportData}
                onImportFile={handlePickImportFile}
                onQuickRecord={(type, turtle) => navigateToQuickRecord(props.navigation, turtle.id, type)}
                onToggleBackupReminder={handleToggleBackupReminder}
                onDeleteTurtle={handleDeleteTurtle}
                backupSettings={settings}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Detail" options={{ title: '龟龟详情' }}>
            {(props) => (
              <DetailScreen
                {...props}
                turtles={turtles}
                records={records}
                onDeleteRecord={handleDeleteRecord}
                onUpdateTurtle={handleUpdateTurtle}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="History" options={{ title: '历史记录' }}>
            {(props) => (
              <HistoryScreen
                {...props}
                turtles={turtles}
                records={records}
                onDeleteRecord={handleDeleteRecord}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="AddTurtle" options={({ route }) => ({ title: route.params?.mode === 'edit' ? '编辑龟档案' : '新增龟档案' })}>
            {(props) => <AddTurtleScreen {...props} onAdd={handleAddTurtle} onUpdate={handleUpdateTurtle} />}
          </Stack.Screen>
          <Stack.Screen name="AddRecord" options={({ route }) => ({ title: route.params?.mode === 'edit' ? '编辑记录' : '新增记录' })}>
            {(props) => <AddRecordScreen {...props} onAdd={handleAddRecord} onUpdate={handleUpdateRecord} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
