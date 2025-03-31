const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// 保持对window对象的引用，否则当JavaScript对象被垃圾回收时，window对象将被自动关闭
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true, // 是否集成Node.js
      contextIsolation: false, // 上下文隔离，推荐为true，此处为简化示例设为false
    },
    title: "特定网页访问器",
  });

  // 加载特定网页
  mainWindow.loadURL("https://connect-us-1.my.connect.aws/agent-app-v2"); // 替换为您要访问的特定网页URL

  // 打开开发者工具（可选）
  // mainWindow.webContents.openDevTools()

  // 当window被关闭时触发
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // 监听DOM准备就绪事件
  mainWindow.webContents.on("dom-ready", () => {});

  // 在页面加载完成后执行
  mainWindow.webContents.on("did-finish-load", () => {});

  // 创建简单菜单
  const menu = Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [{ role: "quit", label: "退出" }],
    },
    {
      label: "区域",
      submenu: [
        {
          label: "美国东部（弗吉尼亚北部）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-us-1.my.connect.aws/agent-app-v2"
            ),
        },
        {
          label: "美国西部（俄勒冈）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-us.my.connect.aws/agent-app-v2"
            ),
        },

        {
          label: "亚太地区（首尔）",
          click: () => mainWindow.loadURL(""),
        },
        {
          label: "亚太地区（新加坡）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-sg-1.my.connect.aws/agent-app-v2"
            ),
        },
        {
          label: "亚太地区（悉尼）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-syd-1.my.connect.aws/agent-app-v2"
            ),
        },
        {
          label: "亚太地区（东京）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-jp-0907.my.connect.aws/agent-app-v2"
            ),
        },
        {
          label: "加拿大（中部）",
          click: () => mainWindow.loadURL(""),
        },
        {
          label: "欧洲（法兰克福）",
          click: () =>
            mainWindow.loadURL("https://eu-c-1.my.connect.aws/agent-app-v2"),
        },
        {
          label: "欧洲（伦敦）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-eu-2.my.connect.aws/agent-app-v2"
            ),
        },
        {
          label: "非洲（开普敦）",
          click: () =>
            mainWindow.loadURL(
              "https://connect-us.my.connect.aws/agent-app-v2"
            ),
        },
        { type: "separator" },
        {
          label: "刷新",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.reload(),
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口关闭时退出应用
app.on("window-all-closed", function () {
  // 在macOS上，应用和菜单栏通常会保持活动状态，直到用户使用Cmd+Q退出
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
  if (mainWindow === null) createWindow();
});
