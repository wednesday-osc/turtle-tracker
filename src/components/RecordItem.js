import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../utils/date';
import { getRecordTypeLabel, RECORD_TYPES } from '../constants';

function buildSummary(record) {
  switch (record.type) {
    case RECORD_TYPES.WEIGHT:
      return `${record.value} g`;
    case RECORD_TYPES.FEEDING:
      return `${record.food || record.value || '-'}${record.amount ? ` · ${record.amount}` : ''}${record.finished ? ' · 已吃完' : ''}`;
    case RECORD_TYPES.WATER:
      return `${record.changeType || '换水'}${record.percent ? ` · ${record.percent}%` : ''}${record.salinity ? ` · 盐度:${record.salinity}` : ''}`;
    case RECORD_TYPES.STATUS:
      return `${record.status || record.value || '-'}${record.appetite ? ` · 食欲:${record.appetite}` : ''}`;
    case RECORD_TYPES.WINTER:
      return `${record.phase || record.value || '-'}${record.temperature ? ` · ${record.temperature}℃` : ''}`;
    default:
      return record.value || '-';
  }
}

export default function RecordItem({ record, onDelete, onEdit, tipText = '点按编辑，长按删除' }) {
  return (
    <TouchableOpacity style={styles.item} onLongPress={() => onDelete?.(record.id)} delayLongPress={500} onPress={() => onEdit?.(record)}>
      <View style={styles.header}>
        <Text style={styles.type}>{getRecordTypeLabel(record.type)}</Text>
        <Text style={styles.time}>{formatDateTime(record.createdAt)}</Text>
      </View>
      <Text style={styles.value}>{buildSummary(record)}</Text>
      {!!record.note && <Text style={styles.note}>{record.note}</Text>}
      {!!record.keywordHit && <Text style={styles.keywordHit}>命中关键词：{record.keywordHit}</Text>}
      {!!tipText && <Text style={styles.tip}>{tipText}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  type: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  keywordHit: {
    fontSize: 12,
    color: '#7c3aed',
    marginBottom: 4,
  },
  tip: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
