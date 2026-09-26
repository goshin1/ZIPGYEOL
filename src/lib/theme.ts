export const THEME_STORAGE_KEY = 'theme';

/**
 * 첫 페인트 전에 <html>에 dark 클래스를 적용해 화면 깜빡임(FOUC)을 막는 스크립트.
 * 저장된 값이 없으면 OS 설정을 따른다. layout.tsx의 <head>에 인라인으로 삽입된다.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
