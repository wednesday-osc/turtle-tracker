export const STORAGE_KEYS = {
  TURTLES: 'turtles',
  RECORDS: 'records',
  SETTINGS: 'settings',
};

export const RECORD_TYPES = {
  WEIGHT: 'weight',
  FEEDING: 'feeding',
  WATER: 'water',
  STATUS: 'status',
  WINTER: 'winter',
};

export const RECORD_TYPE_OPTIONS = [
  { key: RECORD_TYPES.WEIGHT, label: '体重' },
  { key: RECORD_TYPES.FEEDING, label: '喂食' },
  { key: RECORD_TYPES.WATER, label: '换水' },
  { key: RECORD_TYPES.STATUS, label: '状态' },
  { key: RECORD_TYPES.WINTER, label: '冬眠' },
];

export const STATUS_OPTIONS = [
  '正常',
  '应激',
  '拒食',
  '闭眼',
  '腐皮/烂甲',
  '浮水异常',
  '呼吸异常',
  '其它',
];

export const STATUS_APPETITE_OPTIONS = ['正常', '异常'];

export const WINTER_OPTIONS = [
  '自然冬眠',
  '浅冬化',
  '入眠观察',
  '出眠',
  '已开食',
];

export const WINTER_CONSTITUTION_OPTIONS = [
  { label: '待观察', value: '待观察' },
  { label: '是', value: '是' },
  { label: '否', value: '否' },
];

export const QUICK_RECORD_OPTIONS = [
  { key: RECORD_TYPES.FEEDING, label: '记喂食' },
  { key: RECORD_TYPES.WATER, label: '记换水' },
  { key: RECORD_TYPES.WEIGHT, label: '记体重' },
  { key: RECORD_TYPES.STATUS, label: '记状态' },
  { key: RECORD_TYPES.WINTER, label: '记冬眠' },
];

export const WINTER_PHASE_TODO_MAP = {
  入眠观察: '继续观察活动量、食欲和环境温度变化',
  自然冬眠: '保持安静环境，定期检查体重和精神状态',
  浅冬化: '留意温度波动，避免频繁打扰',
  出眠: '逐步升温并观察是否恢复活动与晒背',
  已开食: '继续少量多次喂食，观察排便和体重回升',
};

export function getRecordTypeLabel(type) {
  return RECORD_TYPE_OPTIONS.find((item) => item.key === type)?.label || type;
}
