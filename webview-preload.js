// webview预加载脚本
window.addEventListener('DOMContentLoaded', () => {
  // 确保connect对象可以被访问
  if (typeof window.connect === 'undefined') {
    window.connect = {};
  }
});