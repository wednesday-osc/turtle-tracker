import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { RECORD_TYPES, RECORD_TYPE_OPTIONS, STATUS_OPTIONS, STATUS_APPETITE_OPTIONS, WINTER_OPTIONS } from '../constants';
import { formatDateTime, toPickerDate, toUtc8IsoString } from '../utils/date';

const QUICK_PRESETS = {
  feeding: { food: '龟粮', amount: '少量', finished: '是', value: '龟粮' },
  water: { changeType: '部分换水', percent: '30', value: '部分换水' },
  status: { status: '正常', appetite: '正常', value: '状态正常' },
  winter: { phase: '已开食', temperature: '24', value: '已开食' },
};

function getAutoAppetiteByStatus(status) {
  return ['正常', '其它'].includes(status) ? '正常' : '异常';
}

export default function AddRecordScreen({ route, navigation, onAdd, onUpdate }) {
  const { turtleId, mode, record, presetType } = route.params;
  const initialType = record?.type || presetType || RECORD_TYPES.WEIGHT;
  const presetValues = QUICK_PRESETS[initialType] || {};
  const isEdit = mode === 'edit' && !!record;

  const [type, setType] = useState(initialType);
  const [value, setValue] = useState(record?.value?.toString?.() || presetValues.value || '');
  const [note, setNote] = useState(record?.note || '');
  const [food, setFood] = useState(record?.food || presetValues.food || '');
  const [amount, setAmount] = useState(record?.amount || presetValues.amount || '');
  const [finished, setFinished] = useState(record?.finished === false ? '否' : (record?.finished ? '是' : (presetValues.finished || '是')));
  const [changeType, setChangeType] = useState(record?.changeType || presetValues.changeType || '部分换水');
  const [percent, setPercent] = useState(record?.percent?.toString?.() || presetValues.percent || '');
  const [salinity, setSalinity] = useState(record?.salinity || '');
  const [status, setStatus] = useState(record?.status || presetValues.status || '正常');
  const [appetite, setAppetite] = useState(record?.appetite || presetValues.appetite || '正常');
  const [phase, setPhase] = useState(record?.phase || presetValues.phase || '出眠');
  const [temperature, setTemperature] = useState(record?.temperature?.toString?.() || presetValues.temperature || '');
  const [createdAtDate, setCreatedAtDate] = useState(toPickerDate(record?.createdAt || toUtc8IsoString(new Date())));
  const [showIosPicker, setShowIosPicker] = useState(false);

  const placeholder = useMemo(() => {
    switch (type) {
      case RECORD_TYPES.WEIGHT:
        return '输入体重（g）';
      case RECORD_TYPES.FEEDING:
        return '输入喂食摘要';
      case RECORD_TYPES.WATER:
        return '输入换水摘要';
      case RECORD_TYPES.STATUS:
        return '输入状态摘要';
      case RECORD_TYPES.WINTER:
        return '输入冬眠摘要';
      default:
        return '输入记录值';
    }
  }, [type]);

  const buildPayload = () => {
    const base = {
      id: record?.id || Date.now().toString(),
      turtleId,
      type,
      note,
      createdAt: toUtc8IsoString(createdAtDate),
    };

    switch (type) {
      case RECORD_TYPES.WEIGHT:
        return { ...base, value };
      case RECORD_TYPES.FEEDING:
        return { ...base, value: value || food, food, amount, finished: finished === '是' };
      case RECORD_TYPES.WATER:
        return { ...base, value: value || changeType, changeType, percent, salinity };
      case RECORD_TYPES.STATUS:
        return { ...base, value: value || status, status, appetite };
      case RECORD_TYPES.WINTER:
        return { ...base, value: value || phase, phase, temperature };
      default:
        return { ...base, value };
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!(payload.value || '').toString().trim()) {
      Alert.alert('无法保存', '请至少填写本次记录的核心内容');
      return;
    }

    if (Number.isNaN(new Date(payload.createdAt).getTime())) {
      Alert.alert('时间格式不正确', '请选择有效的日期时间');
      return;
    }

    if (isEdit) {
      await onUpdate(payload);
    } else {
      await onAdd(payload);
    }
    navigation.goBack();
  };

  const handleIosDateChange = (_, selectedDate) => {
    if (selectedDate) {
      setCreatedAtDate(selectedDate);
    }
  };

  const openAndroidDateTimePicker = () => {
    const currentValue = createdAtDate;

    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      is24Hour: true,
      onChange: (dateEvent, selectedDate) => {
        if (dateEvent.type !== 'set' || !selectedDate) {
          return;
        }

        const mergedDate = new Date(currentValue);
        mergedDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

        DateTimePickerAndroid.open({
          value: mergedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== 'set' || !selectedTime) {
              return;
            }

            const finalDate = new Date(mergedDate);
            finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            setCreatedAtDate(finalDate);
          },
        });
      },
    });
  };

  const handlePressDateField = () => {
    if (Platform.OS === 'ios') {
      setShowIosPicker((prev) => !prev);
      return;
    }
    openAndroidDateTimePicker();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{isEdit ? '编辑记录' : '新增记录'}</Text>
      {!isEdit && (
        <>
          <Text style={styles.label}>记录类型</Text>
          <View style={styles.row}>
            {RECORD_TYPE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.typeBtn, type === item.key && styles.typeBtnActive]}
                onPress={() => setType(item.key)}
              >
                <Text style={[styles.typeText, type === item.key && styles.typeTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {isEdit && (
        <View style={styles.readonlyTypeBox}>
          <Text style={styles.readonlyTypeLabel}>记录类型</Text>
          <Text style={styles.readonlyTypeValue}>{RECORD_TYPE_OPTIONS.find((item) => item.key === type)?.label || type}</Text>
        </View>
      )}

      <Text style={styles.label}>记录时间</Text>
      <TouchableOpacity style={styles.dateField} onPress={handlePressDateField}>
        <Text style={styles.dateFieldText}>{formatDateTime(createdAtDate)}</Text>
        <Text style={styles.dateFieldHint}>{Platform.OS === 'ios' ? (showIosPicker ? '收起时间选择' : '点击展开时间选择') : '点击选择日期和时间'}</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIosPicker && (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={createdAtDate}
            mode="datetime"
            display="spinner"
            onChange={handleIosDateChange}
          />
        </View>
      )}

      {type === RECORD_TYPES.WEIGHT && (
        <>
          <Text style={styles.label}>体重（g）</Text>
          <TextInput style={styles.input} placeholder="输入体重（g）" value={value} onChangeText={setValue} keyboardType="numeric" />
        </>
      )}

      {type === RECORD_TYPES.FEEDING && (
        <>
          <Text style={styles.label}>食物</Text>
          <TextInput style={styles.input} placeholder="食物，例如 龟粮/虾/螺" value={food} onChangeText={setFood} />
          <Text style={styles.label}>喂食量</Text>
          <TextInput style={styles.input} placeholder="喂食量，例如 少量/3粒/5g" value={amount} onChangeText={setAmount} />
          <Text style={styles.label}>是否吃完</Text>
          <View style={styles.inlineChoiceRow}>
            {['是', '否'].map((item) => (
              <TouchableOpacity key={item} style={[styles.inlineChoiceBtn, finished === item && styles.inlineChoiceBtnActive]} onPress={() => setFinished(item)}>
                <Text style={[styles.inlineChoiceText, finished === item && styles.inlineChoiceTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>喂食摘要</Text>
          <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={setValue} />
        </>
      )}

      {type === RECORD_TYPES.WATER && (
        <>
          <Text style={styles.label}>换水类型</Text>
          <TextInput style={styles.input} placeholder="换水类型，例如 部分换水/全换" value={changeType} onChangeText={setChangeType} />
          <Text style={styles.label}>换水百分比</Text>
          <TextInput style={styles.input} placeholder="换水百分比，例如 30" value={percent} onChangeText={setPercent} keyboardType="numeric" />
          <Text style={styles.label}>盐度（可选）</Text>
          <TextInput style={styles.input} placeholder="盐度（可选）" value={salinity} onChangeText={setSalinity} />
          <Text style={styles.label}>换水摘要</Text>
          <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={setValue} />
        </>
      )}

      {type === RECORD_TYPES.STATUS && (
        <>
          <Text style={styles.label}>状态标签</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {STATUS_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.tagBtn, status === item && styles.tagBtnActive]}
                onPress={() => {
                  setStatus(item);
                  setAppetite(getAutoAppetiteByStatus(item));
                }}
              >
                <Text style={[styles.tagText, status === item && styles.tagTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.label}>食欲</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={appetite} onValueChange={setAppetite} style={styles.picker}>
              {STATUS_APPETITE_OPTIONS.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>状态摘要</Text>
          <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={setValue} />
        </>
      )}

      {type === RECORD_TYPES.WINTER && (
        <>
          <Text style={styles.label}>冬眠阶段</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {WINTER_OPTIONS.map((item) => {
              const badgeStyle = ['自然冬眠', '浅冬化'].includes(item)
                ? styles.badgeDanger
                : ['出眠', '已开食'].includes(item)
                  ? styles.badgeInfo
                  : null;

              return (
                <TouchableOpacity key={item} style={[styles.tagBtn, styles.winterTagBtn, phase === item && styles.tagBtnActive]} onPress={() => setPhase(item)}>
                  {!!badgeStyle && <View style={[styles.phaseBadgeDot, badgeStyle]} />}
                  <Text style={[styles.tagText, phase === item && styles.tagTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.label}>环境温度（℃）</Text>
          <TextInput style={styles.input} placeholder="环境温度（℃）" value={temperature} onChangeText={setTemperature} keyboardType="numeric" />
          <Text style={styles.label}>冬眠摘要</Text>
          <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={setValue} />
        </>
      )}

      {!Object.values(RECORD_TYPES).includes(type) && (
        <>
          <Text style={styles.label}>记录内容</Text>
          <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={setValue} />
        </>
      )}

      <Text style={styles.label}>备注</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="备注" value={note} onChangeText={setNote} multiline />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{isEdit ? '保存修改' : '保存记录'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  label: { fontSize: 15, color: '#374151', marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  typeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  typeBtnActive: { backgroundColor: '#0f766e' },
  typeText: { color: '#374151', fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  readonlyTypeBox: {
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  readonlyTypeLabel: {
    color: '#0f766e',
    fontSize: 12,
    marginBottom: 4,
  },
  readonlyTypeValue: {
    color: '#115e59',
    fontWeight: '700',
    fontSize: 15,
  },
  dateField: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dateFieldText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  dateFieldHint: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 6,
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#111827',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tagScroll: { marginBottom: 12 },
  tagBtn: {
    backgroundColor: '#e5e7eb',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  winterTagBtn: {
    position: 'relative',
    overflow: 'visible',
  },
  phaseBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  badgeDanger: {
    backgroundColor: '#dc2626',
  },
  badgeInfo: {
    backgroundColor: '#2563eb',
  },
  tagBtnActive: { backgroundColor: '#0f766e' },
  tagText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  tagTextActive: { color: '#fff' },
  inlineChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inlineChoiceBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inlineChoiceBtnActive: {
    backgroundColor: '#0f766e',
  },
  inlineChoiceText: {
    color: '#374151',
    fontWeight: '600',
  },
  inlineChoiceTextActive: {
    color: '#fff',
  },
});
