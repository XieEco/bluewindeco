/* Browser-side Excel export for the static GitHub Pages edition of BlueWindEco.
   The workbook has the same columns and values as the former /api/export route.
   ZIP entries are stored (not deflated) to avoid any runtime library or server. */
(() => {
  'use strict';

  const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const encoder = new TextEncoder();
  const impactNames = ['Positive', 'Negative_Trait', 'Negative_Behaviour', 'Negative_General'];
  const taxa = ['BirdsBats', 'Fish', 'MarineMammals', 'Benthic', 'Plankton'];
  const threats = ['CR', 'EN', 'VU', 'NT_LC_NE'];

  function headers() {
    const columns = [
      'Sequence', 'Selection time', 'Mode', 'Selection', 'TechnologyCode',
      'West_deg', 'East_deg', 'South_deg', 'North_deg'
    ];
    for (let code = 1; code <= 6; code++) {
      columns.push(
        `JSZH${code}_AnnualCost_USD_yr`,
        `JSZH${code}_Capacity_MW`,
        `JSZH${code}_Generation_MWh_yr`
      );
    }
    columns.push('SelectedCells');
    for (const taxon of taxa) for (const impact of impactNames) columns.push(`${taxon}_${impact}`);
    for (const threat of threats) for (const impact of impactNames) columns.push(`${threat}_${impact}`);
    return columns;
  }

  function safeNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || !(number > -1e18 && number < 1e18)) {
      throw new Error('Export contains an invalid number');
    }
    return number;
  }

  function safeInteger(value) {
    const number = safeNumber(value);
    if (!Number.isInteger(number)) throw new Error('Export contains an invalid integer');
    return number;
  }

  function safeText(value) {
    const text = String(value || '').slice(0, 160);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }

  function recordRow(record) {
    const taxonValues = record.impacts_by_taxon || [];
    const threatValues = record.impacts_by_threat || [];
    if (taxonValues.length !== 5 || threatValues.length !== 4 ||
        [...taxonValues, ...threatValues].some(group => !Array.isArray(group) || group.length !== 4)) {
      throw new Error('Impact totals are incomplete in a comparison record');
    }
    const technologyTotals = record.technology_totals;
    if (technologyTotals != null &&
        (!Array.isArray(technologyTotals) || technologyTotals.length !== 6 ||
         technologyTotals.some((totals, index) => !totals || Number(totals.technology_code) !== index + 1))) {
      throw new Error('Technology totals are incomplete in a comparison record');
    }
    const row = [
      safeInteger(record.sequence),
      safeText(record.selection_time_local || record.timestamp_bj || ''),
      safeText(record.mode),
      safeText(record.selection),
      record.technology_code ? safeInteger(record.technology_code) : null,
      ...['west', 'east', 'south', 'north'].map(key => safeNumber(record[key]))
    ];
    if (technologyTotals == null) {
      row.push(...Array(18).fill(null));
    } else {
      for (const totals of technologyTotals) {
        row.push(...['annual_cost_usd', 'capacity_mw', 'generation_mwh'].map(key => safeNumber(totals[key])));
      }
    }
    row.push(safeInteger(record.cell_count ?? 0));
    for (const group of taxonValues) for (const value of group) row.push(safeNumber(value));
    for (const group of threatValues) for (const value of group) row.push(safeNumber(value));
    return row;
  }

  function xmlText(value) {
    return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function columnName(index) {
    let name = '';
    for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
      name = String.fromCharCode(65 + (value - 1) % 26) + name;
    }
    return name;
  }

  function worksheetXml(records) {
    const header = headers();
    const rowCount = records.length + 1;
    const lastColumn = columnName(header.length - 1);
    const rows = [];
    const encodeRow = (values, rowNumber, style) => {
      const cells = [];
      for (let index = 0; index < values.length; index++) {
        const value = values[index];
        if (value === null || value === undefined) continue;
        const ref = `${columnName(index)}${rowNumber}`;
        const styleAttr = style ? ' s="1"' : '';
        if (typeof value === 'number') {
          cells.push(`<c r="${ref}"${styleAttr}><v>${value}</v></c>`);
        } else {
          cells.push(`<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`);
        }
      }
      return `<row r="${rowNumber}"${style ? ' ht="32" customHeight="1"' : ''}>${cells.join('')}</row>`;
    };
    rows.push(encodeRow(header, 1, true));
    records.forEach((record, index) => rows.push(encodeRow(recordRow(record), index + 2, false)));
    const columns = header.map((_, index) => {
      const number = index + 1;
      return `<col min="${number}" max="${number}" width="${number === 2 || number === 4 ? 31 : 18}" customWidth="1"/>`;
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<dimension ref="A1:${lastColumn}${rowCount}"/>` +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      `<cols>${columns}</cols><sheetData>${rows.join('')}</sheetData>` +
      `<autoFilter ref="A1:${lastColumn}${rowCount}"/>` +
      '</worksheet>';
  }

  function stylesheetXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF103047"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';
  }

  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';
  const packageRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
  const workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="Comparison" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index++) {
      let value = index;
      for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      table[index] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zipEntries(entries) {
    const local = [];
    const central = [];
    let localLength = 0;
    const now = new Date();
    const year = Math.max(1980, Math.min(2107, now.getFullYear()));
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const [path, value] of entries) {
      const name = encoder.encode(path);
      const data = encoder.encode(value);
      const crc = crc32(data);
      const localHeader = new Uint8Array(30 + name.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true);
      localHeader.set(name, 30);
      const centralHeader = new Uint8Array(46 + name.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true);
      cv.setUint32(42, localLength, true);
      centralHeader.set(name, 46);
      local.push(localHeader, data);
      central.push(centralHeader);
      localLength += localHeader.length + data.length;
    }
    const centralLength = central.reduce((total, item) => total + item.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralLength, true);
    ev.setUint32(16, localLength, true);
    return new Blob([...local, ...central, end], { type: MIME });
  }

  window.BWEStaticExport = async function exportComparisons(records) {
    if (!Array.isArray(records) || records.length > 500) {
      throw new Error('Export supports at most 500 comparison records');
    }
    return zipEntries([
      ['[Content_Types].xml', contentTypes],
      ['_rels/.rels', packageRels],
      ['xl/workbook.xml', workbookXml],
      ['xl/_rels/workbook.xml.rels', workbookRels],
      ['xl/worksheets/sheet1.xml', worksheetXml(records)],
      ['xl/styles.xml', stylesheetXml()]
    ]);
  };
})();
