'use client';
import { useTranslation } from 'react-i18next';
import { Label } from '@teable/ui-lib/dist/shadcn/ui/label';
import { RadioGroup, RadioGroupItem } from '@teable/ui-lib/dist/shadcn/ui/radio-group';
import { IRankingConfig } from './types';

interface IRankingConfigProps {
  config: IRankingConfig;
  onConfigChange: (config: Partial<IRankingConfig>) => void;
  disabled?: boolean;
}

export function RankingConfig({ config, onConfigChange, disabled }: IRankingConfigProps) {
  const { t } = useTranslation('common');

  const handleSortDirectionChange = (value: 'asc' | 'desc') => {
    onConfigChange({ sortDirection: value });
  };

  const handleRankingMethodChange = (value: 'standard' | 'dense') => {
    onConfigChange({ rankingMethod: value });
  };

  const handleZeroValueHandlingChange = (value: 'skipZero' | 'includeZero') => {
    onConfigChange({ zeroValueHandling: value });
  };

  return (
    <div className="space-y-6">
      {/* 排序方向 */}
      <div className="space-y-3">
        <Label>{t('ranking.sortDirection', '排序方向')}</Label>
        <RadioGroup
          value={config.sortDirection}
          onValueChange={handleSortDirectionChange}
          disabled={disabled}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="asc" id="asc" />
            <Label htmlFor="asc">{t('ranking.ascending', '升序')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="desc" id="desc" />
            <Label htmlFor="desc">{t('ranking.descending', '降序')}</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 排名方式 */}
      <div className="space-y-3">
        <Label>{t('ranking.rankingMethod', '排名方式')}</Label>
        <RadioGroup
          value={config.rankingMethod}
          onValueChange={handleRankingMethodChange}
          disabled={disabled}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard">
              {t('ranking.standardRanking', '标准排名')} (1,2,2,4)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dense" id="dense" />
            <Label htmlFor="dense">
              {t('ranking.denseRanking', '密集排名')} (1,2,2,3)
            </Label>
          </div>
                  </RadioGroup>
      </div>

      {/* 0值处理 */}
      <div className="space-y-3">
        <Label>{t('ranking.zeroValueHandling', '0值处理')}</Label>
        <RadioGroup
          value={config.zeroValueHandling}
          onValueChange={handleZeroValueHandlingChange}
          disabled={disabled}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="skipZero" id="skipZero" />
            <Label htmlFor="skipZero">
              {t('ranking.skipZero', '跳过 0 值')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="includeZero" id="includeZero" />
            <Label htmlFor="includeZero">
              {t('ranking.includeZero', '包含 0 值')}
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}