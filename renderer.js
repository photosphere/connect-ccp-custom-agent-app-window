const { ipcRenderer } = require('electron');

// 当前活动标签ID
let activeTabId = null;
// 标签列表
let tabs = [];

// 初始化容器
const tabContainer = document.getElementById('tabContainer');
const contentContainer = document.getElementById('contentContainer');
const emptyMessage = document.getElementById('emptyMessage');

// 监听标签更新事件
ipcRenderer.on('update-tabs', (event, newTabs) => {
  tabs = newTabs;
  renderTabs();
});

// 监听聚焦标签事件
ipcRenderer.on('focus-tab', (event, tabId) => {
  activeTabId = tabId;
  renderTabs();
  showWebView(tabId);
});

// 监听创建webview事件
ipcRenderer.on('create-webview', (event, { id, url, title }) => {
  createWebView(id, url);
  activeTabId = id;
  renderTabs();
  showWebView(id);
});

// 监听移除webview事件
ipcRenderer.on('remove-webview', (event, id) => {
  const container = document.querySelector(`.webview-container[data-id="${id}"]`);
  if (container) {
    container.remove();
  }
  
  // 如果没有标签页，显示空消息
  if (tabs.length === 0) {
    emptyMessage.style.display = 'flex';
  } else if (activeTabId === id) {
    // 如果关闭的是当前活动标签，切换到第一个标签
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
      showWebView(activeTabId);
    }
  }
});

// 监听执行退出操作事件
ipcRenderer.on('execute-logout', (event, { id, logoutUrl }) => {
  const webviewContainer = document.querySelector(`.webview-container[data-id="${id}"]`);
  if (webviewContainer) {
    const webview = webviewContainer.querySelector('webview');
    if (webview) {
      // 执行退出脚本
      webview.executeJavaScript(`
        fetch("${logoutUrl}", { credentials: 'include', mode: 'no-cors' })
          .then(() => {
            if (typeof connect !== 'undefined' && connect.core) {
              const eventBus = connect.core.getEventBus();
              if (eventBus) {
                eventBus.trigger(connect.EventType.TERMINATE);
              }
            }
          })
          .catch(err => console.error("退出操作失败:", err));
      `);
    }
  }
});

// 创建webview
function createWebView(id, url) {
  // 检查是否已存在
  let container = document.querySelector(`.webview-container[data-id="${id}"]`);
  if (container) {
    return;
  }
  
  // 创建容器
  container = document.createElement('div');
  container.className = 'webview-container';
  container.dataset.id = id;
  
  // 创建webview
  const webview = document.createElement('webview');
  webview.src = url;
  webview.nodeintegration = true;
  webview.allowpopups = true;
  webview.preload = './webview-preload.js';
  
  container.appendChild(webview);
  contentContainer.appendChild(container);
}

// 显示指定的webview
function showWebView(id) {
  // 隐藏所有webview
  document.querySelectorAll('.webview-container').forEach(container => {
    container.classList.remove('active');
  });
  
  // 显示指定的webview
  const container = document.querySelector(`.webview-container[data-id="${id}"]`);
  if (container) {
    container.classList.add('active');
    emptyMessage.style.display = 'none';
  }
}

// 渲染标签页
function renderTabs() {
  tabContainer.innerHTML = '';
  
  if (tabs.length === 0) {
    emptyMessage.style.display = 'flex';
    return;
  }
  
  tabs.forEach(tab => {
    const tabElement = document.createElement('div');
    tabElement.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
    tabElement.dataset.id = tab.id;
    
    // 标签标题
    const tabTitle = document.createElement('span');
    tabTitle.textContent = tab.title;
    tabElement.appendChild(tabTitle);
    
    // 关闭按钮
    const closeButton = document.createElement('span');
    closeButton.className = 'tab-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      ipcRenderer.send('close-app-window', tab.id);
    });
    tabElement.appendChild(closeButton);
    
    // 点击标签切换焦点
    tabElement.addEventListener('click', () => {
      activeTabId = tab.id;
      renderTabs();
      showWebView(tab.id);
    });
    
    tabContainer.appendChild(tabElement);
  });
}

// 初始渲染
renderTabs();