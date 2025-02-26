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
  if (msg.type === 'process-file') {
    try {
      // 获取当前处理的文件信息
      const { fileName, text, channelName, currentIndex, totalFiles } = msg;
      
      // 发送进度消息
      figma.ui.postMessage({ 
        type: 'progress', 
        message: `处理文件 ${currentIndex + 1}/${totalFiles}: ${fileName}`,
        current: currentIndex + 1,
        total: totalFiles
      });
      
      // 在当前页面中找到template实例
      const template = findNode(figma.currentPage, node => 
        node.name.toLowerCase() === 'template' && 
        (node.type === 'INSTANCE' || node.type === 'COMPONENT'));
      
      if (!template) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Template not found. Please make sure you have a template node in your current page.',
          currentIndex: currentIndex
        });
        return;
      }

      // 找到card节点
      const cardNode = findNode(template, node => 
        node.type === 'FRAME' && 
        (node.name.toLowerCase().includes('card') || 
         node.name.toLowerCase().includes('post')));
      
      if (!cardNode) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Card node not found in template. Please check the structure.',
          currentIndex: currentIndex
        });
        return;
      }
      
      // 找到row节点
      const rowNode = findNode(cardNode, node => 
        node.name.toLowerCase().includes('row'));
      
      if (!rowNode) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Row node not found in card. Please check the structure.',
          currentIndex: currentIndex
        });
        return;
      }
      
      // 在row节点下找到文本节点
      const textNode = findNode(rowNode, node => node.type === 'TEXT');
      
      if (!textNode) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Text node not found under row. Please check the structure.',
          currentIndex: currentIndex
        });
        return;
      }
      
      // 加载字体
      await figma.loadFontAsync(textNode.fontName);
      
      // 更新文本内容
      const capitalizedText = capitalizeFirstLetter(text);
      textNode.characters = capitalizedText;
      
      // 获取导出路径
      const baseExportsPath = "F:\\LiFeng\\Project\\windsurf\\ShortsMaster_RedditStory\\data\\exports";
      const exportPath = `${baseExportsPath}\\${channelName}\\${fileName.replace('.txt', '.png')}`;
      
      // 设置导出设置
      const settings = {
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      };
      
      // 导出整个卡片
      const bytes = await cardNode.exportAsync(settings);
      
      // 将bytes转换为base64字符串
      const base64Image = figma.base64Encode(bytes);
      
      // 发送到桌面应用
      figma.ui.postMessage({
        type: 'save-to-desktop-app',
        exportData: {
          imageData: `data:image/png;base64,${base64Image}`,
          filePath: exportPath,
          fileName: fileName,
          channelName: channelName
        },
        currentIndex: currentIndex
      });
      
      // 发送处理完成消息
      figma.ui.postMessage({ 
        type: 'process-file-complete', 
        currentIndex: currentIndex,
        message: `文件 ${fileName} 处理完成`
      });
      
    } catch (error) {
      console.error('错误:', error);
      figma.ui.postMessage({ 
        type: 'error', 
        message: `处理文件时出错: ${error.message}`,
        currentIndex: msg.currentIndex
      });
      
      // 即使出错也继续处理下一个文件
      figma.ui.postMessage({ 
        type: 'process-file-complete', 
        currentIndex: msg.currentIndex,
        message: `文件处理出错，继续下一个`
      });
    }
  }
};
