'use client';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib/dist/shadcn/ui/select';
import { Label } from '@teable/ui-lib/dist/shadcn/ui/label';
import { useFields } from '../../hooks/useFields';
import { IRankingConfig, IField } from '../../types';
import { Hash, Check, Calendar, Users, Search } from '@teable/icons';

interface IGroupFieldSelectorProps {
  config: IRankingConfig;
  onConfigChange: (config: Partial<IRankingConfig>) => void;
  disabled?: boolean;
}

export function GroupFieldSelector({ config, onConfigChange, disabled }: IGroupFieldSelectorProps) {
  const { t } = useTranslation('common');

  // 使用集中式字段数据获取
  const { data: fields } = useFields();

  // 字段类型图标映射
  const getFieldTypeIcon = (field: IField) => {
    // 查找字段使用Search图标
    if (field.isLookup || field.isConditionalLookup) {
      return Search;
    }
    // 日期字段使用Calendar图标
    if (field.type === 'date' || field.type === 'dateTime') {
      return Calendar;
    }
    // 用户字段使用Users图标
    if (field.type === 'user' || field.type === 'createdBy' || field.type === 'lastModifiedBy') {
      return Users;
    }
    // 单选字段使用Check图标
    if (field.type === 'singleSelect' || field.type === 'multipleSelect') {
      return Check;
    }
    // 默认使用Hash图标
    return Hash;
  };

  // 获取字段类型显示文本
  const getFieldTypeText = (field: IField) => {
    // 基于字段属性来判断可分组的类型
    if (field.isLookup || field.isConditionalLookup) {
      return t('ranking.fieldType.lookup', '查找字段');
    }
    if (field.type === 'singleSelect') {
      return t('ranking.fieldType.singleSelect', '单选字段');
    }
    if (field.type === 'multipleSelect') {
      return t('ranking.fieldType.multipleSelect', '多选字段');
    }
    if (field.type === 'date' || field.type === 'dateTime') {
      return t('ranking.fieldType.date', '日期字段');
    }
    if (field.type === 'user' || field.type === 'createdBy' || field.type === 'lastModifiedBy') {
      return t('ranking.fieldType.user', '用户字段');
    }
    if (field.cellValueType === 'string') {
      return t('ranking.fieldType.text', '文本字段');
    }
    if (field.cellValueType === 'number') {
      return t('ranking.fieldType.number', '数字字段');
    }
    return t('ranking.fieldType.unknown', '未知类型');
  };

  // 过滤出可用于分组的字段类型
  const groupableFields = fields?.filter((field: IField) => {
    // 排除已选择的源字段和目标字段
    if (field.id === config.sourceColumnId || field.id === config.targetColumnId) {
      return false;
    }

    // 支持分组的字段类型
    const isGroupableField =
      field.cellValueType === 'string' ||           // 文本字段
      field.type === 'singleSelect' ||              // 单选字段
      field.type === 'multipleSelect' ||            // 多选字段
      field.type === 'date' ||                      // 日期字段
      field.type === 'dateTime' ||                  // 日期时间字段
      field.type === 'user' ||                      // 用户字段
      field.type === 'createdBy' ||                 // 创建人字段
      field.type === 'lastModifiedBy' ||            // 修改人字段
      field.isLookup === true ||                    // 查找字段
      field.isConditionalLookup === true;           // 条件查找字段

    return isGroupableField;
  }) || [];

  // 处理字段选择变化
  const handleGroupFieldChange = (fieldId: string) => {
    if (fieldId === 'none') {
      // 显式传递 undefined 来删除 groupColumnId 属性
      // handleConfigChange 会删除值为 undefined 的可选属性
      onConfigChange({ groupColumnId: undefined } as unknown as Partial<IRankingConfig>);
    } else {
      onConfigChange({ ...config, groupColumnId: fieldId });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="group-field" className="text-sm font-medium">
        {t('ranking.groupColumn', '分组字段')}
      </Label>
      <Select
        value={config.groupColumnId || 'none'}
        onValueChange={handleGroupFieldChange}
        disabled={disabled || false}
      >
        <SelectTrigger id="group-field" className="w-full">
          <SelectValue placeholder={t('ranking.groupFieldPlaceholder', '选择分组字段（可选）')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <span>{t('ranking.noGrouping', '不分组')}</span>
            </div>
          </SelectItem>

          {groupableFields.map((field: IField) => {
            const IconComponent = getFieldTypeIcon(field);
            return (
              <SelectItem key={field.id} value={field.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4 text-blue-500" />
                    <span>{field.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {getFieldTypeText(field)}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {groupableFields.length === 0 && fields && fields.length > 0 && (
        <p className="text-sm text-amber-600">
          {t('ranking.noGroupFields', '未找到可用于分组的字段')}
        </p>
      )}

      {config.groupColumnId && (
        <p className="text-sm text-blue-600">
          {t('ranking.groupingHint', '排名将在每个分组内分别计算')}
        </p>
      )}
    </div>
  );
}