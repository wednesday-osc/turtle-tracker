import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import RecordItem from '../components/RecordItem';
import { formatDate, formatMonthDay } from '../utils/date';

const CHART_PAGE_SIZE = 15;
const RECENT_RECORD_LIMIT = 20;
const RECENT_RECORD_VISIBLE_COUNT = 5;
const RECENT_RECORD_ITEM_HEIGHT = 118;

export default function DetailScreen({ route, turtles, records, navigation, onDeleteRecord }) {
  const { turtleId } = route.params;
  const [chartPage, setChartPage] = useState(0);
  const turtle = turtles.find((t) => t.id === turtleId);
  const turtleRecords = useMemo(
    () => records
      .filter((r) => r.turtleId === turtleId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [records, turtleId]
  );

  const weightRecords = useMemo(
    () => turtleRecords.filter((r) => r.type === 'weight').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [turtleRecords]
  );

  const winterRecords = useMemo(
    () => turtleRecords.filter((r) => r.type === 'winter').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [turtleRecords]
  );

  const recentRecords = useMemo(() => turtleRecords.slice(0, RECENT_RECORD_LIMIT), [turtleRecords]);

  const totalChartPages = Math.max(1, Math.ceil(weightRecords.length / CHART_PAGE_SIZE));
  const safeChartPage = Math.min(chartPage, totalChartPages - 1);
  const chartStart = safeChartPage * CHART_PAGE_SIZE;
  const visibleWeightRecords = weightRecords.slice(chartStart, chartStart + CHART_PAGE_SIZE);

  const chartData = {
    labels: visibleWeightRecords.length ? visibleWeightRecords.map((item) => formatMonthDay(item.createdAt)) : ['--'],
    datasets: [
      {
        data: visibleWeightRecords.length ? visibleWeightRecords.map((r) => Number(r.value) || 0) : [0],
      },
    ],
  };

  const latestStatus = turtleRecords.find((r) => r.type === 'status');
  const latestWater = turtleRecords.find((r) => r.type === 'water');
  const latestWinter = winterRecords[0];
  const winterStart = winterRecords.find((r) => r.phase === '自然冬眠' || r.phase === '浅冬化');
  const winterWake = winterRecords.find((r) => r.phase === '出眠' || r.phase === '已开食');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.name}>{turtle?.name}</Text>
      <Text style={styles.meta}>{turtle?.species}</Text>
      <Text style={styles.meta}>背甲长：{turtle?.shellLength || '-'} cm ｜ 当前体重：{turtle?.weight || '-'} g</Text>
      {!!turtle?.arrivalDate && <Text style={styles.meta}>到家日期：{formatDate(turtle.arrivalDate)}</Text>}
      {!!turtle?.source && <Text style={styles.meta}>来源：{turtle.source}</Text>}
      {!!turtle?.ageEstimate && <Text style={styles.meta}>年龄估计：{turtle.ageEstimate}</Text>}
      {!!turtle?.tags && <Text style={styles.meta}>备注标签：{turtle.tags}</Text>}
      {!!turtle?.winterConstitution && <Text style={styles.meta}>冬眠体质：{turtle.winterConstitution}</Text>}

      <View style={styles.highlightRow}>
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>最近状态</Text>
          <Text style={styles.highlightValue}>{latestStatus?.status || latestStatus?.value || '-'}</Text>
        </View>
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>最近换水</Text>
          <Text style={styles.highlightValue}>{latestWater?.percent ? `${latestWater.percent}%` : latestWater?.value || '-'}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddRecord', { turtleId })}>
          <Text style={styles.actionBtnText}>+ 新增记录</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('AddTurtle', { mode: 'edit', turtle })}>
          <Text style={styles.secondaryBtnText}>编辑龟资料</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>体重趋势</Text>
      <View style={styles.chartHeader}>
        <Text style={styles.chartHint}>默认显示最近 15 条，可左右切换</Text>
        <Text style={styles.chartPageText}>{safeChartPage + 1} / {totalChartPages}</Text>
      </View>
      <View style={styles.chartPagerRow}>
        <TouchableOpacity
          style={[styles.chartPagerBtn, safeChartPage === 0 && styles.chartPagerBtnDisabled]}
          disabled={safeChartPage === 0}
          onPress={() => setChartPage((prev) => Math.max(prev - 1, 0))}
        >
          <Text style={[styles.chartPagerText, safeChartPage === 0 && styles.chartPagerTextDisabled]}>← 更早</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chartPagerBtn, safeChartPage >= totalChartPages - 1 && styles.chartPagerBtnDisabled]}
          disabled={safeChartPage >= totalChartPages - 1}
          onPress={() => setChartPage((prev) => Math.min(prev + 1, totalChartPages - 1))}
        >
          <Text style={[styles.chartPagerText, safeChartPage >= totalChartPages - 1 && styles.chartPagerTextDisabled]}>更新 →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        <LineChart
          data={chartData}
          width={Math.max(Dimensions.get('window').width - 32, visibleWeightRecords.length * 52)}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
            propsForLabels: {
              fontSize: 10,
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>

      <Text style={styles.section}>冬眠记录</Text>
      <View style={styles.winterPanel}>
        <View style={styles.winterCell}>
          <Text style={styles.winterLabel}>当前阶段</Text>
          <Text style={styles.winterValue}>{latestWinter?.phase || '-'}</Text>
        </View>
        <View style={styles.winterCell}>
          <Text style={styles.winterLabel}>入眠记录</Text>
          <Text style={styles.winterValue}>{winterStart?.createdAt ? formatDate(winterStart.createdAt) : '-'}</Text>
        </View>
        <View style={styles.winterCell}>
          <Text style={styles.winterLabel}>出眠/开食</Text>
          <Text style={styles.winterValue}>{winterWake?.createdAt ? formatDate(winterWake.createdAt) : '-'}</Text>
        </View>
        <View style={styles.winterCellLast}>
          <Text style={styles.winterLabel}>环境温度</Text>
          <Text style={styles.winterValue}>{latestWinter?.temperature ? `${latestWinter.temperature}℃` : '-'}</Text>
        </View>
      </View>

      <Text style={styles.section}>最近记录</Text>
      {recentRecords.length ? (
        <ScrollView style={styles.recentList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {recentRecords.map((item) => (
            <RecordItem
              key={item.id}
              record={item}
              onDelete={onDeleteRecord}
              onEdit={(record) => navigation.navigate('AddRecord', { turtleId, mode: 'edit', record })}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>还没有记录，先从新增记录开始。</Text>
        </View>
      )}

      <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History', { turtleId })}>
        <Text style={styles.historyBtnText}>查看历史记录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  highlightTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartPageText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  chartPagerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartPagerBtn: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chartPagerBtnDisabled: {
    backgroundColor: '#f3f4f6',
  },
  chartPagerText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  chartPagerTextDisabled: {
    color: '#9ca3af',
  },
  chartScroll: {
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
  winterPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  winterCell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  winterCellLast: {
    paddingBottom: 0,
  },
  winterLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  winterValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  recentList: {
    maxHeight: RECENT_RECORD_VISIBLE_COUNT * RECENT_RECORD_ITEM_HEIGHT,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  historyBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  historyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
