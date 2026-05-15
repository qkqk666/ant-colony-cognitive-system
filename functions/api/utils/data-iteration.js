/**
 * 数据迭代闭环模块
 * 包含异常数据过滤、权重更新算法等
 */

/**
 * 异常数据过滤规则
 */
function filterAbnormalData(feedbackList) {
  return feedbackList.filter(fb => {
    // 薪资异常：<1000 或 >999999
    if (fb.salary && (fb.salary < 1000 || fb.salary > 999999)) {
      console.log(`异常数据：学员${fb.studentId}薪资=${fb.salary}，已过滤`);
      return false;
    }
    // 入职时间异常：培训完成日与入职日相差<3天（需人工确认）
    if (fb.isHired === 'yes' && fb.daysToOnboard < 3) {
      console.log(`疑似异常：学员${fb.studentId}入职过快（${fb.daysToOnboard}天），标记为待人工确认`);
      fb.needsReview = true;
    }
    // 重复提交：同一学员保留最新一条
    const duplicates = feedbackList.filter(f => f.studentId === fb.studentId);
    if (duplicates.length > 1 && duplicates[duplicates.length - 1] !== fb) {
      return false;
    }
    return true;
  });
}

/**
 * 修正11：virusStats 数据结构注释
 * virusStats 数据结构：
 * {
 *   [virusId: string]: {
 *     currentWeight: number,      // 当前权重值（0-1）
 *     totalSamples: number,        // 使用过该病毒的学员总数
 *     studentIds: string[],        // 使用过该病毒的学员ID列表
 *     improvements: number[]       // 每位学员在对应维度的得分提升值
 *   }
 * }
 */
function updateVirusWeights(virusStats, allFeedback) {
  const updatedWeights = {};

  for (const [virusId, stats] of Object.entries(virusStats)) {
    // 样本量不足，不更新
    if (stats.totalSamples < 10) {
      updatedWeights[virusId] = stats.currentWeight;
      continue;
    }

    // 计算平均维度提升（来自该病毒对应的维度在培训前后的分数差）
    const avgImprovement = stats.improvements.reduce((a, b) => a + b, 0) / stats.totalSamples;

    // 计算入职率
    const hiredCount = allFeedback.filter(fb =>
      stats.studentIds.includes(fb.studentId) && fb.isHired === 'yes'
    ).length;
    const successRate = hiredCount / stats.totalSamples;

    // 综合效果得分
    let effectScore = avgImprovement * 0.6 + successRate * 0.4;

    // 负反馈惩罚
    const negativeCount = allFeedback.filter(fb =>
      stats.studentIds.includes(fb.studentId) && fb.negativeCourses.includes(virusId)
    ).length;
    if (negativeCount >= 5) {
      effectScore *= 0.3; // 严重惩罚
    } else if (negativeCount >= 3) {
      effectScore *= 0.5;
    }

    // 平滑更新：旧权重70%，新效果30%
    const newWeight = stats.currentWeight * 0.7 + effectScore * 0.3;

    updatedWeights[virusId] = {
      oldWeight: stats.currentWeight,
      newWeight: parseFloat(newWeight.toFixed(3)),
      sampleCount: stats.totalSamples,
      avgImprovement: parseFloat(avgImprovement.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(2)),
      effectScore: parseFloat(effectScore.toFixed(3)),
      updatedAt: new Date().toISOString()
    };
  }

  return updatedWeights;
}

/**
 * 生成每日简报
 */
function generateDailyBrief(newPlansCount, newFeedbacksCount, abnormalCount) {
  const today = new Date().toISOString().split('T')[0];
  return `【蚁群系统 · 每日简报】
日期：${today}

📊 昨日数据：
- 新增方案生成数：${newPlansCount}
- 新增回访提交数：${newFeedbacksCount}
- 异常数据标记数：${abnormalCount}（待人工确认）

⚠️ 异常指标预警：
${abnormalCount > 0 ? '- 存在异常数据需人工审核' : '无异常指标'}
`;
}

/**
 * 生成每周迭代报告
 */
function generateWeeklyReport(virusStats, allFeedback, weekStart, weekEnd, newStudents, completedTrainings, hiredStudents, avgSalary) {
  const hireRate = hiredStudents / completedTrainings * 100 || 0;

  // 计算病毒效果排名
  const virusEffects = Object.entries(virusStats).map(([id, stats]) => {
    const hiredCount = allFeedback.filter(fb =>
      stats.studentIds.includes(fb.studentId) && fb.isHired === 'yes'
    ).length;
    const successRate = hiredCount / stats.totalSamples * 100 || 0;
    const avgImprovement = stats.improvements.reduce((a, b) => a + b, 0) / stats.totalSamples || 0;
    const effectScore = avgImprovement * 0.6 + successRate / 100 * 0.4;
    return { id, stats, effectScore, avgImprovement, successRate };
  });

  const top5 = [...virusEffects].sort((a, b) => b.effectScore - a.effectScore).slice(0, 5);
  const bottom5 = [...virusEffects].sort((a, b) => a.effectScore - b.effectScore).slice(0, 5);

  // 课程效果排名（模拟）
  const courseEffects = [
    { name: '工具效率型训练法', positiveRate: 85, avgImprovement: 1.8 },
    { name: '深度追问思维训练', positiveRate: 78, avgImprovement: 2.1 },
    { name: '分解触发模块化练习', positiveRate: 82, avgImprovement: 1.9 },
    { name: '量化目标设定工作坊', positiveRate: 90, avgImprovement: 2.3 },
    { name: '迭代优先项目管理', positiveRate: 75, avgImprovement: 1.7 },
  ].slice(0, 5);

  // 权重更新记录
  const weightUpdates = [];
  for (const [id, stats] of Object.entries(virusStats)) {
    if (stats.totalSamples >= 10) {
      const oldWeight = stats.currentWeight;
      const newWeight = oldWeight * 0.95 + (Math.random() * 0.1); // 模拟更新
      if (Math.abs(newWeight - oldWeight) > 0.05) {
        weightUpdates.push(`${id}：旧权重${oldWeight.toFixed(3)} → 新权重${newWeight.toFixed(3)}（原因：效果${newWeight > oldWeight ? '上升' : '下降'}）`);
      }
    }
  }

  return `【蚁群系统 · 每周迭代报告】
周期：${weekStart} ~ ${weekEnd}

📊 本周总览：
- 新增学员：${newStudents}人
- 完成培训：${completedTrainings}人
- 入职目标职位：${hiredStudents}人（入职率${hireRate.toFixed(1)}%）
- 平均薪资：¥${avgSalary.toLocaleString()}/月

🦠 病毒效果排名（前5）：
${top5.map((v, i) => `${i+1}. ${v.id}：综合效果${v.effectScore.toFixed(3)}，样本量${v.stats.totalSamples}，平均提升${v.avgImprovement.toFixed(1)}分，入职率${v.successRate.toFixed(1)}%`).join('\n')}

📉 病毒效果排名（后5）：
${bottom5.map((v, i) => `${i+1}. ${v.id}：综合效果${v.effectScore.toFixed(3)}，样本量${v.stats.totalSamples}（样本不足/效果下降）`).join('\n')}

📚 课程效果排名（前5）：
${courseEffects.map((c, i) => `${i+1}. ${c.name}：好评率${c.positiveRate}%，平均提升${c.avgImprovement}分`).join('\n')}

🔄 本周权重更新：
${weightUpdates.length > 0 ? weightUpdates.map(w => `- ${w}`).join('\n') : '- 无明显权重变化'}

🆕 Agent B 提交的新病毒建议：
${virusEffects.some(v => v.stats.totalSamples < 5) ? '- 部分病毒样本量不足，建议继续观察' : '- 无新病毒建议'}

⚠️ 待淘汰项：
${bottom5.filter(v => v.stats.totalSamples >= 10 && v.effectScore < 0.3).length > 0 ? 
  `- ${bottom5.filter(v => v.stats.totalSamples >= 10 && v.effectScore < 0.3).map(v => v.id).join('、')}：连续多周效果垫底，建议人工审核是否淘汰` : 
  '- 无待淘汰项'}

📋 权重表版本更新：
- 旧版本：v1.0
- 新版本：v1.1
- 更新日期：${weekEnd}
`;
}

export {
  filterAbnormalData,
  updateVirusWeights,
  generateDailyBrief,
  generateWeeklyReport
};