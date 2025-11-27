addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const addressCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 50

async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country') || getRandomCountry()
  let address, stateProvince, cityName, streetLine, postalCode, name, gender, phone

  const cachedAddress = getCachedAddress(country)
  if (cachedAddress) {
    ({ full: address, state: stateProvince, city: cityName, street: streetLine, postalCode } = cachedAddress)
  }

  if (!address) {
    for (let i = 0; i < 100; i++) {
      const location = getRandomLocationInCountry(country)
      const data = await fetchReverseGeocodeWithRetry(location)

      if (data && data.address && data.address.house_number && data.address.road && (data.address.city || data.address.town)) {
        const formatted = formatAddress(data.address, country)
        address = formatted.full
        stateProvince = formatted.state
        cityName = formatted.city
        streetLine = formatted.street
        postalCode = formatted.postalCode
        cacheAddress(country, formatted)
        break
      }
    }
  }

  if (!address) {
    return new Response('Failed to retrieve detailed address, please refresh the interface （检索详细地址失败，请刷新界面）', { status: 500 })
  }

  const profile = await generateName(country)
  name = profile.name
  gender = profile.gender
  phone = getRandomPhoneNumber(country)

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Real Address Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #0f172a;
      --panel: #0b1224;
      --card: #ffffff;
      --accent: #2563eb;
      --accent-2: #06b6d4;
      --text: #0f172a;
      --muted: #475569;
      --border: #e2e8f0;
      --shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
      background: radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.18), transparent 25%),
                  radial-gradient(circle at 80% 0%, rgba(6, 182, 212, 0.25), transparent 25%),
                  var(--bg);
      color: #e2e8f0;
      min-height: 100vh;
    }
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 18px 48px;
    }
    .hero {
      background: linear-gradient(120deg, rgba(37, 99, 235, 0.22), rgba(6, 182, 212, 0.26));
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border-radius: 18px;
      padding: 20px 24px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .title {
      font-size: 2.1em;
      margin: 0;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .subtitle {
      margin: 0;
      color: #cbd5e1;
      font-size: 1.1em;
    }
    .subtitle-small {
      margin-top: 6px;
      color: #a8b4c9;
      font-size: 0.95em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 6px 12px;
      width: fit-content;
    }
    .layout {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 18px;
    }
    .card {
      background: var(--card);
      color: var(--text);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--shadow);
      position: relative;
      border: 1px solid var(--border);
    }
    .card-title {
      font-size: 1.1em;
      font-weight: 700;
      margin-bottom: 12px;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-top: 8px;
    }
    .info-tile {
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #f8fafc;
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .info-tile:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
    }
    .info-tile:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.35);
      outline-offset: 2px;
      box-shadow: 0 10px 32px rgba(37, 99, 235, 0.18);
    }
    .label {
      display: block;
      color: var(--muted);
      font-size: 0.9em;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .value {
      font-size: 1.35em;
      font-weight: 700;
      word-break: break-word;
      color: #0f172a;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 14px 0 6px;
    }
    .btn {
      flex: 1 1 200px;
      padding: 12px 14px;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
    }
    .btn.primary { background: linear-gradient(120deg, var(--accent), #1d4ed8); box-shadow: 0 10px 30px rgba(37, 99, 235, 0.25); }
    .btn.secondary { background: linear-gradient(120deg, #0ea5e9, var(--accent-2)); box-shadow: 0 10px 30px rgba(14, 165, 233, 0.25); }
    .btn:hover { transform: translateY(-1px); opacity: 0.95; }
    .btn:active { transform: translateY(0); }
    .btn:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.35);
      outline-offset: 2px;
      box-shadow: 0 10px 32px rgba(37, 99, 235, 0.18);
    }
    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .btn.is-loading::after {
      content: '…';
      margin-left: 6px;
      font-weight: 900;
    }
    .copied {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #22c55e;
      color: white;
      padding: 6px 12px;
      border-radius: 999px;
      display: none;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.25);
    }
    .copied.show { display: inline-flex; align-items: center; gap: 6px; }
    .country-select {
      margin: 12px 0 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .country-select select {
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      font-size: 1em;
      background: #f8fafc;
      color: #0f172a;
      outline: none;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .country-select select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .map-card iframe {
      width: 100%;
      height: 100%;
      min-height: 320px;
      border: 0;
      border-radius: 12px;
      box-shadow: inset 0 0 0 1px var(--border);
    }
    .saved-card { margin-top: 16px; }
    .saved-addresses {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 12px;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .saved-addresses th, .saved-addresses td {
      padding: 12px;
      text-align: center;
      border-bottom: 1px solid var(--border);
      color: #0f172a;
    }
    .saved-addresses th {
      background: #f1f5f9;
      font-weight: 800;
    }
    .saved-addresses tr:nth-child(even) td { background: #fff; }
    .saved-addresses tr:nth-child(odd) td { background: #fbfdff; }
    .saved-addresses tr:last-child td { border-bottom: none; }
    .delete-btn {
      padding: 8px 12px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.22);
      transition: transform 0.12s ease, opacity 0.12s ease;
    }
    .delete-btn:hover { transform: translateY(-1px); opacity: 0.96; }
    .delete-btn:focus-visible {
      outline: 3px solid rgba(239, 68, 68, 0.35);
      outline-offset: 2px;
      box-shadow: 0 10px 32px rgba(239, 68, 68, 0.2);
    }
    .loading-notice {
      display: none;
      margin-top: 6px;
      color: #0f172a;
      font-weight: 700;
      padding: 10px 12px;
      border-radius: 10px;
      background: #e0f2fe;
      border: 1px solid #bfdbfe;
    }
    .footer {
      margin-top: 18px;
      padding: 10px 0;
      color: #cbd5e1;
      text-align: center;
      font-size: 0.95em;
    }
    .footer a {
      color: #93c5fd;
      text-decoration: none;
      font-weight: 700;
    }
    .footer a:hover { text-decoration: underline; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <div class="title">Real Address Generator · 真实地址生成器</div>
      <p class="subtitle">Get a realistic address, localized phone number, and profile preview in one click.</p>
      <div class="subtitle-small">🔖 Click any field to copy ｜ 点击任意字段即可复制</div>
    </header>

    <div class="layout">
      <div class="card">
        <div class="copied" id="copied" role="status" aria-live="polite" aria-atomic="true">Copied!</div>
        <div class="card-title">Profile Snapshot ｜ 信息卡片</div>
        <div class="info-grid">
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy name ${name}" onclick="copyToClipboard('${name}')" onkeydown="handleTileKey(event, '${name}')">
            <span class="label">Name 姓名</span>
            <div class="value">${name}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy gender ${gender}" onclick="copyToClipboard('${gender}')" onkeydown="handleTileKey(event, '${gender}')">
            <span class="label">Gender 性别</span>
            <div class="value">${gender}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy phone ${phone.replace(/[()\s-]/g, '')}" onclick="copyToClipboard('${phone.replace(/[()\\s-]/g, '')}')" onkeydown="handleTileKey(event, '${phone.replace(/[()\\s-]/g, '')}')">
            <span class="label">Phone 电话</span>
            <div class="value">${phone}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy state or province ${stateProvince || 'Unknown'}" onclick="copyToClipboard('${stateProvince || 'Unknown'}')" onkeydown="handleTileKey(event, '${stateProvince || 'Unknown'}')">
            <span class="label">State / Province 州 / 省</span>
            <div class="value">${stateProvince || '—'}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy city ${cityName || 'Unknown'}" onclick="copyToClipboard('${cityName || 'Unknown'}')" onkeydown="handleTileKey(event, '${cityName || 'Unknown'}')">
            <span class="label">City 城市</span>
            <div class="value">${cityName || '—'}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy street ${streetLine || 'Unknown'}" onclick="copyToClipboard('${streetLine || 'Unknown'}')" onkeydown="handleTileKey(event, '${streetLine || 'Unknown'}')">
            <span class="label">Street Address 街道地址</span>
            <div class="value">${streetLine || '—'}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy postal code ${postalCode || 'Unknown'}" onclick="copyToClipboard('${postalCode || 'Unknown'}')" onkeydown="handleTileKey(event, '${postalCode || 'Unknown'}')">
            <span class="label">Postal Code 邮政编码</span>
            <div class="value">${postalCode || '—'}</div>
          </div>
          <div class="info-tile" role="button" tabindex="0" aria-label="Copy full address" onclick="copyToClipboard('${address}')" onkeydown="handleTileKey(event, '${address}')">
            <span class="label">Address 地址</span>
            <div class="value">${address}</div>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" id="refreshBtn" aria-label="Get another address" onclick="beginRefresh();">🔄 Get Another Address 获取新地址</button>
          <button class="btn secondary" id="saveBtn" aria-label="Save this address" onclick="saveAddress();">💾 Save Address 保存地址</button>
        </div>
        <div id="loadingNotice" class="loading-notice" role="status" aria-live="polite">Loading new data…</div>

        <div class="country-select">
          <label for="country">Select country (auto-refresh) ｜ 选择国家（自动刷新）</label>
          <select id="country" onchange="changeCountry(this.value)">
            ${getCountryOptions(country)}
          </select>
        </div>
      </div>

      <div class="card map-card">
        <div class="card-title">Live Map ｜ 地图预览</div>
        <iframe class="map" src="https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed"></iframe>
      </div>
    </div>

    <div class="card saved-card">
      <div class="card-title">Saved Addresses ｜ 已保存的地址</div>
      <table class="saved-addresses" id="savedAddressesTable">
        <thead>
          <tr>
            <th>操作 Operation</th>
            <th>备注 Notes</th>
            <th>姓名 Name</th>
            <th>性别 Gender</th>
            <th>电话号码 Phone number</th>
            <th>州 / 省 State / Province</th>
            <th>城市 City</th>
            <th>街道地址 Street Address</th>
            <th>邮政编码 Postal Code</th>
            <th>地址 Address</th>
          </tr>
        </thead>
        <tbody>
          <!-- 动态生成的内容 -->
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Original version by chatgpt.org.uk, modified by Adonis142857 ｜ <a href="https://github.com/Adonis142857/Real-Address-Generator" target="_blank"><img src="https://pic.imgdb.cn/item/66e7ab36d9c307b7e9cefd24.png" alt="GitHub" style="width: 20px; height: 20px; vertical-align: middle; position: relative; top: -3px;"></a>
  </div>

  <script>
    function setLoading(isLoading, label = 'Loading…') {
      const refreshBtn = document.getElementById('refreshBtn')
      const saveBtn = document.getElementById('saveBtn')
      const countrySelect = document.getElementById('country')
      const loadingNotice = document.getElementById('loadingNotice')

      ;[refreshBtn, saveBtn, countrySelect].forEach(el => {
        if (!el) return
        el.disabled = isLoading
        if (isLoading) {
          el.classList.add('is-loading')
          el.setAttribute('aria-busy', 'true')
        } else {
          el.classList.remove('is-loading')
          el.removeAttribute('aria-busy')
        }
      })

      if (refreshBtn) {
        if (!refreshBtn.dataset.originalText) refreshBtn.dataset.originalText = refreshBtn.textContent
        refreshBtn.textContent = isLoading ? label : refreshBtn.dataset.originalText
      }

      if (loadingNotice) {
        loadingNotice.style.display = isLoading ? 'inline-flex' : 'none'
        loadingNotice.textContent = label
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const copied = document.getElementById('copied')
        if (copied) {
          copied.textContent = 'Copied to clipboard'
          copied.classList.add('show')
          setTimeout(() => {
            copied.classList.remove('show')
          }, 2000)
        }
      })
    }

    function handleTileKey(event, text) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        copyToClipboard(text)
      }
    }

    function beginRefresh() {
      setLoading(true, 'Loading new data…')
      window.location.reload()
    }

    function changeCountry(country) {
      setLoading(true, 'Loading new country…')
      window.location.href = \`?country=\${country}\`
    }
    function saveAddress() {
      const note = prompt('请输入备注（可以留空）｜ Please enter a note (can be left blank)') || '';
      const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      const newEntry = {
        note: note,
        name: '${name}',
        gender: '${gender}',
        phone: '${phone.replace(/[()\\s-]/g, '')}',
        state: '${stateProvince || ''}',
        city: '${cityName || ''}',
        street: '${streetLine || ''}',
        postalCode: '${postalCode || ''}',
        address: '${address}'
      };
      savedAddresses.push(newEntry);
      localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
      renderSavedAddresses();
    }
    

    // 渲染保存的地址
    function renderSavedAddresses() {
      const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      const tbody = document.getElementById('savedAddressesTable').getElementsByTagName('tbody')[0];
      tbody.innerHTML = '';
      savedAddresses.forEach((entry, index) => {
        const row = tbody.insertRow();
        const deleteCell = row.insertCell();
        const noteCell = row.insertCell();
        const nameCell = row.insertCell();
        const genderCell = row.insertCell();
        const phoneCell = row.insertCell();
        const stateCell = row.insertCell();
        const cityCell = row.insertCell();
        const streetCell = row.insertCell();
        const postalCodeCell = row.insertCell();
        const addressCell = row.insertCell();

        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除 Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
          savedAddresses.splice(index, 1);
          localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
          renderSavedAddresses();
        };
        deleteCell.appendChild(deleteBtn);

        noteCell.textContent = entry.note;
        nameCell.textContent = entry.name;
        genderCell.textContent = entry.gender;
        phoneCell.textContent = entry.phone;
        stateCell.textContent = entry.state || '—';
        cityCell.textContent = entry.city || '—';
        streetCell.textContent = entry.street || '—';
        postalCodeCell.textContent = entry.postalCode || '—';
        addressCell.textContent = entry.address;
      });
    }

    // 页面加载时渲染已保存的地址
    window.onload = function() {
      renderSavedAddresses();
    };
  </script>
</body>
</html>
`



  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  })
}

function getCachedAddress(country) {
  const cached = addressCache.get(country)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value
  }
  if (cached) {
    addressCache.delete(country)
  }
  return null
}

function cacheAddress(country, formatted) {
  if (addressCache.size >= MAX_CACHE_ENTRIES) {
    let oldestKey
    let oldestTimestamp = Infinity
    for (const [key, entry] of addressCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }
    if (oldestKey) addressCache.delete(oldestKey)
  }

  addressCache.set(country, { value: formatted, timestamp: Date.now() })
}

async function fetchReverseGeocodeWithRetry(location) {
  const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`
  let delay = 200

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'Cloudflare Worker' }
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      // ignore individual fetch errors and retry with backoff
    }

    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2
    }
  }

  return null
}

function getRandomLocationInCountry(country) {
  const countryCoordinates = {
    "US": [{ lat: 37.7749, lng: -122.4194 }, { lat: 34.0522, lng: -118.2437 }],
    "UK": [{ lat: 51.5074, lng: -0.1278 }, { lat: 53.4808, lng: -2.2426 }],
    "FR": [{ lat: 48.8566, lng: 2.3522 }, { lat: 45.7640, lng: 4.8357 }],
    "DE": [{ lat: 52.5200, lng: 13.4050 }, { lat: 48.1351, lng: 11.5820 }],
    "CN": [
      { lat: 39.9042, lng: 116.4074 }, // Beijing 北京
      { lat: 31.2304, lng: 121.4737 }, // Shanghai 上海
      { lat: 23.1291, lng: 113.2644 }, // Guangzhou 广州
      { lat: 22.5431, lng: 114.0579 }, // Shenzhen 深圳
      { lat: 30.5728, lng: 104.0668 }, // Chengdu 成都
      { lat: 30.2741, lng: 120.1551 }, // Hangzhou 杭州
      { lat: 32.0603, lng: 118.7969 }, // Nanjing 南京
      { lat: 30.5928, lng: 114.3055 }  // Wuhan 武汉
    ],
    "TW": [{ lat: 25.0330, lng: 121.5654 }, { lat: 22.6273, lng: 120.3014 }],
    "HK": [{ lat: 22.3193, lng: 114.1694 },{ lat: 22.3964, lng: 114.1095 }],
    "JP": [{ lat: 35.6895, lng: 139.6917 }, { lat: 34.6937, lng: 135.5023 }],
    "IN": [{ lat: 28.6139, lng: 77.2090 }, { lat: 19.0760, lng: 72.8777 }],
    "AU": [{ lat: -33.8688, lng: 151.2093 }, { lat: -37.8136, lng: 144.9631 }],
    "BR": [{ lat: -23.5505, lng: -46.6333 }, { lat: -22.9068, lng: -43.1729 }],
    "CA": [{ lat: 43.651070, lng: -79.347015 }, { lat: 45.501690, lng: -73.567253 }],
    "RU": [{ lat: 55.7558, lng: 37.6173 }, { lat: 59.9343, lng: 30.3351 }],
    "ZA": [{ lat: -33.9249, lng: 18.4241 }, { lat: -26.2041, lng: 28.0473 }],
    "MX": [{ lat: 19.4326, lng: -99.1332 }, { lat: 20.6597, lng: -103.3496 }],
    "KR": [{ lat: 37.5665, lng: 126.9780 }, { lat: 35.1796, lng: 129.0756 }],
    "IT": [{ lat: 41.9028, lng: 12.4964 }, { lat: 45.4642, lng: 9.1900 }],
    "ES": [{ lat: 40.4168, lng: -3.7038 }, { lat: 41.3851, lng: 2.1734 }],
    "TR": [{ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 }],
    "SA": [{ lat: 24.7136, lng: 46.6753 }, { lat: 21.3891, lng: 39.8579 }],
    "AR": [{ lat: -34.6037, lng: -58.3816 }, { lat: -31.4201, lng: -64.1888 }],
    "EG": [{ lat: 30.0444, lng: 31.2357 }, { lat: 31.2156, lng: 29.9553 }],
    "NG": [{ lat: 6.5244, lng: 3.3792 }, { lat: 9.0579, lng: 7.4951 }],
    "ID": [{ lat: -6.2088, lng: 106.8456 }, { lat: -7.7956, lng: 110.3695 }]
  }

  const jitterByCountry = {
    CN: 0.03
  }

  const jitter = jitterByCountry[country] || 0.1
  const coordsArray = countryCoordinates[country]
  const randomCity = coordsArray[Math.floor(Math.random() * coordsArray.length)]
  const lat = randomCity.lat + (Math.random() - 0.5) * jitter
  const lng = randomCity.lng + (Math.random() - 0.5) * jitter
  return { lat, lng }
}

function formatAddress(address, country) {
  const state = address.state || address.state_district || address.province || address.region
  const city = address.city || address.town || address.village
  const street = address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road || ''
  const postalCode = address.postcode
  const parts = [
    street,
    city,
    state,
    postalCode,
    country
  ].filter(Boolean)

  return { full: parts.join(', '), state, city, street, postalCode }
}


function getRandomPhoneNumber(country) {
  const patterns = {
    US: {
      regex: /^\+1 \([2-9]\d{2}\) [2-9]\d{2}-\d{4}$/,
      generate: () => {
        const areaCode = `${randomDigitInRange(2, 9)}${randomDigit()}${randomDigit()}`
        const exchangeCode = `${randomDigitInRange(2, 9)}${randomDigit()}${randomDigit()}`
        const lineNumber = `${Math.floor(1000 + Math.random() * 9000)}`
        return `+1 (${areaCode}) ${exchangeCode}-${lineNumber}`
      }
    },
    CA: {
      regex: /^\+1 \([2-9]\d{2}\) [2-9]\d{2}-\d{4}$/,
      generate: () => {
        const areaCode = `${randomDigitInRange(2, 9)}${randomDigit()}${randomDigit()}`
        const exchangeCode = `${randomDigitInRange(2, 9)}${randomDigit()}${randomDigit()}`
        const lineNumber = `${Math.floor(1000 + Math.random() * 9000)}`
        return `+1 (${areaCode}) ${exchangeCode}-${lineNumber}`
      }
    },
    UK: {
      regex: /^\+44 7\d{3} \d{6}$/,
      generate: () => {
        const subscriber = Array.from({ length: 6 }, randomDigit).join('')
        const prefix = `${randomDigitInRange(0, 9)}${randomDigit()}${randomDigit()}`
        return `+44 7${prefix} ${subscriber}`
      }
    },
    FR: {
      regex: /^\+33 [67] \d{2} \d{2} \d{2} \d{2}$/,
      generate: () => {
        const segments = Array.from({ length: 4 }, () => `${randomDigit()}${randomDigit()}`)
        const lead = randomFrom(['6', '7'])
        return `+33 ${lead} ${segments.join(' ')}`
      }
    },
    DE: {
      regex: /^\+49 1[5-7]\d \d{7}$/,
      generate: () => {
        const lead = randomFrom(['15', '16', '17'])
        const mid = randomDigit()
        const tail = Array.from({ length: 7 }, randomDigit).join('')
        return `+49 ${lead}${mid} ${tail}`
      }
    },
    CN: {
      regex: /^\+86 1[3-9]\d \d{4} \d{4}$/,
      generate: () => {
        const start = `${randomDigitInRange(3, 9)}${randomDigit()}`
        const block1 = Array.from({ length: 4 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+86 1${start} ${block1} ${block2}`
      }
    },
    TW: {
      regex: /^\+886 9\d{2} \d{3} \d{3}$/,
      generate: () => {
        const block1 = `${randomDigit()}${randomDigit()}`
        const block2 = Array.from({ length: 3 }, randomDigit).join('')
        const block3 = Array.from({ length: 3 }, randomDigit).join('')
        return `+886 9${block1} ${block2} ${block3}`
      }
    },
    HK: {
      regex: /^\+852 [569]\d{3} \d{4}$/,
      generate: () => {
        const start = randomFrom(['5', '6', '9'])
        const block1 = `${randomDigit()}${randomDigit()}${randomDigit()}`
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+852 ${start}${block1} ${block2}`
      }
    },
    JP: {
      regex: /^\+81 0?[789]0 \d{4} \d{4}$/,
      generate: () => {
        const lead = randomFrom(['70', '80', '90'])
        const block1 = Array.from({ length: 4 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+81 ${lead} ${block1} ${block2}`
      }
    },
    IN: {
      regex: /^\+91 [6-9]\d \d{3} \d{4}$/,
      generate: () => {
        const start = `${randomDigitInRange(6, 9)}${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+91 ${start} ${block1} ${block2}`
      }
    },
    AU: {
      regex: /^\+61 4\d \d{3} \d{3}$/,
      generate: () => {
        const block1 = `${randomDigit()}${randomDigit()}`
        const block2 = Array.from({ length: 3 }, randomDigit).join('')
        const block3 = Array.from({ length: 3 }, randomDigit).join('')
        return `+61 4${block1} ${block2} ${block3}`
      }
    },
    BR: {
      regex: /^\+55 \d{2} 9\d{4} \d{4}$/,
      generate: () => {
        const ddd = `${randomDigitInRange(1, 9)}${randomDigit()}`
        const block1 = `9${Array.from({ length: 4 }, randomDigit).join('')}`
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+55 ${ddd} ${block1} ${block2}`
      }
    },
    RU: {
      regex: /^\+7 9\d{2} \d{3} \d{2} \d{2}$/,
      generate: () => {
        const block1 = `${randomDigit()}${randomDigit()}`
        const block2 = Array.from({ length: 3 }, randomDigit).join('')
        const block3 = Array.from({ length: 2 }, randomDigit).join('')
        const block4 = Array.from({ length: 2 }, randomDigit).join('')
        return `+7 9${block1} ${block2} ${block3} ${block4}`
      }
    },
    ZA: {
      regex: /^\+27 [6-8]\d \d{3} \d{4}$/,
      generate: () => {
        const start = randomFrom(['6', '7', '8'])
        const mid = `${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+27 ${start}${mid} ${block1} ${block2}`
      }
    },
    MX: {
      regex: /^\+52 1?\d{2} \d{4} \d{4}$/,
      generate: () => {
        const prefix = randomFrom(['', '1'])
        const area = `${randomDigit()}${randomDigit()}`
        const block1 = Array.from({ length: 4 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+52 ${prefix}${area} ${block1} ${block2}`.replace('  ', ' ')
      }
    },
    KR: {
      regex: /^\+82 10 \d{4} \d{4}$/,
      generate: () => {
        const block1 = Array.from({ length: 4 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+82 10 ${block1} ${block2}`
      }
    },
    IT: {
      regex: /^\+39 3\d \d{3} \d{4}$/,
      generate: () => {
        const mid = `${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+39 3${mid} ${block1} ${block2}`
      }
    },
    ES: {
      regex: /^\+34 [67]\d \d{3} \d{3}$/,
      generate: () => {
        const start = randomFrom(['6', '7'])
        const mid = `${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 3 }, randomDigit).join('')
        return `+34 ${start}${mid} ${block1} ${block2}`
      }
    },
    TR: {
      regex: /^\+90 5\d{2} \d{3} \d{2} \d{2}$/,
      generate: () => {
        const mid = `${randomDigit()}${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 2 }, randomDigit).join('')
        const block3 = Array.from({ length: 2 }, randomDigit).join('')
        return `+90 5${mid} ${block1} ${block2} ${block3}`
      }
    },
    SA: {
      regex: /^\+966 5\d{2} \d{3} \d{4}$/,
      generate: () => {
        const mid = `${randomDigit()}${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+966 5${mid} ${block1} ${block2}`
      }
    },
    AR: {
      regex: /^\+54 9?\d{2} \d{3,4} \d{4}$/,
      generate: () => {
        const mobileFlag = randomFrom(['', '9'])
        const area = `${randomDigit()}${randomDigit()}`
        const block1 = Array.from({ length: mobileFlag ? 4 : 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+54 ${mobileFlag}${area} ${block1} ${block2}`.replace('  ', ' ')
      }
    },
    EG: {
      regex: /^\+20 1[0-5]\d \d{4} \d{3}$/,
      generate: () => {
        const mid = randomFrom(['0', '1', '2', '5'])
        const rest = `${randomDigit()}`
        const block1 = Array.from({ length: 4 }, randomDigit).join('')
        const block2 = Array.from({ length: 3 }, randomDigit).join('')
        return `+20 1${mid}${rest} ${block1} ${block2}`
      }
    },
    NG: {
      regex: /^\+234 [789]\d \d{3} \d{4}$/,
      generate: () => {
        const start = randomFrom(['7', '8', '9'])
        const mid = `${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+234 ${start}${mid} ${block1} ${block2}`
      }
    },
    ID: {
      regex: /^\+62 8\d \d{3} \d{4}$/,
      generate: () => {
        const mid = `${randomDigit()}`
        const block1 = Array.from({ length: 3 }, randomDigit).join('')
        const block2 = Array.from({ length: 4 }, randomDigit).join('')
        return `+62 8${mid} ${block1} ${block2}`
      }
    }
  }

  const generator = patterns[country] || patterns.US
  for (let i = 0; i < 5; i++) {
    const phone = generator.generate()
    if (generator.regex.test(phone)) {
      return phone
    }
  }

  return '+1 (555) 010-0000'
}

function randomDigit() {
  return Math.floor(Math.random() * 10)
}

function randomDigitInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomCountry() {
  const countries = ["US", "UK", "FR", "DE", "CN", "TW", "HK", "JP", "IN", "AU", "BR", "CA", "RU", "ZA", "MX", "KR", "IT", "ES", "TR", "SA", "AR", "EG", "NG", "ID"]
  return countries[Math.floor(Math.random() * countries.length)]
}

function getCountryOptions(selectedCountry) {
  const countries = [
    { name: "United States 美国", english: "United States", code: "US" },
    { name: "United Kingdom 英国", english: "United Kingdom", code: "UK" },
    { name: "France 法国", english: "France", code: "FR" },
    { name: "Germany 德国", english: "Germany", code: "DE" },
    { name: "China 中国", english: "China", code: "CN" },
    { name: "Taiwan 中国台湾", english: "Taiwan", code: "TW" },
    { name: "Hong Kong 中国香港", english: "Hong Kong", code: "HK" },
    { name: "Japan 日本", english: "Japan", code: "JP" },
    { name: "India 印度", english: "India", code: "IN" },
    { name: "Australia 澳大利亚", english: "Australia", code: "AU" },
    { name: "Brazil 巴西", english: "Brazil", code: "BR" },
    { name: "Canada 加拿大", english: "Canada", code: "CA" },
    { name: "Russia 俄罗斯", english: "Russia", code: "RU" },
    { name: "South Africa 南非", english: "South Africa", code: "ZA" },
    { name: "Mexico 墨西哥", english: "Mexico", code: "MX" },
    { name: "South Korea 韩国", english: "South Korea", code: "KR" },
    { name: "Italy 意大利", english: "Italy", code: "IT" },
    { name: "Spain 西班牙", english: "Spain", code: "ES" },
    { name: "Turkey 土耳其", english: "Turkey", code: "TR" },
    { name: "Saudi Arabia 沙特阿拉伯", english: "Saudi Arabia", code: "SA" },
    { name: "Argentina 阿根廷", english: "Argentina", code: "AR" },
    { name: "Egypt 埃及", english: "Egypt", code: "EG" },
    { name: "Nigeria 尼日利亚", english: "Nigeria", code: "NG" },
    { name: "Indonesia 印度尼西亚", english: "Indonesia", code: "ID" }
  ]

  return countries
    .sort((a, b) => a.english.localeCompare(b.english))
    .map(({ name, code }) => `<option value="${code}" ${code === selectedCountry ? 'selected' : ''}>${name}</option>`)
    .join('')
}

async function generateName(country) {
  const genderOptions = ['male', 'female']
  const chosenGender = genderOptions[Math.floor(Math.random() * genderOptions.length)]
  const localName = getLocalizedName(country, chosenGender)

  if (localName) {
    return localName
  }

  const natMap = {
    US: 'us',
    UK: 'gb',
    FR: 'fr',
    DE: 'de',
    BR: 'br',
    AU: 'au',
    CA: 'ca',
    TR: 'tr',
    MX: 'mx',
    ES: 'es',
    IT: 'it',
    JP: 'jp'
  }

  const nat = natMap[country]

  if (nat) {
    try {
      const res = await fetch(`https://randomuser.me/api/?nat=${nat}&gender=${chosenGender}`)
      const json = await res.json()
      if (json && json.results && json.results.length > 0) {
        const user = json.results[0]
        return {
          name: `${capitalize(user.name.first)} ${capitalize(user.name.last)}`,
          gender: capitalize(chosenGender)
        }
      }
    } catch (e) {
      // fall back below
    }
  }

  return getLocalizedName('default', chosenGender)
}

function getLocalizedName(country, gender) {
  const commonSurnamesCN = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '何', '高', '林', '罗']
  const givenMaleCN = ['伟', '强', '磊', '洋', '勇', '超', '俊杰', '浩', '鹏', '宇', '晨', '涛', '凯', '俊', '泽民', '世杰']
  const givenFemaleCN = ['娜', '娟', '艳', '静', '敏', '丽', '霞', '莹', '丹', '芳', '璐', '婷婷', '梅', '雅琴', '慧', '雪']

  const spanishSurnames = ['García', 'Martínez', 'Rodríguez', 'López', 'Hernández', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres']
  const spanishMale = ['Juan', 'Carlos', 'José', 'Luis', 'Miguel', 'Andrés', 'Diego', 'Fernando', 'Ricardo', 'Hugo']
  const spanishFemale = ['María', 'Ana', 'Lucía', 'Carmen', 'Isabella', 'Sofía', 'Valentina', 'Camila', 'Elena', 'Gabriela']

  const englishSurnames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Williams', 'Wilson', 'Davis', 'Clark', 'Thompson', 'Anderson', 'Moore', 'Martin']
  const englishMale = ['James', 'Daniel', 'Michael', 'William', 'Joseph', 'Andrew', 'Benjamin', 'Ethan', 'Samuel', 'Thomas', 'Henry', 'Jack']
  const englishFemale = ['Emily', 'Sophia', 'Olivia', 'Charlotte', 'Amelia', 'Grace', 'Ava', 'Isabella', 'Mia', 'Harper', 'Ella', 'Chloe']

  const frenchSurnames = ['Dubois', 'Martin', 'Bernard', 'Durand', 'Lefevre', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Garcia']
  const frenchMale = ['Louis', 'Hugo', 'Arthur', 'Gabriel', 'Lucas', 'Jules', 'Nathan', 'Theo', 'Leo', 'Antoine']
  const frenchFemale = ['Emma', 'Louise', 'Chloé', 'Camille', 'Manon', 'Alice', 'Jeanne', 'Inès', 'Sarah', 'Léna']

  const germanSurnames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer']
  const germanMale = ['Lukas', 'Finn', 'Leon', 'Paul', 'Jonas', 'Felix', 'Maximilian', 'Tim', 'Niklas', 'Julian']
  const germanFemale = ['Mia', 'Hanna', 'Emma', 'Lea', 'Marie', 'Lena', 'Anna', 'Sofia', 'Laura', 'Emily']

  const italianSurnames = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Gallo', 'Costa', 'Fontana', 'Moretti']
  const italianMale = ['Lorenzo', 'Andrea', 'Matteo', 'Francesco', 'Alessandro', 'Davide', 'Gabriele', 'Marco', 'Diego', 'Paolo']
  const italianFemale = ['Giulia', 'Sofia', 'Aurora', 'Martina', 'Giorgia', 'Alice', 'Chiara', 'Elena', 'Camilla', 'Beatrice']

  const japaneseSurnames = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤']
  const japaneseMale = ['蓮', '大和', '颯太', '陽翔', '悠真', '湊', '陸斗', '陽太', '蒼', '悠人']
  const japaneseFemale = ['葵', '陽菜', 'さくら', '美咲', '結衣', '凛', '結愛', '楓', '咲良', '心春']

  const indianSurnames = ['Singh', 'Kumar', 'Sharma', 'Patel', 'Gupta', 'Reddy', 'Varma', 'Iyer', 'Nair', 'Khan']
  const indianMale = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Reyansh', 'Ishaan', 'Krishna', 'Rohan', 'Kabir', 'Dhruv']
  const indianFemale = ['Aadhya', 'Siya', 'Anaya', 'Ira', 'Myra', 'Diya', 'Aarohi', 'Navya', 'Pari', 'Mira']

  const portugueseSurnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Costa', 'Gomes', 'Martins']
  const portugueseMale = ['Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Rafael', 'Felipe', 'João', 'Pedro', 'Thiago', 'Bruno']
  const portugueseFemale = ['Maria', 'Ana', 'Beatriz', 'Juliana', 'Camila', 'Letícia', 'Fernanda', 'Carolina', 'Patrícia', 'Larissa']

  const russianSurnames = ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Petrov', 'Sokolov', 'Mikhailov', 'Fedorov', 'Morozov']
  const russianMale = ['Alexander', 'Dmitry', 'Ivan', 'Sergey', 'Mikhail', 'Nikolai', 'Pavel', 'Andrei', 'Yuri', 'Vladimir']
  const russianFemale = ['Anna', 'Elena', 'Olga', 'Natalia', 'Tatiana', 'Irina', 'Ekaterina', 'Maria', 'Svetlana', 'Galina']

  const turkishSurnames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Aydın', 'Öztürk', 'Arslan']
  const turkishMale = ['Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hüseyin', 'İbrahim', 'Hasan', 'Murat', 'Ömer', 'Yusuf']
  const turkishFemale = ['Fatma', 'Ayşe', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Esra', 'Sultan', 'Büşra']

  const arabicSurnames = ['Al Harbi', 'Al Qahtani', 'Al Otaibi', 'Al Shammari', 'Al Zahrani', 'Al Ghamdi', 'Al Mutairi', 'Al Dosari', 'Al Suwaidi', 'Al Hajri']
  const arabicMale = ['Abdullah', 'Mohammed', 'Fahad', 'Saud', 'Khalid', 'Faisal', 'Abdulrahman', 'Nasser', 'Turki', 'Majed']
  const arabicFemale = ['Aisha', 'Fatimah', 'Noura', 'Hessa', 'Maryam', 'Jawaher', 'Lama', 'Dania', 'Reem', 'Amal']

  const pools = {
    US: { surnames: englishSurnames, male: englishMale, female: englishFemale },
    UK: { surnames: englishSurnames, male: englishMale, female: englishFemale },
    AU: { surnames: englishSurnames, male: englishMale, female: englishFemale },
    CA: { surnames: englishSurnames, male: englishMale, female: englishFemale },
    ZA: { surnames: englishSurnames, male: englishMale, female: englishFemale },
    CN: {
      surnames: commonSurnamesCN,
      male: givenMaleCN,
      female: givenFemaleCN,
      formatter: (surname, given) => `${surname}${given}`
    },
    TW: {
      surnames: commonSurnamesCN,
      male: givenMaleCN,
      female: givenFemaleCN,
      formatter: (surname, given) => `${surname}${given}`
    },
    HK: {
      surnames: commonSurnamesCN,
      male: givenMaleCN,
      female: givenFemaleCN,
      formatter: (surname, given) => `${surname}${given}`
    },
    JP: { surnames: japaneseSurnames, male: japaneseMale, female: japaneseFemale, formatter: (surname, given) => `${surname}${given}` },
    ES: { surnames: spanishSurnames, male: spanishMale, female: spanishFemale },
    MX: { surnames: spanishSurnames, male: spanishMale, female: spanishFemale },
    AR: { surnames: spanishSurnames, male: spanishMale, female: spanishFemale },
    FR: { surnames: frenchSurnames, male: frenchMale, female: frenchFemale },
    DE: { surnames: germanSurnames, male: germanMale, female: germanFemale },
    IT: { surnames: italianSurnames, male: italianMale, female: italianFemale },
    IN: { surnames: indianSurnames, male: indianMale, female: indianFemale },
    BR: { surnames: portugueseSurnames, male: portugueseMale, female: portugueseFemale },
    RU: { surnames: russianSurnames, male: russianMale, female: russianFemale },
    TR: { surnames: turkishSurnames, male: turkishMale, female: turkishFemale },
    SA: { surnames: arabicSurnames, male: arabicMale, female: arabicFemale },
    default: { surnames: englishSurnames, male: englishMale, female: englishFemale }
  }

  const pool = pools[country]
  if (!pool || !pool.surnames?.length || !pool[gender]?.length) {
    return null
  }

  const surname = randomFrom(pool.surnames)
  const given = randomFrom(pool[gender])
  const formatter = pool.formatter || ((last, first) => `${first} ${last}`)

  return {
    name: formatter(surname, given),
    gender: capitalize(gender)
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
