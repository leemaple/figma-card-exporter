// 调试服务器 - 详细日志和CORS支持
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 打印请求信息
  console.log(`收到请求: ${req.method} ${req.url}`);
  console.log(`请求头: ${JSON.stringify(req.headers, null, 2)}`);
  
  // 设置CORS头 - 允许所有来源
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log('处理OPTIONS预检请求');
    res.writeHead(204);
    res.end();
    return;
  }
  
  // 处理状态检查请求
  if (req.method === 'GET' && req.url === '/status') {
    console.log('处理状态检查请求');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'running' }));
    return;
  }
  
  // 处理保存图片的POST请求
  if (req.method === 'POST' && req.url === '/save-image') {
    console.log('处理保存图片请求');
    let body = '';
    req.on('data', chunk => { 
      body += chunk;
      console.log(`接收数据块: ${chunk.length} 字节`);
    });
    
    req.on('end', () => {
      console.log('请求数据接收完成');
      try {
        const data = JSON.parse(body);
        console.log(`解析JSON成功: ${Object.keys(data).join(', ')}`);
        
        const { imageData, channelName, fileName } = data;
        
        // 解码Base64图片
        console.log('解码Base64数据...');
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log(`图片大小: ${imageBuffer.length} 字节`);
        
        // 保存路径
        const baseDir = "F:\\LiFeng\\Project\\windsurf\\ShortsMaster_RedditStory\\data\\exports";
        const channelDir = path.join(baseDir, channelName);
        const outputFile = path.join(channelDir, fileName.replace('.txt', '.png'));
        console.log(`输出路径: ${outputFile}`);
        
        // 创建目录并保存文件
        if (!fs.existsSync(channelDir)) {
          console.log(`创建目录: ${channelDir}`);
          fs.mkdirSync(channelDir, { recursive: true });
        }
        
        console.log('写入文件...');
        fs.writeFileSync(outputFile, imageBuffer);
        
        console.log(`✅ 已保存: ${outputFile}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          path: outputFile,
          message: '图片已成功保存'
        }));
      } catch (error) {
        console.error(`❌ 错误: ${error.message}`);
        console.error(error.stack);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message,
          stack: error.stack
        }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/save-batch') {
    console.log('处理批量保存请求');
    let body = '';
    req.on('data', chunk => { 
      body += chunk;
      console.log(`接收数据块: ${chunk.length} 字节`);
    });
    
    req.on('end', () => {
      console.log('请求数据接收完成');
      try {
        const data = JSON.parse(body);
        console.log(`解析JSON成功: ${Object.keys(data).join(', ')}`);
        
        const { images } = data;
        
        if (!images || !Array.isArray(images) || images.length === 0) {
          console.error('缺少必要参数或格式不正确');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少必要参数或格式不正确' }));
          return;
        }
        
        const results = [];
        const errors = [];
        
        // 处理每个图像
        for (const item of images) {
          try {
            const { imageData, filePath } = item;
            
            if (!imageData || !filePath) {
              errors.push({ filePath: filePath || 'unknown', error: '缺少必要参数' });
              continue;
            }
            
            // 从Base64数据中提取图像数据
            const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
            
            // 确保目标目录存在
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // 写入文件
            fs.writeFileSync(filePath, base64Data, 'base64');
            
            console.log(`图片已保存到: ${filePath}`);
            results.push({ filePath, success: true });
          } catch (error) {
            console.error(`保存图片 ${item.filePath} 时出错:`, error);
            errors.push({ filePath: item.filePath, error: error.message });
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `批量处理完成。成功: ${results.length}, 失败: ${errors.length}`,
          results,
          errors
        }));
      } catch (error) {
        console.error('批量保存图片时出错:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `批量保存图片时出错: ${error.message}` }));
      }
    });
  } else if (req.method !== 'GET' || req.url !== '/status') {
    console.log(`未处理的请求: ${req.method} ${req.url}`);
    res.writeHead(404);
    res.end(JSON.stringify({ error: '未找到请求的资源' }));
  }
});

// 启动服务器
server.listen(54545, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  调试服务器已启动 - 端口54545           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('监听所有网络接口 (0.0.0.0:54545)');
  console.log('请在Figma插件中点击"导出"按钮');
});
