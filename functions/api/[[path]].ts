// Cloudflare Pages Function：把同源的 /api/* 请求转发到后端 Worker
//
// 背景：*.workers.dev 域名在部分网络（如中国大陆）会被 DNS 污染/封锁，
// 浏览器直连会报 "Failed to fetch"。这里改由 Pages 边缘节点代为请求，
// 浏览器只访问同源的 *.pages.dev，既绕开封锁也免去了跨域 CORS。
//
// 路由：/api/*  ->  https://astrowind-worker.1900692808.workers.dev/api/*

const WORKER_ORIGIN = 'https://astrowind-worker.1900692808.workers.dev';

export const onRequest = async (context: any): Promise<Response> => {
  const { request } = context;
  const url = new URL(request.url);
  const target = WORKER_ORIGIN + url.pathname + url.search;

  // 复制请求头，去掉与目标主机冲突的头
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'follow',
    });
  } catch (err: any) {
    return Response.json({ error: `代理请求后端失败: ${err?.message || err}` }, { status: 502 });
  }

  // 同源代理不需要 CORS 响应头，去掉以免重复
  const respHeaders = new Headers(response.headers);
  respHeaders.delete('access-control-allow-origin');
  respHeaders.delete('access-control-allow-credentials');
  respHeaders.delete('access-control-allow-headers');
  respHeaders.delete('access-control-allow-methods');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
};
