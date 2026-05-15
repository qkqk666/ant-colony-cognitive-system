/**
 * Agent A1：漏洞诊断
 * 输入：六维思维评分（0-10）
 * 输出：漏洞分级说明 + 维度崩塌状态表
 */

export function getA1Prompt(scores) {
  const { tool, essence, modular, result, iterative, boundary } = scores;

  return `# 任务：认知漏洞诊断

## 输入数据
学员六维思维评分（0-10分，10为最高）：
- 工具本位：${tool}
- 本质主义：${essence}
- 模块化：${modular}
- 结果导向：${result}
- 迭代式：${iterative}
- 边界思维：${boundary}

## 输出格式要求
你必须严格按照以下格式输出，不得添加任何解释性前缀。

### 第一部分：漏洞分级说明
用一段话（100-150字）总结该学员的整体思维特征：
1. 指出 **最强维度**（得分最高）和 **最弱维度**（得分最低）
2. 根据各维度得分分布，判断其思维模式属于哪种类型：
   - 均衡型（所有维度≥7）
   - 偏科型（某1-2个维度≤4，其余≥6）
   - 崩塌型（≥3个维度≤4）
   - 待开发型（多数维度在5-7之间，无明显短板）
3. 预测如果短板不补足，在职场中可能遇到的具体风险（举例说明）

### 第二部分：维度崩塌状态表
必须用以下表格形式，一行一个维度，不得合并或省略：

| 维度 | 原始得分 | 分级 | 崩塌状态 | 建议关注点 |
|------|----------|------|----------|------------|
| 工具本位 | ${tool} | ${getLevel(tool)} | ${getCollapse(tool)} | ${getFocus('工具本位', tool)} |
| 本质主义 | ${essence} | ${getLevel(essence)} | ${getCollapse(essence)} | ${getFocus('本质主义', essence)} |
| 模块化 | ${modular} | ${getLevel(modular)} | ${getCollapse(modular)} | ${getFocus('模块化', modular)} |
| 结果导向 | ${result} | ${getLevel(result)} | ${getCollapse(result)} | ${getFocus('结果导向', result)} |
| 迭代式 | ${iterative} | ${getLevel(iterative)} | ${getCollapse(iterative)} | ${getFocus('迭代式', iterative)} |
| 边界思维 | ${boundary} | ${getLevel(boundary)} | ${getCollapse(boundary)} | ${getFocus('边界思维', boundary)} |

**分级标准**：
- 优秀（8-10分）：该维度思维模式成熟，可视为优势
- 良好（6-7分）：该维度表现正常，有提升空间
- 薄弱（4-5分）：该维度存在明显短板，需针对性训练
- 崩塌（0-3分）：该维度思维模式几乎失效，构成重大风险

**崩塌状态**：
- 安全：得分≥6
- 预警：得分4-5
- 崩塌：得分≤3

**建议关注点**：根据维度特性和得分，给出1-2个具体可观察的行为表现。

## 输出示例
（此处省略示例，你只需按格式输出即可）

开始输出：`;
}

// 辅助函数：分级
function getLevel(score) {
  if (score >= 8) return '优秀';
  if (score >= 6) return '良好';
  if (score >= 4) return '薄弱';
  return '崩塌';
}

// 辅助函数：崩塌状态
function getCollapse(score) {
  if (score >= 6) return '安全';
  if (score >= 4) return '预警';
  return '崩塌';
}

// 辅助函数：建议关注点
function getFocus(dimension, score) {
  const map = {
    '工具本位': [
      '安全：能主动寻找工具解决问题',
      '预警：倾向于手动操作，工具使用不熟练',
      '崩塌：拒绝使用工具，认为工具浪费时间'
    ],
    '本质主义': [
      '安全：善于追问根本原因，不满足表面解释',
      '预警：偶尔会追问，但容易被表面现象带偏',
      '崩塌：完全接受表面现象，从不质疑底层逻辑'
    ],
    '模块化': [
      '安全：能将复杂问题拆解为独立模块',
      '预警：拆解能力有限，模块间耦合度高',
      '崩塌：问题一团乱麻，无法结构化思考'
    ],
    '结果导向': [
      '安全：始终以目标为导向，行动高效',
      '预警：有时会陷入过程细节，忘记目标',
      '崩塌：过程即目的，缺乏明确的目标意识'
    ],
    '迭代式': [
      '安全：习惯小步快跑，持续优化',
      '预警：追求一次完美，迭代意识弱',
      '崩塌：害怕修改，认为第一次就必须正确'
    ],
    '边界思维': [
      '安全：清晰区分内外部因素，不越界',
      '预警：边界意识模糊，容易责任扩散',
      '崩塌：完全没有边界概念，混乱无序'
    ],
  };

  const index = score >= 6 ? 0 : score >= 4 ? 1 : 2;
  return map[dimension]?.[index] || '请观察该维度的实际行为表现';
}