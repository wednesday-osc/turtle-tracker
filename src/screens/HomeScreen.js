import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import TurtleCard from '../components/TurtleCard';
import { formatDateKey, formatDateTime } from '../utils/date';

export default function HomeScreen({
  turtles,
  records,
  navigation,
  todoItems,
  onExportData,
  onImportFile,
  onQuickRecord,
  onToggleBackupReminder,
  onDeleteTurtle,
  backupSettings,
}) {
  const totalRecords = records.length;
  const today = formatDateKey(new Date());
  const todayRecords = records.filter((r) => formatDateKey(r.createdAt) === today).length;

  const getStats = (turtleId) => {
    const turtleRecords = records.filter((r) => r.turtleId === turtleId);
    const lastFeeding = turtleRecords
      .filter((r) => r.type === 'feeding')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    return {
      count: turtleRecords.length,
      lastFeeding: lastFeeding ? formatDateTime(lastFeeding.createdAt).slice(0, 11) : '-',
    };
  };


  const handlePickImportFile = async () => {
    const result = await onImportFile?.();
    if (!result || result.canceled) {
      return;
    }

    if (result.ok) {
      Alert.alert('导入成功', '备份文件数据已恢复');
    } else {
      Alert.alert('导入失败', result.message || '读取备份文件失败');
    }
  };

  const renderTodoItem = (item) => (
    <TouchableOpacity key={item.id} style={styles.todoItem} onPress={() => item.action?.()}>
      <View style={[styles.todoDot, item.level === 'high' ? styles.todoDotHigh : item.level === 'medium' ? styles.todoDotMedium : styles.todoDotLow]} />
      <View style={styles.todoBody}>
        <Text style={styles.todoText}>{item.text}</Text>
        {!!item.cta && <Text style={styles.todoCta}>{item.cta}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={turtles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TurtleCard
            turtle={item}
            stats={getStats(item.id)}
            onPress={() => navigation.navigate('Detail', { turtleId: item.id })}
            onQuickRecord={onQuickRecord}
            onDelete={onDeleteTurtle}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.brandRow}>
              <Image source={require('../../resources/logo.jpg')} style={styles.logo} />
              <View style={styles.brandTextWrap}>
                <Text style={styles.title}>Turtle Tracker</Text>
                <Text style={styles.subtitle}>记录体重、喂食、换水、状态与冬眠</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{turtles.length}</Text>
                <Text style={styles.summaryLabel}>龟档案</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalRecords}</Text>
                <Text style={styles.summaryLabel}>总记录</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{todayRecords}</Text>
                <Text style={styles.summaryLabel}>今日新增</Text>
              </View>
            </View>

            <View style={styles.toolboxRow}>
              <TouchableOpacity style={styles.toolboxBtn} onPress={onExportData}>
                <Text style={styles.toolboxBtnText}>导出备份文件</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolboxBtnSecondary} onPress={handlePickImportFile}>
                <Text style={styles.toolboxBtnSecondaryText}>导入备份文件</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.backupCard}>
              <View style={styles.backupHeader}>
                <View>
                  <Text style={styles.todoTitle}>自动备份提醒</Text>
                  <Text style={styles.backupMeta}>{backupSettings?.lastBackupAt ? `上次备份：${formatDateTime(backupSettings.lastBackupAt)}` : '还没有完成过文件备份'}</Text>
                </View>
                <Switch value={!!backupSettings?.backupReminderEnabled} onValueChange={onToggleBackupReminder} />
              </View>
              {!!backupSettings?.lastBackupFileUri && <Text style={styles.backupPath}>最近文件：{backupSettings.lastBackupFileUri}</Text>}
            </View>

            <View style={styles.todoCard}>
              <View style={styles.todoHeader}>
                <Text style={styles.todoTitle}>待办提醒</Text>
                <Text style={styles.todoCount}>{todoItems.length} 条</Text>
              </View>
              {todoItems.length ? (
                <ScrollView style={styles.todoList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {todoItems.map(renderTodoItem)}
                </ScrollView>
              ) : (
                <Text style={styles.todoEmpty}>暂无待办，今天状态不错。</Text>
              )}
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTurtle')}>
            <Text style={styles.addBtnText}>+ 添加龟档案</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  brandTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f766e',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  toolboxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  toolboxBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toolboxBtnSecondary: {
    flex: 1,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toolboxBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  toolboxBtnSecondaryText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '700',
  },
  backupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backupMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  backupPath: {
    marginTop: 8,
    fontSize: 12,
    color: '#4b5563',
  },
  todoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  todoCount: {
    color: '#6b7280',
    fontSize: 12,
  },
  todoList: {
    maxHeight: 250,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  todoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8,
  },
  todoBody: {
    flex: 1,
  },
  todoDotHigh: {
    backgroundColor: '#dc2626',
  },
  todoDotMedium: {
    backgroundColor: '#d97706',
  },
  todoDotLow: {
    backgroundColor: '#2563eb',
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  todoCta: {
    marginTop: 2,
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '700',
  },
  todoEmpty: {
    fontSize: 14,
    color: '#6b7280',
  },
  addBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
