// 蚁群系统 Cloudflare Pages 入口文件
// 将Functions路由到/api/路径下

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 静态文件服务
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveStatic('index.html');
    }
    if (url.pathname === '/feedback.html') {
      return serveStatic('feedback.html');
    }
    
    // API路由
    if (url.pathname === '/api/reshape-plan' || url.pathname === '/api/reshape-plan/') {
      // 导入并执行主云函数
      const module = await import('./functions/api/reshape-plan.js');
      return module.onRequest({
        request,
        env,
        waitUntil: ctx.waitUntil.bind(ctx)
      });
    }
    
    // 404处理
    return new Response('蚁群认知重塑系统', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
    
    // 静态文件服务函数
    async function serveStatic(filename) {
      const file = await env.ASSETS.fetch(new URL(`/${filename}`, url));
      if (file.status === 404) {
        return new Response('文件未找到', { status: 404 });
      }
      return file;
    }
  }
};