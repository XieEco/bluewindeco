rootDir = fileparts(mfilename('fullpath'));
outputFile = fullfile(rootDir, 'Source data_Run.xlsx');

source = matfile(fullfile(rootDir, 'SHURUSHUJU.mat'));

baseMatrix = source.base_matrix;
gridSize = size(baseMatrix);

foundation = [1 1 2 2 3 3];
transmission = [4 5 4 5 4 5];
costGrid = inf(numel(baseMatrix), 6);
capacityGrid = zeros(numel(baseMatrix), 6);
for technology = 1:6
    cost = double(source.(sprintf('Cost_JSZH%d', technology)));
    capacity = double(source.(sprintf('Capacity_JSZH%d', technology)));
    feasible = isfinite(baseMatrix) & isfinite(cost) & cost > 0 & isfinite(capacity) & capacity > 0;
    costGrid(feasible(:), technology) = cost(feasible);
    capacityGrid(feasible(:), technology) = capacity(feasible);
end
[minimumCost, minimumTechnology] = min(costGrid, [], 2);
validLinear = find(isfinite(minimumCost));
numberOfSites = numel(validLinear);

costAtSite = costGrid(validLinear, :);
capacityAtSite = capacityGrid(validLinear, :);
minimumTechnology = minimumTechnology(validLinear);
clear costGrid capacityGrid baseMatrix cost capacity feasible minimumCost;
[gridRow, gridColumn] = ind2sub(gridSize, validLinear);
longitude = -180 + (gridColumn - 1) * 0.25;
latitude = 90 - (gridRow - 1) * 0.25;

impactNames = who(source, 'FIG_*');
impactCodes = zeros(numel(impactNames), 4);
impactValues = cell(numel(impactNames), 1);
positiveByComponent = zeros(numberOfSites, 5);
negativeByComponent = zeros(numberOfSites, 5);
for layerIndex = 1:numel(impactNames)
    layerName = impactNames{layerIndex};
    codes = str2double(regexp(layerName, '^FIG_\d+_WZ_(\d+)_B_(\d+)_JS_(\d+)_YX_(\d+)$', 'tokens', 'once'));
    impactCodes(layerIndex, :) = codes;
    layer = double(source.(layerName));
    values = layer(validLinear);
    values(~isfinite(values) | values < 0) = 0;
    impactValues{layerIndex} = sparse(values);
    component = codes(3);
    if codes(4) == 1
        positiveByComponent(:, component) = positiveByComponent(:, component) + values;
    else
        negativeByComponent(:, component) = negativeByComponent(:, component) + values;
    end
end
clear layer values;
positiveAtSite = positiveByComponent(:, foundation) + positiveByComponent(:, transmission);
negativeAtSite = negativeByComponent(:, foundation) + negativeByComponent(:, transmission);
siteRows = (1:numberOfSites)';
baselineIndex = sub2ind(size(costAtSite), siteRows, minimumTechnology);
baselinePositive = positiveAtSite(baselineIndex);
baselineNegative = negativeAtSite(baselineIndex);
baselineCapacity = capacityAtSite(baselineIndex);
negativeAtSite(~isfinite(costAtSite)) = Inf;
positiveAtSite(~isfinite(costAtSite)) = -Inf;
leastHarm = negativeAtSite == min(negativeAtSite, [], 2);
benefitAtLeastHarm = positiveAtSite;
benefitAtLeastHarm(~leastHarm) = -Inf;
minimumHarmTechnology = cheapestTechnology(costAtSite, leastHarm);
tier3 = cheapestTechnology(costAtSite, benefitAtLeastHarm == max(benefitAtLeastHarm, [], 2));
tier4 = cheapestTechnology(costAtSite, positiveAtSite == max(positiveAtSite, [], 2));

tier1 = minimumTechnology;
tier2 = minimumTechnology;
negativeOnly = baselineNegative > 0 & baselinePositive == 0;
hasNegative = baselineNegative > 0;
tier1(negativeOnly) = minimumHarmTechnology(negativeOnly);
tier2(hasNegative) = minimumHarmTechnology(hasNegative);
tier3(~hasNegative) = minimumTechnology(~hasNegative);
technologyAtSite = [minimumTechnology, tier1, tier2, tier3, tier4];
scenarioIndex = sub2ind(size(costAtSite), repmat(siteRows, 1, 5), technologyAtSite);
LCOE = costAtSite(scenarioIndex);
capacityByScenario = capacityAtSite(scenarioIndex);

realmAtSite = getMEOWRealms(source.meowGeoJSON, latitude, longitude);
realmNames = ["Arctic"; "Central Indo-Pacific"; "Eastern Indo-Pacific"; "Southern Ocean"; ...
    "Temperate Australasia"; "Temperate Northern Atlantic"; "Temperate Northern Pacific"; ...
    "Temperate South America"; "Temperate Southern Africa"; "Tropical Atlantic"; ...
    "Tropical Eastern Pacific"; "Western Indo-Pacific"];
[~, realmCode] = ismember(realmAtSite, realmNames);

positiveByGroup = zeros(numberOfSites, 5, 5);
negativeByGroup = zeros(numberOfSites, 5, 5);
positiveByThreat = zeros(numberOfSites, 4, 5);
negativeByThreat = zeros(numberOfSites, 4, 5);
baselineByThreatImpact = zeros(numberOfSites, 4, 4);
CumulativeAffectedSpeciesRichness = zeros(5, 4, 4);
ThreatenedNegativeAtSite = zeros(numberOfSites, 1);
ImpactByGroupThreatTech = zeros(15, 6);
RealmSpeciesTotals = zeros(12, 5);
selectedFoundation = reshape(foundation(technologyAtSite), size(technologyAtSite));
selectedTransmission = reshape(transmission(technologyAtSite), size(technologyAtSite));
for layerIndex = 1:numel(impactNames)
    group = impactCodes(layerIndex, 1);
    threat = impactCodes(layerIndex, 2);
    component = impactCodes(layerIndex, 3);
    impact = impactCodes(layerIndex, 4);
    [sites, ~, values] = find(impactValues{layerIndex});
    for scenario = 1:5
        selected = selectedFoundation(sites, scenario) == component | selectedTransmission(sites, scenario) == component;
        matchedSites = sites(selected);
        matchedValues = values(selected);
        if impact == 1
            positiveByGroup(matchedSites, group, scenario) = positiveByGroup(matchedSites, group, scenario) + matchedValues;
            positiveByThreat(matchedSites, threat, scenario) = positiveByThreat(matchedSites, threat, scenario) + matchedValues;
        else
            negativeByGroup(matchedSites, group, scenario) = negativeByGroup(matchedSites, group, scenario) + matchedValues;
            negativeByThreat(matchedSites, threat, scenario) = negativeByThreat(matchedSites, threat, scenario) + matchedValues;
        end
        if scenario == 1
            baselineByThreatImpact(matchedSites, threat, impact) = baselineByThreatImpact(matchedSites, threat, impact) + matchedValues;
            CumulativeAffectedSpeciesRichness(group, threat, impact) = CumulativeAffectedSpeciesRichness(group, threat, impact) + sum(matchedValues);
            if impact > 1 && threat <= 3
                ThreatenedNegativeAtSite(matchedSites) = ThreatenedNegativeAtSite(matchedSites) + matchedValues;
                byTechnology = accumarray(minimumTechnology(matchedSites), matchedValues, [6 1]);
                row = (group - 1) * 3 + threat;
                ImpactByGroupThreatTech(row, :) = ImpactByGroupThreatTech(row, :) + byTechnology';
                RealmSpeciesTotals(:, group) = RealmSpeciesTotals(:, group) + accumarray(realmCode(matchedSites), matchedValues, [12 1]);
            end
        end
    end
end
clear impactValues;
capacityByTechnologyGW = accumarray(minimumTechnology, baselineCapacity, [6 1]) / 1e3;
impactCategory = 1 + double(baselinePositive > 0) + 2 * double(baselineNegative > 0);
capacityByImpactTW = accumarray(impactCategory, baselineCapacity, [4 1]) / 1e6;

positiveCapacityTW = zeros(5, 6);
negativeCapacityTW = zeros(5, 6);
for group = 1:5
    p = positiveByGroup(:, group, 1) > 0;
    n = negativeByGroup(:, group, 1) > 0;
    positiveCapacityTW(group, :) = accumarray(minimumTechnology(p), baselineCapacity(p), [6 1])' / 1e6;
    negativeCapacityTW(group, :) = accumarray(minimumTechnology(n), baselineCapacity(n), [6 1])' / 1e6;
end
capacityByThreatImpactTW = zeros(4, 4);
for threat = 1:4
    for impact = 1:4
        capacityByThreatImpactTW(threat, impact) = sum(baselineCapacity(baselineByThreatImpact(:, threat, impact) > 0)) / 1e6;
    end
end

capacityFactorGrid = source.capacityFactorGrid;
capacityFactorAtSites = capacityFactorGrid(validLinear);
annualCostUSD = capacityByScenario .* capacityFactorAtSites .* 8760 .* LCOE;

transitionCodePairs = [
    1 2;
    1 5;
    1 6;
    2 1;
    2 5;
    2 6;
    3 4;
    3 5;
    3 6;
    4 5;
    4 6;
    5 1;
    5 3;
    5 4;
    5 6;
    6 2;
    6 4;
    6 5
];
transitionCapacityGW = zeros(12, 72);
transitionGridData = cell(1, 4);
for tier = 1:4
    selectedTechnology = technologyAtSite(:, tier + 1);
    changed = selectedTechnology ~= minimumTechnology;
    [~, code] = ismember([minimumTechnology(changed), selectedTechnology(changed)], transitionCodePairs, 'rows');

    transitionGridData{tier} = [longitude(changed), latitude(changed), code];
    changedCapacity = capacityByScenario(changed, tier + 1);
    capacityByRealmAndTransition = accumarray([realmCode(changed), code], changedCapacity, [12 18]) / 1000;
    transitionCapacityGW(:, (tier - 1) * 18 + (1:18)) = capacityByRealmAndTransition;

end

[~, rowOrder] = sortrows([gridRow, gridColumn]);
figure1Locations = [longitude(rowOrder), latitude(rowOrder), minimumTechnology(rowOrder)];
figure1GroupRichness = reshape(sum(CumulativeAffectedSpeciesRichness, 2), 5, 4)' / 1e5;
figure1ThreatRichness = reshape(sum(CumulativeAffectedSpeciesRichness, 1), 4, 4) / 1e4;
figure1GroupCapacity = zeros(10, 6);
figure1GroupCapacity(1:2:end, :) = positiveCapacityTW(5:-1:1, :);
figure1GroupCapacity(2:2:end, :) = negativeCapacityTW(5:-1:1, :);
figure3Selected = find(ThreatenedNegativeAtSite > 0);
[~, localOrder] = sortrows([gridColumn(figure3Selected), -gridRow(figure3Selected)]);
figure3Selected = figure3Selected(localOrder);
figure3Locations = [longitude(figure3Selected), latitude(figure3Selected), ThreatenedNegativeAtSite(figure3Selected)];
figure3Realm = [RealmSpeciesTotals, sum(RealmSpeciesTotals, 2)];
figure4Cost = (sum(annualCostUSD(:, 2:5), 1) - sum(annualCostUSD(:, 1), 1))' / 1e11;
positiveGroupChange = reshape(sum(positiveByGroup(:, :, 2:5) - positiveByGroup(:, :, 1), 1), [], 1);
negativeGroupChange = reshape(sum(negativeByGroup(:, :, 2:5) - negativeByGroup(:, :, 1), 1), [], 1);
figure4Group = [positiveGroupChange, negativeGroupChange] / 1e4;
positiveThreatChange = reshape(sum(positiveByThreat(:, 1:3, 2:5) - positiveByThreat(:, 1:3, 1), 1), [], 1);
negativeThreatChange = reshape(sum(negativeByThreat(:, 1:3, 2:5) - negativeByThreat(:, 1:3, 1), 1), [], 1);
figure4Threat = [positiveThreatChange, negativeThreatChange] / 1e3;
writeSourceWorkbook(outputFile, realmNames, transitionCodePairs, ...
    {3, 1, figure1Locations, [9 9 13]; 3, 9, capacityByTechnologyGW, 9; ...
    4, 12, figure1GroupRichness, 9; 4, 19, figure1ThreatRichness(3:-1:1, :), 9; ...
    3, 25, capacityByImpactTW, 9; 4, 29, figure1GroupCapacity, 9; 4, 37, capacityByThreatImpactTW(1:3, :), 9}, ...
    {3, 1, [longitude, latitude], 9; 3, 3, realmAtSite, 13; ...
    3, 4, [baselinePositive, baselineNegative], [13 2]}, ...
    {3, 1, figure3Locations, 12; 4, 7, ImpactByGroupThreatTech, 2; 4, 15, figure3Realm, 2}, ...
    {3, 2, figure4Cost, 9; 4, 6, figure4Group, 9; 4, 11, figure4Threat, 9}, ...
    {3, 1, transitionGridData{1}, 1; 3, 5, transitionGridData{2}, 1; 3, 9, transitionGridData{3}, 1; ...
    3, 13, transitionGridData{4}, 1; 5, 21, transitionCapacityGW, 8});

function technology = cheapestTechnology(cost, candidates)
cost(~candidates) = Inf;
[~, technology] = min(cost, [], 2);
end

function realm = getMEOWRealms(meowGeoJSON, latitude, longitude)
boundaryFile = [tempname, '.geojson'];
cleanup = onCleanup(@() deleteFileIfPresent(boundaryFile));
writeBundledFile(boundaryFile, meowGeoJSON);
boundaries = readgeotable(boundaryFile);
clear cleanup;
variableNames = boundaries.Properties.VariableNames;
names = string(boundaries.(variableNames{find(strcmpi(variableNames, 'REALM'), 1)}));
vertices = geotable2table(boundaries, ["Latitude" "Longitude"]);
realm = classifyMEOWPoints(latitude, longitude, boundaries.Shape, names);
realm = assignNearestMEOWRealm(latitude, longitude, realm, vertices.Latitude, vertices.Longitude, names);
caspian = inpolygon(longitude, latitude, [46.50 54.25 54.25 46.50], [36.50 36.50 47 47]);
realm(caspian) = "Temperate Northern Atlantic";
end

function realm = classifyMEOWPoints(latitude, longitude, shapes, names)
realm = strings(numel(latitude), 1);
crs = geocrs(4326);
batchSize = 5000;
for first = 1:batchSize:numel(latitude)
    pending = (first:min(first + batchSize - 1, numel(latitude)))';
    for shape = 1:numel(shapes)
        if isempty(pending)
            break;
        end
        points = geopointshape(latitude(pending), longitude(pending));
        points.GeographicCRS = crs;
        inside = isinterior(shapes(shape), points);
        realm(pending(inside)) = names(shape);
        pending(inside) = [];
    end
end
end

function realm = assignNearestMEOWRealm(latitude, longitude, realm, boundaryLatitude, boundaryLongitude, names)
    outsideIndex = find(realm == "");
    for k = 1:numel(outsideIndex)
        p = outsideIndex(k);
        queryLat = latitude(p);
        queryLon = longitude(p);
        minimumDistance = Inf;
        nearestRealm = "";

        for shapeIndex = 1:numel(names)
            latVector = double(boundaryLatitude{shapeIndex}(:));
            lonVector = double(boundaryLongitude{shapeIndex}(:));
            valid = isfinite(latVector) & isfinite(lonVector);
            validIndex = find(valid);
            if numel(validIndex) < 2
                continue;
            end

            groupBreaks = [0; find(diff(validIndex) > 1); numel(validIndex)];
            for groupIndex = 1:numel(groupBreaks)-1
                firstValid = groupBreaks(groupIndex) + 1;
                lastValid = groupBreaks(groupIndex + 1);
                pointIndex = validIndex(firstValid:lastValid);
                if numel(pointIndex) < 2
                    continue;
                end

                ringLat = latVector(pointIndex);
                ringLon = rad2deg(unwrap(deg2rad(lonVector(pointIndex))));
                ringLon = ringLon + 360 .* round( ...
                    (queryLon - mean(ringLon)) ./ 360);
                if ringLat(1) ~= ringLat(end) || ringLon(1) ~= ringLon(end)
                    ringLat(end+1,1) = ringLat(1);
                    ringLon(end+1,1) = ringLon(1);
                end

                x = (ringLon - queryLon) .* cosd(queryLat);
                y = ringLat - queryLat;
                x1 = x(1:end-1);
                y1 = y(1:end-1);
                dx = x(2:end) - x1;
                dy = y(2:end) - y1;
                denominator = dx.^2 + dy.^2;
                t = zeros(size(denominator));
                nonzero = denominator > 0;
                t(nonzero) = -(x1(nonzero).*dx(nonzero) + ...
                    y1(nonzero).*dy(nonzero)) ./ denominator(nonzero);
                t = max(0,min(1,t));
                nearestX = x1 + t.*dx;
                nearestY = y1 + t.*dy;
                currentDistance = min(nearestX.^2 + nearestY.^2);

                if currentDistance < minimumDistance
                    minimumDistance = currentDistance;
                    nearestRealm = names(shapeIndex);
                end
            end
        end

        realm(p) = nearestRealm;
    end
end

function writeSourceWorkbook(outputFile, realmNames, transitionPairs, varargin)
    stage = tempname;
    mkdir(stage);
    cleanup = onCleanup(@() rmdir(stage, 's'));
    mkdir(fullfile(stage, '_rels'));
    mkdir(fullfile(stage, 'xl', '_rels'));
    mkdir(fullfile(stage, 'xl', 'worksheets'));
    declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    spreadsheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    relationshipsNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    packageRelationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
    contentTypeNamespace = 'http://schemas.openxmlformats.org/package/2006/content-types';
    contentTypes = [declaration, '<Types xmlns="', contentTypeNamespace, '">', ...
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>', ...
        '<Default Extension="xml" ContentType="application/xml"/>', ...
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>', ...
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'];
    workbook = [declaration, '<workbook xmlns="', spreadsheetNamespace, '" xmlns:r="', relationshipsNamespace, ...
        '"><bookViews><workbookView activeTab="2"/></bookViews><sheets>'];
    workbookRelationships = [declaration, '<Relationships xmlns="', packageRelationships, '">', ...
        '<Relationship Id="styles" Type="', relationshipsNamespace, '/styles" Target="styles.xml"/>'];
    packageRoot = [declaration, '<Relationships xmlns="', packageRelationships, '">', ...
        '<Relationship Id="workbook" Type="', relationshipsNamespace, '/officeDocument" Target="xl/workbook.xml"/></Relationships>'];
    files = {'[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml'};
    for sheet = 1:numel(varargin)
        sheetPath = sprintf('worksheets/sheet%d.xml', sheet);
        files{end + 1} = ['xl/', sheetPath];
        contentTypes = [contentTypes, sprintf(['<Override PartName="/xl/%s" ContentType="', ...
            'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'], sheetPath)];
        workbook = [workbook, sprintf('<sheet name="Fig.%d" sheetId="%d" r:id="sheet%d"/>', sheet, sheet, sheet)];
        workbookRelationships = [workbookRelationships, sprintf( ...
            '<Relationship Id="sheet%d" Type="%s/worksheet" Target="%s"/>', sheet, relationshipsNamespace, sheetPath)];
        writeSheet(fullfile(stage, files{end}), sheet, varargin{sheet}, realmNames, transitionPairs, declaration, spreadsheetNamespace);
    end
    writeXmlFile(fullfile(stage, files{1}), [contentTypes, '</Types>']);
    writeXmlFile(fullfile(stage, files{2}), packageRoot);
    writeXmlFile(fullfile(stage, files{3}), [workbook, '</sheets></workbook>']);
    writeXmlFile(fullfile(stage, files{4}), [workbookRelationships, '</Relationships>']);
    writeXmlFile(fullfile(stage, files{5}), [declaration, workbookStyles(spreadsheetNamespace)]);
    archive = [tempname(fileparts(outputFile)), '.zip'];
    archiveCleanup = onCleanup(@() deleteFileIfPresent(archive));
    zip(archive, files, stage);
    movefile(archive, outputFile, 'f');

end

function writeSheet(path, sheet, blocks, realmNames, transitionPairs, declaration, spreadsheetNamespace)
    [headers, columns, merges, rowLayout, viewLayout, outlineLevel] = workbookLayout(sheet, realmNames, transitionPairs);
    [headerRows, headerColumns] = cellCoordinates(headers(:, 1));
    maxRow = max(headerRows);
    maxColumn = max(headerColumns);
    for k = 1:size(blocks, 1)
        maxRow = max(maxRow, blocks{k, 1} + size(blocks{k, 3}, 1) - 1);
        maxColumn = max(maxColumn, blocks{k, 2} + size(blocks{k, 3}, 2) - 1);
    end
    if sheet == 3
        maxRow = max(maxRow, 70090);
    end
    colNames = strings(1, maxColumn);
    for col = 1:maxColumn
        colNames(col) = excelColumnName(col);
    end
    file = fopen(path, 'w', 'n', 'UTF-8');
    closeFile = onCleanup(@() fclose(file));
    fprintf(file, '%s<worksheet xmlns="%s"><sheetPr/><dimension ref="A1:%s%d"/>', ...
        declaration, spreadsheetNamespace, char(colNames(end)), maxRow);
    fprintf(file, '<sheetViews><sheetView workbookViewId="0"');
    if viewLayout{4} == 1
        fprintf(file, ' tabSelected="1"');
    end
    if ~isempty(viewLayout{1})
        fprintf(file, ' topLeftCell="%s"', viewLayout{1});
    end
    fprintf(file, '><selection activeCell="%s" sqref="%s"/></sheetView></sheetViews>', viewLayout{2}, viewLayout{3});
    fprintf(file, '<sheetFormatPr defaultColWidth="9.23076923076923" defaultRowHeight="16.8"');
    if outlineLevel > 0
        fprintf(file, ' outlineLevelCol="%d"', outlineLevel);
    end
    fprintf(file, '/><cols>');
    for k = 1:size(columns, 1)
        fprintf(file, '<col min="%d" max="%d" width="%.15g" style="%d"', columns(k, 1:4));
        if columns(k, 5) == 1
            fprintf(file, ' customWidth="1"');
        end
        if columns(k, 6) > 0
            fprintf(file, ' outlineLevel="%d"', columns(k, 6));
        end
        fprintf(file, '/>');
    end
    fprintf(file, '</cols><sheetData>');
    for firstRow = 1:2500:maxRow
        lastRow = min(firstRow + 2499, maxRow);
        rows = (firstRow:lastRow)';
        cells = strings(numel(rows), maxColumn);
        for k = 1:size(blocks, 1)
            top = blocks{k, 1};
            left = blocks{k, 2};
            values = blocks{k, 3};
            style = blocks{k, 4};
            selected = rows >= top & rows < top + size(values, 1);
            if ~any(selected)
                continue;
            end
            indices = rows(selected) - top + 1;
            for j = 1:size(values, 2)
                column = left + j - 1;
                address = colNames(column) + string(rows(selected));
                value = values(indices, j);
                cellStyle = repmat(style(min(j, numel(style))), numel(value), 1);
                if sheet == 2 && column == 1
                    cellStyle(value ~= fix(value) & rows(selected) >= 37832) = 16;
                elseif sheet == 2 && column == 2
                    cellStyle(value ~= fix(value) & value > 0) = 16;
                end
                cells(selected, column) = cellXml(address, value, cellStyle);
            end
        end
        if sheet == 3
            styledEmpty = rows >= 3 + size(blocks{1, 3}, 1);
            for column = 1:3
                cells(styledEmpty, column) = '<c r="' + colNames(column) + string(rows(styledEmpty)) + '" s="12"/>';
            end
        end
        indices = find(headerRows >= firstRow & headerRows <= lastRow);
        for k = indices'
            row = headerRows(k) - firstRow + 1;
            cells(row, headerColumns(k)) = cellXml(string(headers{k, 1}), headers{k, 2}, headers{k, 3});
        end
        rowAttributes = ' r="' + string(rows) + '"';
        for k = 1:size(rowLayout, 1)
            selected = rows == rowLayout(k, 1);
            rowAttributes(selected) = rowAttributes(selected) + ' ht="' + string(rowLayout(k, 2)) + '"';
            if rowLayout(k, 3) >= 0
                rowAttributes(selected) = rowAttributes(selected) + ' s="' + string(rowLayout(k, 3)) + '" customFormat="1"';
            end
        end
        xml = '<row' + rowAttributes + '>' + join(cells, '', 2) + '</row>';
        fprintf(file, '%s', char(join(xml, '')));
    end
    fprintf(file, '</sheetData>');
    if ~isempty(merges)
        fprintf(file, '<mergeCells count="%d">', numel(merges));
        fprintf(file, '<mergeCell ref="%s"/>', merges{:});
        fprintf(file, '</mergeCells>');
    end
    fprintf(file, '<pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/></worksheet>');
end

function xml = cellXml(address, value, style)
    startTag = '<c r="' + address + '" s="' + string(style) + '"';
    if isnumeric(value)

        xml = startTag + '><v>' + compose('%.17g', value) + '</v></c>';
    elseif isempty(value)
        xml = startTag + '/>';
    elseif ischar(value) && any(strcmp(value, {'Affected species richness (105)', 'Affected species richness (104)'}))
        properties = '<sz val="11"/><color rgb="FF000000"/><rFont val="Arial Regular"/><charset val="134"/>';
        xml = startTag + ' t="inlineStr"><is><r><rPr>' + string(properties) + '</rPr><t>' + ...
            string(value(1:end-2)) + '</t></r><r><rPr><vertAlign val="superscript"/>' + string(properties) + ...
            '</rPr><t>' + string(value(end-1)) + '</t></r><r><rPr>' + string(properties) + ...
            '</rPr><t>)</t></r></is></c>';
    else
        xml = startTag + ' t="inlineStr"><is><t xml:space="preserve">' + escapeXml(value) + '</t></is></c>';
    end
end

function escaped = escapeXml(value)
    escaped = replace(string(value), '&', '&amp;');
    escaped = replace(escaped, '<', '&lt;');
    escaped = replace(escaped, '>', '&gt;');
end

function [rows, columns] = cellCoordinates(addresses)
    rows = zeros(numel(addresses), 1);
    columns = zeros(numel(addresses), 1);
    for k = 1:numel(addresses)
        parts = regexp(addresses{k}, '^([A-Z]+)([0-9]+)$', 'tokens', 'once');
        rows(k) = str2double(parts{2});
        for letter = parts{1}
            columns(k) = columns(k) * 26 + double(letter) - double('A') + 1;
        end
    end
end

function name = excelColumnName(column)
    name = '';
    while column > 0
        letter = mod(column - 1, 26);
        name = [char(double('A') + letter), name];
        column = floor((column - 1) / 26);
    end
end

function xml = workbookStyles(spreadsheetNamespace)
    xml = ['<styleSheet xmlns="', spreadsheetNamespace, '">', ...
        '<numFmts count="2"><numFmt numFmtId="176" formatCode="0_ "/>', ...
        '<numFmt numFmtId="177" formatCode="0.00_ "/></numFmts>', ...
        '<fonts count="4">', ...
        '<font><sz val="11"/><color rgb="FF000000"/><name val="宋体"/><charset val="134"/></font>', ...
        '<font><sz val="11"/><name val="Arial Regular"/><charset val="134"/></font>', ...
        '<font><sz val="11"/><color rgb="FF000000"/><name val="Arial Regular"/><charset val="134"/></font>', ...
        '<font><sz val="11"/><name val="Calibri"/><charset val="134"/></font></fonts>', ...
        '<fills count="5"><fill><patternFill patternType="none"/></fill>', ...
        '<fill><patternFill patternType="gray125"/></fill>'];
    for colour = ["FFFEE695", "FFD9D9D9", "FFD9D9D9"]
        xml = [xml, '<fill><patternFill patternType="solid"><fgColor rgb="', char(colour), ...
            '"/><bgColor indexed="64"/></patternFill></fill>'];
    end
    xml = [xml, '</fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>', ...
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>', ...
        '<cellXfs count="17">'];
    formats = [
          0 0 0 0 1 0;
          0 1 0 1 1 0;
          0 2 0 1 1 0;
          0 2 2 1 1 0;
          0 1 3 1 1 0;
          0 2 3 1 1 0;
          0 3 3 1 1 0;
          0 3 0 1 1 0;
        176 3 0 1 1 0;
        177 2 0 1 1 0;
          0 1 3 1 1 1;
        176 2 4 1 1 0;
          0 1 0 1 0 0;
        176 2 0 1 1 0;
        177 2 4 1 1 0;
          0 2 4 1 1 0;
          0 2 0 1 1 0
    ];
    for k = 1:size(formats, 1)
        xml = [xml, sprintf(['<xf numFmtId="%d" fontId="%d" fillId="%d" borderId="0" xfId="0" ', ...
            'applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment'], formats(k, 1:3))];
        if formats(k, 4)
            xml = [xml, ' horizontal="left"'];
        end
        if formats(k, 5)
            xml = [xml, ' vertical="center"'];
        end
        if formats(k, 6)
            xml = [xml, ' wrapText="1"'];
        end
        xml = [xml, '/></xf>'];
    end
    xml = [xml, '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'];
end

function writeXmlFile(path, xml)
    file = fopen(path, 'w', 'n', 'UTF-8');
    closeFile = onCleanup(@() fclose(file));
    fprintf(file, '%s', xml);
end

function [headers, columnLayout, mergedRanges, rowLayout, viewLayout, columnOutlineLevel] = workbookLayout(sheet, realmNames, transitionPairs)
    rowLayout = zeros(0, 3);
    columnOutlineLevel = 0;
    technologies = ["Monopile + DC"; "Monopile + AC"; "Jacket + DC"; "Jacket + AC"; "Floating + DC"; "Floating + AC"];
    groups = ["Birds and bats"; "Fish"; "Marine mammals"; "Benthic invertebrates"; "Plankton organisms"];
    threats = ["Critically Endangered"; "Endangered"; "Vulnerable"];
    impacts = ["Positive impact"; "Trait impact"; "Behaviour impact"; "General impact"];
    solutions = ["Minimize harm at negative-only sites"; "Minimize harm at all negative sites"; ...
        "Minimize harm at all negative sites, then maximize positive-impact"; ...
        "Maximize positive-impact at all sites, regardless of harm"];
    switch sheet
        case 1
            headers = {
                'A1', 'a', 3;
                'K1', 'b', 3;
                'R1', 'c', 3;
                'X1', 'd', 3;
                'AA1', 'e', 3;
                'AJ1', 'f', 3;
                'A2', 'Longitude', 14;
                'B2', 'Latitude', 14;
                'C2', 'Technology', 11;
                'D2', '', 2;
                'E2', 'No.', 15;
                'F2', 'Technology', 15;
                'G2', '', 2;
                'H2', 'Technology', 11;
                'I2', 'Potential installed capacity (GW)', 14;
                'K2', 'Impact', 15;
                'L2', 'Affected species richness (105)', 14;
                'M2', '', 14;
                'N2', '', 14;
                'O2', '', 14;
                'P2', '', 14;
                'R2', 'Threat status', 15;
                'S2', 'Affected species richness (104)', 15;
                'T2', '', 15;
                'U2', '', 15;
                'V2', '', 15;
                'X2', 'Impact', 15;
                'Y2', 'Potential installed capacity (TW)', 15;
                'AA2', 'Taxonomic group', 15;
                'AB2', 'Impact', 15;
                'AC2', 'Potential installed capacity (TW)', 15;
                'AD2', '', 15;
                'AE2', '', 15;
                'AF2', '', 15;
                'AG2', '', 15;
                'AH2', '', 15;
                'AJ2', 'Threat status', 15;
                'AK2', 'Potential installed capacity (TW)', 15;
                'AL2', '', 15;
                'AM2', '', 15;
                'AN2', '', 15;
                'K3', '', 15;
                'R3', '', 15;
                'X3', 'No impact', 2;
                'AA3', '', 15;
                'AB3', '', 15;
                'AJ3', '', 15;
                'X4', 'Positive impact only', 2;
                'X5', 'Negative impact only', 2;
                'X6', 'Both positive and negative impact', 2;
            };
            headers = [headers;
                headerCells("E" + string(3:8), num2cell(1:6), 2);
                headerCells("F" + string(3:8), technologies, 2);
                headerCells("H" + string(3:8), technologies, 2);
                headerCells(["L3" "M3" "N3" "O3" "P3"], groups, 15);
                headerCells(["S3" "T3" "U3" "V3"], impacts, 15);
                headerCells(["AC3" "AD3" "AE3" "AF3" "AG3" "AH3"], technologies, 15);
                headerCells(["AK3" "AL3" "AM3" "AN3"], impacts, 15);
                headerCells("K" + string(4:7), impacts, 2);
                headerCells("R" + string(4:6), flipud(threats), 2);
                headerCells("AA" + string(4:2:12), flipud(groups), 2);
                headerCells("AB" + string(4:13), repmat(["Positive impact"; "Negative impact"], 5, 1), 2);
                headerCells("AJ" + string(4:6), threats, 2)];
            columnLayout = [
                1 1 11.6923076923077 9 1 0;
                2 2 9.69230769230769 9 1 0;
                3 3 13.5384615384615 13 1 0;
                4 4 9.23076923076923 2 0 0;
                5 5 5.23076923076923 2 1 0;
                6 6 17 2 1 0;
                7 7 9.23076923076923 2 0 0;
                8 8 17 2 1 0;
                9 9 36.1538461538462 9 1 0;
                10 10 9.23076923076923 2 0 0;
                11 11 19.7692307692308 2 1 0;
                12 12 16.5384615384615 2 1 0;
                13 13 6.76923076923077 2 1 0;
                14 14 19.3846153846154 2 1 0;
                15 15 23.9230769230769 2 1 0;
                16 16 22.3076923076923 2 1 0;
                17 17 9.23076923076923 2 0 0;
                18 18 24.0769230769231 2 1 0;
                19 19 17.2307692307692 2 1 0;
                20 20 13.5384615384615 2 1 0;
                21 21 19.7692307692308 2 1 0;
                22 22 17.3846153846154 2 1 0;
                23 23 9.23076923076923 2 0 0;
                24 24 37.6923076923077 2 1 0;
                25 25 35.7692307692308 2 1 0;
                26 26 9.23076923076923 2 0 0;
                27 27 23.9230769230769 2 1 0;
                28 28 18.3846153846154 2 1 0;
                29 29 17 2 1 0;
                30 30 16.9230769230769 2 1 0;
                31 31 14.1538461538462 2 1 0;
                32 32 14 2 1 0;
                33 33 15.7692307692308 2 1 0;
                34 34 15.6923076923077 2 1 0;
                35 35 9.23076923076923 2 0 0;
                36 36 24.0769230769231 2 1 0;
                37 37 17.2307692307692 2 1 0;
                38 38 13.5384615384615 2 1 0;
                39 39 19.7692307692308 2 1 0;
                40 40 17.3846153846154 2 1 0;
                41 16384 9.23076923076923 2 0 0;
            ];
            mergedRanges = {'L2:P2', 'S2:V2', 'AC2:AH2', 'AK2:AN2', 'K2:K3', 'R2:R3', 'AA2:AA3', 'AA4:AA5', 'AA6:AA7', 'AA8:AA9', 'AA10:AA11', 'AA12:AA13', 'AB2:AB3', 'AJ2:AJ3'};
            rowLayout = [2 17 2];
            viewLayout = {'Z1', 'AJ2', 'AJ2:AJ3', 0};
        case 2
            headers = {
                'A1', 'a & b', 3;
                'B1', '', 9;
                'A2', 'Longitude', 14;
                'B2', 'Latitude', 14;
                'C2', 'Region (MEOW)', 11;
                'D2', 'Positive affected species richness', 11;
                'E2', 'Negative affected species richness', 15;
            };
            columnLayout = [
                1 1 11.6923076923077 2 1 0;
                2 2 9.69230769230769 2 1 0;
                3 3 31.6153846153846 13 1 0;
                4 4 37.6923076923077 13 1 0;
                5 5 38.7692307692308 2 1 0;
                6 16384 9.23076923076923 2 0 0;
            ];
            mergedRanges = {};
            viewLayout = {'', 'D18', 'D18', 0};
            columnOutlineLevel = 4;
        case 3
            headers = {
                'A1', 'a', 3;
                'E1', 'b', 3;
                'N1', 'c', 3;
                'A2', 'Longitude', 4;
                'B2', 'Latitude', 4;
                'C2', 'Cumulative negative endangered species richness per grid cell', 10;
                'E2', 'Taxonomic Group', 5;
                'F2', 'Threat Status', 5;
                'G2', 'Global cumulative negative endangered species richness', 5;
                'H2', '', 5;
                'I2', '', 5;
                'J2', '', 5;
                'K2', '', 5;
                'L2', '', 5;
                'N2', 'Region (MEOW)', 11;
                'O2', 'Cumulative negative endangered species richness', 5;
                'P2', '', 5;
                'Q2', '', 5;
                'R2', '', 5;
                'S2', '', 5;
                'T2', '', 5;
                'E3', '', 5;
                'F3', '', 5;
                'N3', '', 11;
                'T3', 'Total', 5;
            };
            headers = [headers;
                headerCells(["G3" "H3" "I3" "J3" "K3" "L3"], erase(technologies, " "), 5);
                headerCells(["O3" "P3" "Q3" "R3" "S3"], groups, 5);
                headerCells("E" + string(4:3:16), groups, 2);
                headerCells("F" + string(4:18), repmat(threats, 5, 1), 2);
                headerCells("N" + string(4:15), realmNames, 2)];
            columnLayout = [
                1 1 11.6923076923077 2 1 0;
                2 2 9.69230769230769 2 1 0;
                3 3 61.7307692307692 2 1 0;
                4 4 9.23076923076923 2 0 0;
                5 5 23.9230769230769 2 1 0;
                6 6 24.0769230769231 2 1 0;
                7 7 15.6153846153846 2 1 0;
                8 8 15.5384615384615 2 1 0;
                9 9 12.7692307692308 2 1 0;
                10 10 12.6153846153846 2 1 0;
                11 11 14.3846153846154 2 1 0;
                12 12 14.3076923076923 2 1 0;
                13 13 9.23076923076923 2 0 0;
                14 14 31.6153846153846 2 1 0;
                15 15 16.5384615384615 2 1 0;
                16 16 8 2 1 0;
                17 17 19.3846153846154 2 1 0;
                18 18 23.9230769230769 2 1 0;
                19 19 22.3076923076923 2 1 0;
                20 20 8 2 1 0;
                21 16384 9.23076923076923 2 0 0;
            ];
            mergedRanges = {'G2:L2', 'O2:T2', 'E2:E3', 'E4:E6', 'E7:E9', 'E10:E12', 'E13:E15', 'E16:E18', 'F2:F3', 'N2:N3'};
            rowLayout = [2 17 -1];
            viewLayout = {'E1', 'G2', 'G2:L2', 1};
        case 4
            headers = {
                'A1', 'a', 3;
                'D1', 'b', 3;
                'I1', 'c', 3;
                'A2', 'Solutions', 5;
                'B2', 'Cost change compared to baseline (10^11 USD/year)', 5;
                'D2', 'Solutions', 5;
                'E2', 'Taxonomic Group', 5;
                'F2', 'Affected species richness change compared to baseline (10^4)', 5;
                'G2', '', 5;
                'I2', 'Solutions', 5;
                'J2', 'Threat status', 5;
                'K2', 'Affected species richness (10^3)', 5;
                'L2', '', 5;
                'D3', '', 5;
                'E3', '', 5;
                'F3', 'Positive', 5;
                'G3', 'Negative', 5;
                'I3', '', 5;
                'J3', '', 5;
                'K3', 'Positive', 5;
                'L3', 'Negative', 5;
            };
            headers = [headers;
                headerCells("A" + string(3:6), solutions, 2);
                headerCells("D" + string(4:5:19), solutions, 2);
                headerCells("E" + string(4:23), repmat(groups, 4, 1), 2);
                headerCells("I" + string(4:3:13), solutions, 2);
                headerCells("J" + string(4:15), repmat(threats, 4, 1), 2)];
            columnLayout = [
                1 1 72.3076923076923 2 1 0;
                2 2 59 2 1 0;
                3 3 9.23076923076923 2 0 0;
                4 4 72.3076923076923 2 1 0;
                5 5 23.9230769230769 2 1 0;
                6 6 9.46153846153846 2 1 0;
                7 7 53.3557692307692 2 1 0;
                8 8 9.23076923076923 2 0 0;
                9 9 72.3076923076923 2 1 0;
                10 10 24.0769230769231 2 1 0;
                11 11 19.2307692307692 2 1 0;
                12 12 16.6634615384615 2 1 0;
                13 16384 9.23076923076923 2 0 0;
            ];
            mergedRanges = {'F2:G2', 'K2:L2', 'D2:D3', 'D4:D8', 'D9:D13', 'D14:D18', 'D19:D23', 'E2:E3', 'I2:I3', 'I4:I6', 'I7:I9', 'I10:I12', 'I13:I15', 'J2:J3'};
            viewLayout = {'E1', 'K2', 'K2:L2', 0};
        case 5
            headers = {
                'A1', 'a', 3;
                'E1', 'b', 3;
                'I1', 'c', 3;
                'M1', 'd', 3;
                'T1', 'e', 3;
                'A2', 'Longitude', 4;
                'B2', 'Latitude', 4;
                'C2', 'Change', 4;
                'E2', 'Longitude', 4;
                'F2', 'Latitude', 4;
                'G2', 'Change', 4;
                'I2', 'Longitude', 4;
                'J2', 'Latitude', 4;
                'K2', 'Change', 4;
                'M2', 'Longitude', 4;
                'N2', 'Latitude', 4;
                'O2', 'Change', 4;
                'Q2', 'No.', 5;
                'R2', 'Change', 5;
                'T2', 'Region (MEOW)', 6;
                'U2', 'Potential installed capacity (GW)', 6;
                'T3', '', 6;
                'T4', '', 6;
            };
            names = replace(erase(technologies, " "), "Floating", "Float");
            transitionLabels = names(transitionPairs(:, 1)) + " to " + names(transitionPairs(:, 2));
            headers = [headers;
                headerCells("Q" + string(3:20), num2cell(1:18), 2);
                headerCells("R" + string(3:20), transitionLabels, 7);
                headerCells("T" + string(5:16), realmNames, 7);
                headerCells(["U3" "AM3" "BE3" "BW3"], solutions, 6)];
            for column = 21:92
                label = char(transitionLabels(mod(column - 21, 18) + 1));
                headers(end + 1, :) = {sprintf('%s4', excelColumnName(column)), label, 6};
                for row = 2:3
                    tierHeader = row == 3 && mod(column - 21, 18) == 0;
                    if ~(row == 2 && column == 21) && ~tierHeader
                        headers(end + 1, :) = {sprintf('%s%d', excelColumnName(column), row), '', 6};
                    end
                end
            end
            columnLayout = [
                1 1 11.6923076923077 1 1 0;
                2 2 9.69230769230769 1 1 0;
                3 3 9.53846153846154 1 1 0;
                4 4 9.23076923076923 2 0 0;
                5 5 11.6923076923077 1 1 0;
                6 6 9.69230769230769 1 1 0;
                7 7 9.53846153846154 1 1 0;
                8 8 9.23076923076923 2 0 0;
                9 9 11.6923076923077 1 1 0;
                10 10 9.69230769230769 1 1 0;
                11 11 9.53846153846154 1 1 0;
                12 12 9.23076923076923 2 0 0;
                13 13 11.6923076923077 1 1 0;
                14 14 9.69230769230769 1 1 0;
                15 15 9.53846153846154 1 1 0;
                16 16 9.23076923076923 2 0 0;
                17 17 5.23076923076923 2 1 0;
                18 18 34.0769230769231 2 1 0;
                19 19 9.23076923076923 2 0 0;
                20 20 31.5384615384615 2 1 0;
                21 21 34.0769230769231 2 1 0;
                22 22 29.6153846153846 2 1 0;
                23 23 29.4615384615385 2 1 0;
                24 24 34.0769230769231 2 1 0;
                25 25 29.4615384615385 2 1 0;
                26 26 29.2307692307692 2 1 0;
                27 27 28.5384615384615 2 1 0;
                28 28 26.8461538461538 2 1 0;
                29 30 26.6923076923077 2 1 0;
                31 31 26.4615384615385 2 1 0;
                32 32 29.6153846153846 2 1 0;
                33 33 26.8461538461538 2 1 0;
                34 34 26.6923076923077 2 1 0;
                35 35 24.7692307692308 2 1 0;
                36 36 29.2307692307692 2 1 0;
                37 37 26.4615384615385 2 1 0;
                38 38 24.7692307692308 2 1 0;
                93 16384 9.23076923076923 2 0 0;
            ];
            tierColumns = columnLayout(columnLayout(:, 1) >= 21 & columnLayout(:, 2) <= 38, :);
            for tier = 1:3
                columns = tierColumns;
                columns(:, 1:2) = columns(:, 1:2) + tier * 18;
                columnLayout = [columnLayout; columns];
            end
            columnLayout = sortrows(columnLayout, 1);
            mergedRanges = {'U2:CN2', 'U3:AL3', 'AM3:BD3', 'BE3:BV3', 'BW3:CN3', 'T2:T4'};
            viewLayout = {'T1', 'T2', 'T2:T4', 0};
    end
end

function headers = headerCells(addresses, labels, style)
if isstring(labels)
    labels = cellstr(labels);
end
headers = [cellstr(addresses(:)), labels(:), repmat({style}, numel(addresses), 1)];
end

function writeBundledFile(path, bytes)

    file = fopen(path, 'wb');
    closeFile = onCleanup(@() fclose(file));
    fwrite(file, bytes, 'uint8');

end

function deleteFileIfPresent(file)
    if isfile(file)
        delete(file);
    end
end
