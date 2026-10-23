(() => {
  'use strict';

  // English is the source language. Keep the first column in sync with the
  // actual interface and server-provided labels; the other columns are display
  // translations only and never change the numeric grid data or API keys.
  const rows = [
    ['BlueWindEco — Offshore Wind & Marine Biodiversity', 'BlueWindEco — 海上风电与海洋生物多样性', 'BlueWindEco — Éolien en mer et biodiversité marine', 'BlueWindEco — Energía eólica marina y biodiversidad', 'BlueWindEco — Energia eólica offshore e biodiversidade marinha'],
    ['BlueWindEco is a spatial decision platform for offshore wind power, cost and marine biodiversity impacts.', 'BlueWindEco 是一个展示海上风电潜力、成本和海洋生物多样性影响的空间决策平台。', 'BlueWindEco est une plateforme d’aide à la décision spatiale sur le potentiel, les coûts et les effets de l’éolien en mer sur la biodiversité marine.', 'BlueWindEco es una plataforma de decisión espacial sobre el potencial, los costes y los impactos de la energía eólica marina en la biodiversidad.', 'BlueWindEco é uma plataforma de apoio à decisão espacial sobre o potencial, os custos e os impactos da energia eólica offshore na biodiversidade marinha.'],
    ['BlueWindEco home', 'BlueWindEco 首页', 'Accueil BlueWindEco', 'Inicio de BlueWindEco', 'Início do BlueWindEco'],
    ['MARINE SITING INTELLIGENCE', '海洋选址决策', 'AIDE À L’IMPLANTATION MARINE', 'INTELIGENCIA DE EMPLAZAMIENTO MARINO', 'INTELIGÊNCIA PARA LOCALIZAÇÃO MARINHA'],
    ['Main navigation', '主导航', 'Navigation principale', 'Navegación principal', 'Navegação principal'],
    ['TECHNOLOGY', '技术', 'TECHNOLOGIE', 'TECNOLOGÍA', 'TECNOLOGIA'],
    ['STRATEGIES', '策略', 'STRATÉGIES', 'ESTRATEGIAS', 'ESTRATÉGIAS'],
    ['MAP LAYERS', '地图图层', 'COUCHES CARTOGRAPHIQUES', 'CAPAS DEL MAPA', 'CAMADAS DO MAPA'],
    ['AREA', '区域', 'ZONE', 'ÁREA', 'ÁREA'],
    ['RESULTS', '结果', 'RÉSULTATS', 'RESULTADOS', 'RESULTADOS'],
    ['COMPARE', '比选', 'COMPARER', 'COMPARAR', 'COMPARAR'],
    ['RESEARCH PREVIEW', '研究预览版', 'VERSION DE RECHERCHE', 'VERSIÓN DE INVESTIGACIÓN', 'VERSÃO DE PESQUISA'],
    ['Select language', '选择语言', 'Choisir la langue', 'Seleccionar idioma', 'Selecionar idioma'],
    ['Language', '语言', 'Langue', 'Idioma', 'Idioma'],
    ['GLOBAL OFFSHORE WIND / BIODIVERSITY', '全球海上风电 / 生物多样性', 'ÉOLIEN EN MER MONDIAL / BIODIVERSITÉ', 'EÓLICA MARINA MUNDIAL / BIODIVERSIDAD', 'EÓLICA OFFSHORE GLOBAL / BIODIVERSIDADE'],
    ['Explore the energy–ecology frontier.', '探索能源与生态的交汇地带。', 'Explorez la frontière entre énergie et écologie.', 'Explore la frontera entre energía y ecología.', 'Explore a fronteira entre energia e ecologia.'],
    ['Map offshore wind power, costs and biodiversity impacts.', '绘制海上风电潜力、成本及生物多样性影响地图。', 'Cartographiez le potentiel, les coûts et les impacts de l’éolien en mer sur la biodiversité.', 'Explore mapas del potencial, los costes y los impactos de la eólica marina en la biodiversidad.', 'Explore mapas do potencial, dos custos e dos impactos da eólica offshore na biodiversidade.'],
    ['GLOBAL GRID', '全球网格', 'GRILLE MONDIALE', 'CUADRÍCULA GLOBAL', 'GRADE GLOBAL'],
    ['Interactive map workspace', '交互式地图工作区', 'Espace cartographique interactif', 'Espacio de mapas interactivo', 'Espaço de mapas interativo'],
    ['EXPLORE', '探索', 'EXPLORER', 'EXPLORAR', 'EXPLORAR'],
    ['Scenario controls', '情景控制', 'Choix du scénario', 'Controles de escenario', 'Controles de cenário'],
    ['MODE', '模式', 'MODE', 'MODO', 'MODO'],
    ['Choose a scenario mode', '选择情景模式', 'Choisir un mode de scénario', 'Elegir modo de escenario', 'Escolher modo de cenário'],
    ['Technology', '技术', 'Technologie', 'Tecnología', 'Tecnologia'],
    ['Strategy', '策略', 'Stratégie', 'Estrategia', 'Estratégia'],
    ['Technology combination', '技术组合', 'Combinaison technologique', 'Combinación tecnológica', 'Combinação tecnológica'],
    ['Technology combinations', '技术组合', 'Combinaisons technologiques', 'Combinaciones tecnológicas', 'Combinações tecnológicas'],
    ['Planning strategy', '规划策略', 'Stratégie de planification', 'Estrategia de planificación', 'Estratégia de planejamento'],
    ['Planning strategies', '规划策略', 'Stratégies de planification', 'Estrategias de planificación', 'Estratégias de planejamento'],
    ['05 OPTIONS', '05 个选项', '05 OPTIONS', '05 OPCIONES', '05 OPÇÕES'],
    ['Each grid cell adopts the technology chosen by the selected planning strategy.', '每个网格采用所选规划策略确定的技术。', 'Chaque maille utilise la technologie retenue par la stratégie de planification choisie.', 'Cada celda utiliza la tecnología definida por la estrategia de planificación elegida.', 'Cada célula utiliza a tecnologia definida pela estratégia de planejamento selecionada.'],
    ['DISPLAY', '展示', 'AFFICHER', 'VISUALIZAR', 'EXIBIR'],
    ['Map layers', '地图图层', 'Couches cartographiques', 'Capas del mapa', 'Camadas do mapa'],
    ['Map layer', '地图图层', 'Couche cartographique', 'Capa del mapa', 'Camada do mapa'],
    ['Map metric', '地图指标', 'Indicateur cartographique', 'Indicador del mapa', 'Indicador do mapa'],
    ['SELECT A METRIC', '选择指标', 'CHOISIR UN INDICATEUR', 'ELEGIR INDICADOR', 'ESCOLHER INDICADOR'],
    ['Impact lens', '影响分析', 'Analyse des impacts', 'Análisis de impactos', 'Análise de impactos'],
    ['MAP + AREA CHART', '地图 + 区域图表', 'CARTE + GRAPHIQUE DE ZONE', 'MAPA + GRÁFICO DE ÁREA', 'MAPA + GRÁFICO DA ÁREA'],
    ['Impact grouping', '影响分组', 'Regroupement des impacts', 'Agrupación de impactos', 'Agrupamento dos impactos'],
    ['By taxon', '按物种类群', 'Par taxon', 'Por taxón', 'Por táxon'],
    ['By threat', '按濒危等级', 'Par statut de menace', 'Por categoría de amenaza', 'Por categoria de ameaça'],
    ['Group', '类别', 'Groupe', 'Grupo', 'Grupo'],
    ['Impact type', '影响类型', 'Type d’impact', 'Tipo de impacto', 'Tipo de impacto'],
    ['SPATIAL EXPLORER', '空间探索', 'EXPLORATEUR SPATIAL', 'EXPLORADOR ESPACIAL', 'EXPLORADOR ESPACIAL'],
    ['Global marine atlas', '全球海洋图集', 'Atlas marin mondial', 'Atlas marino mundial', 'Atlas marinho global'],
    ['LIVE GRID', '动态网格', 'GRILLE ACTIVE', 'CUADRÍCULA ACTIVA', 'GRADE ATIVA'],
    ['Fit global view', '适配全球视图', 'Afficher le monde entier', 'Ajustar vista global', 'Ajustar vista global'],
    ['Interactive global offshore wind map', '交互式全球海上风电地图', 'Carte interactive mondiale de l’éolien en mer', 'Mapa mundial interactivo de energía eólica marina', 'Mapa global interativo da energia eólica offshore'],
    ['Zoom in', '放大', 'Zoom avant', 'Acercar', 'Ampliar'],
    ['Zoom out', '缩小', 'Zoom arrière', 'Alejar', 'Reduzir'],
    ['Land / coast © Natural Earth', '陆地 / 海岸线 © Natural Earth', 'Terres / littoral © Natural Earth', 'Tierra / costa © Natural Earth', 'Terra / costa © Natural Earth'],
    ['Preparing map layer…', '正在准备地图图层…', 'Préparation de la couche cartographique…', 'Preparando la capa del mapa…', 'Preparando a camada do mapa…'],
    ['ANNUAL COST', '年成本', 'COÛT ANNUEL', 'COSTE ANUAL', 'CUSTO ANUAL'],
    ['ANNUALIZED COST', '年化成本', 'COÛT ANNUALISÉ', 'COSTE ANUALIZADO', 'CUSTO ANUALIZADO'],
    ['Technology combination colors', '技术组合颜色', 'Couleurs des combinaisons technologiques', 'Colores de las combinaciones tecnológicas', 'Cores das combinações tecnológicas'],
    ['LON — \u00a0 LAT —', '经度 — \u00a0 纬度 —', 'LON — \u00a0 LAT —', 'LONG — \u00a0 LAT —', 'LON — \u00a0 LAT —'],
    ['LIGHT GREY / LAND', '浅灰色 / 陆地', 'GRIS CLAIR / TERRE', 'GRIS CLARO / TIERRA', 'CINZA CLARO / TERRA'],
    ['CLICK A CELL TO INSPECT · ZOOM TO EXPLORE', '点击网格查看详情 · 缩放探索', 'CLIQUER SUR UNE MAILLE · ZOOMER POUR EXPLORER', 'HAGA CLIC EN UNA CELDA · ACERQUE PARA EXPLORAR', 'CLIQUE EM UMA CÉLULA · AMPLIE PARA EXPLORAR'],
    ['AVAILABLE CELLS', '可用网格', 'MAILLES DISPONIBLES', 'CELDAS DISPONIBLES', 'CÉLULAS DISPONÍVEIS'],
    ['ANALYZE', '分析', 'ANALYSER', 'ANALIZAR', 'ANALISAR'],
    ['Area selection', '区域选择', 'Sélection de zone', 'Selección de área', 'Seleção de área'],
    ['Area selection method', '区域选择方法', 'Méthode de sélection de zone', 'Método de selección de área', 'Método de seleção de área'],
    ['Draw area', '绘制区域', 'Dessiner une zone', 'Dibujar área', 'Desenhar área'],
    ['Select point', '选择点位', 'Sélectionner un point', 'Seleccionar punto', 'Selecionar ponto'],
    ['Coordinates', '坐标输入', 'Coordonnées', 'Coordenadas', 'Coordenadas'],
    ['Drag across the map to draw a rectangular area.', '在地图上拖动以绘制矩形区域。', 'Faites glisser sur la carte pour dessiner une zone rectangulaire.', 'Arrastre sobre el mapa para dibujar un área rectangular.', 'Arraste no mapa para desenhar uma área retangular.'],
    ['▱ DRAW ON MAP', '▱ 在地图上绘制', '▱ DESSINER SUR LA CARTE', '▱ DIBUJAR EN EL MAPA', '▱ DESENHAR NO MAPA'],
    ['DRAG ON MAP…', '在地图上拖动…', 'FAIRE GLISSER SUR LA CARTE…', 'ARRASTRAR EN EL MAPA…', 'ARRASTE NO MAPA…'],
    ['Single grid cell', '单个网格', 'Une maille', 'Una celda', 'Uma célula'],
    ['0.25° GRID', '0.25° 网格', 'MAILLE DE 0,25°', 'CELDA DE 0,25°', 'CÉLULA DE 0,25°'],
    ['◎ CLICK A POINT ON MAP', '◎ 点击地图选点', '◎ CLIQUER SUR LA CARTE', '◎ HAGA CLIC EN EL MAPA', '◎ CLIQUE NO MAPA'],
    ['CLICK A GRID CELL…', '点击一个网格…', 'CLIQUER SUR UNE MAILLE…', 'HAGA CLIC EN UNA CELDA…', 'CLIQUE EM UMA CÉLULA…'],
    ['Or enter a point to find its nearest grid cell.', '或输入坐标以查找最近的网格。', 'Ou saisissez un point pour trouver la maille la plus proche.', 'O introduzca un punto para encontrar la celda más cercana.', 'Ou insira um ponto para encontrar a célula mais próxima.'],
    ['LONGITUDE', '经度', 'LONGITUDE', 'LONGITUD', 'LONGITUDE'],
    ['LATITUDE', '纬度', 'LATITUDE', 'LATITUD', 'LATITUDE'],
    ['SELECT GRID CELL', '选择网格', 'SÉLECTIONNER LA MAILLE', 'SELECCIONAR CELDA', 'SELECIONAR CÉLULA'],
    ['Enter the west, east, south and north bounds.', '输入西、东、南、北四个边界坐标。', 'Saisissez les limites ouest, est, sud et nord.', 'Introduzca los límites oeste, este, sur y norte.', 'Insira os limites oeste, leste, sul e norte.'],
    ['WEST', '西界', 'OUEST', 'OESTE', 'OESTE'],
    ['EAST', '东界', 'EST', 'ESTE', 'LESTE'],
    ['SOUTH', '南界', 'SUD', 'SUR', 'SUL'],
    ['NORTH', '北界', 'NORD', 'NORTE', 'NORTE'],
    ['APPLY COORDINATES', '应用坐标', 'APPLIQUER LES COORDONNÉES', 'APLICAR COORDENADAS', 'APLICAR COORDENADAS'],
    ['No area selected yet.', '尚未选择区域。', 'Aucune zone sélectionnée.', 'Aún no se ha seleccionado un área.', 'Nenhuma área selecionada.'],
    ['VISUALIZE', '可视化', 'VISUALISER', 'VISUALIZAR', 'VISUALIZAR'],
    ['Area results', '区域结果', 'Résultats de la zone', 'Resultados del área', 'Resultados da área'],
    ['Expand area results', '放大区域结果', 'Agrandir les résultats de la zone', 'Ampliar resultados del área', 'Ampliar resultados da área'],
    ['Close expanded area results', '关闭放大的区域结果', 'Fermer les résultats agrandis', 'Cerrar resultados ampliados', 'Fechar resultados ampliados'],
    ['Selected area', '所选区域', 'Zone sélectionnée', 'Área seleccionada', 'Área selecionada'],
    ['CELLS', '个网格', 'MAILLES', 'CELDAS', 'CÉLULAS'],
    ['CELL', '个网格', 'MAILLE', 'CELDA', 'CÉLULA'],
    ['INSTALLABLE CAPACITY', '可安装容量', 'CAPACITÉ INSTALLABLE', 'CAPACIDAD INSTALABLE', 'CAPACIDADE INSTALÁVEL'],
    ['ANNUAL GENERATION', '年发电量', 'PRODUCTION ANNUELLE', 'GENERACIÓN ANUAL', 'GERAÇÃO ANUAL'],
    ['Total annual cost', '年总成本', 'Coût annuel total', 'Coste anual total', 'Custo anual total'],
    ['Cumulative affected species richness', '累计受影响物种丰富度', 'Richesse spécifique affectée cumulée', 'Riqueza acumulada de especies afectadas', 'Riqueza acumulada de espécies afetadas'],
    ['Select an area to view results.', '选择区域后查看结果。', 'Sélectionnez une zone pour afficher les résultats.', 'Seleccione un área para ver los resultados.', 'Selecione uma área para ver os resultados.'],
    ['Four impact types will appear here.', '此处将显示四种影响类型。', 'Les quatre types d’impact apparaîtront ici.', 'Aquí aparecerán los cuatro tipos de impacto.', 'Os quatro tipos de impacto aparecerão aqui.'],
    ['RECORD THIS SELECTION', '记录当前选择', 'ENREGISTRER CETTE SÉLECTION', 'REGISTRAR ESTA SELECCIÓN', 'REGISTRAR ESTA SELEÇÃO'],
    ['DECIDE', '决策', 'DÉCIDER', 'DECIDIR', 'DECIDIR'],
    ['Comparison workspace', '方案比选', 'Espace de comparaison', 'Espacio de comparación', 'Espaço de comparação'],
    ['Expand comparison workspace', '放大方案比选', 'Agrandir l’espace de comparaison', 'Ampliar espacio de comparación', 'Ampliar espaço de comparação'],
    ['Close expanded comparison workspace', '关闭放大的方案比选', 'Fermer la comparaison agrandie', 'Cerrar comparación ampliada', 'Fechar comparação ampliada'],
    ['RECORDED SELECTIONS', '条已记录选择', 'SÉLECTIONS ENREGISTRÉES', 'SELECCIONES REGISTRADAS', 'SELEÇÕES REGISTRADAS'],
    ['RECORDED SELECTION', '条已记录选择', 'SÉLECTION ENREGISTRÉE', 'SELECCIÓN REGISTRADA', 'SELEÇÃO REGISTRADA'],
    ['↧ EXPORT EXCEL', '↧ 导出 EXCEL', '↧ EXPORTER EXCEL', '↧ EXPORTAR EXCEL', '↧ EXPORTAR EXCEL'],
    ['PREPARING EXCEL…', '正在准备 EXCEL…', 'PRÉPARATION DU FICHIER EXCEL…', 'PREPARANDO EXCEL…', 'PREPARANDO EXCEL…'],
    ['× CLEAR ALL', '× 全部删除', '× TOUT EFFACER', '× BORRAR TODO', '× LIMPAR TUDO'],
    ['Delete all comparison records', '删除所有比选记录', 'Supprimer toutes les entrées de comparaison', 'Eliminar todos los registros de comparación', 'Excluir todos os registros de comparação'],
    ['Record scenarios for the same or different extents, remove entries, and export every measured outcome.', '记录同一区域或不同区域的情景，可删除记录并导出全部结果。', 'Enregistrez des scénarios sur une ou plusieurs zones, supprimez des entrées et exportez tous les résultats.', 'Registre escenarios para la misma área u otras áreas, elimine entradas y exporte todos los resultados.', 'Registre cenários para a mesma área ou áreas diferentes, exclua entradas e exporte todos os resultados.'],
    ['No selections recorded. Set an area, then choose “Record this selection”.', '尚无记录。先选择区域，再点击“记录当前选择”。', 'Aucune sélection enregistrée. Choisissez une zone, puis « Enregistrer cette sélection ».', 'No hay selecciones registradas. Seleccione un área y pulse « Registrar esta selección ».', 'Nenhuma seleção registrada. Selecione uma área e clique em « Registrar esta seleção ».'],
    ['Remove', '删除', 'Supprimer', 'Eliminar', 'Remover'],
    ['Selection time', '选取时间', 'Heure de sélection', 'Hora de selección', 'Horário da seleção'],
    ['Mode', '模式', 'Mode', 'Modo', 'Modo'],
    ['Selection', '选择', 'Sélection', 'Selección', 'Seleção'],
    ['West', '西界', 'Ouest', 'Oeste', 'Oeste'],
    ['East', '东界', 'Est', 'Este', 'Leste'],
    ['South', '南界', 'Sud', 'Sur', 'Sul'],
    ['North', '北界', 'Nord', 'Norte', 'Norte'],
    ['Cells', '网格数', 'Mailles', 'Celdas', 'Células'],
    ['Annual cost · USD/yr', '年成本 · 美元/年', 'Coût annuel · USD/an', 'Coste anual · USD/año', 'Custo anual · USD/ano'],
    ['Capacity · MW', '装机容量 · MW', 'Capacité · MW', 'Capacidad · MW', 'Capacidade · MW'],
    ['Generation · MWh/yr', '年发电量 · MWh/年', 'Production · MWh/an', 'Generación · MWh/año', 'Geração · MWh/ano'],
    ['DELETE', '删除', 'SUPPRIMER', 'ELIMINAR', 'EXCLUIR'],
    ['COMPARISON WORKSPACE', '方案比选', 'ESPACE DE COMPARAISON', 'ESPACIO DE COMPARACIÓN', 'ESPAÇO DE COMPARAÇÃO'],
    ['Delete all records?', '删除全部记录？', 'Supprimer toutes les entrées ?', '¿Eliminar todos los registros?', 'Excluir todos os registros?'],
    ['This will permanently remove', '这将永久删除', 'Cette action supprimera définitivement', 'Esto eliminará permanentemente', 'Isto removerá permanentemente'],
    ['all recorded selections', '所有已记录的选择', 'toutes les sélections enregistrées', 'todas las selecciones registradas', 'todas as seleções registradas'],
    ['from this browser. This cannot be undone.', '从此浏览器中删除。此操作无法撤销。', 'de ce navigateur. Cette action est irréversible.', 'de este navegador. Esta acción no se puede deshacer.', 'deste navegador. Esta ação não pode ser desfeita.'],
    ['CANCEL', '取消', 'ANNULER', 'CANCELAR', 'CANCELAR'],
    ['DELETE ALL', '全部删除', 'TOUT SUPPRIMER', 'ELIMINAR TODO', 'EXCLUIR TUDO'],
    ['Copyright © 2026 Guangdong University of Technology · Nanyang Technological University · Huazhong University of Science and Technology', '版权所有 © 2026 广东工业大学 · 南洋理工大学 · 华中科技大学', 'Copyright © 2026 Guangdong University of Technology · Nanyang Technological University · Huazhong University of Science and Technology', 'Derechos de autor © 2026 Guangdong University of Technology · Nanyang Technological University · Huazhong University of Science and Technology', 'Direitos autorais © 2026 Guangdong University of Technology · Nanyang Technological University · Huazhong University of Science and Technology'],
    ['Contact email:', '联系邮箱：', 'Courriel :', 'Correo electrónico:', 'E-mail de contato:'],

    // Config and layer labels supplied by the Flask API.
    ['Monopile + DC', '单桩式 + 直流', 'Monopieu + CC', 'Monopilote + CC', 'Monopilar + CC'],
    ['Monopile + AC', '单桩式 + 交流', 'Monopieu + CA', 'Monopilote + CA', 'Monopilar + CA'],
    ['Jacket + DC', '导管架式 + 直流', 'Treillis + CC', 'Celosía + CC', 'Jaqueta + CC'],
    ['Jacket + AC', '导管架式 + 交流', 'Treillis + CA', 'Celosía + CA', 'Jaqueta + CA'],
    ['Floating + DC', '漂浮式 + 直流', 'Flottant + CC', 'Flotante + CC', 'Flutuante + CC'],
    ['Floating + AC', '漂浮式 + 交流', 'Flottant + CA', 'Flotante + CA', 'Flutuante + CA'],
    ['Minimum cost', '最低成本', 'Coût minimal', 'Coste mínimo', 'Custo mínimo'],
    ['Tier 1 · Negative-only sites', '第 1 档 · 仅负面影响区域', 'Niveau 1 · Zones à effets négatifs seuls', 'Nivel 1 · Zonas solo con impactos negativos', 'Nível 1 · Áreas apenas com impactos negativos'],
    ['Tier 2 · Minimize negative impacts', '第 2 档 · 最小化负面影响', 'Niveau 2 · Réduire les effets négatifs', 'Nivel 2 · Minimizar impactos negativos', 'Nível 2 · Minimizar impactos negativos'],
    ['Tier 3 · Minimize negative, then maximize positive', '第 3 档 · 先减负、再增正', 'Niveau 3 · Réduire le négatif, puis maximiser le positif', 'Nivel 3 · Minimizar negativos y luego maximizar positivos', 'Nível 3 · Minimizar negativos e depois maximizar positivos'],
    ['Tier 4 · Maximize positive impacts', '第 4 档 · 最大化正面影响', 'Niveau 4 · Maximiser les effets positifs', 'Nivel 4 · Maximizar impactos positivos', 'Nível 4 · Maximizar impactos positivos'],
    ['Tier 1 · Negative-only', '第 1 档 · 仅负面影响', 'Niveau 1 · Négatif seulement', 'Nivel 1 · Solo negativos', 'Nível 1 · Apenas negativos'],
    ['Tier 2 · All negative', '第 2 档 · 全部负面影响', 'Niveau 2 · Tous les effets négatifs', 'Nivel 2 · Todos los negativos', 'Nível 2 · Todos os negativos'],
    ['Tier 3 · Negative + positive', '第 3 档 · 负面 + 正面', 'Niveau 3 · Négatif + positif', 'Nivel 3 · Negativo + positivo', 'Nível 3 · Negativo + positivo'],
    ['Tier 4 · Maximum positive', '第 4 档 · 最大正面影响', 'Niveau 4 · Maximum positif', 'Nivel 4 · Máximo positivo', 'Nível 4 · Máximo positivo'],
    ['Birds and bats', '鸟类与蝙蝠', 'Oiseaux et chauves-souris', 'Aves y murciélagos', 'Aves e morcegos'],
    ['BIRDS & BATS', '鸟类与蝙蝠', 'OISEAUX ET CHAUVES-SOURIS', 'AVES Y MURCIÉLAGOS', 'AVES E MORCEGOS'],
    ['Fish', '鱼类', 'Poissons', 'Peces', 'Peixes'],
    ['Marine mammals', '海洋哺乳动物', 'Mammifères marins', 'Mamíferos marinos', 'Mamíferos marinhos'],
    ['Benthic invertebrates and habitats', '底栖无脊椎动物与生境', 'Invertébrés benthiques et habitats', 'Invertebrados bentónicos y hábitats', 'Invertebrados bentônicos e habitats'],
    ['Benthic invertebrates / habitats', '底栖无脊椎动物 / 生境', 'Invertébrés benthiques / habitats', 'Invertebrados bentónicos / hábitats', 'Invertebrados bentônicos / habitats'],
    ['Plankton', '浮游生物', 'Plancton', 'Plancton', 'Plâncton'],
    ['Plankton / zooplankton', '浮游生物 / 浮游动物', 'Plancton / zooplancton', 'Plancton / zooplancton', 'Plâncton / zooplâncton'],
    ['Critically endangered (CR)', '极危（CR）', 'En danger critique (CR)', 'En peligro crítico (CR)', 'Criticamente em perigo (CR)'],
    ['Endangered (EN)', '濒危（EN）', 'En danger (EN)', 'En peligro (EN)', 'Em perigo (EN)'],
    ['Vulnerable (VU)', '易危（VU）', 'Vulnérable (VU)', 'Vulnerable (VU)', 'Vulnerável (VU)'],
    ['Critically endangered', '极危', 'En danger critique', 'En peligro crítico', 'Criticamente em perigo'],
    ['Endangered', '濒危', 'En danger', 'En peligro', 'Em perigo'],
    ['Vulnerable', '易危', 'Vulnérable', 'Vulnerable', 'Vulnerável'],
    ['NT / LC / NE', '近危 / 无危 / 未评估', 'NT / LC / NE', 'NT / LC / NE', 'NT / LC / NE'],
    ['Positive', '正面', 'Positif', 'Positivo', 'Positivo'],
    ['Trait', '性状', 'Traits', 'Rasgos', 'Traços'],
    ['Behaviour', '行为', 'Comportement', 'Comportamiento', 'Comportamento'],
    ['General adverse', '一般负面', 'Effets négatifs généraux', 'Efectos negativos generales', 'Efeitos negativos gerais'],
    ['Negative · trait', '负面 · 性状', 'Négatif · Traits', 'Negativo · Rasgos', 'Negativo · Traços'],
    ['Negative · behaviour', '负面 · 行为', 'Négatif · Comportement', 'Negativo · Comportamiento', 'Negativo · Comportamento'],
    ['Negative · general', '负面 · 一般', 'Négatif · Général', 'Negativo · General', 'Negativo · Geral'],
    ['Annual cost', '年成本', 'Coût annuel', 'Coste anual', 'Custo anual'],
    ['Annualized generation cost', '年化发电成本', 'Coût annualisé de production', 'Coste anualizado de generación', 'Custo anualizado de geração'],
    ['Annualized cost', '年化成本', 'Coût annualisé', 'Coste anualizado', 'Custo anualizado'],
    ['LCOE', '平准化发电成本', 'Coût actualisé de l’électricité', 'Coste nivelado de electricidad', 'Custo nivelado de eletricidade'],
    ['Levelized cost of electricity', '平准化发电成本', 'Coût actualisé de l’électricité', 'Coste nivelado de electricidad', 'Custo nivelado da eletricidade'],
    ['Capacity', '装机容量', 'Capacité', 'Capacidad', 'Capacidade'],
    ['Potential installed capacity', '潜在装机容量', 'Capacité installable potentielle', 'Capacidad instalable potencial', 'Capacidade instalável potencial'],
    ['Generation', '发电量', 'Production', 'Generación', 'Geração'],
    ['Annual generation', '年发电量', 'Production annuelle', 'Generación anual', 'Geração anual'],
    ['Modelled gross annual generation', '模拟年总发电量', 'Production annuelle brute modélisée', 'Generación anual bruta modelada', 'Geração anual bruta modelada'],
    ['Capacity factor', '容量系数', 'Facteur de charge', 'Factor de capacidad', 'Fator de capacidade'],
    ['Biodiversity impact', '生物多样性影响', 'Impact sur la biodiversité', 'Impacto en la biodiversidad', 'Impacto na biodiversidade'],
    ['species', '物种', 'espèces', 'especies', 'espécies'],
    ['fraction', '比例', 'fraction', 'fracción', 'fração'],

    // User-facing status and popup text generated by app.js.
    ['SELECTED GROUP', '所选类别', 'GROUPE SÉLECTIONNÉ', 'GRUPO SELECCIONADO', 'GRUPO SELECIONADO'],
    ['SELECT SCENARIO', '选择情景', 'CHOISIR UN SCÉNARIO', 'ELEGIR ESCENARIO', 'ESCOLHER CENÁRIO'],
    ['Map image could not be loaded.', '地图图像无法加载。', 'Impossible de charger l’image de la carte.', 'No se pudo cargar la imagen del mapa.', 'Não foi possível carregar a imagem do mapa.'],
    ['No feasible offshore wind technology in this grid cell.', '此网格没有可用的海上风电技术。', 'Aucune technologie éolienne en mer réalisable dans cette maille.', 'No hay tecnología eólica marina viable en esta celda.', 'Não há tecnologia eólica offshore viável nesta célula.'],
    ['Annualized cost', '年化成本', 'Coût annualisé', 'Coste anualizado', 'Custo anualizado'],
    ['Layer unavailable:', '图层不可用：', 'Couche indisponible :', 'Capa no disponible:', 'Camada indisponível:'],
    ['Drag across the map to define a rectangular area.', '在地图上拖动以确定矩形区域。', 'Faites glisser sur la carte pour délimiter une zone rectangulaire.', 'Arrastre sobre el mapa para delimitar un área rectangular.', 'Arraste no mapa para definir uma área retangular.'],
    ['Drag from one corner of the area to the opposite corner.', '从区域一个角拖动到对角。', 'Faites glisser d’un coin de la zone vers le coin opposé.', 'Arrastre desde una esquina del área hasta la opuesta.', 'Arraste de um canto da área até o canto oposto.'],
    ['Click a point on the map to select its nearest grid cell.', '点击地图上的一点以选择最近的网格。', 'Cliquez sur un point de la carte pour choisir la maille la plus proche.', 'Haga clic en un punto del mapa para seleccionar la celda más cercana.', 'Clique em um ponto do mapa para selecionar a célula mais próxima.'],
    ['Use west < east and south < north, within global longitude and latitude limits.', '请确保西界 < 东界、南界 < 北界，且坐标在全球经纬度范围内。', 'Vérifiez ouest < est et sud < nord, dans les limites mondiales de longitude et latitude.', 'Use oeste < este y sur < norte, dentro de los límites mundiales de longitud y latitud.', 'Use oeste < leste e sul < norte, dentro dos limites globais de longitude e latitude.'],
    ['Enter longitude from −180° to 180° and latitude from −90° to 90°.', '输入经度 −180° 至 180°，纬度 −90° 至 90°。', 'Saisissez une longitude de −180° à 180° et une latitude de −90° à 90°.', 'Introduzca longitud entre −180° y 180° y latitud entre −90° y 90°.', 'Insira longitude de −180° a 180° e latitude de −90° a 90°.'],
    ['Enter longitude and latitude to select a grid cell.', '输入经纬度以选择网格。', 'Saisissez longitude et latitude pour sélectionner une maille.', 'Introduzca longitud y latitud para seleccionar una celda.', 'Insira longitude e latitude para selecionar uma célula.'],
    ['Calculating exact grid-cell totals…', '正在计算网格汇总值…', 'Calcul des totaux exacts des mailles…', 'Calculando los totales exactos de las celdas…', 'Calculando os totais exatos das células…'],
    ['The selected grid cell has no feasible technology in this scenario.', '所选网格在此情景下没有可用技术。', 'La maille sélectionnée ne dispose d’aucune technologie réalisable dans ce scénario.', 'La celda seleccionada no tiene tecnología viable en este escenario.', 'A célula selecionada não tem tecnologia viável neste cenário.'],
    ['Enter all four boundaries before applying the area.', '应用区域前请输入全部四个边界。', 'Saisissez les quatre limites avant d’appliquer la zone.', 'Introduzca los cuatro límites antes de aplicar el área.', 'Insira os quatro limites antes de aplicar a área.'],
    ['Current', '当前', 'Actuel', 'Actual', 'Atual'],
    ['Delete record', '删除记录', 'Supprimer l’entrée', 'Eliminar registro', 'Excluir registro'],
    ['recorded selection', '条已记录选择', 'sélection enregistrée', 'selección registrada', 'seleção registrada'],
    ['recorded selections', '条已记录选择', 'sélections enregistrées', 'selecciones registradas', 'seleções registradas'],
    ['Area calculation failed:', '区域计算失败：', 'Échec du calcul de la zone :', 'Error al calcular el área:', 'Falha no cálculo da área:'],
    ['Export failed', '导出失败', 'Échec de l’exportation', 'Error al exportar', 'Falha na exportação'],
    ['DRAW ON MAP', '在地图上绘制', 'DESSINER SUR LA CARTE', 'DIBUJAR EN EL MAPA', 'DESENHAR NO MAPA'],
    ['CLICK A POINT ON MAP', '点击地图选点', 'CLIQUER SUR LA CARTE', 'HAGA CLIC EN EL MAPA', 'CLIQUE NO MAPA'],
    ['EXPORT EXCEL', '导出 EXCEL', 'EXPORTER EXCEL', 'EXPORTAR EXCEL', 'EXPORTAR EXCEL'],
    ['Impact', '影响', 'Impact', 'Impacto', 'Impacto'],
    ['{count} AVAILABLE CELLS', '{count} 个可用网格', '{count} MAILLES DISPONIBLES', '{count} CELDAS DISPONIBLES', '{count} CÉLULAS DISPONÍVEIS'],
    ['— AVAILABLE CELLS', '— 个可用网格', '— MAILLES DISPONIBLES', '— CELDAS DISPONIBLES', '— CÉLULAS DISPONÍVEIS'],
    ['0 RECORDED SELECTIONS', '0 条已记录选择', '0 SÉLECTIONS ENREGISTRÉES', '0 SELECCIONES REGISTRADAS', '0 SELEÇÕES REGISTRADAS'],
    ['Layer unavailable: {message}', '图层不可用：{message}', 'Couche indisponible : {message}', 'Capa no disponible: {message}', 'Camada indisponível: {message}'],
    ['{count} CELL', '{count} 个网格', '{count} MAILLE', '{count} CELDA', '{count} CÉLULA'],
    ['{count} CELLS', '{count} 个网格', '{count} MAILLES', '{count} CELDAS', '{count} CÉLULAS'],
    ['— CELLS', '— 个网格', '— MAILLES', '— CELDAS', '— CÉLULAS'],
    ['{count} feasible grid cell selected.', '已选择 {count} 个可用网格。', '{count} maille réalisable sélectionnée.', '{count} celda viable seleccionada.', '{count} célula viável selecionada.'],
    ['{count} feasible grid cells selected.', '已选择 {count} 个可用网格。', '{count} mailles réalisables sélectionnées.', '{count} celdas viables seleccionadas.', '{count} células viáveis selecionadas.'],
    ['Grid cell {lon}°, {lat}° selected.', '已选择网格 {lon}°、{lat}°。', 'Maille {lon}°, {lat}° sélectionnée.', 'Celda {lon}°, {lat}° seleccionada.', 'Célula {lon}°, {lat}° selecionada.'],
    ['Selected grid center: {lon}° longitude, {lat}° latitude.', '所选网格中心：经度 {lon}°，纬度 {lat}°。', 'Centre de la maille : longitude {lon}°, latitude {lat}°.', 'Centro de la celda: longitud {lon}°, latitud {lat}°.', 'Centro da célula: longitude {lon}°, latitude {lat}°.'],
    ['Area calculation failed: {message}', '区域计算失败：{message}', 'Échec du calcul de la zone : {message}', 'Error al calcular el área: {message}', 'Falha no cálculo da área: {message}'],
    ['Delete record {number}', '删除第 {number} 条记录', 'Supprimer l’entrée {number}', 'Eliminar registro {number}', 'Excluir registro {number}'],
    ['{count} RECORDED SELECTION', '{count} 条已记录选择', '{count} SÉLECTION ENREGISTRÉE', '{count} SELECCIÓN REGISTRADA', '{count} SELEÇÃO REGISTRADA'],
    ['{count} RECORDED SELECTIONS', '{count} 条已记录选择', '{count} SÉLECTIONS ENREGISTRÉES', '{count} SELECCIONES REGISTRADAS', '{count} SELEÇÕES REGISTRADAS'],
    ['{count} recorded selection', '{count} 条已记录选择', '{count} sélection enregistrée', '{count} selección registrada', '{count} seleção registrada'],
    ['{count} recorded selections', '{count} 条已记录选择', '{count} sélections enregistrées', '{count} selecciones registradas', '{count} seleções registradas'],
    ['Export failed (HTTP {status}).', '导出失败（HTTP {status}）。', 'Échec de l’exportation (HTTP {status}).', 'Error al exportar (HTTP {status}).', 'Falha na exportação (HTTP {status}).'],
    ['LON', '经度', 'LON', 'LONG', 'LON'],
    ['LAT', '纬度', 'LAT', 'LAT', 'LAT'],
  ];

  const localeIndex = { 'zh-CN': 1, fr: 2, es: 3, pt: 4 };
  const codes = { en: 'EN', 'zh-CN': '中文', fr: 'FR', es: 'ES', pt: 'PT' };
  const catalog = new Map(rows.map(row => [row[0], row]));
  const folded = new Map(rows.map(row => [row[0].toLocaleLowerCase('en'), row]));
  const textOrigins = new WeakMap();
  const attributeOrigins = new WeakMap();
  const attributes = ['aria-label', 'title', 'placeholder'];
  let language = 'en';
  let observer;

  function getLanguage() { return language; }

  function t(source) {
    const text = String(source ?? '');
    if (language === 'en') return text;
    const row = catalog.get(text) || folded.get(text.toLocaleLowerCase('en'));
    if (!row) return text;
    const result = row[localeIndex[language]];
    // Keep all-uppercase display labels uppercase in alphabetic languages.
    const hasLetters = /[A-Za-z]/.test(text);
    const isUppercase = hasLetters && text === text.toLocaleUpperCase('en');
    return isUppercase && language !== 'zh-CN' ? result.toLocaleUpperCase(language) : result;
  }

  function format(source, values = {}) {
    return t(source).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match);
  }

  function isExcluded(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || !!element.closest('script, style, svg, #language-menu, #language-current');
  }

  function translateText(node) {
    if (isExcluded(node)) return;
    const current = node.nodeValue || '';
    let entry = textOrigins.get(node);
    if (!entry || current !== entry.rendered) entry = { original: current, rendered: current };
    const match = entry.original.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const rendered = match ? match[1] + t(match[2]) + match[3] : entry.original;
    entry.rendered = rendered;
    textOrigins.set(node, entry);
    if (current !== rendered) node.nodeValue = rendered;
  }

  function translateAttributes(element) {
    if (isExcluded(element)) return;
    let record = attributeOrigins.get(element);
    if (!record) record = {};
    for (const name of attributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      let entry = record[name];
      if (!entry || current !== entry.rendered) entry = { original: current, rendered: current };
      const rendered = t(entry.original);
      entry.rendered = rendered;
      record[name] = entry;
      if (current !== rendered) element.setAttribute(name, rendered);
    }
    attributeOrigins.set(element, record);
  }

  function translateDOM(root = document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const element = root.nodeType === Node.ELEMENT_NODE ? root : root.documentElement;
    if (element && !isExcluded(element)) translateAttributes(element);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) translateText(node);
      else translateAttributes(node);
    }
  }

  function updateMetadata() {
    document.documentElement.lang = language;
    const pageTitle = 'BlueWindEco — Offshore Wind & Marine Biodiversity';
    document.title = t(pageTitle);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t('BlueWindEco is a spatial decision platform for offshore wind power, cost and marine biodiversity impacts.');
  }

  function closeMenu(focusToggle = false) {
    const toggle = document.getElementById('language-toggle');
    const menu = document.getElementById('language-menu');
    if (!toggle || !menu) return;
    menu.classList.add('is-hidden');
    toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) toggle.focus();
  }

  function openMenu() {
    const toggle = document.getElementById('language-toggle');
    const menu = document.getElementById('language-menu');
    if (!toggle || !menu) return;
    menu.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    menu.querySelector(`[data-lang="${language}"]`)?.focus();
  }

  function updateMenu() {
    const current = document.getElementById('language-current');
    if (current) current.textContent = codes[language];
    const menu = document.getElementById('language-menu');
    if (menu) menu.setAttribute('aria-label', t('Language'));
    document.querySelectorAll('#language-menu [data-lang]').forEach(button => {
      button.setAttribute('aria-checked', String(button.dataset.lang === language));
    });
  }

  function setLanguage(locale, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(codes, locale)) locale = 'en';
    const changed = locale !== language;
    language = locale;
    try { localStorage.setItem('bluewindeco_language', language); } catch (_) { /* Storage is optional. */ }
    updateMetadata();
    updateMenu();
    translateDOM(document.body);
    if (changed && options.announce !== false) {
      window.dispatchEvent(new CustomEvent('bluewindeco:languagechange', { detail: { locale: language } }));
    }
    return language;
  }

  function wireMenu() {
    const switcher = document.getElementById('language-switcher');
    const toggle = document.getElementById('language-toggle');
    const menu = document.getElementById('language-menu');
    if (!switcher || !toggle || !menu) return;
    toggle.addEventListener('click', () => menu.classList.contains('is-hidden') ? openMenu() : closeMenu());
    menu.addEventListener('click', event => {
      const button = event.target.closest('[data-lang]');
      if (!button) return;
      setLanguage(button.dataset.lang);
      closeMenu(true);
    });
    switcher.addEventListener('keydown', event => {
      const options = Array.from(menu.querySelectorAll('[data-lang]'));
      if (event.key === 'Escape' && !menu.classList.contains('is-hidden')) {
        event.preventDefault(); event.stopPropagation(); closeMenu(true); return;
      }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && menu.classList.contains('is-hidden')) {
        event.preventDefault(); openMenu(); return;
      }
      const index = options.indexOf(document.activeElement);
      if (index >= 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
      }
      if (index >= 0 && (event.key === 'Home' || event.key === 'End')) {
        event.preventDefault(); options[event.key === 'Home' ? 0 : options.length - 1].focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!switcher.contains(event.target)) closeMenu();
    });
  }

  function observe() {
    observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') translateText(mutation.target);
        else if (mutation.type === 'attributes') translateAttributes(mutation.target);
        else for (const node of mutation.addedNodes) translateDOM(node);
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: attributes
    });
  }

  window.BWEI18n = { t, format, setLanguage, getLanguage, translateDOM };
  const initialize = () => {
    wireMenu();
    let saved = 'en';
    try { saved = localStorage.getItem('bluewindeco_language') || 'en'; } catch (_) { /* Default English. */ }
    setLanguage(saved, { announce: false });
    observe();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
