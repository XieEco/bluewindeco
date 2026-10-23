/* BlueWindEco's GitHub Pages data engine. All calculations run in the visitor's browser. */
(() => {
  'use strict';

  const ROWS = 721;
  const COLS = 1440;
  const HOURS_PER_YEAR = 8760;
  const FOUNDATION = [1, 1, 2, 2, 3, 3];
  const TRANSMISSION = [4, 5, 4, 5, 4, 5];
  const TECHNOLOGY_LABELS = [
    'Monopile + DC', 'Monopile + AC', 'Jacket + DC', 'Jacket + AC',
    'Floating + DC', 'Floating + AC'
  ];
  const TECHNOLOGY_COLORS = [
    '#F4C288', '#8B511F', '#68BFE8', '#214EA7', '#DCA0DD', '#7552A7'
  ];
  const METRICS = {
    technology: ['Technology combination', ''],
    annual_cost: ['Annualized generation cost', 'USD yr⁻¹'],
    lcoe: ['Levelized cost of electricity', 'USD MWh⁻¹'],
    capacity: ['Potential installed capacity', 'MW'],
    generation: ['Modelled gross annual generation', 'MWh yr⁻¹'],
    cf: ['Capacity factor', 'fraction'],
    impact: ['Cumulative affected species richness', 'species']
  };
  const ANCHORS = [
    [24, 63, 104], [26, 128, 174], [69, 207, 225],
    [176, 139, 223], [250, 195, 112]
  ];
  const CONFIG = {
    technologies: TECHNOLOGY_LABELS.map((label, index) => ({ id: index + 1, label })),
    strategies: [
      { id: 0, label: 'Minimum cost' },
      { id: 1, label: 'Tier 1 · Negative-only sites' },
      { id: 2, label: 'Tier 2 · Minimize negative impacts' },
      { id: 3, label: 'Tier 3 · Minimize negative, then maximize positive' },
      { id: 4, label: 'Tier 4 · Maximize positive impacts' }
    ],
    taxa: [
      { id: 1, label: 'Birds and bats' },
      { id: 2, label: 'Fish' },
      { id: 3, label: 'Marine mammals' },
      { id: 4, label: 'Benthic invertebrates and habitats' },
      { id: 5, label: 'Plankton' }
    ],
    threats: [
      { id: 1, label: 'Critically endangered (CR)' },
      { id: 2, label: 'Endangered (EN)' },
      { id: 3, label: 'Vulnerable (VU)' },
      { id: 4, label: 'NT / LC / NE' }
    ],
    impacts: [
      { id: 1, label: 'Positive' },
      { id: 2, label: 'Negative · trait' },
      { id: 3, label: 'Negative · behaviour' },
      { id: 4, label: 'Negative · general' }
    ],
    metrics: Object.entries(METRICS).map(([id, pair]) => ({ id, label: pair[0] })),
    land_url: './land.geojson', coast_url: './coast.geojson'
  };

  let corePromise = null;
  const impactPromises = new Map();
  const layerCache = new Map();

  function assertLittleEndian() {
    if (new Uint8Array(new Uint32Array([1]).buffer)[0] !== 1) {
      throw new Error('This browser does not support the little-endian BlueWindEco data format.');
    }
  }

  async function fetchBytes(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load published data (${response.status}): ${path}`);
    return response.arrayBuffer();
  }

  async function gunzipBytes(bytes) {
    const view = new Uint8Array(bytes);
    if (view[0] !== 0x1f || view[1] !== 0x8b) return bytes;
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decompress the published data. Use a recent browser.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  async function fetchBinary(path) {
    return gunzipBytes(await fetchBytes(path));
  }

  async function fetchSplitBinary(paths) {
    const chunks = await Promise.all(paths.map(fetchBytes));
    const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
    const combined = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    return gunzipBytes(combined.buffer);
  }

  async function loadCore() {
    if (!corePromise) corePromise = (async () => {
      assertLittleEndian();
      const manifestResponse = await fetch('./data/manifest.json');
      if (!manifestResponse.ok) throw new Error('The published dataset manifest is unavailable.');
      const manifest = await manifestResponse.json();
      const coreParts = Array.isArray(manifest.core_parts) ? manifest.core_parts : null;
      const buffer = coreParts?.length
        ? await fetchSplitBinary(coreParts.map(path => new URL(path, new URL('./data/', window.location.href)).toString()))
        : await fetchBinary('./data/core.bin.gz');
      if (Number(manifest.grid?.rows ?? manifest.rows) !== ROWS ||
          Number(manifest.grid?.cols ?? manifest.cols) !== COLS) {
        throw new Error('The published dataset has an unexpected grid size.');
      }
      const n = new DataView(buffer).getUint32(0, true);
      if (n !== Number(manifest.site_count) || buffer.byteLength !== 4 + n * 61) {
        throw new Error('The published core dataset is incomplete.');
      }
      let offset = 4;
      const positions = new Uint32Array(buffer, offset, n); offset += n * 4;
      const capacity = new Float32Array(buffer, offset, n * 6); offset += n * 6 * 4;
      const lcoe = new Float32Array(buffer, offset, n * 6); offset += n * 6 * 4;
      const cf = new Float32Array(buffer, offset, n); offset += n * 4;
      const strategies = new Uint8Array(buffer, offset, n * 5);
      for (let i = 1; i < n; i++) {
        if (positions[i] <= positions[i - 1] || positions[i] >= ROWS * COLS) {
          throw new Error('Published grid-cell positions are invalid.');
        }
      }
      return { manifest, n, positions, capacity, lcoe, cf, strategies };
    })().catch(error => { corePromise = null; throw error; });
    return corePromise;
  }

  async function loadImpact(component) {
    if (!Number.isInteger(component) || component < 1 || component > 5) {
      throw new Error('Invalid offshore-wind component.');
    }
    if (!impactPromises.has(component)) {
      const promise = (async () => {
        const core = await loadCore();
        const buffer = await fetchBinary(`./data/impact_${component}.bin.gz`);
        const n = new DataView(buffer).getUint32(0, true);
        if (n !== core.n || buffer.byteLength !== 4 + n * 36 * 4) {
          throw new Error(`Published impact dataset ${component} is incomplete.`);
        }
        const values = new Float32Array(buffer, 4, n * 36);
        return { n, values, buffer };
      })().catch(error => { impactPromises.delete(component); throw error; });
      impactPromises.set(component, promise);
    }
    return impactPromises.get(component);
  }

  function impactAt(pack, axis, group, effect, site) {
    const baseGroup = axis === 'taxon' ? group - 1 : 5 + group - 1;
    return pack.values[(baseGroup * 4 + effect - 1) * pack.n + site];
  }

  function validateSelection(mode, id) {
    if (mode === 'combo' && Number.isInteger(id) && id >= 1 && id <= 6) return;
    if (mode === 'strategy' && Number.isInteger(id) && id >= 0 && id <= 4) return;
    throw new Error('Unknown technology combination or strategy.');
  }

  function validateImpact(axis, group, effect) {
    if (!['taxon', 'threat'].includes(axis) || !Number.isInteger(group) ||
        group < 1 || group > (axis === 'taxon' ? 5 : 4) ||
        !Number.isInteger(effect) || effect < 1 || effect > 4) {
      throw new Error('Invalid biodiversity impact selection.');
    }
  }

  function codeAt(core, mode, id, site) {
    if (mode === 'strategy') return core.strategies[id * core.n + site];
    const index = (id - 1) * core.n + site;
    const cap = core.capacity[index];
    const cost = core.lcoe[index];
    return Number.isFinite(cap) && cap > 0 && Number.isFinite(cost) && cost > 0 ? id : 0;
  }

  function percentile98(values) {
    values.sort((a, b) => a - b);
    const index = (values.length - 1) * 0.98;
    const lower = Math.floor(index);
    const upper = Math.min(lower + 1, values.length - 1);
    return values[lower] * (1 - (index - lower)) + values[upper] * (index - lower);
  }

  function renderLayer(core, selection, metric, axis, group, effect, components) {
    const canvas = document.createElement('canvas');
    canvas.width = COLS;
    canvas.height = ROWS;
    const context = canvas.getContext('2d', { willReadFrequently: false });
    if (!context) throw new Error('This browser cannot render the map layer.');
    const image = context.createImageData(COLS, ROWS);
    const pixels = image.data;
    const values = new Float64Array(core.n);
    const valid = new Uint8Array(core.n);
    const validValues = [];
    let validCells = 0;
    for (let i = 0; i < core.n; i++) {
      const code = codeAt(core, selection.mode, selection.id, i);
      if (!code) continue;
      const index = (code - 1) * core.n + i;
      const cap = core.capacity[index];
      const lcoe = core.lcoe[index];
      const cf = core.cf[i];
      let value;
      if (metric === 'technology') value = code;
      else if (metric === 'capacity') value = cap;
      else if (metric === 'lcoe') value = lcoe;
      else if (metric === 'cf') value = cf;
      else if (metric === 'generation') value = cap * cf * HOURS_PER_YEAR;
      else if (metric === 'annual_cost') value = cap * cf * HOURS_PER_YEAR * lcoe;
      else {
        value = impactAt(components[FOUNDATION[code - 1]], axis, group, effect, i) +
          impactAt(components[TRANSMISSION[code - 1]], axis, group, effect, i);
      }
      if (!Number.isFinite(value)) continue;
      values[i] = value;
      valid[i] = 1;
      validValues.push(value);
      validCells++;
    }
    if (!validCells) throw new Error('Selected layer has no valid sites.');

    let maximum = metric === 'technology' ? 6 : percentile98(validValues);
    if (maximum <= 0) {
      maximum = 0;
      for (const value of validValues) maximum = Math.max(maximum, value);
    }
    if (maximum <= 0) maximum = 1;
    for (let i = 0; i < core.n; i++) {
      const code = codeAt(core, selection.mode, selection.id, i);
      if (!code || !valid[i]) continue;
      const value = values[i];
      const pixel = core.positions[i] * 4;
      if (metric === 'technology') {
        const color = TECHNOLOGY_COLORS[code - 1];
        pixels[pixel] = Number.parseInt(color.slice(1, 3), 16);
        pixels[pixel + 1] = Number.parseInt(color.slice(3, 5), 16);
        pixels[pixel + 2] = Number.parseInt(color.slice(5, 7), 16);
      } else if (value === 0) {
        pixels[pixel] = 25; pixels[pixel + 1] = 57; pixels[pixel + 2] = 83;
      } else {
        const position = Math.max(0, Math.min(1, value / maximum)) * (ANCHORS.length - 1);
        const lower = Math.floor(position);
        const upper = Math.min(lower + 1, ANCHORS.length - 1);
        const weight = position - lower;
        for (let channel = 0; channel < 3; channel++) {
          pixels[pixel + channel] = Math.trunc(
            ANCHORS[lower][channel] * (1 - weight) + ANCHORS[upper][channel] * weight
          );
        }
      }
      pixels[pixel + 3] = 240;
    }
    context.putImageData(image, 0, 0);
    const [label, unit] = METRICS[metric];
    const result = {
      image_url: canvas.toDataURL('image/png'),
      min: metric === 'technology' ? 1 : 0,
      max: maximum, unit, label, valid_cells: validCells
    };
    if (metric === 'technology') {
      result.categories = TECHNOLOGY_LABELS.map((technologyLabel, index) => ({
        id: index + 1, label: technologyLabel, color: TECHNOLOGY_COLORS[index]
      }));
    }
    return result;
  }

  async function layer(params) {
    const mode = params.get('mode') || 'combo';
    const id = Number(params.get('id') ?? 1);
    const metric = params.get('metric') || 'annual_cost';
    const axis = params.get('axis') || 'taxon';
    const group = Number(params.get('group') ?? 1);
    const effect = Number(params.get('impact') ?? 1);
    validateSelection(mode, id);
    validateImpact(axis, group, effect);
    if (!Object.hasOwn(METRICS, metric)) throw new Error('Unknown map layer.');
    const cacheKey = [mode, id, metric, axis, group, effect].join(':');
    if (layerCache.has(cacheKey)) return layerCache.get(cacheKey);
    const core = await loadCore();
    const components = {};
    if (metric === 'impact') {
      const loaded = await Promise.all([1, 2, 3, 4, 5].map(loadImpact));
      for (let component = 1; component <= 5; component++) components[component] = loaded[component - 1];
    }
    const result = renderLayer(core, { mode, id }, metric, axis, group, effect, components);
    layerCache.set(cacheKey, result);
    if (layerCache.size > 12) layerCache.delete(layerCache.keys().next().value);
    return result;
  }

  function roundTiesEven(value) {
    const floor = Math.floor(value);
    const fraction = value - floor;
    if (fraction < 0.5) return floor;
    if (fraction > 0.5) return floor + 1;
    return floor % 2 === 0 ? floor : floor + 1;
  }

  function siteForLinear(positions, linear) {
    let low = 0;
    let high = positions.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (positions[middle] === linear) return middle;
      if (positions[middle] < linear) low = middle + 1;
      else high = middle - 1;
    }
    return -1;
  }

  async function cell(params) {
    const mode = params.get('mode') || 'combo';
    const id = Number(params.get('id') ?? 1);
    const lon = Number(params.get('lon'));
    const lat = Number(params.get('lat'));
    const axis = params.get('axis') || 'taxon';
    const group = Number(params.get('group') ?? 1);
    const effect = Number(params.get('impact') ?? 1);
    validateSelection(mode, id);
    validateImpact(axis, group, effect);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon >= 180 || lat < -90 || lat > 90) {
      throw new Error('Point is outside the map.');
    }
    const row = roundTiesEven((90 - lat) / 0.25);
    const col = roundTiesEven((lon + 180) / 0.25);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    const core = await loadCore();
    const site = siteForLinear(core.positions, row * COLS + col);
    if (site < 0) return null;
    const code = codeAt(core, mode, id, site);
    if (!code) return null;
    const [foundation, transmission] = await Promise.all([
      loadImpact(FOUNDATION[code - 1]), loadImpact(TRANSMISSION[code - 1])
    ]);
    const cap = core.capacity[(code - 1) * core.n + site];
    const lcoe = core.lcoe[(code - 1) * core.n + site];
    const cf = core.cf[site];
    const generation = cap * cf * HOURS_PER_YEAR;
    return {
      lon: -180 + col * 0.25, lat: 90 - row * 0.25,
      technology: code, label: TECHNOLOGY_LABELS[code - 1],
      cost: generation * lcoe, capacity: cap, generation, cf, lcoe,
      selected_impact: impactAt(foundation, axis, group, effect, site) +
        impactAt(transmission, axis, group, effect, site)
    };
  }

  function validateBounds(bounds) {
    if (!bounds) throw new Error('Select an area first.');
    const west = Number(bounds.west);
    const east = Number(bounds.east);
    const south = Number(bounds.south);
    const north = Number(bounds.north);
    if (!Number.isFinite(west) || !Number.isFinite(east) ||
        !Number.isFinite(south) || !Number.isFinite(north) ||
        !(-180 <= west && west < east && east <= 180 && -90 <= south && south < north && north <= 90)) {
      throw new Error('Enter west < east and south < north within world coordinates.');
    }
    return { west, east, south, north };
  }

  async function summary(body) {
    const mode = String(body.mode);
    const id = Number(body.id);
    const axis = String(body.axis || 'taxon');
    const group = Number(body.group ?? 1);
    const bounds = validateBounds(body.bounds);
    validateSelection(mode, id);
    validateImpact(axis, group, 1);
    const core = await loadCore();
    const impacts = await Promise.all([1, 2, 3, 4, 5].map(loadImpact));
    const technologyTotals = Array.from({ length: 6 }, (_, index) => ({
      technology_code: index + 1,
      annual_cost_usd: 0, capacity_mw: 0, generation_mwh: 0
    }));
    const taxonTotals = Array.from({ length: 5 }, () => [0, 0, 0, 0]);
    const threatTotals = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    let cellCount = 0;
    for (let i = 0; i < core.n; i++) {
      const linear = core.positions[i];
      const latitude = 90 - Math.floor(linear / COLS) * 0.25;
      const longitude = -180 + (linear % COLS) * 0.25;
      if (latitude < bounds.south || latitude > bounds.north ||
          longitude < bounds.west || longitude > bounds.east) continue;
      const code = codeAt(core, mode, id, i);
      if (!code) continue;
      cellCount++;
      const index = (code - 1) * core.n + i;
      const cap = core.capacity[index];
      const generation = cap * core.cf[i] * HOURS_PER_YEAR;
      const totals = technologyTotals[code - 1];
      totals.capacity_mw += cap;
      totals.generation_mwh += generation;
      totals.annual_cost_usd += generation * core.lcoe[index];
      const foundation = impacts[FOUNDATION[code - 1] - 1];
      const transmission = impacts[TRANSMISSION[code - 1] - 1];
      for (let taxon = 0; taxon < 5; taxon++) {
        for (let effect = 0; effect < 4; effect++) {
          const offset = (taxon * 4 + effect) * core.n + i;
          taxonTotals[taxon][effect] += foundation.values[offset] + transmission.values[offset];
        }
      }
      for (let threat = 0; threat < 4; threat++) {
        for (let effect = 0; effect < 4; effect++) {
          const offset = ((5 + threat) * 4 + effect) * core.n + i;
          threatTotals[threat][effect] += foundation.values[offset] + transmission.values[offset];
        }
      }
    }
    const impactTypes = axis === 'taxon' ? taxonTotals[group - 1] : threatTotals[group - 1];
    return {
      cell_count: cellCount,
      annual_cost_usd: technologyTotals.reduce((sum, item) => sum + item.annual_cost_usd, 0),
      capacity_mw: technologyTotals.reduce((sum, item) => sum + item.capacity_mw, 0),
      generation_mwh: technologyTotals.reduce((sum, item) => sum + item.generation_mwh, 0),
      technology_totals: technologyTotals,
      impact_types: [...impactTypes],
      impacts_by_taxon: taxonTotals,
      impacts_by_threat: threatTotals
    };
  }

  async function request(url, options = {}) {
    const parsed = new URL(url, window.location.href);
    switch (parsed.pathname) {
      case '/api/config': return CONFIG;
      case '/api/layer': return layer(parsed.searchParams);
      case '/api/cell': return cell(parsed.searchParams);
      case '/api/summary': {
        if (options.method?.toUpperCase() !== 'POST') throw new Error('Area summary requires POST.');
        return summary(JSON.parse(options.body || '{}'));
      }
      default: throw new Error(`Unknown local data request: ${parsed.pathname}`);
    }
  }

  window.BWEStatic = Object.freeze({ request, ready: loadCore });
})();
