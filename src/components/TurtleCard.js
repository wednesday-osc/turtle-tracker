import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDate } from '../utils/date';

export default function TurtleCard({ turtle, onPress, stats, onQuickRecord, onDelete }) {
  const handleLongPress = () => {
    onDelete?.(turtle.id);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={handleLongPress} activeOpacity={0.95} delayLongPress={300}>
      <View style={styles.mainArea}>
        <Text style={styles.name}>{turtle.name}</Text>
        <Text style={styles.meta}>{turtle.species}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.meta}>背甲长：{turtle.shellLength || '-'} cm</Text>
            <Text style={styles.meta}>体重：{turtle.weight || '-'} g</Text>
          </View>
          <View style={styles.infoColumn}>
            {!!turtle.arrivalDate ? <Text style={styles.meta}>到家：{formatDate(turtle.arrivalDate)}</Text> : <Text style={styles.meta}>到家：-</Text>}
            {!!turtle.tags ? <Text style={styles.meta}>标签：{turtle.tags}</Text> : <Text style={styles.meta}>标签：-</Text>}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}><Text style={styles.statText}>记录 {stats?.count || 0}</Text></View>
          <View style={styles.statBadge}><Text style={styles.statText}>最近喂食 {stats?.lastFeeding || '-'}</Text></View>
        </View>
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => onQuickRecord?.('feeding', turtle)}>
          <Text style={styles.quickBtnText}>记喂食</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => onQuickRecord?.('water', turtle)}>
          <Text style={styles.quickBtnText}>记换水</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => onQuickRecord?.('weight', turtle)}>
          <Text style={styles.quickBtnText}>记体重</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  mainArea: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  infoColumn: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#ecfeff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statText: {
    color: '#155e75',
    fontSize: 12,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickBtnText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 12,
  },
});

