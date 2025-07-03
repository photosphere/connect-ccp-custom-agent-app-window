const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// 保持对window对象的引用，否则当JavaScript对象被垃圾回收时，window对象将被自动关闭
let mainWindow;
// 添加退出标志
let willQuitApp = false;
// 存储所有打开的应用窗口
let appWindows = {};
// 存储区域配置
let regions = [];

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true, // 是否集成Node.js
      contextIsolation: false, // 上下文隔离，推荐为true，此处为简化示例设为false
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true // 启用webview标签
    },
    title: "特定网页访问器",
  });

  // 加载主页面
  mainWindow.loadFile('index.html');

  // 打开开发者工具（可选）
  // mainWindow.webContents.openDevTools()

  // 拦截窗口关闭事件
  mainWindow.on("close", function (e) {
    // 如果不是通过确认对话框关闭，则阻止默认关闭行为
    if (!willQuitApp) {
      e.preventDefault();

      // 显示确认对话框
      dialog
        .showMessageBox(mainWindow, {
          type: "question",
          buttons: ["确认", "取消"],
          title: "确认退出",
          message: "确定要退出应用吗?",
          defaultId: 0, // 默认选中的按钮索引
          cancelId: 1, // 取消按钮的索引
        })
        .then((result) => {
          if (result.response === 0) {
            // 用户点击了"确认"
            willQuitApp = true;
            app.quit();
          }
          // 如果用户点击"取消"，则不做任何操作，应用继续运行
        });
    }
  });

  // 当window被关闭时触发
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // 监听DOM准备就绪事件
  mainWindow.webContents.on("dom-ready", () => {});

  // 在页面加载完成后执行
  mainWindow.webContents.on("did-finish-load", () => {});

  updateMenu();
  
  // 更新标签页列表
  updateTabList();
}

// 获取退出URL
function getLogoutUrl(url) {
  if (!url) return null;
  
  // 从URL中提取域名部分
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  if (match) {
    return `${match[1]}/logout`;
  }
  return null;
}

// 创建应用窗口
function createAppWindow(id, url, title) {
  // 如果窗口已存在，则聚焦该窗口
  if (appWindows[id]) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "提示",
      message: "应用已打开",
      buttons: ["确定"]
    });
    
    // 通知渲染进程聚焦该标签
    mainWindow.webContents.send('focus-tab', id);
    return;
  }
  
  // 获取退出URL
  const logoutUrl = getLogoutUrl(url);
  
  // 存储窗口信息
  appWindows[id] = {
    title: title,
    url: url,
    logoutUrl: logoutUrl
  };
  
  // 通知渲染进程创建webview
  mainWindow.webContents.send('create-webview', {
    id: id,
    url: url || 'about:blank',
    title: title
  });
  
  // 更新标签页列表
  updateTabList();
}

// 加载XML配置
function loadRegionsConfig() {
  try {
    const xmlPath = path.join(__dirname, 'regions.xml');
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    
    // 简单的XML解析
    const regionMatches = xmlData.match(/<region>[\s\S]*?<\/region>/g);
    regions = [];
    
    if (regionMatches) {
      regionMatches.forEach(regionXml => {
        const id = regionXml.match(/<id>([^<]*)<\/id>/)?.[1] || '';
        const label = regionXml.match(/<label>([^<]*)<\/label>/)?.[1] || '';
        const url = regionXml.match(/<url>([^<]*)<\/url>/)?.[1] || '';
        const title = regionXml.match(/<title>([^<]*)<\/title>/)?.[1] || '';
        
        regions.push({ id, label, url, title });
      });
    }
  } catch (error) {
    console.error('加载XML配置失败:', error);
  }
}

// 构建区域子菜单
function buildRegionSubmenu() {
  return regions.map(region => ({
    label: appWindows[region.id] ? `${region.label} ✓` : region.label,
    click: () => createAppWindow(region.id, region.url, region.title)
  }));
}

// 更新标签页列表
function updateTabList() {
  if (mainWindow) {
    const tabList = Object.keys(appWindows).map(id => {
      return {
        id: id,
        title: appWindows[id].title
      };
    });
    mainWindow.webContents.send('update-tabs', tabList);
    
    // 更新菜单以反映tab状态
    updateMenu();
  }
}

// 关闭应用窗口
function closeAppWindow(id) {
  if (appWindows[id]) {
    dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["确认", "取消"],
      title: "确认退出",
      message: "确定要退出应用吗?",
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        // 用户点击了"确认"
        const logoutUrl = appWindows[id].logoutUrl;
        
        // 如果有退出URL，执行退出操作
        if (logoutUrl) {
          mainWindow.webContents.send('execute-logout', {
            id: id,
            logoutUrl: logoutUrl
          });
        }
        
        delete appWindows[id];
        updateTabList();
        // 通知渲染进程移除webview
        mainWindow.webContents.send('remove-webview', id);
      }
    });
  }
}

// 更新菜单
function updateMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",
          click: () => {
            dialog
              .showMessageBox(mainWindow, {
                type: "question",
                buttons: ["确认", "取消"],
                title: "确认退出",
                message: "确定要退出应用吗?",
                defaultId: 0,
                cancelId: 1,
              })
              .then((result) => {
                if (result.response === 0) {
                  willQuitApp = true;
                  app.quit();
                }
              });
          },
        },
      ],
    },
    {
      label: "区域",
      submenu: [
        ...buildRegionSubmenu(),
        { type: "separator" },
        {
          label: "刷新",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) focusedWindow.reload();
          },
        },
      ],
    },
  ]);
  
  Menu.setApplicationMenu(menu);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  loadRegionsConfig();
  createWindow();
  
  // 设置IPC通信
  ipcMain.on('close-app-window', (event, id) => {
    closeAppWindow(id);
  });
  
  ipcMain.on('focus-app-window', (event, id) => {
    if (appWindows[id]) {
      mainWindow.webContents.send('focus-tab', id);
    }
  });
});

// 当所有窗口关闭时退出应用
app.on("window-all-closed", function () {
  // 在macOS上，应用和菜单栏通常会保持活动状态，直到用户使用Cmd+Q退出
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
  if (mainWindow === null) createWindow();
});

// 应用退出前的处理
app.on("before-quit", () => {
  willQuitApp = true;
});
