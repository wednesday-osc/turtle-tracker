import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { WINTER_CONSTITUTION_OPTIONS } from '../constants';
import { formatInputDate, parseDateRangeToUtc, toPickerDate } from '../utils/date';

const GENDER_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '雄性', value: '雄性' },
  { label: '雌性', value: '雌性' },
];

export default function AddTurtleScreen({ navigation, route, onAdd, onUpdate }) {
  const editingTurtle = route.params?.turtle;
  const isEdit = route.params?.mode === 'edit' && !!editingTurtle;

  const [name, setName] = useState(editingTurtle?.name || '');
  const [species, setSpecies] = useState(editingTurtle?.species || '');
  const [gender, setGender] = useState(editingTurtle?.gender || '');
  const [shellLength, setShellLength] = useState(editingTurtle?.shellLength || '');
  const [weight, setWeight] = useState(editingTurtle?.weight || '');
  const [arrivalDate, setArrivalDate] = useState(editingTurtle?.arrivalDate ? formatInputDate(editingTurtle.arrivalDate) : '');
  const [arrivalDatePickerValue, setArrivalDatePickerValue] = useState(editingTurtle?.arrivalDate ? toPickerDate(editingTurtle.arrivalDate) : new Date());
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [source, setSource] = useState(editingTurtle?.source || '');
  const [ageEstimate, setAgeEstimate] = useState(editingTurtle?.ageEstimate || '');
  const [tags, setTags] = useState(editingTurtle?.tags || '');
  const [winterConstitution, setWinterConstitution] = useState(editingTurtle?.winterConstitution || '待观察');
  const [note, setNote] = useState(editingTurtle?.note || '');

  const pageTitle = useMemo(() => (isEdit ? '编辑龟档案' : '新增龟档案'), [isEdit]);

  const updateArrivalDate = (selectedDate) => {
    if (!selectedDate) return;
    setArrivalDatePickerValue(selectedDate);
    setArrivalDate(formatInputDate(selectedDate.toISOString()));
  };

  const openAndroidArrivalDatePicker = () => {
    DateTimePickerAndroid.open({
      value: arrivalDatePickerValue,
      mode: 'date',
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }
        updateArrivalDate(selectedDate);
      },
    });
  };

  const handlePressArrivalDate = () => {
    if (Platform.OS === 'ios') {
      setShowIosDatePicker((prev) => !prev);
      return;
    }
    openAndroidArrivalDatePicker();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('无法保存', '请先填写龟名称');
      return;
    }

    const arrivalDateUtc = arrivalDate ? parseDateRangeToUtc(arrivalDate, false) : '';
    if (arrivalDate && !arrivalDateUtc) {
      Alert.alert('无法保存', '到家日期请通过日期组件选择，或使用 YYYY-MM-DD 格式');
      return;
    }

    const payload = {
      id: editingTurtle?.id || Date.now().toString(),
      name: name.trim(),
      species: species.trim(),
      gender: gender.trim(),
      shellLength: shellLength.trim(),
      weight: weight.trim(),
      arrivalDate: arrivalDateUtc || '',
      source: source.trim(),
      ageEstimate: ageEstimate.trim(),
      tags: tags.trim(),
      winterConstitution: winterConstitution.trim(),
      note: note.trim(),
    };

    if (isEdit) {
      await onUpdate(payload);
    } else {
      await onAdd(payload);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{pageTitle}</Text>

      <Text style={styles.label}>龟名称</Text>
      <TextInput style={styles.input} placeholder="请输入龟名称" value={name} onChangeText={setName} />

      <Text style={styles.label}>品种</Text>
      <TextInput style={styles.input} placeholder="请输入品种" value={species} onChangeText={setSpecies} />

      <Text style={styles.label}>性别</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={gender} onValueChange={setGender}>
          {GENDER_OPTIONS.map((item) => (
            <Picker.Item key={item.value || 'empty'} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>背甲长（cm）</Text>
      <TextInput style={styles.input} placeholder="请输入背甲长" value={shellLength} onChangeText={setShellLength} keyboardType="numeric" />

      <Text style={styles.label}>体重（g）</Text>
      <TextInput style={styles.input} placeholder="请输入体重" value={weight} onChangeText={setWeight} keyboardType="numeric" />

      <Text style={styles.label}>到家日期</Text>
      <TouchableOpacity style={styles.dateField} onPress={handlePressArrivalDate}>
        <Text style={styles.dateFieldText}>{arrivalDate || '请选择到家日期'}</Text>
        <Text style={styles.dateFieldHint}>{Platform.OS === 'ios' ? (showIosDatePicker ? '收起日期选择' : '点击展开日期选择') : '点击选择日期'}</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIosDatePicker && (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={arrivalDatePickerValue}
            mode="date"
            display="spinner"
            onChange={(_, selectedDate) => selectedDate && updateArrivalDate(selectedDate)}
          />
        </View>
      )}

      <Text style={styles.label}>来源</Text>
      <TextInput style={styles.input} placeholder="例如 龟友转让 / 龟店" value={source} onChangeText={setSource} />

      <Text style={styles.label}>年龄估计</Text>
      <TextInput style={styles.input} placeholder="例如 亚成 / 成体 / 约 3 岁" value={ageEstimate} onChangeText={setAgeEstimate} />

      <Text style={styles.label}>备注标签</Text>
      <TextInput style={styles.input} placeholder="多个标签用逗号分隔" value={tags} onChangeText={setTags} />

      <Text style={styles.label}>是否冬眠体质</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={winterConstitution} onValueChange={setWinterConstitution}>
          {WINTER_CONSTITUTION_OPTIONS.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>备注</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="备注" value={note} onChangeText={setNote} multiline />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{isEdit ? '保存修改' : '保存'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  label: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dateField: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dateFieldText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  dateFieldHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 6,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
