/**
 * 权重表文件
 * 用于 Agent B 病毒匹配时的权重参考
 * 版本：v1.0
 */

export const WEIGHT_TABLE = {
  version: 'v1.0',
  updatedAt: '2026-05-16',
  description: '蚁群认知病毒权重表 - 基于初期样本和专家经验',
  viruses: {
    // 工具本位病毒
    '工具效率型': 0.8,
    '工具依赖型': 0.6,
    '工具创造型': 0.4,
    
    // 本质主义病毒
    '深度追问型': 0.9,
    '模型映射型': 0.7,
    '反常识型': 0.5,
    
    // 模块化病毒
    '分解触发型': 0.8,
    '接口标准化型': 0.6,
    '模块复用型': 0.4,
    
    // 结果导向病毒
    '量化思维型': 0.9,
    '关键路径型': 0.7,
    '结果可视化型': 0.5,
    
    // 迭代式病毒
    '迭代优先型': 0.8,
    '反馈闭环型': 0.6,
    '版本管理型': 0.4,
    
    // 边界思维病毒
    '约束创新型': 0.9,
    '责任界定型': 0.7,
    '系统思维型': 0.5,
  },
  
  // 归因关键词强制对应表
  forcedMapping: {
    '从不质疑': '深度追问型',
    '拒绝使用': '工具效率型',
    '一团乱麻': '分解触发型',
    '缺乏目标': '量化思维型',
    '害怕修改': '迭代优先型',
    '没有边界': '约束创新型',
    '依赖捷径': '反常识型',
    '责任扩散': '责任界定型',
  },
  
  // 病毒类型默认变体（当归因未命中关键词时使用）
  defaultVariants: {
    '工具本位病毒': '工具效率型',
    '本质主义病毒': '深度追问型',
    '模块化病毒': '分解触发型',
    '结果导向病毒': '量化思维型',
    '迭代式病毒': '迭代优先型',
    '边界思维病毒': '约束创新型',
  },
  
  // 权重更新记录
  updateHistory: [
    {
      version: 'v1.0',
      date: '2026-05-16',
      changes: '初始版本，基于专家经验设定',
    },
  ],
};

/**
 * 获取病毒权重
 */
export function getVirusWeight(virusName) {
  return WEIGHT_TABLE.viruses[virusName] || 0.5;
}

/**
 * 根据归因关键词获取强制匹配的病毒变体
 */
export function getForcedVariant(keyword) {
  return WEIGHT_TABLE.forcedMapping[keyword] || null;
}

/**
 * 获取病毒类型的默认变体
 */
export function getDefaultVariant(virusType) {
  return WEIGHT_TABLE.defaultVariants[virusType] || null;
}

/**
 * 导出当前权重版本号
 */
export const CURRENT_WEIGHT_VERSION = WEIGHT_TABLE.version;