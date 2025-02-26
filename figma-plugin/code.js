figma.showUI(__html__, { width: 450, height: 550 });

// 递归查找指定节点
function findNode(node, criteria) {
  if (criteria(node)) {
    return node;
  }
  if ("children" in node) {
    for (const child of node.children) {
      const found = findNode(child, criteria);
      if (found) return found;
    }
  }
  return null;
}

// 首字母大写函数
function capitalizeFirstLetter(text) {
  // 只取第一个问号之前的文本
  const questionMarkIndex = text.indexOf('?');
  const firstQuestion = questionMarkIndex !== -1 
    ? text.substring(0, questionMarkIndex + 1) 
    : text;
    
  return firstQuestion.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 从输入路径获取导出路径
function getExportPath(inputPath, channelName, fileName) {
  // 基础路径
  const baseTranscriptsPath = "F:\\LiFeng\\Project\\windsurf\\ShortsMaster_RedditStory\\data\\transcripts";
  const baseExportsPath = "F:\\LiFeng\\Project\\windsurf\\ShortsMaster_RedditStory\\data\\exports";
  
  // 替换文件扩展名
  const outputFileName = fileName.replace('.txt', '.png');
  
  // 构建完整的导出路径
  return `${baseExportsPath}\\${channelName}\\${outputFileName}`;
}

// 主要处理逻辑
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'update-text') {
    try {
      // 在当前页面中找到template实例
      const template = findNode(figma.currentPage, node => 
        node.name.toLowerCase() === 'template' && 
        (node.type === 'INSTANCE' || node.type === 'COMPONENT'));
      
      if (!template) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Template not found. Please make sure you have a template node in your current page.' 
        });
        return;
      }

      // 找到card frame
      const card = findNode(template, node => 
        node.name.toLowerCase() === 'card' && 
        (node.type === 'FRAME' || node.type === 'COMPONENT'));
      
      if (!card) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Card not found in template. Please check the structure.' 
        });
        return;
      }

      // 找到row中的文本节点
      const textNode = findNode(card, node => 
        node.type === 'TEXT' && 
        node.parent && 
        node.parent.name.toLowerCase() === 'row');
      
      if (!textNode) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Text node not found in row. Please check the structure.' 
        });
        return;
      }

      // 加载字体
      await figma.loadFontAsync(textNode.fontName);

      // 更新文本内容
      const capitalizedText = capitalizeFirstLetter(msg.text);
      textNode.characters = capitalizedText;

      // 获取导出路径
      const exportPath = getExportPath(msg.filePath, msg.channelName, msg.fileName);

      // 设置导出设置
      const settings = {
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      };

      // 导出
      const bytes = await card.exportAsync(settings);

      // 将bytes转换为base64字符串
      const base64Image = figma.base64Encode(bytes);
      
      // 发送到桌面应用
      figma.ui.postMessage({
        type: 'save-to-desktop-app',
        exportData: {
          imageData: `data:image/png;base64,${base64Image}`,
          filePath: exportPath,
          fileName: msg.fileName,
          channelName: msg.channelName
        }
      });
      
      // 同时发送成功消息
      figma.ui.postMessage({ 
        type: 'success', 
        message: `文本更新成功！\n原文本: ${msg.text}\n更新后: ${capitalizedText}\n导出路径: ${exportPath}`
      });
      
    } catch (error) {
      console.error('错误:', error);
      figma.ui.postMessage({ type: 'error', message: `发生错误: ${error.message}` });
    }
  }
};
