(() => {
  const originalRender = window.render;
  let currentEvents = [];
  let persistedData = null;

  function eventsForInsight() {
    let rows = data.filter(a => match(a, company));
    if (type !== '전체') rows = rows.filter(a => classify(a)[0] === type);
    if (region !== '전체') rows = rows.filter(a => (a.region || 'Global') === region);
    rows = rows.filter(a => {
      const date = (a.published || '').slice(0, 10);
      return (!startDate || date >= startDate) && (!endDate || date <= endDate);
    });
    if (compareMode && compareCompanies.length) {
      return compareCompanies.flatMap(name => limitMonthlyEvents(rows.filter(a => match(a, name)))).slice(0, 30);
    }
    return limitMonthlyEvents(rows).slice(0, 30);
  }

  function eventCompany(article, preferred = '') {
    if (preferred) return preferred;
    if (company) return company;
    const allCompanies = Object.values(GROUPS).flat();
    return allCompanies.find(name => match(article, name)) || stage;
  }

  function groupCompanyEvents(rows, preferred = '') {
    if (rows.length && rows.every(article => article._storedEvent)) {
      return rows.map(article => {
        const saved = article._storedEvent;
        const eventType = TYPES.find(item => item[0] === saved.event_type) || TYPES[TYPES.length - 1];
        return {
          title: saved.summary, summary: saved.details || saved.summary, published: article.published,
          region: saved.region, application: saved.application, material: saved.material, hashtags: [saved.company],
          source: '저장된 이벤트', url: saved.source_articles?.[0]?.url || '#', score: 5,
          company: saved.company, eventType, brief: saved.summary,
          articles: (saved.source_articles || []).map(source => ({ ...source, id: null })),
        };
      });
    }
    const groups = new Map();
    rows.forEach(article => {
      const companyName = eventCompany(article, preferred);
      const eventType = classify(article);
      const month = (article.published || '날짜미상').slice(0, 7);
      const key = `${companyName}|${eventType[0]}|${month}`;
      if (!groups.has(key)) groups.set(key, { company: companyName, eventType, month, articles: [] });
      groups.get(key).articles.push(article);
    });
    return [...groups.values()].map(group => {
      const articles = [...group.articles].sort((a, b) => (Number(b.score) || 3) - (Number(a.score) || 3) || (b.published || '').localeCompare(a.published || ''));
      const lead = articles[0];
      const keyTags = [...new Set(articles.flatMap(a => a.hashtags || []))].filter(tag => !/기자|뉴스/.test(tag)).slice(0, 5);
      const signals = [...new Set(articles.map(a => String(a.summary || '').replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 3).join(' / ');
      const briefSource = String(lead.summary || lead.title || '').replace(/\s+/g, ' ').trim();
      return {
        title: `${group.company} · ${group.eventType[0]}`,
        summary: signals.slice(0, 420), published: lead.published, region: lead.region, application: lead.application,
        material: lead.material, hashtags: keyTags, source: lead.source, url: lead.url, score: lead.score,
        company: group.company, eventType: group.eventType, brief: briefSource.length > 30 ? `${briefSource.slice(0, 30)}…` : briefSource, articles,
      };
    }).sort((a, b) => (b.published || '').localeCompare(a.published || ''));
  }

  function eventCard(event) {
    const sources = event.articles.slice(0, 4).map(article => `<li><a href="${safe(article.url)}" target="_blank" rel="noopener">${safe(article.title)}</a></li>`).join('');
    const extra = event.articles.length > 4 ? `<li>외 ${event.articles.length - 4}건</li>` : '';
    return `<article class="event groupedEvent" style="--tone:${event.eventType[2]}"><div class="eventDate">${safe((event.published || '날짜 미상').slice(0, 7).replace('-', '.'))}</div><div class="eventLine"><span class="eventType">${safe(event.eventType[0])}</span><span class="eventBrief">${safe(event.brief || '근거 기사 내용을 확인해 주세요.')}</span></div><details><summary>근거 기사 ${event.articles.length}건</summary><ul>${sources}${extra}</ul></details></article>`;
  }

  function renderGroupedEvents(events) {
    const timeline = document.getElementById('timeline');
    if (compareMode && compareCompanies.length >= 2) {
      timeline.className = 'compareGrid';
      timeline.innerHTML = compareCompanies.map(name => {
        const grouped = groupCompanyEvents(eventsForInsight().filter(article => match(article, name)), name);
        return `<section class="lane"><h3>${safe(name)} <small>(${grouped.length}개 이벤트)</small></h3>${grouped.length ? grouped.map(eventCard).join('') : '<p class="sub">해당 조건의 이벤트가 없습니다.</p>'}</section>`;
      }).join('');
      document.getElementById('meta').textContent = '회사별로 같은 월·같은 이벤트 성격의 기사를 하나의 사건으로 묶었습니다.';
      return;
    }
    timeline.className = 'timeline';
    timeline.innerHTML = events.length ? events.map(eventCard).join('') : '<div class="empty">선택 조건에 맞는 이벤트가 없습니다.</div>';
    document.getElementById('meta').textContent = `${events.length}개 굵직한 회사 이벤트 · 상세 내용은 30자 이내`;
  }

  window.render = function () {
    if (persistedData) data = persistedData;
    originalRender();
    currentEvents = groupCompanyEvents(eventsForInsight());
    renderGroupedEvents(currentEvents);
    const count = document.getElementById('insightCount');
    if (count) count.textContent = `현재 선택 ${currentEvents.length}개 이벤트`;
  };

  document.querySelector('.filters').insertAdjacentHTML('afterend',
    '<section class="aiTimeline"><div><span>AI TIMELINE BRIEF</span><strong>선택한 시계열을 소재사 관점으로 정리</strong><small id="insightCount">현재 선택 0개 이벤트</small></div><button id="makeTimelineInsight">AI 흐름 분석</button><pre id="timelineInsight">밸류체인·기업·이벤트 성격·권역·기간을 고른 뒤 실행하면, 변화와 대응 포인트를 정리합니다.</pre></section>'
  );

  const style = document.createElement('style');
  style.textContent = '.groupedEvent{padding-bottom:15px}.groupedEvent .eventDate{font:600 10px/1 ui-monospace,monospace;color:var(--muted);margin-bottom:7px}.groupedEvent .eventLine{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}.groupedEvent .eventBrief{color:var(--ink);font-size:13px;font-weight:650}.groupedEvent details{margin-top:9px;font-size:11px;color:var(--green)}.groupedEvent summary{cursor:pointer}.groupedEvent ul{margin:7px 0 0;padding-left:16px;line-height:1.55}.groupedEvent li{margin:3px 0}.groupedEvent li a{color:var(--muted)}.aiTimeline{margin:0 0 17px;background:#17261c;color:#fff;border-radius:16px;padding:16px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.aiTimeline span,.aiTimeline small{display:block;font:700 10px/1.4 ui-monospace,monospace;letter-spacing:.09em;color:#b6df8e}.aiTimeline strong{display:block;font-size:15px;margin-top:5px}.aiTimeline small{color:#cbd7c9;margin-top:5px}.aiTimeline button{border:0;border-radius:999px;background:#b6df8e;color:#17261c;font-weight:800;padding:10px 13px;cursor:pointer}.aiTimeline button:disabled{opacity:.6}.aiTimeline pre{grid-column:1/-1;display:none;white-space:pre-wrap;margin:0;border-top:1px solid #4b5d4e;padding-top:12px;font:13px/1.65 ui-sans-serif,sans-serif;color:#edf5ea}.aiTimeline pre.show{display:block}@media(max-width:700px){.aiTimeline{grid-template-columns:1fr}.aiTimeline button{width:100%;min-height:42px}}';
  document.head.appendChild(style);

  async function authHeaders() {
    if (!window.supabase) return { 'Content-Type': 'application/json' };
    const client = window.supabase.createClient('https://wpgiidlfjtimeellpzwk.supabase.co', 'sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL');
    const { data: { session } } = await client.auth.getSession();
    return { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) };
  }

  function eventKey(event) {
    const month = String(event.published || '').slice(0, 7);
    const phrase = String(event.brief || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, '').slice(0, 50);
    return `${event.company}|${event.eventType[0]}|${month}|${phrase}`;
  }

  function eventRecord(event) {
    return {
      event_key: eventKey(event), company: event.company, stage: stage, event_type: event.eventType[0],
      event_date: String(event.published || '').slice(0, 10), region: event.region || 'Global',
      application: event.application || 'Etc', material: event.material || 'Etc', summary: event.brief,
      details: event.summary || null, ai_model: 'gpt-4o-mini', last_seen_at: new Date().toISOString(),
      source_article_ids: event.articles.map(article => article.id).filter(Boolean),
      source_articles: event.articles.slice(0, 8).map(article => ({ title: article.title, url: article.url, source: article.source, published: article.published })),
    };
  }

  async function saveEvents(events) {
    const response = await fetch('/api/timeline-events', {
      method: 'POST', credentials: 'same-origin', headers: await authHeaders(),
      body: JSON.stringify({ events: events.map(eventRecord) }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'timeline_save_failed');
  }

  async function loadPersistedEvents() {
    try {
      const response = await fetch('/api/timeline-events', { credentials: 'same-origin', headers: await authHeaders() });
      const result = await response.json();
      if (!response.ok || !result.events?.length) return;
      persistedData = result.events.map(event => ({
        id: event.id, title: `${event.company} ${event.summary}`, summary: event.details || event.summary,
        published: `${event.event_date}T00:00:00+09:00`, region: event.region, application: event.application,
        material: event.material, hashtags: [event.company], source: '저장된 이벤트', score: 5,
        _storedEvent: event,
      }));
      renderControls();
      window.render();
    } catch (_) { /* 저장된 이벤트가 없으면 원본 뉴스 기반 화면을 사용한다. */ }
  }

  document.getElementById('makeTimelineInsight').onclick = async () => {
    const button = document.getElementById('makeTimelineInsight');
    const box = document.getElementById('timelineInsight');
    if (!currentEvents.length) {
      box.textContent = '선택 조건에 맞는 이벤트가 없습니다.';
      box.classList.add('show');
      return;
    }
    button.disabled = true;
    button.textContent = 'AI가 흐름을 읽는 중…';
    box.classList.remove('show');
    try {
      const response = await fetch('/api/timeline-insight', {
        method: 'POST', credentials: 'same-origin', headers: await authHeaders(),
        body: JSON.stringify({ events: currentEvents, scope: { stage, company: compareMode ? compareCompanies : company, type, region, startDate, endDate } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || 'AI 분석에 실패했습니다.');
      const majorIndexes = new Set();
      (result.summaries || []).forEach(item => {
        if (Number.isInteger(item.index) && currentEvents[item.index] && item.summary) currentEvents[item.index].brief = item.summary;
        if (Number.isInteger(item.index) && item.major) majorIndexes.add(item.index);
      });
      if (majorIndexes.size) currentEvents = currentEvents.filter((_, index) => majorIndexes.has(index));
      renderGroupedEvents(currentEvents);
      try { await saveEvents(currentEvents); } catch (saveError) { console.warn('시계열 저장 실패:', saveError.message); }
      box.textContent = result.insight;
    } catch (error) {
      box.textContent = error.message === 'unauthorized' ? '대시보드에서 로그인한 뒤 다시 시도해 주세요.' : `AI 분석 실패: ${error.message}`;
    } finally {
      box.classList.add('show');
      button.disabled = false;
      button.textContent = 'AI 흐름 분석';
    }
  };

  window.render();
  loadPersistedEvents();
})();

