import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { RecordProvider } from './context/RecordContext'

// 動的ビューポート高さの設定
const setVh = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--screen-height', `${window.innerHeight}px`);
};

// 初回設定
setVh();

// リサイズ時の調整（デバウンス付き）
let resizeTimer: NodeJS.Timeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setVh, 150);
});

// オリエンテーション変更時の調整
window.addEventListener('orientationchange', () => {
  setTimeout(setVh, 500);
});

// iOS Safariでのスクロール時の調整
if (navigator.userAgent.includes('Safari') && navigator.userAgent.includes('iPhone')) {
  window.addEventListener('scroll', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setVh, 100);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RecordProvider>
        <App />
      </RecordProvider>
    </AuthProvider>
  </React.StrictMode>,
)
