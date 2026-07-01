"use client";

import { useEffect } from "react";

const targetRoute = "/admin/dashboard";
const eyebrow = "USER MODE [윤창]";
const title = "한국경영분석연구원";
const summary = "원가계산, 계약금액조정, 개발부담금, 학술연구와 분쟁 검증 업무를 한 화면에서 탐색하도록 재구성한 공개 사이트형 대시보드입니다.";

const overrideStyles = `
  .app[data-dashboard-copy-override="admin-dashboard"] .container > .hero ~ *:not(.dashboard-copy-override) {
    display: none !important;
  }

  .dashboard-copy-override {
    display: grid;
    gap: 28px;
  }

  .dashboard-copy-overview {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 330px);
    gap: 32px;
    padding: 38px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px),
      var(--panel);
    background-size: 34px 34px;
    box-shadow: var(--shadow-md);
  }

  .dashboard-copy-overview::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0.94), rgba(255,255,255,0.78));
    pointer-events: none;
  }

  .dark .dashboard-copy-overview::before {
    background: linear-gradient(90deg, rgba(17,24,39,0.94), rgba(17,24,39,0.78));
  }

  .dashboard-copy-main,
  .dashboard-copy-metrics {
    position: relative;
    z-index: 1;
  }

  .dashboard-copy-main .eyebrow {
    display: inline-flex;
    margin-bottom: 12px;
  }

  .dashboard-copy-main h2 {
    margin: 0 0 12px;
    font-size: clamp(32px, 5vw, 48px);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .dashboard-copy-main p {
    max-width: 720px;
    margin: 0;
    color: var(--text-soft);
    line-height: 1.8;
  }

  .dashboard-copy-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 24px 0;
  }

  .dashboard-copy-tags span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 800;
    box-shadow: var(--shadow-sm);
  }

  .dashboard-copy-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .dashboard-copy-actions a {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 18px;
    border-radius: 10px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
    transition: all 0.2s var(--ease);
  }

  .dashboard-copy-actions a:first-child {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 10px 18px rgba(37, 99, 235, 0.18);
  }

  .dashboard-copy-actions a:last-child {
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text);
  }

  .dashboard-copy-actions a:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .dashboard-copy-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dashboard-copy-metric {
    min-height: 112px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: color-mix(in srgb, var(--panel) 82%, transparent);
    box-shadow: var(--shadow-sm);
  }

  .dashboard-copy-metric strong {
    color: var(--text);
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .dashboard-copy-metric span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-copy-service-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .dashboard-copy-service {
    min-height: 144px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    box-shadow: var(--shadow-sm);
  }

  .dashboard-copy-service span {
    color: var(--primary);
    font-size: 11px;
    font-weight: 900;
  }

  .dashboard-copy-service strong {
    display: block;
    color: var(--text);
    font-size: 18px;
    letter-spacing: 0;
  }

  .dashboard-copy-service p {
    margin: 0;
    color: var(--text-soft);
    font-size: 12.5px;
    line-height: 1.55;
  }

  @media (max-width: 980px) {
    .dashboard-copy-overview {
      grid-template-columns: 1fr;
      padding: 26px;
    }

    .dashboard-copy-service-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .dashboard-copy-overview {
      padding: 22px;
    }

    .dashboard-copy-metrics,
    .dashboard-copy-service-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function currentHashRoute() {
  return window.location.hash.replace("#", "") || "/dashboard";
}

function dashboardMarkup() {
  return `
    <section class="dashboard-copy-overview" aria-label="한국경영분석연구원 공개 사이트형 대시보드">
      <div class="dashboard-copy-main">
        <span class="eyebrow">Korea Institute of Business Analysis & Development</span>
        <h2>${title}</h2>
        <p>${summary}</p>
        <div class="dashboard-copy-tags" aria-label="핵심 업무 태그">
          <span>기재부 허가</span>
          <span>공공예산 검증</span>
          <span>34개 업무 페이지</span>
        </div>
        <div class="dashboard-copy-actions">
          <a href="#/support/contact">상담 및 문의</a>
          <a href="#/cost-guide/government-contract">원가계산안내</a>
        </div>
      </div>
      <div class="dashboard-copy-metrics">
        <div class="dashboard-copy-metric"><strong>1998.04.10</strong><span>설립 허가</span></div>
        <div class="dashboard-copy-metric"><strong>48명</strong><span>구성 인원</span></div>
        <div class="dashboard-copy-metric"><strong>100명+</strong><span>전문·자문</span></div>
        <div class="dashboard-copy-metric"><strong>ISO<br />27001</strong><span>보안 인증</span></div>
      </div>
    </section>
    <section class="dashboard-copy-service-grid" aria-label="주요 업무">
      <article class="dashboard-copy-service"><span>01</span><div><strong>원가계산</strong><p>정부계약, 예정가격, 원가계산 실무 흐름을 한 화면에서 탐색합니다.</p></div></article>
      <article class="dashboard-copy-service"><span>02</span><div><strong>계약금액조정</strong><p>물가변동, 설계변경, 기타 계약내용 변경 업무를 연결합니다.</p></div></article>
      <article class="dashboard-copy-service"><span>03</span><div><strong>개발부담금</strong><p>부과대상, 산출방식, 개발비용 산정 기준을 정리합니다.</p></div></article>
      <article class="dashboard-copy-service"><span>04</span><div><strong>학술연구·분쟁</strong><p>타당성조사, 공공서비스 요금산정, 분쟁 검증 업무를 연결합니다.</p></div></article>
    </section>
  `;
}

export function DashboardUiOverrides() {
  useEffect(() => {
    let applying = false;

    function ensureStyles() {
      if (document.getElementById("dashboard-ui-overrides-style")) {
        return;
      }
      const style = document.createElement("style");
      style.id = "dashboard-ui-overrides-style";
      style.textContent = overrideStyles;
      document.head.appendChild(style);
    }

    function removeOverride() {
      document.querySelector(".app")?.removeAttribute("data-dashboard-copy-override");
      document.querySelector(".dashboard-copy-override")?.remove();
    }

    function applyOverride() {
      if (applying) {
        return;
      }
      applying = true;

      try {
        ensureStyles();
        const app = document.querySelector<HTMLElement>(".app");
        const container = document.querySelector<HTMLElement>(".app .container");
        const hero = container?.querySelector<HTMLElement>(".hero");

        if (!app || !container || !hero || currentHashRoute() !== targetRoute) {
          removeOverride();
          return;
        }

        app.setAttribute("data-dashboard-copy-override", "admin-dashboard");

        const small = hero.querySelector("small");
        const heading = hero.querySelector("h1");
        const paragraph = hero.querySelector("p");
        if (small) {
          small.textContent = eyebrow;
        }
        if (heading) {
          heading.textContent = title;
        }
        if (paragraph) {
          paragraph.textContent = summary;
        }

        let override = container.querySelector<HTMLElement>(".dashboard-copy-override");
        if (!override) {
          override = document.createElement("div");
          override.className = "dashboard-copy-override";
          hero.insertAdjacentElement("afterend", override);
        }
        override.innerHTML = dashboardMarkup();
      } finally {
        window.setTimeout(() => {
          applying = false;
        }, 0);
      }
    }

    const scheduleApply = () => window.requestAnimationFrame(applyOverride);
    const observer = new MutationObserver(scheduleApply);

    scheduleApply();
    window.addEventListener("hashchange", scheduleApply);
    window.addEventListener("popstate", scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.removeEventListener("hashchange", scheduleApply);
      window.removeEventListener("popstate", scheduleApply);
      observer.disconnect();
      removeOverride();
    };
  }, []);

  return null;
}
