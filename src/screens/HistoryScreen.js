import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import RecordItem from '../components/RecordItem';
import { RECORD_TYPE_OPTIONS, getRecordTypeLabel } from '../constants';

export default function HistoryScreen({ route, turtles, records, navigation, onDeleteRecord }) {
  const { turtleId } = route.params;
  const [filterType, setFilterType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const turtle = turtles.find((t) => t.id === turtleId);

  const turtleRecords = useMemo(() => records
    .filter((r) => r.turtleId === turtleId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [records, turtleId]);

  const filteredRecords = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();

    return turtleRecords.filter((record) => {
      if (filterType !== 'all' && record.type !== filterType) return false;
      if (keywordLower) {
        const haystack = [record.note, record.value, record.food, record.status, record.phase, record.changeType]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keywordLower)) return false;
        record.keywordHit = keyword.trim();
      } else {
        record.keywordHit = '';
      }
      return true;
    });
  }, [filterType, keyword, turtleRecords]);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{turtle?.name} 的历史记录</Text>
      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="按备注/摘要关键词搜索"
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]} onPress={() => setFilterType('all')}>
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>全部</Text>
        </TouchableOpacity>
        {RECORD_TYPE_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterBtn, filterType === item.key && styles.filterBtnActive]}
            onPress={() => setFilterType(item.key)}
          >
            <Text style={[styles.filterText, filterType === item.key && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordItem
            record={item}
            onDelete={onDeleteRecord}
            onEdit={() => navigation.navigate('AddRecord', { turtleId, mode: 'edit', record: item })}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>暂无{filterType === 'all' ? '' : getRecordTypeLabel(filterType)}记录</Text>}
        contentContainerStyle={filteredRecords.length ? styles.listContent : styles.emptyContent}
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
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    backgroundColor: '#e5e7eb',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterBtnActive: {
    backgroundColor: '#0f766e',
  },
  filterText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
});

