/* ==========================================================================
   해외여행 지도
   - d3-geo + topojson-client로 세계지도를 그리고, 방문한 곳에 대표 사진 핀을 꽂는다.
   - 핀에 마우스를 올리면(또는 키보드로 포커스하면) 핀이 커지고 아래에 방문 시기가 뜬다.
   - 핀끼리 겹치지 않도록 간단한 반발력 계산으로 사진 위치를 벌리고,
     실제 위치에는 작은 점을 찍어 선으로 잇는다.
   ========================================================================== */

(function () {
  // 여행 기록 — 새 여행은 여기에 한 줄 추가하고 assets/travel/ 에 사진을 넣으면 된다
  // photo: assets/travel/<photo>.jpg (정사각형 썸네일)
  const TRIPS = [
    { id: 'danang',    country: '베트남',       city: '다낭',       lon: 108.22, lat: 16.05, dates: ['2018.08'], photo: 'danang' },
    { id: 'prague',    country: '체코',         city: '프라하',     lon: 14.42,  lat: 50.08, dates: ['2019.01'], photo: 'prague' },
    { id: 'vienna',    country: '오스트리아',   city: '빈',         lon: 16.37,  lat: 48.21, dates: ['2019.01'], photo: 'vienna' },
    { id: 'dresden',   country: '독일',         city: '드레스덴',   lon: 13.74,  lat: 51.05, dates: ['2019.01'], photo: 'dresden' },
    { id: 'budapest',  country: '헝가리',       city: '부다페스트', lon: 19.04,  lat: 47.50, dates: ['2019.01'], photo: 'budapest' },
    { id: 'singapore', country: '싱가포르',     city: '',           lon: 103.82, lat: 1.35,  dates: ['2019.06'], photo: 'singapore' },
    { id: 'bangkok',   country: '태국',         city: '방콕',       lon: 100.50, lat: 13.76, dates: ['2019.08'], photo: 'bangkok' },
    { id: 'macau',     country: '마카오',       city: '',           lon: 113.54, lat: 22.20, dates: ['2019.11'], photo: 'macau' },
    { id: 'tashkent',  country: '우즈베키스탄', city: '타슈켄트',   lon: 69.24,  lat: 41.30, dates: ['2024.01'], photo: 'tashkent' },
    { id: 'hongkong',  country: '홍콩',         city: '',           lon: 114.17, lat: 22.32, dates: ['2024.07', '2026.02'], photo: 'hongkong-2026' },
    { id: 'chengdu',   country: '중국',         city: '청두',       lon: 104.07, lat: 30.57, dates: ['2024.09', '2026.05'], photo: 'chengdu-2026' },
    { id: 'qingdao',   country: '중국',         city: '칭다오',     lon: 120.38, lat: 36.07, dates: ['2024.12'], photo: 'qingdao' },
    { id: 'cairo',     country: '이집트',       city: '카이로',     lon: 31.24,  lat: 30.04, dates: ['2025.02'], photo: 'cairo' },
    { id: 'almaty',    country: '카자흐스탄',   city: '알마티',     lon: 76.95,  lat: 43.24, dates: ['2025.07'], photo: 'almaty' },
    { id: 'issykkul',  country: '키르기스스탄', city: '이식쿨',     lon: 77.20,  lat: 42.45, dates: ['2025.07'], photo: 'issykkul' },
    { id: 'newyork',   country: '미국',         city: '뉴욕',       lon: -74.00, lat: 40.71, dates: ['2025.12'], photo: 'newyork' },
    { id: 'vancouver', country: '캐나다',       city: '밴쿠버',     lon: -123.12, lat: 49.28, dates: ['2025.12'], photo: 'vancouver' },
    { id: 'chongqing', country: '중국',         city: '충칭',       lon: 106.55, lat: 29.56, dates: ['2026.05'], photo: 'chongqing' },
  ];

  // 방문한 나라 (world-atlas의 ISO 3166-1 숫자 코드). 홍콩·마카오·싱가포르는 110m 지도에 없어 핀만 표시된다
  const VISITED = new Set(['704', '203', '040', '276', '348', '764', '860', '156', '818', '398', '417', '840', '124']);

  const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

  // 지도 좌표계 (viewBox)
  const W = 1000;
  let H = 540;            // 실제 높이는 보여줄 범위에 맞춰 draw()에서 다시 계산한다
  const R = 17;           // 사진 핀 반지름
  const LIFT = 30;        // 사진을 실제 위치보다 얼마나 위로 띄울지
  const GAP = 5;          // 핀 사이 최소 여백

  // 보여줄 범위 — 밴쿠버부터 동아시아까지
  const VIEW = { west: -130, east: 146, south: -8, north: 70 };

  const host = document.getElementById('travel-map');
  if (!host) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  const label = (t) => (t.city ? `${t.country} · ${t.city}` : t.country);

  function fail() {
    host.innerHTML = '<p class="travel-map-status">지도를 불러오지 못했습니다.</p>';
  }

  if (!window.d3 || !window.topojson) {
    fail();
    return;
  }

  fetch(WORLD_URL)
    .then((res) => {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(draw)
    .catch(fail);

  function draw(world) {
    const countries = topojson.feature(world, world.objects.countries);

    // 보여줄 범위의 테두리 점들로 투영을 맞춘다
    const frame = [];
    for (let i = 0; i <= 12; i++) {
      const lon = VIEW.west + ((VIEW.east - VIEW.west) * i) / 12;
      frame.push([lon, VIEW.south], [lon, VIEW.north]);
    }
    // 폭에 맞춘 뒤, 범위의 위아래에 딱 맞게 높이를 정해 빈 여백이 생기지 않게 한다
    const frameShape = { type: 'MultiPoint', coordinates: frame };
    const projection = d3.geoNaturalEarth1().fitWidth(W - 20, frameShape);
    const [[x0, y0], [, y1]] = d3.geoPath(projection).bounds(frameShape);
    const [tx, ty] = projection.translate();
    projection.translate([tx + 10 - x0, ty + 10 - y0]);
    H = Math.ceil(y1 - y0 + 20);
    const path = d3.geoPath(projection);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '방문한 나라와 도시를 표시한 세계지도' });

    const defs = el('defs');
    const clip = el('clipPath', { id: 'travel-pin-clip' });
    clip.appendChild(el('circle', { r: R }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    // 나라
    const land = el('g', { class: 'travel-land' });
    for (const f of countries.features) {
      if (f.id === '010') continue; // 남극 제외
      const d = path(f);
      if (!d) continue;
      // fill 속성은 CSS가 늦게 오거나 예전 CSS가 캐시돼 있을 때를 위한 기본값 (CSS가 있으면 CSS가 우선)
      const visited = VISITED.has(f.id);
      land.appendChild(el('path', { d, class: visited ? 'visited' : '', fill: visited ? '#052a63' : '#111826' }));
    }
    svg.appendChild(land);

    // 핀 위치 계산 — 실제 위치(anchor)에서 위로 띄운 뒤 서로 밀어낸다
    const pins = TRIPS.map((t) => {
      const [ax, ay] = projection([t.lon, t.lat]);
      return { t, ax, ay, x: ax, y: ay - LIFT };
    });

    const minDist = R * 2 + GAP;
    for (let iter = 0; iter < 500; iter++) {
      for (let i = 0; i < pins.length; i++) {
        for (let j = i + 1; j < pins.length; j++) {
          const a = pins[i];
          const b = pins[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          if (dist === 0) { dx = 1; dy = 0; dist = 1; }
          if (dist < minDist) {
            const push = (minDist - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
          }
        }
      }
      // 제자리(anchor 위쪽)로 조금씩 당긴다
      for (const p of pins) {
        p.x += (p.ax - p.x) * 0.02;
        p.y += (p.ay - LIFT - p.y) * 0.02;
        p.x = Math.min(W - R - 2, Math.max(R + 2, p.x));
        p.y = Math.min(H - R - 2, Math.max(R + 2, p.y));
      }
    }

    // 선과 점을 먼저, 사진을 나중에 그려 사진이 항상 위에 오게 한다
    const stems = el('g', { class: 'travel-stems' });
    const layer = el('g', { class: 'travel-pins' });

    for (const p of pins) {
      stems.appendChild(el('line', { x1: p.ax, y1: p.ay, x2: p.x, y2: p.y }));
      stems.appendChild(el('circle', { cx: p.ax, cy: p.ay, r: 2.6, class: 'travel-dot' }));

      const g = el('g', {
        class: 'travel-pin',
        transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`,
        tabindex: '0',
        'aria-label': `${label(p.t)}, ${p.t.dates.join(', ')}`,
        'data-trip': p.t.id,
      });
      const bubble = el('g', { class: 'travel-bubble' });
      bubble.appendChild(el('circle', { r: R, class: 'travel-bubble-bg', fill: '#02132f' }));
      bubble.appendChild(el('image', {
        href: `assets/travel/${p.t.photo}.jpg`,
        x: -R, y: -R, width: R * 2, height: R * 2,
        preserveAspectRatio: 'xMidYMid slice',
        'clip-path': 'url(#travel-pin-clip)',
      }));
      bubble.appendChild(el('circle', { r: R, class: 'travel-bubble-ring', fill: 'none', stroke: '#1746c4', 'stroke-width': 2 }));
      g.appendChild(bubble);
      layer.appendChild(g);
    }

    svg.appendChild(stems);
    svg.appendChild(layer);

    const tip = document.createElement('div');
    tip.className = 'travel-tip';
    tip.hidden = true;

    host.innerHTML = '';
    host.appendChild(svg);
    host.appendChild(tip);

    // 방문 시기 툴팁 — 핀 바로 아래에 띄운다
    function show(g) {
      const t = TRIPS.find((x) => x.id === g.dataset.trip);
      if (layer.lastChild !== g) layer.appendChild(g); // 겹칠 때 맨 위로
      tip.innerHTML = `<strong>${label(t)}</strong><span>${t.dates.join(' · ')}</span>`;
      tip.hidden = false;
      const box = g.getBoundingClientRect();
      const base = host.getBoundingClientRect();
      tip.style.left = `${box.left - base.left + host.scrollLeft + box.width / 2}px`;
      tip.style.top = `${box.bottom - base.top + 8}px`;
    }

    function hide() {
      tip.hidden = true;
    }

    layer.addEventListener('pointerover', (e) => {
      const g = e.target.closest('.travel-pin');
      if (g) show(g);
    });
    layer.addEventListener('pointerout', (e) => {
      if (e.pointerType === 'touch') return; // 터치는 손을 떼도 유지하고, 바깥을 누르면 닫는다
      const g = e.target.closest('.travel-pin');
      if (g && !g.contains(e.relatedTarget)) hide();
    });
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !e.target.closest('.travel-pin')) hide();
    });
    layer.addEventListener('focusin', (e) => {
      const g = e.target.closest('.travel-pin');
      if (g) show(g);
    });
    layer.addEventListener('focusout', hide);
  }
})();
