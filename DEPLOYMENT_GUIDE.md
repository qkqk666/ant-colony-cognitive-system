# 蚁群认知重塑系统 - 部署指南

## 系统概述
蚁群系统是一个基于多Agent AI流水线的认知重塑方案生成平台，将学员的六维思维评分转化为个性化培训方案。

## 部署结构
```
deploy/
├── index.html                    # 前端操作台
├── feedback.html                 # 学员回访表单
├── _worker.js                    # Cloudflare Workers入口文件
├── wrangler.toml                 # Cloudflare Pages配置
├── package.json                  # Node.js项目配置
├── functions/api/                # API函数目录
│   ├── reshape-plan.js           # 主调度云函数
│   └── utils/                    # Agent模块
│       ├── agent-a1.js
│       ├── agent-a2.js
│       ├── agent-b.js
│       ├── agent-c.js
│       ├── agent-d.js
│       ├── agent-v.js
│       ├── agent-integration.js
│       ├── weight-table.js       # 权重表
│       └── data-iteration.js     # 数据迭代模块
```

## 部署步骤

### 1. 准备部署包
```bash
# 从 WorkBuddy 工作区复制部署包
# 位置：c:/Users/28334/WorkBuddy/20260513111534/deploy/
```

### 2. Cloudflare Pages 部署
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages → 创建 → Pages → 上传资产
3. 拖拽 `deploy/` 文件夹或上传ZIP文件
4. 项目名称设为 `ant-colony`
5. 构建设置：
   - 框架预设：None
   - 构建命令：留空
   - 输出目录：`/`
6. 环境变量：
   - 名称：`SILICONFLOW_API_KEY`
   - 值：你的硅基流动 API Key（从 [硅基流动控制台](https://siliconflow.cn) 获取）
7. 点击"保存并部署"
8. 等待部署完成（约1-2分钟）

部署成功后，访问地址：`https://ant-colony.pages.dev`

### 3. 验证部署
1. 访问 `https://ant-colony.pages.dev`
2. 检查页面元素：
   - ✅ 深色主题操作台
   - ✅ 6个评分滑块（工具本位、本质主义、模块化、结果导向、迭代式、边界思维）
   - ✅ 建造者类型下拉框
   - ✅ 期望职位输入框
   - ✅ 人工分析报告文本框
   - ✅ 13节点进度面板
3. 测试生成功能（使用模拟数据）：
   - 调整所有滑块到随机值
   - 选择"工匠型"建造者类型
   - 填写期望职位（如"前端工程师"）
   - 点击"生成认知重塑方案"
   - 观察右侧节点逐步推进（模拟模式）
   - 最终显示完整方案

### 4. API配置验证
**测试API端点：**
```bash
curl -X POST https://ant-colony.pages.dev/api/reshape-plan \
  -H "Content-Type: application/json" \
  -d '{
    "scores": {
      "tool": 3,
      "essence": 4,
      "modular": 6,
      "result": 2,
      "iterative": 5,
      "boundary": 4
    },
    "targetRole": "产品经理",
    "manualReport": "学员有拒绝使用工具的习惯，宁愿手动完成重复任务。"
  }'
```

预期响应：
- HTTP 200 状态码
- 包含完整流水线结果的 JSON 数据
- progress字段显示13个节点状态

## 系统使用流程

### 学员方案生成
1. **数据输入**：
   - 学员在玄驹系统完成测评，得到六维数据 + 建造者类型
   - 进行15分钟结构化访谈，了解期望职位和具体需求
2. **方案生成**：
   - 打开蚁群操作台 `https://ant-colony.pages.dev`
   - 手动填入六维分数、建造者类型、期望职位
   - 粘贴人工分析报告
   - 点击"生成认知重塑方案"
   - 等待约2-3分钟（13节点流水线执行）
3. **交付方案**：
   - 复制生成的完整方案
   - 交付给学员，并提供支持联系方式

### 回访数据收集
1. 学员完成培训并入职后，填写回访表单：
   - 访问 `https://ant-colony.pages.dev/feedback.html`
   - 填写7个选择题（约30秒/人）
2. 数据存储：目前为手动记录，后续可接入数据库

### 权重迭代更新（当前手动执行）
**每周一次更新流程：**
1. 收集本周所有回访数据
2. 运行权重更新脚本：
   ```javascript
   // 在 data-iteration.js 中调用 updateVirusWeights 函数
   const newWeights = updateVirusWeights(virusStats, allFeedback);
   ```
3. 更新权重表文件 `weight-table.js`：
   - 修改 `viruses` 字段中的权重值
   - 更新 `version` 和 `updatedAt`
   - 添加更新记录到 `updateHistory`
4. 更新版本号：
   - `reshape-plan.js` 中的 `CURRENT_WEIGHT_VERSION`
   - `agent-b.js` 中的 `CURRENT_WEIGHT_VERSION`
5. 重新部署项目

## 成本与监控

### 成本估算
- 单次方案生成：约 ¥0.18
- 每月成本（按100学员计）：约 ¥18
- 建议硅基流动账户余额保持 ¥50 以上

### 余额预警
1. 登录 [硅基流动控制台](https://siliconflow.cn/console)
2. 设置余额预警：¥5 时提醒
3. 定期检查调用统计和费用

## 故障排除

### 常见问题
1. **API调用失败**
   - 检查 `SILICONFLOW_API_KEY` 环境变量是否正确
   - 确认硅基流动账户余额充足
   - 检查网络连接是否正常

2. **前端加载错误**
   - 检查 Cloudflare Pages 部署状态
   - 查看浏览器控制台错误信息
   - 清除浏览器缓存后重试

3. **进度面板卡住**
   - 通常是模拟模式，实际部署后应注释掉模拟代码
   - 检查前端JavaScript中的fetch调用路径

### 日志查看
Cloudflare Dashboard → Workers & Pages → ant-colony → 日志

## 后续优化路线图

### 阶段 1：当前（手动执行）
- 手动回访数据收集
- 手动更新权重表
- 手动部署更新

### 阶段 2：半自动（接入WorkBuddy）
- WorkBuddy定时任务：每周日自动计算权重
- 自动生成每周迭代报告
- 人工审核确认后自动部署

### 阶段 3：全自动
- 回访数据自动入库
- 权重自动更新，无需人工干预
- 系统每周自动使用最新权重生成方案
- 仅在异常时通知人工介入

## 联系方式
- 项目负责人：玄驹科技
- 技术支持：xuanju@coze.email
- 部署问题：检查本指南或联系技术团队

---
*文档版本：v1.0 | 更新日期：2026-05-16*