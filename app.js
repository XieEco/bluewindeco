(() => {
  'use strict';

  const fallbackConfig = {
    technologies: [
      { id: 1, label: 'Monopile + DC' }, { id: 2, label: 'Monopile + AC' },
      { id: 3, label: 'Jacket + DC' }, { id: 4, label: 'Jacket + AC' },
      { id: 5, label: 'Floating + DC' }, { id: 6, label: 'Floating + AC' }
    ],
    strategies: [
      { id: 0, label: 'Minimum cost' },
      { id: 1, label: 'Tier 1 · Negative-only' },
      { id: 2, label: 'Tier 2 · All negative' },
      { id: 3, label: 'Tier 3 · Negative + positive' },
      { id: 4, label: 'Tier 4 · Maximum positive' }
    ],
    taxa: [
      { id: 1, label: 'Birds and bats' }, { id: 2, label: 'Fish' },
      { id: 3, label: 'Marine mammals' }, { id: 4, label: 'Benthic invertebrates / habitats' },
      { id: 5, label: 'Plankton / zooplankton' }
    ],
    threats: [
      { id: 1, label: 'Critically endangered' }, { id: 2, label: 'Endangered' },
      { id: 3, label: 'Vulnerable' }, { id: 4, label: 'NT / LC / NE' }
    ],
    impacts: [
      { id: 1, label: 'Positive' }, { id: 2, label: 'Trait' },
      { id: 3, label: 'Behaviour' }, { id: 4, label: 'General adverse' }
    ],
    metrics: [
      { id: 'annual_cost', label: 'Annual cost' }, { id: 'lcoe', label: 'LCOE' },
      { id: 'capacity', label: 'Capacity' }, { id: 'generation', label: 'Generation' },
      { id: 'cf', label: 'Capacity factor' }, { id: 'technology', label: 'Technology combination' },
      { id: 'impact', label: 'Biodiversity impact' }
    ],
    coast_url: './coast.geojson', land_url: './land.geojson'
  };

  const state = {
    config: fallbackConfig, mode: 'combo', comboId: 1, strategyId: 0,
    metric: 'annual_cost', axis: 'taxon', group: 1, impact: 1,
    bounds: null, selectedCell: null, summary: null, records: [], map: null, image: null,
    land: null, coast: null, rectangle: null, drawing: false,
    areaMethod: 'draw', selectingPoint: false,
    drawStart: null, drawTemporary: null, layerRequest: 0,
    summaryRequest: 0, ignoreClickUntil: 0, layerInfo: null
  };

  const $ = id => document.getElementById(id);
  const t = source => window.BWEI18n?.t(source) ?? source;
  const tf = (source, values) => window.BWEI18n?.format(source, values) ??
    source.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const displayLabel = item => t(item?.label || '');
  const numberLocale = () => window.BWEI18n?.getLanguage() || 'en-US';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const compact = (value, maximumFractionDigits = 2) => new Intl.NumberFormat(numberLocale(), { notation: 'compact', maximumFractionDigits }).format(Number(value) || 0);
  const precise = (value, digits = 2) => new Intl.NumberFormat(numberLocale(), { maximumFractionDigits: digits }).format(Number(value) || 0);
  const money = value => 'US$ ' + compact(value);
  const capacityLabel = value => value >= 1e6 ? precise(value / 1e6) + ' TW' : value >= 1e3 ? precise(value / 1e3) + ' GW' : precise(value) + ' MW';
  const generationLabel = value => value >= 1e6 ? precise(value / 1e6) + ' TWh' : value >= 1e3 ? precise(value / 1e3) + ' GWh' : precise(value) + ' MWh';
  const currentId = () => state.mode === 'combo' ? state.comboId : state.strategyId;
  const selectedScenario = () => (state.mode === 'combo' ? state.config.technologies : state.config.strategies).find(x => Number(x.id) === currentId());
  const selectedGroup = () => (state.axis === 'taxon' ? state.config.taxa : state.config.threats).find(x => Number(x.id) === state.group);
  const selectedImpact = () => state.config.impacts.find(x => Number(x.id) === state.impact);
  const labelFor = (list, id) => displayLabel(list.find(x => Number(x.id) === Number(id))) || String(id);
  const shortMetric = id => displayLabel(state.config.metrics.find(x => x.id === id)) || id;
  const apiBase = String(window.BLUEWINDECO_API_BASE || '').trim().replace(/\/+$/, '');
  const backendUrl = path => apiBase ? new URL(path, apiBase + '/').toString() : path;
  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try { detail = (await response.json()).error || detail; } catch (_) { /* Keep HTTP status. */ }
      throw new Error(detail);
    }
    return response.json();
  };
  const apiJson = async (url, options = {}) => {
    if (window.BWEStatic) return window.BWEStatic.request(url, options);
    return requestJson(backendUrl(url), options);
  };
  const query = (path, params) => path + '?' + new URLSearchParams(params).toString();
  const selectionParams = () => ({
    mode: state.mode, id: String(currentId()), metric: state.metric,
    axis: state.axis, group: String(state.group), impact: String(state.impact)
  });
  const setFeedback = (text, error = false) => {
    $('area-message').textContent = text;
    $('area-message').classList.toggle('is-error', error);
  };

  function setMode(mode) {
    if (mode !== 'combo' && mode !== 'strategy') return;
    state.mode = mode;
    $('mode-combo').classList.toggle('is-active', mode === 'combo');
    $('mode-strategy').classList.toggle('is-active', mode === 'strategy');
    $('mode-combo').setAttribute('aria-checked', String(mode === 'combo'));
    $('mode-strategy').setAttribute('aria-checked', String(mode === 'strategy'));
    $('combo-panel').classList.toggle('is-hidden', mode !== 'combo');
    $('strategy-panel').classList.toggle('is-hidden', mode !== 'strategy');
    if ($('technology').classList.contains('is-nav-highlighted')) {
      markActiveNav(document.querySelector(`.site-nav [data-mode-link="${mode}"]`));
    }
    renderChoices();
    loadLayer();
    refreshSummary();
  }

  function setAxis(axis) {
    state.axis = axis;
    state.group = 1;
    for (const button of document.querySelectorAll('[data-axis]')) {
      const active = button.dataset.axis === axis;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    }
    fillGroups();
    if (state.metric === 'impact') loadLayer();
    refreshSummary();
  }

  function fillGroups() {
    const groups = state.axis === 'taxon' ? state.config.taxa : state.config.threats;
    $('impact-group').innerHTML = groups.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(displayLabel(item))}</option>`).join('');
    $('impact-group').value = String(state.group);
    $('impact-chart-group').textContent = displayLabel(selectedGroup()).toUpperCase() || t('SELECTED GROUP');
  }

  function renderChoices() {
    $('combo-options').innerHTML = state.config.technologies.map(item => {
      const active = Number(item.id) === state.comboId;
      return `<button type="button" class="choice-button${active ? ' is-active' : ''}" role="radio" aria-checked="${active}" data-combo="${escapeHTML(item.id)}"><span class="choice-index">0${escapeHTML(item.id)} / 06</span><span class="choice-label">${escapeHTML(displayLabel(item))}</span></button>`;
    }).join('');
    $('strategy-options').innerHTML = state.config.strategies.map(item => {
      const active = Number(item.id) === state.strategyId;
      const index = Number(item.id) === 0 ? 'BASE' : `0${item.id}`;
      return `<button type="button" class="strategy-button${active ? ' is-active' : ''}" role="radio" aria-checked="${active}" data-strategy="${escapeHTML(item.id)}"><span class="strategy-index">${escapeHTML(index)}</span><span class="strategy-label">${escapeHTML(displayLabel(item))}</span></button>`;
    }).join('');
    $('map-scenario-name').textContent = displayLabel(selectedScenario()).toUpperCase() || t('SELECT SCENARIO');
  }

  function renderMetrics() {
    $('metric-options').innerHTML = state.config.metrics.map(item => {
      const active = item.id === state.metric;
      return `<button type="button" class="metric-button${active ? ' is-active' : ''}" role="radio" aria-checked="${active}" data-metric="${escapeHTML(item.id)}">${escapeHTML(displayLabel(item))}</button>`;
    }).join('');
    $('map-metric-name').textContent = state.metric === 'impact'
      ? `${displayLabel(selectedGroup()) || t('Group')} / ${displayLabel(selectedImpact()) || t('Impact')}`.toUpperCase()
      : shortMetric(state.metric).toUpperCase();
  }

  function initMap() {
    if (typeof L === 'undefined') throw new Error('The local Leaflet library did not load.');
    const map = L.map('map', {
      crs: L.CRS.EPSG4326, zoomControl: false, attributionControl: false,
      minZoom: 0, maxZoom: 8, zoomSnap: 0.25, zoomDelta: 0.5,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 0.8,
      preferCanvas: true
    });
    state.map = map;
    map.createPane('rasterPane'); map.getPane('rasterPane').style.zIndex = 310;
    map.createPane('landPane'); map.getPane('landPane').style.zIndex = 390;
    map.createPane('coastPane'); map.getPane('coastPane').style.zIndex = 400;
    map.createPane('areaPane'); map.getPane('areaPane').style.zIndex = 470;
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map).addAttribution('Land / coast © Natural Earth');
    map.fitBounds([[-90, -180], [90, 180]], { padding: [8, 8] });
    map.on('mousemove', event => {
      $('map-coordinates').textContent = `${t('LON')} ${event.latlng.lng.toFixed(2)}°   ${t('LAT')} ${event.latlng.lat.toFixed(2)}°`;
      if (state.drawing && state.drawStart && state.drawTemporary) state.drawTemporary.setBounds(L.latLngBounds(state.drawStart, event.latlng));
    });
    map.on('mousedown', event => {
      if (!state.drawing) return;
      state.drawStart = event.latlng;
      if (state.drawTemporary) map.removeLayer(state.drawTemporary);
      state.drawTemporary = L.rectangle(L.latLngBounds(event.latlng, event.latlng), { pane: 'areaPane', color: '#f0bf78', weight: 1.5, dashArray: '5 4', fillColor: '#eebc77', fillOpacity: 0.09, interactive: false }).addTo(map);
    });
    map.on('mouseup', event => {
      if (!state.drawing || !state.drawStart) return;
      const bounds = L.latLngBounds(state.drawStart, event.latlng);
      state.drawStart = null;
      if (state.drawTemporary) { map.removeLayer(state.drawTemporary); state.drawTemporary = null; }
      stopDrawing();
      if (Math.abs(bounds.getEast() - bounds.getWest()) < 0.01 || Math.abs(bounds.getNorth() - bounds.getSouth()) < 0.01) {
        setFeedback(t('Drag across the map to define a rectangular area.'), true);
        return;
      }
      state.ignoreClickUntil = Date.now() + 500;
      applyBounds({ west: bounds.getWest(), east: bounds.getEast(), south: bounds.getSouth(), north: bounds.getNorth() }, true);
    });
    map.on('click', event => {
      if (state.selectingPoint) {
        stopPointSelection();
        selectCellAt(event.latlng.lng, event.latlng.lat, true);
        return;
      }
      inspectCell(event);
    });
    $('fit-world').addEventListener('click', () => map.fitBounds([[-90, -180], [90, 180]], { padding: [8, 8] }));
    window.addEventListener('resize', () => map.invalidateSize());
    loadGeography();
  }

  async function loadGeography() {
    try {
      const [land, coast] = await Promise.all([
        requestJson('./land.geojson'), requestJson('./coast.geojson')
      ]);
      state.land = L.geoJSON(land, {
        pane: 'landPane', interactive: false,
        style: { color: '#e5eaed', weight: 0.35, fillColor: '#dce3e8', fillOpacity: 1 }
      }).addTo(state.map);
      state.coast = L.geoJSON(coast, {
        pane: 'coastPane', interactive: false,
        style: { color: '#c1d0d9', weight: 0.7, opacity: 0.9, fill: false }
      }).addTo(state.map);
    } catch (error) {
      console.error('Unable to load land boundary:', error);
    }
  }

  async function loadLayer() {
    if (!state.map) return;
    const version = ++state.layerRequest;
    $('map-loading').classList.remove('is-hidden');
    $('map-loading').innerHTML = `<span class="loading-ring"></span> ${escapeHTML(t('Preparing map layer…'))}`;
    renderMetrics();
    $('map-scenario-name').textContent = displayLabel(selectedScenario()).toUpperCase() || t('SELECT SCENARIO');
    try {
      const info = await apiJson(query('/api/layer', selectionParams()));
      if (version !== state.layerRequest) return;
      const next = L.imageOverlay(backendUrl(info.image_url), [[-90, -180], [90, 180]], { pane: 'rasterPane', opacity: 0.94, interactive: false, errorOverlayUrl: '' });
      next.once('load', () => {
        if (version !== state.layerRequest) return;
        if (state.image) state.map.removeLayer(state.image);
        state.image = next;
        $('map-loading').classList.add('is-hidden');
      });
      next.once('error', () => {
        if (version === state.layerRequest) $('map-loading').textContent = t('Map image could not be loaded.');
      });
      next.addTo(state.map);
      state.layerInfo = info;
      renderLegend();
    } catch (error) {
      if (version === state.layerRequest) $('map-loading').textContent = tf('Layer unavailable: {message}', { message: error.message });
    }
  }

  function renderLegend() {
    const info = state.layerInfo;
    if (!info) return;
    $('legend-title').textContent = t(String(info.label || shortMetric(state.metric))).toUpperCase();
    const categorical = state.metric === 'technology' && Array.isArray(info.categories);
    $('map-legend').classList.toggle('is-categorical', categorical);
    $('legend-continuous').classList.toggle('is-hidden', categorical);
    $('legend-categories').classList.toggle('is-hidden', !categorical);
    if (categorical) {
      $('legend-categories').innerHTML = info.categories.map(item => {
        const color = /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : '#a9c5d5';
        return `<span class="legend-category"><i style="background:${color}"></i>${escapeHTML(t(item.label))}</span>`;
      }).join('');
    }
    $('legend-min').textContent = precise(info.min ?? 0);
    $('legend-max').textContent = compact(info.max ?? 0);
    $('legend-unit').textContent = t(info.unit || '');
    $('valid-cells').textContent = tf('{count} AVAILABLE CELLS', { count: precise(info.valid_cells ?? 0, 0) });
  }

  async function inspectCell(event) {
    if (state.drawing || Date.now() < state.ignoreClickUntil) return;
    const lon = Math.max(-180, Math.min(179.75, event.latlng.lng));
    const lat = Math.max(-90, Math.min(90, event.latlng.lat));
    try {
      const data = await apiJson(query('/api/cell', {
        mode: state.mode, id: String(currentId()), lon: String(lon), lat: String(lat),
        axis: state.axis, group: String(state.group), impact: String(state.impact)
      }));
      if (!data || data.available === false) {
        L.popup().setLatLng(event.latlng).setContent(`<strong>${escapeHTML(t('No feasible offshore wind technology in this grid cell.'))}</strong>`).openOn(state.map);
        return;
      }
      const rows = [
        [t('Technology'), t(data.label || data.technology || '—')],
        [t('Annualized cost'), money(data.cost)],
        ['LCOE', `US$ ${precise(data.lcoe)} / MWh`],
        [t('Capacity'), capacityLabel(data.capacity)],
        [t('Annual generation'), generationLabel(data.generation)],
        [t('Capacity factor'), precise((data.cf || 0) * 100) + '%'],
        [`${displayLabel(selectedImpact()) || t('Impact')} · ${displayLabel(selectedGroup()) || t('Group')}`, precise(data.selected_impact, 0)]
      ];
      const html = `<div class="cell-popup-title">${precise(data.lon, 2)}° / ${precise(data.lat, 2)}°</div>` + rows.map(row => `<div class="cell-popup-row"><span>${escapeHTML(row[0])}</span><strong>${escapeHTML(row[1])}</strong></div>`).join('');
      L.popup().setLatLng(event.latlng).setContent(html).openOn(state.map);
    } catch (error) {
      console.error('Cell inspection failed:', error);
    }
  }

  function startDrawing() {
    stopPointSelection();
    state.drawing = true;
    state.map.dragging.disable();
    $('draw-area').classList.add('is-active');
    $('draw-area').textContent = t('DRAG ON MAP…');
    $('map').style.cursor = 'crosshair';
    setFeedback(t('Drag from one corner of the area to the opposite corner.'));
  }

  function stopDrawing() {
    state.drawing = false;
    state.map.dragging.enable();
    $('draw-area').classList.remove('is-active');
    $('draw-area').textContent = `▱ ${t('DRAW ON MAP')}`;
    $('map').style.cursor = '';
  }

  function startPointSelection() {
    if (state.drawing) stopDrawing();
    state.selectingPoint = true;
    $('pick-cell').classList.add('is-active');
    $('pick-cell').textContent = t('CLICK A GRID CELL…');
    $('map').style.cursor = 'crosshair';
    setFeedback(t('Click a point on the map to select its nearest grid cell.'));
  }

  function stopPointSelection() {
    state.selectingPoint = false;
    $('pick-cell').classList.remove('is-active');
    $('pick-cell').textContent = `◎ ${t('CLICK A POINT ON MAP')}`;
    $('map').style.cursor = '';
  }

  function setAreaMethod(method) {
    if (!['draw', 'cell', 'coordinates'].includes(method)) return;
    if (state.drawing) stopDrawing();
    if (state.selectingPoint) stopPointSelection();
    state.areaMethod = method;
    for (const button of document.querySelectorAll('[data-area-method]')) {
      const active = button.dataset.areaMethod === method;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      $('selection-' + button.dataset.areaMethod).classList.toggle('is-hidden', !active);
    }
  }

  function applyBounds(bounds, fromMap = false, cellCenter = null) {
    const { west, east, south, north } = bounds;
    if (![west, east, south, north].every(Number.isFinite) || west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) {
      setFeedback(t('Use west < east and south < north, within global longitude and latitude limits.'), true);
      return;
    }
    state.bounds = { west, east, south, north };
    state.selectedCell = cellCenter;
    $('cell-selection-note').textContent = cellCenter
      ? tf('Selected grid center: {lon}° longitude, {lat}° latitude.', { lon: cellCenter.lon.toFixed(2), lat: cellCenter.lat.toFixed(2) })
      : '';
    for (const key of ['west', 'east', 'south', 'north']) $(key).value = Number(bounds[key].toFixed(3));
    if (state.rectangle) state.map.removeLayer(state.rectangle);
    state.rectangle = L.rectangle([[south, west], [north, east]], {
      pane: 'areaPane', color: '#f0bf78', weight: 1.8,
      fillColor: '#e9bb79', fillOpacity: 0.08, interactive: false
    }).addTo(state.map);
    if (!fromMap) state.map.fitBounds(state.rectangle.getBounds(), { padding: [28, 28], maxZoom: 6 });
    refreshSummary();
  }

  function selectCellAt(longitude, latitude, fromMap = false) {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) ||
        longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      setFeedback(t('Enter longitude from −180° to 180° and latitude from −90° to 90°.'), true);
      return;
    }
    const col = Math.max(0, Math.min(1439, Math.round((longitude + 180) / 0.25)));
    const row = Math.max(0, Math.min(720, Math.round((90 - latitude) / 0.25)));
    const center = { lon: -180 + col * 0.25, lat: 90 - row * 0.25 };
    $('cell-lon').value = center.lon.toFixed(2);
    $('cell-lat').value = center.lat.toFixed(2);
    applyBounds({
      west: Math.max(-180, center.lon - 0.125),
      east: Math.min(180, center.lon + 0.125),
      south: Math.max(-90, center.lat - 0.125),
      north: Math.min(90, center.lat + 0.125)
    }, fromMap, center);
  }

  function selectSingleCell() {
    const longitudeText = $('cell-lon').value.trim();
    const latitudeText = $('cell-lat').value.trim();
    if (!longitudeText || !latitudeText) {
      setFeedback(t('Enter longitude and latitude to select a grid cell.'), true);
      return;
    }
    selectCellAt(Number(longitudeText), Number(latitudeText));
  }

  async function refreshSummary() {
    state.summary = null;
    $('record-button').disabled = true;
    if (!state.bounds) return;
    const version = ++state.summaryRequest;
    setFeedback(t('Calculating exact grid-cell totals…'));
    const request = {
      mode: state.mode, id: currentId(), bounds: state.bounds,
      axis: state.axis, group: state.group
    };
    try {
      const summary = await apiJson('/api/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request)
      });
      if (version !== state.summaryRequest) return;
      state.summary = summary;
      const cellCount = Number(summary.cell_count || 0);
      $('area-cell-count').textContent = tf(cellCount === 1 ? '{count} CELL' : '{count} CELLS', { count: precise(cellCount, 0) });
      $('kpi-cost').textContent = money(summary.annual_cost_usd);
      $('kpi-capacity').textContent = capacityLabel(summary.capacity_mw || 0);
      $('kpi-generation').textContent = generationLabel(summary.generation_mwh || 0);
      if (state.selectedCell) {
        setFeedback(summary.cell_count > 0
          ? tf('Grid cell {lon}°, {lat}° selected.', { lon: state.selectedCell.lon.toFixed(2), lat: state.selectedCell.lat.toFixed(2) })
          : t('The selected grid cell has no feasible technology in this scenario.'), summary.cell_count < 1);
      } else {
        setFeedback(tf(cellCount === 1 ? '{count} feasible grid cell selected.' : '{count} feasible grid cells selected.', { count: precise(cellCount, 0) }));
      }
      $('record-button').disabled = summary.cell_count < 1;
      renderCharts();
    } catch (error) {
      if (version !== state.summaryRequest) return;
      setFeedback(tf('Area calculation failed: {message}', { message: error.message }), true);
      $('area-cell-count').textContent = tf('— CELLS', {});
      $('kpi-cost').textContent = '—';
      $('kpi-capacity').textContent = '—';
      $('kpi-generation').textContent = '—';
      renderCharts();
    }
  }

  function sameBounds(a, b) {
    if (!a || !b) return false;
    return ['west', 'east', 'south', 'north'].every(key => Math.abs(Number(a[key]) - Number(b[key])) < 1e-5);
  }

  function barRow(label, value, maxValue, selected = false, muted = false) {
    const width = maxValue > 0 ? Math.max(value > 0 ? 1.2 : 0, Math.min(100, value / maxValue * 100)) : 0;
    return `<div class="bar-row${selected ? ' is-selected' : ''}${muted ? ' is-muted' : ''}"><span class="bar-label" title="${escapeHTML(label)}">${escapeHTML(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span class="bar-value">${compact(value)}</span></div>`;
  }

  function renderCharts() {
    if (!state.summary) {
      $('cost-chart').innerHTML = `<p class="chart-empty">${escapeHTML(t('Select an area to view results.'))}</p>`;
      $('impact-chart').innerHTML = `<p class="chart-empty">${escapeHTML(t('Four impact types will appear here.'))}</p>`;
      return;
    }
    const comparable = state.records.filter(record => sameBounds(record, state.bounds)).slice(-3);
    const entries = [{ label: t('Current'), value: state.summary.annual_cost_usd || 0, selected: true }, ...comparable.map(record => ({ label: t(record.selection), value: record.annual_cost_usd || 0 }))];
    const maxCost = Math.max(1, ...entries.map(entry => entry.value));
    $('cost-chart').innerHTML = entries.map((entry, index) => barRow(entry.label, entry.value, maxCost, entry.selected, index > 0)).join('');
    const values = state.summary.impact_types || [0, 0, 0, 0];
    const maxImpact = Math.max(1, ...values);
    $('impact-chart').innerHTML = state.config.impacts.map((impact, index) => barRow(displayLabel(impact), values[index] || 0, maxImpact, Number(impact.id) === state.impact)).join('');
    $('impact-chart-group').textContent = displayLabel(selectedGroup()).toUpperCase() || t('SELECTED GROUP');
  }

  const impactColumnKey = (axis, groupId, impactId) => `${axis}_${groupId}_impact_${impactId}`;
  function localSelectionTime() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
    const offsetRemainder = pad(Math.abs(offsetMinutes) % 60);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ` +
      `UTC${offsetSign}${offsetHours}:${offsetRemainder}`;
  }

  function recordCurrent() {
    if (!state.summary || !state.bounds) return;
    const record = {
      sequence: state.records.length + 1, selection_time_local: localSelectionTime(),
      mode: state.mode, selection: selectedScenario()?.label || String(currentId()),
      selection_id: currentId(),
      technology_code: state.mode === 'combo' ? state.comboId : null,
      west: state.bounds.west, east: state.bounds.east,
      south: state.bounds.south, north: state.bounds.north,
      annual_cost_usd: Number(state.summary.annual_cost_usd || 0),
      capacity_mw: Number(state.summary.capacity_mw || 0),
      generation_mwh: Number(state.summary.generation_mwh || 0),
      technology_totals: state.summary.technology_totals || [],
      cell_count: Number(state.summary.cell_count || 0),
      impacts_by_taxon: state.summary.impacts_by_taxon || Array.from({ length: 5 }, () => [0, 0, 0, 0]),
      impacts_by_threat: state.summary.impacts_by_threat || Array.from({ length: 4 }, () => [0, 0, 0, 0])
    };
    state.records.push(record);
    saveRecords();
    renderRecords();
    renderCharts();
    const tableScroll = $('comparison-table').parentElement;
    tableScroll.scrollTop = tableScroll.scrollHeight;
    tableScroll.scrollLeft = 0;
    $('compare').classList.add('is-highlighted');
    window.setTimeout(() => $('compare').classList.remove('is-highlighted'), 1100);
  }

  function saveRecords() {
    try { localStorage.setItem('bluewindeco_comparisons_v1', JSON.stringify(state.records)); }
    catch (_) { /* Export remains available even if browser storage is disabled. */ }
  }

  function loadRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem('bluewindeco_comparisons_v1') || '[]');
      state.records = Array.isArray(parsed) ? parsed.filter(x => x && x.selection).slice(0, 500).map(record => ({
        ...record,
        selection_time_local: record.selection_time_local ||
          (record.timestamp_bj ? `${record.timestamp_bj} UTC+08:00` : '')
      })) : [];
    } catch (_) { state.records = []; }
  }

  function comparisonColumns() {
    const base = [
      ['sequence', '#'], ['selection_time_local', 'Selection time'], ['mode', 'Mode'],
      ['selection', 'Selection'], ['west', 'West'], ['east', 'East'],
      ['south', 'South'], ['north', 'North'], ['cell_count', 'Cells']
    ];
    const technologyMetrics = [
      ['annual_cost_usd', 'Annual cost · USD/yr'],
      ['capacity_mw', 'Capacity · MW'],
      ['generation_mwh', 'Generation · MWh/yr']
    ];
    const technologies = [];
    for (const technology of state.config.technologies) {
      for (const [key, label] of technologyMetrics) {
        technologies.push([`technology_${technology.id}_${key}`, `${technology.label} · ${label}`]);
      }
    }
    const impacts = [];
    for (const taxon of state.config.taxa) for (const impact of state.config.impacts) impacts.push([impactColumnKey('taxon', taxon.id, impact.id), `${taxon.label} · ${impact.label}`]);
    for (const threat of state.config.threats) for (const impact of state.config.impacts) impacts.push([impactColumnKey('threat', threat.id, impact.id), `${threat.label} · ${impact.label}`]);
    return [...base, ...technologies, ...impacts];
  }

  function recordValue(record, key) {
    const technologyParts = key.match(/^technology_(\d+)_(annual_cost_usd|capacity_mw|generation_mwh)$/);
    if (technologyParts) {
      const technology = record.technology_totals?.find(item => Number(item.technology_code) === Number(technologyParts[1]));
      return technology?.[technologyParts[2]];
    }
    const parts = key.match(/^(taxon|threat)_(\d+)_impact_(\d+)$/);
    if (parts) {
      const matrix = parts[1] === 'taxon' ? record.impacts_by_taxon : record.impacts_by_threat;
      return matrix?.[Number(parts[2]) - 1]?.[Number(parts[3]) - 1] ?? 0;
    }
    return record[key];
  }

  function localizeCompoundLabel(label) {
    const direct = t(label);
    if (direct !== label) return direct;
    const parts = label.split(' · ');
    if (parts.length < 2) return direct;
    const first = t(parts[0]);
    const rest = t(parts.slice(1).join(' · '));
    return `${first} · ${rest === parts.slice(1).join(' · ') ? parts.slice(1).map(t).join(' · ') : rest}`;
  }

  function renderRecords() {
    const columns = comparisonColumns();
    $('comparison-head').innerHTML = `<tr><th>${escapeHTML(t('Remove'))}</th>` + columns.map(([, label]) => `<th>${escapeHTML(localizeCompoundLabel(label))}</th>`).join('') + '</tr>';
    if (!state.records.length) {
      $('comparison-body').innerHTML = `<tr><td class="empty-table" colspan="${columns.length + 1}">${escapeHTML(t('No selections recorded. Set an area, then choose “Record this selection”.'))}</td></tr>`;
    } else {
      $('comparison-body').innerHTML = state.records.map((record, index) => {
        const values = columns.map(([key]) => {
          const value = recordValue(record, key);
          const display = typeof value === 'number' ? (['west', 'east', 'south', 'north'].includes(key) ? precise(value, 3) : precise(value, 2)) :
            key === 'mode' ? t(value === 'combo' ? 'Technology' : 'Strategy') : key === 'selection' ? t(String(value ?? '')) : String(value ?? '');
          return `<td>${escapeHTML(display)}</td>`;
        }).join('');
        return `<tr><td><button class="delete-record" type="button" data-delete="${index}" aria-label="${escapeHTML(tf('Delete record {number}', { number: index + 1 }))}">${escapeHTML(t('DELETE'))}</button></td>${values}</tr>`;
      }).join('');
    }
    $('record-count').textContent = tf(state.records.length === 1 ? '{count} RECORDED SELECTION' : '{count} RECORDED SELECTIONS', { count: state.records.length });
    $('export-button').disabled = !state.records.length;
    $('clear-records').disabled = !state.records.length;
  }

  function requestClearAllRecords() {
    if (!state.records.length) return;
    $('clear-confirm-count').textContent = tf(state.records.length === 1 ? '{count} recorded selection' : '{count} recorded selections', { count: state.records.length });
    $('clear-confirmation').showModal();
  }

  function clearAllRecords() {
    if (!$('clear-confirmation').open) return;
    $('clear-confirmation').close();
    state.records = [];
    saveRecords();
    renderRecords();
    renderCharts();
  }

  function setComparisonExpanded(expanded) {
    if (expanded) setResultsExpanded(false);
    $('compare').classList.toggle('is-expanded', expanded);
    document.body.classList.toggle('compare-expanded', expanded);
    const button = $('compare-expand');
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', t(expanded ? 'Close expanded comparison workspace' : 'Expand comparison workspace'));
    button.title = t(expanded ? 'Close expanded comparison workspace' : 'Expand comparison workspace');
    button.querySelector('.maximize-icon').classList.toggle('is-hidden', expanded);
    button.querySelector('.close-icon').classList.toggle('is-hidden', !expanded);
  }

  function setResultsExpanded(expanded) {
    if (expanded) setComparisonExpanded(false);
    $('results').classList.toggle('is-expanded', expanded);
    document.body.classList.toggle('results-expanded', expanded);
    const button = $('results-expand');
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', t(expanded ? 'Close expanded area results' : 'Expand area results'));
    button.title = t(expanded ? 'Close expanded area results' : 'Expand area results');
    button.querySelector('.maximize-icon').classList.toggle('is-hidden', expanded);
    button.querySelector('.close-icon').classList.toggle('is-hidden', !expanded);
  }

  function markActiveNav(activeLink) {
    for (const link of document.querySelectorAll('.site-nav [data-nav-target]')) {
      const active = link === activeLink;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function navigateToModule(link) {
    const targetId = link.dataset.navTarget;
    const panel = $(targetId);
    if (!panel) return;
    if (link.dataset.modeLink) setMode(link.dataset.modeLink);
    for (const item of document.querySelectorAll('.workspace .panel.is-nav-highlighted')) {
      item.classList.remove('is-nav-highlighted');
    }
    panel.classList.add('is-nav-highlighted');
    markActiveNav(link);
    const innerScroll = panel.querySelector('.analysis-body, .results-body');
    if (innerScroll) innerScroll.scrollTop = 0;
    else if (targetId !== 'compare') panel.scrollTop = 0;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    window.history.replaceState(null, '', `#${targetId}`);
  }

  async function exportRecords() {
    if (!state.records.length) return;
    const button = $('export-button');
    button.disabled = true;
    button.textContent = t('PREPARING EXCEL…');
    try {
      let blob;
      if (window.BWEStaticExport) {
        blob = await window.BWEStaticExport(state.records);
      } else {
        const response = await fetch(backendUrl('/api/export'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: state.records })
        });
        if (!response.ok) throw new Error(tf('Export failed (HTTP {status}).', { status: response.status }));
        blob = await response.blob();
      }
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `BlueWindEco_comparisons_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(href), 2000);
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = `↧ ${t('EXPORT EXCEL')}`;
    }
  }

  function wireControls() {
    document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
    $('combo-options').addEventListener('click', event => {
      const button = event.target.closest('[data-combo]');
      if (!button) return;
      state.comboId = Number(button.dataset.combo);
      renderChoices();
      if (state.mode === 'combo') { loadLayer(); refreshSummary(); }
    });
    $('strategy-options').addEventListener('click', event => {
      const button = event.target.closest('[data-strategy]');
      if (!button) return;
      state.strategyId = Number(button.dataset.strategy);
      renderChoices();
      if (state.mode === 'strategy') { loadLayer(); refreshSummary(); }
    });
    $('metric-options').addEventListener('click', event => {
      const button = event.target.closest('[data-metric]');
      if (!button) return;
      state.metric = button.dataset.metric;
      renderMetrics();
      loadLayer();
    });
    document.querySelectorAll('[data-axis]').forEach(button => button.addEventListener('click', () => setAxis(button.dataset.axis)));
    $('impact-group').addEventListener('change', event => {
      state.group = Number(event.target.value);
      if (state.metric === 'impact') loadLayer();
      refreshSummary();
    });
    $('impact-type').addEventListener('change', event => {
      state.impact = Number(event.target.value);
      if (state.metric === 'impact') loadLayer();
      renderCharts();
    });
    document.querySelectorAll('[data-area-method]').forEach(button => button.addEventListener('click', () => setAreaMethod(button.dataset.areaMethod)));
    $('apply-area').addEventListener('click', () => {
      if (['west', 'east', 'south', 'north'].some(key => $(key).value.trim() === '')) {
        setFeedback(t('Enter all four boundaries before applying the area.'), true);
        return;
      }
      applyBounds(Object.fromEntries(['west', 'east', 'south', 'north'].map(key => [key, Number($(key).value)])));
    });
    for (const key of ['west', 'east', 'south', 'north']) $(key).addEventListener('change', () => {
      if (['west', 'east', 'south', 'north'].every(name => $(name).value !== '')) applyBounds(Object.fromEntries(['west', 'east', 'south', 'north'].map(name => [name, Number($(name).value)])));
    });
    $('draw-area').addEventListener('click', () => state.drawing ? stopDrawing() : startDrawing());
    $('pick-cell').addEventListener('click', () => state.selectingPoint ? stopPointSelection() : startPointSelection());
    $('select-cell').addEventListener('click', selectSingleCell);
    for (const key of ['cell-lon', 'cell-lat']) $(key).addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); selectSingleCell(); }
    });
    $('record-button').addEventListener('click', recordCurrent);
    $('comparison-body').addEventListener('click', event => {
      const button = event.target.closest('[data-delete]');
      if (!button) return;
      state.records.splice(Number(button.dataset.delete), 1);
      state.records.forEach((record, index) => { record.sequence = index + 1; });
      saveRecords(); renderRecords(); renderCharts();
    });
    $('export-button').addEventListener('click', exportRecords);
    $('clear-records').addEventListener('click', requestClearAllRecords);
    $('cancel-clear-records').addEventListener('click', () => $('clear-confirmation').close());
    $('confirm-clear-records').addEventListener('click', clearAllRecords);
    $('compare-expand').addEventListener('click', () => setComparisonExpanded(!$('compare').classList.contains('is-expanded')));
    $('results-expand').addEventListener('click', () => setResultsExpanded(!$('results').classList.contains('is-expanded')));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if ($('compare').classList.contains('is-expanded')) {
          setComparisonExpanded(false);
          $('compare-expand').focus();
        } else if ($('results').classList.contains('is-expanded')) {
          setResultsExpanded(false);
          $('results-expand').focus();
        }
      }
    });
    for (const link of document.querySelectorAll('.site-nav [data-nav-target]')) link.addEventListener('click', event => {
      event.preventDefault();
      navigateToModule(link);
    });
  }

  function renderImpactTypes() {
    $('impact-type').innerHTML = state.config.impacts.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(displayLabel(item))}</option>`).join('');
    $('impact-type').value = String(state.impact);
  }

  function refreshLanguage() {
    renderChoices();
    renderMetrics();
    fillGroups();
    renderImpactTypes();
    renderLegend();
    renderRecords();
    renderCharts();
    if (state.selectedCell) {
      $('cell-selection-note').textContent = tf('Selected grid center: {lon}° longitude, {lat}° latitude.', {
        lon: state.selectedCell.lon.toFixed(2), lat: state.selectedCell.lat.toFixed(2)
      });
    }
    if (state.summary) {
      const count = Number(state.summary.cell_count || 0);
      $('area-cell-count').textContent = tf(count === 1 ? '{count} CELL' : '{count} CELLS', { count: precise(count, 0) });
      $('kpi-cost').textContent = money(state.summary.annual_cost_usd);
      $('kpi-capacity').textContent = capacityLabel(state.summary.capacity_mw || 0);
      $('kpi-generation').textContent = generationLabel(state.summary.generation_mwh || 0);
      setFeedback(state.selectedCell
        ? (count ? tf('Grid cell {lon}°, {lat}° selected.', { lon: state.selectedCell.lon.toFixed(2), lat: state.selectedCell.lat.toFixed(2) })
          : t('The selected grid cell has no feasible technology in this scenario.'))
        : tf(count === 1 ? '{count} feasible grid cell selected.' : '{count} feasible grid cells selected.', { count: precise(count, 0) }), count < 1);
    } else if (!state.bounds) {
      setFeedback(t('No area selected yet.'));
    }
    $('draw-area').textContent = state.drawing ? t('DRAG ON MAP…') : `▱ ${t('DRAW ON MAP')}`;
    $('pick-cell').textContent = state.selectingPoint ? t('CLICK A GRID CELL…') : `◎ ${t('CLICK A POINT ON MAP')}`;
    $('export-button').textContent = `↧ ${t('EXPORT EXCEL')}`;
    if ($('clear-confirmation').open) {
      const count = state.records.length;
      $('clear-confirm-count').textContent = tf(count === 1 ? '{count} recorded selection' : '{count} recorded selections', { count });
    }
    $('compare-expand').setAttribute('aria-label', t($('compare').classList.contains('is-expanded') ? 'Close expanded comparison workspace' : 'Expand comparison workspace'));
    $('compare-expand').title = $('compare-expand').getAttribute('aria-label');
    $('results-expand').setAttribute('aria-label', t($('results').classList.contains('is-expanded') ? 'Close expanded area results' : 'Expand area results'));
    $('results-expand').title = $('results-expand').getAttribute('aria-label');
    if (state.map) state.map.closePopup();
  }

  async function init() {
    try { state.config = await apiJson('/api/config'); }
    catch (error) { console.warn('Using fallback labels:', error); }
    renderChoices(); renderMetrics(); fillGroups();
    renderImpactTypes();
    loadRecords(); renderRecords();
    window.addEventListener('bluewindeco:languagechange', refreshLanguage);
    wireControls();
    try { initMap(); loadLayer(); }
    catch (error) {
      $('map-loading').textContent = error.message;
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
