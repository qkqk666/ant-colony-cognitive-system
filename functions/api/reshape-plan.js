/**
 * 蚁群认知重塑系统 - 主调度云函数
 * 按顺序调用 A1→A2→B→C→D→V→Integration 流水线
 * 部署在 Cloudflare Pages Functions，对接硅基流动 API
 */

/* 注意：如果修改 Agent B 的病毒变体或对应规则，必须同步更新 Agent V 的检查2强制对应表 */

// 权重表版本号：与 agent-b.js 中使用的版本一致
// 更新时需同步修改 agent-b.js 中的 CURRENT_WEIGHT_VERSION
const CURRENT_WEIGHT_VERSION = 'v1.0';

// 导入所有 Agent 的 Prompt 生成函数
import { getA1Prompt } from './utils/agent-a1.js';
import { getA2Prompt } from './utils/agent-a2.js';
import { getBPrompt, CURRENT_WEIGHT_VERSION as B_WEIGHT_VERSION } from './utils/agent-b.js';
import { getCPrompt } from './utils/agent-c.js';
import { getDPrompt } from './utils/agent-d.js';
import { getVPrompt } from './utils/agent-v.js';
import { getIntegrationPrompt } from './utils/agent-integration.js';

// 硅基流动 API 配置
const API_BASE = 'https://api.siliconflow.cn/v1';
// 推理模型：DeepSeek-R1，用于需要复杂推理的任务
const REASONING_MODEL = 'deepseek-ai/DeepSeek-R1';
// 生产模型：DeepSeek-V3.2，用于大多数任务
const PRODUCTION_MODEL = 'deepseek-ai/DeepSeek-V3.2';

// 辅助函数：带重试的 API 调用
async function callWithRetry(apiKey, model, messages, temperature, maxTokens, maxRetries = 2) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature || 0.5,
          max_tokens: maxTokens || 2048,
          stream: false,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API 错误 ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('API 响应格式异常');
      }

      return {
        success: true,
        content: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  return {
    success: false,
    error: lastError?.message || 'API 调用失败',
  };
}

// 辅助函数：结构校验
function validateOutput(text, type) {
  if (!text) {
    return { valid: false, missing: ['输出为空'] };
  }

  const checks = {
    diagnosis: {
      required: ['漏洞分级说明', '维度崩塌状态表'],
      keywords: ['工具本位', '本质主义', '模块化', '结果导向', '迭代式', '边界思维'],
    },
    attribution: {
      required: ['归因分析正文', '归因充分性说明'],
      keywords: ['原生家庭', '教育背景', '职业经历', '文化环境', '刻意训练', '思维捷径'],
    },
    matching: {
      required: ['匹配结果', '匹配理由'],
      keywords: ['工具效率型', '深度追问型', '分解触发型', '量化思维型', '迭代优先型', '约束创新型'],
    },
    design: {
      required: ['课程结构表', '导入环节引导语', '植入点设计'],
      keywords: ['病毒变体', '伪装课程', '感染路径'],
    },
    verification: {
      required: ['阶梯式标准表', '感染验证方案'],
      keywords: ['初级达标', '完全达标', '卓越达标'],
    },
    validation: {
      required: ['监督校验报告'],
      keywords: ['检查1', '检查2', '检查3', '检查4', '检查5'],
    },
  };

  const spec = checks[type] || { required: [], keywords: [] };
  const missing = spec.required.filter(field => !text.includes(field));

  // 修正12：表格解析容错增强
  if (missing.length > 0 && type === 'diagnosis') {
    const dimNames = ['工具本位', '本质主义', '模块化', '结果导向', '迭代式', '边界思维'];
    const foundDims = dimNames.filter(d => text.includes(d));
    if (foundDims.length >= 4) {
      // 至少4个维度出现在文本中，视为格式非标准但内容有效
      return { valid: true, missing: [] };
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// 增量校验函数
function incrementalCheck12(a1Output, a2Output) {
  const warnings = [];

  // 检查1：崩塌维度数量一致性
  const a1Dims = ['工具本位', '本质主义', '模块化', '结果导向', '迭代式', '边界思维'].filter(
    dim => a1Output.includes(`【${dim}】`) || a1Output.includes(dim)
  );
  const a2Dims = ['工具本位', '本质主义', '模块化', '结果导向', '迭代式', '边界思维'].filter(
    dim => a2Output.includes(`维度：${dim}`) || a2Output.includes(`维度 ${dim}`)
  );

  if (Math.abs(a1Dims.length - a2Dims.length) > 1) {
    warnings.push('检查1警告：A1和A2识别的崩塌维度数量差异较大');
  }

  // 检查2：归因与崩塌维度的对应
  const dimRegex = /维度：([^（\n]+)/g;
  const dimMatches = [...a2Output.matchAll(dimRegex)];
  if (dimMatches.length > 0) {
    const a2DimNames = dimMatches.map(m => m[1].trim());
    const missing = a2DimNames.filter(d => !a1Output.includes(d));
    if (missing.length > 0) {
      warnings.push(`检查2警告：A2归因的维度 ${missing.join('、')} 在A1崩塌分析中未提及`);
    }
  }

  return warnings;
}

function incrementalCheck34(bOutput, cOutput) {
  const warnings = [];

  // 检查3：病毒变体在课程设计中是否被正确引用
  const virusMatch = bOutput.match(/匹配结果：([^\n]+)/);
  if (virusMatch) {
    const virus = virusMatch[1].trim();
    if (!cOutput.includes(virus)) {
      warnings.push(`检查3警告：课程设计中未明确提及病毒变体 "${virus}"`);
    }
  }

  // 检查4：课程时长与病毒类型是否匹配
  const durationMatch = cOutput.match(/总时长：(\d+)分钟/);
  if (durationMatch) {
    const duration = parseInt(durationMatch[1]);
    const virusType = bOutput.includes('工具效率型') ? '工具' :
                      bOutput.includes('深度追问型') ? '追问' :
                      bOutput.includes('分解触发型') ? '分解' :
                      bOutput.includes('量化思维型') ? '量化' :
                      bOutput.includes('迭代优先型') ? '迭代' :
                      bOutput.includes('约束创新型') ? '约束' : null;
    // 长课程（>45分钟）适合复杂变体（追问、分解、约束）
    if (duration > 45 && !['追问', '分解', '约束'].includes(virusType)) {
      warnings.push('检查4警告：长课程可能更适合复杂病毒变体（深度追问型/分解触发型/约束创新型）');
    }
  }

  return warnings;
}

// 主处理函数
export async function onRequest(context) {
  try {
    const { request } = context;
    const apiKey = context.env?.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '缺少API密钥配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 解析请求数据
    const contentType = request.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      data = Object.fromEntries(await request.formData());
    }

    const {
      scores = {},           // 六维思维评分 {tool: 0-10, essence: 0-10, ...}
      manualReport = '',     // 可选人工分析报告
      targetRole = '',       // 目标职位
      learningStyle = '',    // 学习风格偏好
      timeResource = '',     // 时间资源限制
      specialNotes = '',     // 特殊注意事项
    } = data;

    // 输入验证
    const requiredDims = ['tool', 'essence', 'modular', 'result', 'iterative', 'boundary'];
    const missingDims = requiredDims.filter(dim => !scores.hasOwnProperty(dim));
    if (missingDims.length > 0) {
      return new Response(JSON.stringify({
        error: `缺少维度评分：${missingDims.join(', ')}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 进度日志
    const progressLog = [];
    const startTime = Date.now();

    // ========== 第一级流水线：A1 → A2 串行 ==========
    // 修正1：A1和A2从并行改为串行
    progressLog.push({ node: 'A1漏洞诊断', status: 'running', timestamp: new Date().toISOString() });
    const a1Result = await callWithRetry(apiKey, PRODUCTION_MODEL, [
      { role: 'system', content: '你是认知漏洞诊断专家。严格按照用户指定的格式输出，不得添加任何解释性前缀。' },
      { role: 'user', content: getA1Prompt(scores) }
    ], 0.5, 1024);

    const a1Valid = validateOutput(a1Result.success ? a1Result.content : '', 'diagnosis');
    const a1Output = a1Result.success ? a1Result.content : 'A1诊断失败：' + a1Result.error;
    progressLog.push({
      node: 'A1漏洞诊断',
      status: a1Result.success ? (a1Valid.valid ? 'completed' : 'warning') : 'failed',
      detail: a1Result.success ? (a1Valid.valid ? '诊断完成' : `缺少字段：${a1Valid.missing.join(',')}`) : a1Result.error,
      timestamp: new Date().toISOString(),
    });

    progressLog.push({ node: 'A2深层归因', status: 'running', timestamp: new Date().toISOString() });
    const a2Result = await callWithRetry(apiKey, PRODUCTION_MODEL, [
      { role: 'system', content: '你是思维漏洞深层归因分析专家。严格按照用户指定的格式输出。' },
      { role: 'user', content: getA2Prompt(manualReport, a1Result.success ? a1Result.content : 'A1数据缺失') }
    ], 0.5, 1536);

    const a2Valid = validateOutput(a2Result.success ? a2Result.content : '', 'attribution');
    const a2Output = a2Result.success ? a2Result.content : 'A2归因失败：' + a2Result.error;
    progressLog.push({
      node: 'A2深层归因',
      status: a2Result.success ? (a2Valid.valid ? 'completed' : 'warning') : 'failed',
      detail: a2Result.success ? (a2Valid.valid ? '归因完成' : `缺少字段：${a2Valid.missing.join(',')}`) : a2Result.error,
      timestamp: new Date().toISOString(),
    });

    // 增量校验 1-2
    const incCheck12 = incrementalCheck12(a1Output, a2Output);
    if (incCheck12.length > 0) {
      progressLog.push({
        node: '增量校验1-2',
        status: 'warning',
        detail: `警告：${incCheck12.join('; ')}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      progressLog.push({
        node: '增量校验1-2',
        status: 'completed',
        detail: '通过',
        timestamp: new Date().toISOString(),
      });
    }

    // ========== 第二级流水线：B 并行 ==========
    progressLog.push({ node: 'B病毒匹配', status: 'running', timestamp: new Date().toISOString() });
    const weightVersion = B_WEIGHT_VERSION || CURRENT_WEIGHT_VERSION;
    const bResult = await callWithRetry(apiKey, REASONING_MODEL, [
      { role: 'system', content: '你是认知病毒匹配引擎。严格按照用户指定的格式输出。' },
      { role: 'user', content: getBPrompt(scores, a1Output, a2Output, targetRole, weightVersion) }
    ], 0.4, 1024);

    const bValid = validateOutput(bResult.success ? bResult.content : '', 'matching');
    const bOutput = bResult.success ? bResult.content : 'B匹配失败：' + bResult.error;
    progressLog.push({
      node: 'B病毒匹配',
      status: bResult.success ? (bValid.valid ? 'completed' : 'warning') : 'failed',
      detail: bResult.success ? (bValid.valid ? '匹配完成' : `缺少字段：${bValid.missing.join(',')}`) : bResult.error,
      timestamp: new Date().toISOString(),
    });

    // ========== 第三级流水线：C 串行 → D 串行 ==========
    // 修正2：注释修正，实际逻辑不变
    progressLog.push({ node: 'C载体设计', status: 'running', timestamp: new Date().toISOString() });
    const cResult = await callWithRetry(apiKey, PRODUCTION_MODEL, [
      { role: 'system', content: '你是认知病毒伪装课程设计专家。严格按照用户指定的格式输出。' },
      { role: 'user', content: getCPrompt(bOutput, learningStyle, timeResource) }
    ], 0.6, 2048);

    const cValid = validateOutput(cResult.success ? cResult.content : '', 'design');
    const cOutput = cResult.success ? cResult.content : 'C设计失败：' + cResult.error;
    progressLog.push({
      node: 'C载体设计',
      status: cResult.success ? (cValid.valid ? 'completed' : 'warning') : 'failed',
      detail: cResult.success ? (cValid.valid ? '设计完成' : `缺少字段：${cValid.missing.join(',')}`) : cResult.error,
      timestamp: new Date().toISOString(),
    });

    progressLog.push({ node: 'D验证设计', status: 'running', timestamp: new Date().toISOString() });
    const dResult = await callWithRetry(apiKey, PRODUCTION_MODEL, [
      { role: 'system', content: '你是认知病毒感染验证专家。严格按照用户指定的格式输出。' },
      { role: 'user', content: getDPrompt(cOutput, specialNotes) }
    ], 0.5, 1536);

    const dValid = validateOutput(dResult.success ? dResult.content : '', 'verification');
    const dOutput = dResult.success ? dResult.content : 'D验证设计失败：' + dResult.error;
    progressLog.push({
      node: 'D验证设计',
      status: dResult.success ? (dValid.valid ? 'completed' : 'warning') : 'failed',
      detail: dResult.success ? (dValid.valid ? '验证设计完成' : `缺少字段：${dValid.missing.join(',')}`) : dResult.error,
      timestamp: new Date().toISOString(),
    });

    // 增量校验 3-4
    const incCheck34 = incrementalCheck34(bOutput, cOutput);
    if (incCheck34.length > 0) {
      progressLog.push({
        node: '增量校验3-4',
        status: 'warning',
        detail: `警告：${incCheck34.join('; ')}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      progressLog.push({
        node: '增量校验3-4',
        status: 'completed',
        detail: '通过',
        timestamp: new Date().toISOString(),
      });
    }

    // ========== 第四级流水线：V 监督校验 ==========
    progressLog.push({ node: 'V监督校验', status: 'running', timestamp: new Date().toISOString() });
    const vResult = await callWithRetry(apiKey, REASONING_MODEL, [
      { role: 'system', content: '你是蚁群系统全局监督校验专家。严格按照用户指定的格式输出。' },
      { role: 'user', content: getVPrompt({
        a1: a1Output,
        a2: a2Output,
        b: bOutput,
        c: cOutput,
        d: dOutput,
      }, { scores, manualReport, targetRole, learningStyle, timeResource, specialNotes }) }
    ], 0.3, 2048);

    // 修正13：Agent V 数据缺失时的降级处理
    const vOutput = vResult.success ? vResult.content : '[V数据缺失，监督校验未执行，方案将不包含校验报告]';
    const vValid = vResult.success ? validateOutput(vResult.content, 'validation') : { valid: false, missing: [] };
    progressLog.push({
      node: 'V监督校验',
      status: vResult.success ? (vValid.valid ? 'completed' : 'warning') : 'failed',
      detail: vResult.success ? (vValid.valid ? '校验完成' : `缺少字段：${vValid.missing.join(',')}`) : '校验失败，已降级处理',
      timestamp: new Date().toISOString(),
    });

    // ========== 第五级流水线：Integration 整合生成 ==========
    progressLog.push({ node: '整合生成', status: 'running', timestamp: new Date().toISOString() });
    // 修正3：整合 Agent 输入增加 manualReport
    const allOutputs = {
      a1: a1Output,
      a2: a2Output,
      b: bOutput,
      c: cOutput,
      d: dOutput,
      manualReport: manualReport || '未提供',
    };
    const integrationResult = await callWithRetry(apiKey, PRODUCTION_MODEL, [
      { role: 'system', content: '你是蚁群系统方案整合专家。严格按照用户指定的格式输出。' },
      { role: 'user', content: getIntegrationPrompt(allOutputs, vOutput) }
    ], 0.7, 3072);

    const integrationValid = validateOutput(integrationResult.success ? integrationResult.content : '', 'integration');
    const finalPlan = integrationResult.success ? integrationResult.content : '整合失败：' + integrationResult.error;
    progressLog.push({
      node: '整合生成',
      status: integrationResult.success ? (integrationValid.valid ? 'completed' : 'warning') : 'failed',
      detail: integrationResult.success ? (integrationValid.valid ? '方案生成完成' : `缺少字段：${integrationValid.missing.join(',')}`) : integrationResult.error,
      timestamp: new Date().toISOString(),
    });

    // 总耗时
    const totalTime = Date.now() - startTime;

    // 返回最终结果
    return new Response(JSON.stringify({
      success: true,
      data: {
        plan: finalPlan,
        progress: progressLog,
        metadata: {
          totalTime: `${totalTime}ms`,
          weightVersion,
          model: PRODUCTION_MODEL,
          hasValidation: vResult.success,
          validationReport: vOutput,
        },
        rawOutputs: {
          a1: a1Output,
          a2: a2Output,
          b: bOutput,
          c: cOutput,
          d: dOutput,
          v: vOutput,
        },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('主云函数异常:', err);
    return new Response(JSON.stringify({
      success: false,
      error: `内部服务器错误：${err.message}`,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}