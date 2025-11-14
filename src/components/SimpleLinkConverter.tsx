'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@teable/ui-lib/dist/shadcn/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib/dist/shadcn/ui/select';
import { Progress } from '@teable/ui-lib/dist/shadcn/ui/progress';
import { toast } from 'sonner';
import {
  ArrowUp,
  AlertCircle,
  Sheet,
  ClipboardList as Form,
  LayoutGrid as Gallery,
  Kanban,
  Calendar,
  A,
  LongText,
  File,
} from '@teable/icons';
import * as openApi from '@teable/openapi';
import { AttachmentUploader, IUploadResult } from '@/utils/attachmentUploader';
import { extractUrls } from '@/utils/urlExtractor';
import { useViews } from '@/hooks/useViews';
import { useGlobalUrlParams } from '@/hooks/useGlobalUrlParams';

interface ConversionResult {
  recordId: string;
  urlCount: number;
  successCount: number;
  failedUrls: string[];
  errors: string[];
}

export function SimpleLinkConverter() {
  const { t } = useTranslation('common');
  const { tableId } = useGlobalUrlParams();

  // Configuration states
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const [selectedUrlField, setSelectedUrlField] = useState<string>('');
  const [selectedAttachmentField, setSelectedAttachmentField] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ success: 0, failed: 0, processing: 0 });

  // Initialize AttachmentUploader
  const [uploader] = useState(() => new AttachmentUploader({
    timeout: 30000,
    retryCount: 2,
    retryDelay: 1000,
    preserveOriginalLink: true,
    maxConcurrency: 3,
    onComplete: (result: IUploadResult) => {
      // Upload completed callback
      if (process.env.NODE_ENV === 'development') {
        console.log(`Upload completed for ${result.originalUrl}:`, result);
      }
    },
    onError: (url: string, error: string) => {
      // Upload error callback - always log errors
      console.error(`Upload error for ${url}:`, error);
    }
  }));


  // Fetch table fields and records
  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['table-fields', tableId],
    queryFn: async () => {
      if (!tableId) return [];
      const { data } = await openApi.getFields(tableId);
      return data;
    },
    enabled: !!tableId,
  });

  // Get views
  const { data: views = [], isLoading: viewsLoading } = useViews();

  // Filter fields by type (memoized for performance)
  const textFields = useMemo(() => 
    fields?.filter(field =>
      field.type === 'longText' || field.type === 'singleLineText'
    ) || [],
    [fields]
  );

  const attachmentFields = useMemo(() => 
    fields?.filter(field => field.type === 'attachment') || [],
    [fields]
  );

  // Get selected field objects (memoized)
  const urlField = useMemo(() => 
    fields?.find(f => f.id === selectedUrlField),
    [fields, selectedUrlField]
  );
  
  const attachmentField = useMemo(() => 
    fields?.find(f => f.id === selectedAttachmentField),
    [fields, selectedAttachmentField]
  );

  // Check if configuration is valid
  const isConfigValid = Boolean(selectedViewId && selectedUrlField && selectedAttachmentField && urlField && attachmentField);

  // Get view icon based on view type (memoized)
  const getViewIcon = useCallback((viewType: string) => {
    const iconClassName = "w-4 h-4";

    switch (viewType) {
      case 'grid':
        return <Sheet className={iconClassName} />;
      case 'form':
        return <Form className={iconClassName} />;
      case 'gallery':
        return <Gallery className={iconClassName} />;
      case 'kanban':
        return <Kanban className={iconClassName} />;
      case 'component':
        return <Calendar className={iconClassName} />; // 使用 Calendar 图标代替 Component
      case 'calendar':
        return <Calendar className={iconClassName} />;
      default:
        return <Sheet className={iconClassName} />; // 默认使用 grid 图标
    }
  }, []);

  // Get field icon based on field type (memoized)
  const getFieldIcon = useCallback((fieldType: string, cellValueType?: string) => {
    const type = fieldType?.toLowerCase() || '';
    const cellType = cellValueType?.toLowerCase() || '';
    
    // 检查字段类型
    if (type === 'singlelinetext' || cellType === 'singlelinetext' || type === 'a') {
      return <A className="w-4 h-4" />;
    }
    if (type === 'longtext' || cellType === 'longtext') {
      return <LongText className="w-4 h-4" />;
    }
    
    return <A className="w-4 h-4" />; // 默认图标
  }, []);

  
  // 使用真正的uploadAttachment API进行转换
  const handleConvert = async () => {
    if (!isConfigValid) {
      toast.error(t('converter.configIncomplete'), {
        description: t('converter.selectViewUrlAndAttachmentFields')
      });
      return;
    }

    if (!tableId) {
      toast.error(t('converter.tableIdUnavailable'), {
        description: t('converter.cannotGetTableInfo')
      });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setStats({ success: 0, failed: 0, processing: 0 });

    try {
      // 点击开始转换时才查询记录
      const recordsResponse = await openApi.getRecords(tableId, selectedViewId ? { viewId: selectedViewId } : undefined);
      const records = recordsResponse.data.records;

      if (!records || records.length === 0) {
        toast.error(t('converter.noRecordsToProcess'), {
          description: t('converter.noRecordsInView')
        });
        setIsConverting(false);
        return;
      }

      const results: ConversionResult[] = [];
      const totalRecords = records.length;
      let totalUrls = 0;
      let processedCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record) continue;

        // Try to get URL from field by ID first, then by field name
        const text = (record.fields[selectedUrlField] || record.fields[urlField?.name || ''] || '') as string;
        const urls = extractUrls(text);

        if (urls.length === 0) continue;

        totalUrls += urls.length;
        const result: ConversionResult = {
          recordId: record.id,
          urlCount: urls.length,
          successCount: 0,
          failedUrls: [],
          errors: []
        };

        // Process each URL using the new uploader
        for (const url of urls) {
          processedCount++;
          setStats(prev => ({ ...prev, processing: totalUrls - processedCount }));
          try {
            // Use the new AttachmentUploader with fileUrl method
            // 文件名由服务器端从 URL 或响应头中提取，不需要客户端处理
            const uploadResult = await uploader.uploadFromUrl(
              url,
              '', // 不传递文件名，让服务器端处理
              tableId,
              record!.id,
              selectedAttachmentField
            );

            if (uploadResult.success) {
              result.successCount++;
              setStats(prev => {
                const newStats = { ...prev };
                newStats.success += 1;
                newStats.processing -= 1;
                return newStats;
              });
            } else {
              result.failedUrls.push(url);
              result.errors.push(uploadResult.error || 'Upload failed');
              setStats(prev => {
                const newStats = { ...prev };
                newStats.failed += 1;
                newStats.processing -= 1;
                return newStats;
              });
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.failedUrls.push(url);
            result.errors.push(errorMessage);
            setStats(prev => {
              const newStats = { ...prev };
              newStats.failed += 1;
              newStats.processing -= 1;
              return newStats;
            });
          }
        }

        if (result.urlCount > 0) {
          results.push(result);
        }

        setProgress(((i + 1) / totalRecords) * 100);
      }

      // Show success message
      toast.success(t('converter.conversionCompleted'), {
        description: t('converter.foundLinksProcessed', { total: totalUrls, success: stats.success })
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Conversion error:', error);
      toast.error(t('converter.conversionFailed'), {
        description: `${t('converter.errorDuringConversion')}: ${errorMessage}`
      });
    } finally {
      setIsConverting(false);
      setStats(prev => ({ ...prev, processing: 0 }));
    }
  };

  if (!tableId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">{t('converter.pluginInitializing')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('converter.gettingTableInfo')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 只在初始加载时显示加载状态
  if (fieldsLoading || viewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">{t('converter.loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* 选择视图 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t('converter.selectView')}</label>
        <Select value={selectedViewId} onValueChange={setSelectedViewId} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectViewPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {views.length === 0 ? (
              <SelectItem value="no-views" disabled>{t('converter.noViewsFound')}</SelectItem>
            ) : (
              views.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2">
                    {getViewIcon(view.type)}
                    <span>{view.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 选择 URL字段 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t('converter.selectUrlField')}</label>
        <Select value={selectedUrlField} onValueChange={setSelectedUrlField} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {textFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>{t('converter.noTextFieldsFound')}</SelectItem>
            ) : (
              textFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    {getFieldIcon(field.type, field.cellValueType)}
                    <span>{field.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 选择附件字段 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t('converter.selectAttachmentField')}</label>
        <Select value={selectedAttachmentField} onValueChange={setSelectedAttachmentField} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {attachmentFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>{t('converter.noAttachmentFieldsFound')}</SelectItem>
            ) : (
              attachmentFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span>{field.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 配置提示 */}
      {!isConfigValid && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <AlertCircle className="inline-block w-4 h-4 mr-1" />
          {t('converter.pleaseSelectFields')}
        </div>
      )}

      {/* 开始转换按钮 */}
      <Button
        onClick={handleConvert}
        disabled={!isConfigValid || isConverting}
        className="w-full"
        size="lg"
      >
        {isConverting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {t('converter.converting')}
          </>
        ) : (
          <>
            <ArrowUp className="w-4 h-4 mr-2" />
            {t('converter.startConversion')}
          </>
        )}
      </Button>

      {/* 转换进度 */}
      {(isConverting || stats.success > 0 || stats.failed > 0) && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
            📈 {t('converter.conversionProgress')}
          </div>
          {isConverting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{t('converter.progress')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <div className="flex gap-6 text-sm">
            <span className="text-green-600">{t('converter.successful')}: {stats.success}{t('converter.countUnit')}</span>
            {stats.failed > 0 && <span className="text-red-600">{t('converter.failed')}: {stats.failed}{t('converter.countUnit')}</span>}
            {stats.processing > 0 && <span className="text-blue-600">{t('converter.processing')}: {stats.processing}{t('converter.countUnit')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}