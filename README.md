# 蚁群认知重塑系统 (Ant Colony Cognitive Reshaping System)

## 🚀 系统概述
基于多Agent AI流水线的认知重塑方案生成平台，将学员的六维思维评分转化为个性化培训方案。

## 📦 项目结构
```
├── index.html                    # 前端操作台（六维评分滑块 + 13节点进度可视化）
├── feedback.html                 # 学员回访表单（7个问题 + 动态课程加载）
├── _worker.js                    # Cloudflare Workers入口文件
├── wrangler.toml                 # Cloudflare Pages配置
├── package.json                  # Node.js项目配置
├── README.md                     # 项目文档
├── .gitignore                    # Git忽略配置
├── DEPLOYMENT_GUIDE.md          # 详细部署指南
└── functions/api/                # API函数目录
    ├── reshape-plan.js           # 主调度云函数
    └── utils/                    # Agent模块
        ├── agent-a1.js           # 漏洞诊断
        ├── agent-a2.js           # 深层归因
        ├── agent-b.js            # 病毒匹配
        ├── agent-c.js            # 载体设计
        ├── agent-d.js            # 验证设计
        ├── agent-v.js            # 监督校验
        ├── agent-integration.js  # 整合生成
        ├── weight-table.js       # 权重表（病毒-解决方案映射）
        └── data-iteration.js     # 数据迭代模块
```

## 🎯 核心功能
1. **六维认知评估**：工具本位、本质主义、模块化、结果导向、迭代式、边界思维
2. **多Agent流水线**：13节点AI推理流程（A1→A2→B→C→D→V→Integration）
3. **实时进度可视化**：前端动态展示Agent执行进度
4. **权重迭代优化**：基于回访数据自动调整病毒权重
5. **移动端适配**：完整响应式设计，移动端专用样式

## 🏗️ 技术架构
- **前端**：HTML5 + CSS3 + JavaScript（原生ES6+）
- **后端**：Cloudflare Pages + Functions
- **AI模型**：硅基流动API（DeepSeek-V3.2 + DeepSeek-R1）
- **部署**：Cloudflare Workers（边缘计算）

## 🔧 Agent模型配置
- **Agent B和V**：DeepSeek-R1（推理模型）
- **其他Agent**：DeepSeek-V3.2（生产模型）
- **API调用**：通过硅基流动平台

## 📊 双路径解锁条件
- **路径A**：提交方向被触摸≥2次且输入框有非空回复
- **路径B**：文档打开≥2次且提及文档关键词＞1次

## 🚀 快速部署
1. 上传整个文件夹到 Cloudflare Pages
2. 配置环境变量 `SILICONFLOW_API_KEY`
3. 访问生成的域名：`ant-colony.pages.dev`

## 📈 数据迭代流程
1. 学员完成培训后填写回访表单
2. 系统收集反馈数据并过滤异常
3. 每周更新病毒权重表
4. 更新版本号并重新部署

## 📞 支持
- **技术支持**：xuanju@coze.email
- **项目状态**：生产就绪 v1.0
- **最后更新**：2026-05-16

---
*本项目为独立仓库，与玄驹认知测试系统分离*