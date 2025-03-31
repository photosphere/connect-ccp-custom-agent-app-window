const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");

// 保持对window对象的引用，否则当JavaScript对象被垃圾回收时，window对象将被自动关闭
let mainWindow;
// 添加退出标志
let willQuitApp = false;

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

  // 创建简单菜单
  const menu = Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",
          click: () => {
            // 点击菜单退出时也显示确认对话框
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
                  // 用户点击了"确认"
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

// 应用退出前的处理
app.on("before-quit", () => {
  willQuitApp = true;
});
