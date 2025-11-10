import { useCallback } from 'react';
import { useFields } from './useFields';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import type { IRankingConfig } from '../types';

/**
 * 可导出的配置数据结构
 */
interface IExportableConfig {
  version: '1.0';
  config: IRankingConfig;
  metadata: {
    exportDate: string;
    tableName?: string;
    tableId?: string;
    baseId?: string;
    fieldNames: {
      [fieldId: string]: string;
    };
  };
}

/**
 * 配置导入结果
 */
interface IConfigImportResult {
  success: boolean;
  config?: IRankingConfig;
  warnings: string[];
  errors: string[];
}

/**
 * 配置导出/导入 Hook
 */
export function useConfigExportImport() {
  const { data: fields } = useFields();
  const urlParams = useGlobalUrlParams();

  /**
   * 导出配置为 JSON 字符串
   */
  const exportConfig = useCallback((config: IRankingConfig): string => {
    const exportData: IExportableConfig = {
      version: '1.0',
      config,
      metadata: {
        exportDate: new Date().toISOString(),
        tableId: urlParams.tableId,
        baseId: urlParams.baseId,
        fieldNames: fields?.reduce((map, field) => {
          map[field.id] = field.name;
          return map;
        }, {} as Record<string, string>) || {},
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [fields, urlParams]);

  /**
   * 下载配置为 JSON 文件
   */
  const downloadConfig = useCallback((config: IRankingConfig, filename?: string) => {
    try {
      const configJson = exportConfig(config);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const defaultFilename = filename || `ranking-config-${new Date().toISOString().split('T')[0]}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Failed to download config:', error);
      return { success: false, error: String(error) };
    }
  }, [exportConfig]);

  /**
   * 从 JSON 字符串导入配置
   */
  const importConfigFromJson = useCallback((jsonString: string): IConfigImportResult => {
    const result: IConfigImportResult = {
      success: false,
      warnings: [],
      errors: [],
    };

    try {
      const importedData: IExportableConfig = JSON.parse(jsonString);

      // 版本检查
      if (!importedData.version) {
        result.errors.push('Missing version information');
        return result;
      }

      if (importedData.version !== '1.0') {
        result.warnings.push(`Imported config version ${importedData.version} may not be fully compatible`);
      }

      // 验证配置结构
      if (!importedData.config) {
        result.errors.push('Missing configuration data');
        return result;
      }

      const config = importedData.config;

      // 验证必需字段
      if (!config.sourceColumnId || !config.targetColumnId) {
        result.errors.push('Missing required fields: sourceColumnId and targetColumnId');
        return result;
      }

      // 验证字段值
      if (!Array.isArray(['asc', 'desc']).includes(config.sortDirection)) {
        result.errors.push('Invalid sortDirection value');
        return result;
      }

      if (!Array.isArray(['standard', 'dense']).includes(config.rankingMethod)) {
        result.errors.push('Invalid rankingMethod value');
        return result;
      }

      if (!Array.isArray(['skipZero', 'includeZero']).includes(config.zeroValueHandling)) {
        result.errors.push('Invalid zeroValueHandling value');
        return result;
      }

      // 验证字段是否存在（如果有字段数据）
      if (fields && fields.length > 0) {
        const fieldIds = new Set(fields.map(f => f.id));

        if (!fieldIds.has(config.sourceColumnId)) {
          result.warnings.push(`Source field with ID ${config.sourceColumnId} may not exist in current table`);
        }

        if (!fieldIds.has(config.targetColumnId)) {
          result.warnings.push(`Target field with ID ${config.targetColumnId} may not exist in current table`);
        }

        if (config.groupColumnId && !fieldIds.has(config.groupColumnId)) {
          result.warnings.push(`Group field with ID ${config.groupColumnId} may not exist in current table`);
        }
      }

      // 如果源字段和目标字段相同，这是一个错误
      if (config.sourceColumnId === config.targetColumnId) {
        result.errors.push('Source field and target field cannot be the same');
        return result;
      }

      result.success = true;
      result.config = config;

    } catch (error) {
      result.errors.push(`Invalid JSON format: ${String(error)}`);
    }

    return result;
  }, [fields]);

  /**
   * 从文件导入配置
   */
  const importConfigFromFile = useCallback((file: File): Promise<IConfigImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const jsonString = event.target?.result as string;
        if (jsonString) {
          const result = importConfigFromJson(jsonString);
          resolve(result);
        } else {
          resolve({
            success: false,
            errors: ['Failed to read file content'],
            warnings: [],
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Failed to read file'],
          warnings: [],
        });
      };

      reader.readAsText(file);
    });
  }, [importConfigFromJson]);

  /**
   * 生成配置分享链接
   */
  const generateShareLink = useCallback((config: IRankingConfig): string => {
    const encodedConfig = btoa(JSON.stringify(config));
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('rankingConfig', encodedConfig);
    return currentUrl.toString();
  }, []);

  /**
   * 从 URL 参数导入配置
   */
  const importConfigFromUrl = useCallback((): IRankingConfig | null => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedConfig = urlParams.get('rankingConfig');

      if (!encodedConfig) {
        return null;
      }

      const configString = atob(encodedConfig);
      const config: IRankingConfig = JSON.parse(configString);

      // 基本验证
      if (config.sourceColumnId && config.targetColumnId &&
          ['asc', 'desc'].includes(config.sortDirection) &&
          ['standard', 'dense'].includes(config.rankingMethod) &&
          ['skipZero', 'includeZero'].includes(config.zeroValueHandling)) {
        return config;
      }

      return null;
    } catch (error) {
      console.error('Failed to import config from URL:', error);
      return null;
    }
  }, []);

  return {
    exportConfig,
    downloadConfig,
    importConfigFromJson,
    importConfigFromFile,
    generateShareLink,
    importConfigFromUrl,
  };
}