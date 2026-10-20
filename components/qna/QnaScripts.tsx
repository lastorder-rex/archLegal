'use client';

import { useEffect, useRef } from 'react';

// qna 본문(dangerouslySetInnerHTML)의 3D 캔버스 엔진·UI 스크립트를 mount마다 주입.
// next/script(afterInteractive)는 클라이언트 소프트 내비게이션에서 재실행되지 않아,
// 헤더 메뉴로 /qna에 진입하면 캔버스가 초기화되지 않는 문제가 있었다.
// useEffect에서 <script>를 직접 append하면 전체 로드/클라이언트 이동 모두에서 실행된다.
export function QnaScripts() {
  const injected = useRef(false);

  useEffect(() => {
    // Strict Mode(dev)의 이중 실행/재마운트로 엔진이 두 번 돌아 콘텐츠가 중복 주입되는 것 방지
    if (injected.current) return;
    injected.current = true;

    // 순서 보존(async=false): qna-ui.js → current-model.js
    const sources = ['/qna/qna-ui.js', '/qna/current-model.js'];
    const els = sources.map(src => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      document.body.appendChild(s);
      return s;
    });
    return () => {
      els.forEach(s => s.remove());
    };
  }, []);

  return null;
}
