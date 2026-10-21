// @ts-check
/**
 * FORJA RUBRA — Mapa Interativo de Arton
 * Motor: Leaflet CRS.Simple com grade TMS idêntica ao Fichas de Nimb.
 * Inclui:
 * 1. Arrasto do mapa clicando e segurando com o botão direito (mesmo com esquerdo segurado).
 * 2. Clique com botão direito cancela a medição ou rota ativa.
 * 3. Medidor de distância em linha reta dinâmica com balão de km e dias (9m) direto no cursor/ponto final.
 * 4. Sistema de Rotas estilo Google Maps: A* sobre estradas e rotas marítimas reais de Arton.
 * 5. Snapping magnético em cidades próximas.
 * 6. Marcadores compactos e despoluídos.
 */

declare const L: any;

interface CityLocation {
  name: string;
  coordinates: [number, number];
  isCapital?: boolean;
  kingdom?: string;
  description?: string;
  image?: string;
}

interface KingdomBoundary {
  name: string;
  color?: string;
  coordinates: [number, number][];
  description?: string;
}

interface CustomMarker {
  id: string;
  name: string;
  coordinates: [number, number];
  description?: string;
  createdAt?: number;
}

interface RoadNode {
  id: string;
  coord: [number, number];
}

interface RoadEdge {
  id: string;
  from: string;
  to: string;
  kind?: 'estrada' | 'trilha' | 'maritima' | string;
  path: [number, number][];
  lengthKm?: number;
  name?: string;
  conditions?: string[];
}

interface RoadGraph {
  nodes: RoadNode[];
  edges: RoadEdge[];
}

(() => {
  'use strict';

  interface MapDefinition {
    id: string;
    name: string;
    color: string;
    center: [number, number];
    minZoom: number;
    maxZoom: number;
    defaultZoom: number;
    dataKey: string;
  }

  const MAP_DEFINITIONS: Record<string, MapDefinition> = {
    arton: { id: 'arton', name: 'Arton', color: '#E0B83C', center: [-76, 93], minZoom: 3, maxZoom: 5, defaultZoom: 4, dataKey: 'mapLocations' },
    tamura: { id: 'tamura', name: 'Tamu-ra', color: '#C0392B', center: [-89, 47], minZoom: 2, maxZoom: 3, defaultZoom: 3, dataKey: 'mapTamura' },
    lamnor: { id: 'lamnor', name: 'Lamnor', color: '#16A085', center: [-61, 88], minZoom: 2, maxZoom: 3, defaultZoom: 3, dataKey: 'mapLamnor' },
    doherimm: { id: 'doherimm', name: 'Doherimm', color: '#8D6E63', center: [-79, 105], minZoom: 2, maxZoom: 3, defaultZoom: 3, dataKey: 'mapDoherimm' },
    moreania: { id: 'moreania', name: 'Moreania', color: '#5C6BC0', center: [-61, 88], minZoom: 2, maxZoom: 3, defaultZoom: 3, dataKey: 'mapMoreania' }
  };

  function getMapTileUrl(mapId: string): string {
    return `https://yurialessandro.github.io/artonMap/map_tiles/${mapId}/{z}/{x}/{y}.png`;
  }

  function showMapToast(message: string, durationMs = 3000) {
    let container = document.getElementById('mapToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mapToastContainer';
      container.className = 'map-toast-container';
      document.getElementById('mapViewport')?.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'map-toast-item';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <div class="map-toast-content">
        <svg class="map-toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>${message}</span>
      </div>
      <button type="button" class="map-toast-close" title="Fechar">×</button>
    `;

    const closeToast = () => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 250);
    };

    toast.addEventListener('click', closeToast);
    container.appendChild(toast);

    setTimeout(() => {
      closeToast();
    }, durationMs);
  }

  const KM_PER_MAP_UNIT = 43;
  const KM_PER_TRAVEL_DAY_LAND = 36; // Velocidade padrão 9m = 36 km/dia a pé
  const KM_PER_TRAVEL_DAY_SEA = 48;  // Veleiro no mar = 48 km/dia
  const MAGNETIC_SNAP_RADIUS = 3.6;  // Raio magnético em unidades de mapa

  const DEFAULT_MARKER_COLOR = '#c0392b';
  const CUSTOM_MARKER_COLOR = '#2563eb';

  // Mapeamento de Capitais para seus Reinos de Origem
  const CAPITAL_KINGDOM_MAP: Record<string, string> = {
    'tiberus': 'Tauron',
    'thartann': 'Ahlen',
    'valkaria': 'Deheon',
    'zakharin': 'Zakharov',
    'sophand': 'Wynlla',
    'kannilar': 'Supremacia Purista',
    'roschfallen': 'Bielefeld',
    'cidade de svalas': 'Svalas',
    'yuton': 'Salistick',
    'milothiann': 'Aslothia',
    'vectora': 'Independente',
    'sambúrdia capital': 'Sambúrdia',
    'samburdia capital': 'Sambúrdia',
    'linnanthas-shaed': 'Pondsmânia',
    'ghallistryx': 'Sckharshantallas',
    'mirandege': 'Ubani',
    'valarur': 'Khubar',
    'triunphus': 'Trebuck',
    'a cidade no deserto': 'Halak-Tûr'
  };

  // Cores heráldicas canônicas baseadas nos brasões oficiais de Arton
  const KINGDOM_MARKER_COLORS: Record<string, string> = {
    Deheon: '#B0B5C2',                 // Prata (Estátua de Valkaria)
    'Supremacia Purista': '#C52222',    // Vermelho Purista com Leopardo
    Wynlla: '#8E24AA',                 // Púrpura Arcana da Magocracia
    Ahlen: '#D84315',                  // Vermelho Raposa das três raposas
    Pondsmânia: '#15803d',             // Verde Folhagem da Árvore Sagrada de Pondsmânia
    'Pondsmǽnia': '#15803d',
    'Império de Tauron': '#8B0000',    // Vermelho Minotauro Táurico
    Tauron: '#8B0000',
    Bielefeld: '#2E7D32',              // Verde Ordem da Luz
    Bielefelt: '#2E7D32',
    Namalkah: '#8D6E63',               // Marrom Cavaleiro das Planícies
    Namalkha: '#8D6E63',
    Zakharov: '#455A64',               // Aço / Forja das Armas
    Aslothia: '#311B92',               // Negro Púrpura de Tenebra
    Sambúrdia: '#EAB308',              // Dourado Trigo (Celeiro de Arton)
    'Sambǧrdia': '#EAB308',
    'Repúblicas Livres de Sambúrdia': '#EAB308',
    Salistick: '#0D9488',              // Turquesa Herbal da Medicina
    Salistk: '#0D9488',
    Svalas: '#0284C7',                 // Ciano Fluvial
    Svallas: '#0284C7',
    Trebuck: '#78350F',                // Bronze Bélico dos Feudos
    'Feudos de Trebuck': '#78350F',
    Sckharshantallas: '#DC2626',       // Rubro Flamejante do Rei Dragão
    'Montanhas Uivantes': '#38BDF8',   // Azul Glacial
    Uivantes: '#38BDF8',
    'Floresta de Tolon': '#33691E',    // Verde Musgo de Madeira Nobre
    Tollon: '#33691E',
    Khubar: '#1D4ED8',                 // Azul Marinho Oceânico
    Ubani: '#EA580C',                  // Âmbar
    Galrasia: '#15803D',               // Verde Selva Primordial
    'Halak-Tûr': '#CA8A04',            // Areia Dourada do Deserto
    'Halak-Tǯr': '#CA8A04',
    'Ermos Purpuras': '#581C87',       // Púrpura Fúnebre
    'Conflagração do Aço': '#475569',
    Independente: '#D97706'
  };

  function getCityColor(city: CityLocation): string {
    let kingdom = city.kingdom;
    if (!kingdom && city.isCapital) {
      kingdom = CAPITAL_KINGDOM_MAP[city.name.toLowerCase().trim()];
    }
    if (kingdom && KINGDOM_MARKER_COLORS[kingdom]) {
      return KINGDOM_MARKER_COLORS[kingdom];
    }
    return DEFAULT_MARKER_COLOR;
  }

  // Pin compacto para Capitais: 18x26
  function createCapitalPinIcon(color: string): any {
    const svg = `
      <svg width="18" height="26" viewBox="0 0 18 26" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 0C4.03 0 0 4.03 0 9c0 6.27 7.68 16.06 8.33 16.86a0.86 0.86 0 0 0 1.34 0C10.32 25.06 18 15.27 18 9c0-4.97-4.03-9-9-9z" fill="${color}" stroke="#ffffff" stroke-width="1.3"/>
        <circle cx="9" cy="9" r="3.5" fill="#ffffff"/>
      </svg>
    `;
    return L.divIcon({
      className: 'arton-pin-icon arton-pin-capital',
      html: svg,
      iconSize: [18, 26],
      iconAnchor: [9, 26],
      popupAnchor: [0, -24]
    });
  }

  // Pin para Outras Localidades: 12x18
  function createCityPinIcon(color: string): any {
    const svg = `
      <svg width="12" height="18" viewBox="0 0 12 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0C2.69 0 0 2.69 0 6c0 4.18 5.12 11.11 5.55 11.71a0.58 0.58 0 0 0 0.9 0C6.88 17.11 12 10.18 12 6c0-3.31-2.69-6-6-6z" fill="${color}" stroke="#ffffff" stroke-width="1.1"/>
        <circle cx="6" cy="6" r="2.3" fill="#ffffff"/>
      </svg>
    `;
    return L.divIcon({
      className: 'arton-pin-icon arton-pin-city',
      html: svg,
      iconSize: [12, 18],
      iconAnchor: [6, 18],
      popupAnchor: [0, -16]
    });
  }

  // Pin para Marcadores Personalizados: 14x21
  function createCustomPinIcon(color: string): any {
    const svg = `
      <svg width="14" height="21" viewBox="0 0 14 21" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0C3.13 0 0 3.13 0 7c0 4.88 5.98 12.96 6.48 13.66a0.68 0.68 0 0 0 1.04 0C8.02 19.96 14 11.88 14 7c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="7" cy="7" r="2.6" fill="#ffffff"/>
      </svg>
    `;
    return L.divIcon({
      className: 'arton-pin-icon arton-pin-custom',
      html: svg,
      iconSize: [14, 21],
      iconAnchor: [7, 21],
      popupAnchor: [0, -19]
    });
  }

  // Vértice da rota / medição (ponto único, sem duplicidade)
  function createEndpointIcon(color = '#f59e0b'): any {
    return L.divIcon({
      className: 'route-endpoint-pin-wrapper',
      html: `<div style="width:12px;height:12px;background:#ffffff;border:3px solid ${color};border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.6);box-sizing:border-box;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  }

  function loadSavedMarkers(): CustomMarker[] {
    try {
      const raw = localStorage.getItem(SAVED_MARKERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveSavedMarkers(list: CustomMarker[]) {
    try {
      localStorage.setItem(SAVED_MARKERS_KEY, JSON.stringify(list));
    } catch {}
  }

  /* ==============================================================
     ALGORITMO A* PARA ROTAS SOBRE A MALHA DE ESTRADAS DE ARTON
     ============================================================== */
  function distUnits(p1: [number, number], p2: [number, number]): number {
    return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
  }

  function pathKm(path: [number, number][]): number {
    let sum = 0;
    for (let i = 1; i < path.length; i++) {
      sum += distUnits(path[i - 1], path[i]);
    }
    return sum * KM_PER_MAP_UNIT;
  }

  function sameCoord(a: [number, number], b: [number, number]): boolean {
    return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
  }

  function closestPointOnSegment(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return a;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
    return [a[0] + dx * t, a[1] + dy * t];
  }

  const ROAD_CONDITIONS = [
    {
      id: 'zonaTormenta',
      label: 'Zona de Tormenta',
      color: '#d13235',
      altColor: '#EF9A9A',
      dotClass: 'tormenta',
      description: 'A rota atravessa uma área tomada pela Tormenta.'
    },
    {
      id: 'guerra',
      label: 'Estrada em guerra',
      color: '#EF6C00',
      altColor: '#FFCC80',
      dotClass: 'war',
      description: 'A rota passa por uma região em guerra.'
    },
    {
      id: 'terrenoDificil',
      label: 'Terreno difícil',
      color: '#F9A825',
      altColor: '#FFE082',
      dotClass: 'difficult',
      description: 'Terreno difícil: a distância por dia cai pela metade.'
    }
  ] as const;

  const CUSTOM_DIFFICULT_COLOR = '#F9A825';
  const ROUTE_CASING_COLOR = '#0D47A1';
  const ROUTE_COLOR = '#42A5F5';
  const ROUTE_ALT_COLOR = '#90CAF9';
  const CONNECTOR_COLOR = '#37474F';

  function getConditionDef(conditions?: string[]) {
    if (!conditions || conditions.length === 0) return null;
    return ROAD_CONDITIONS.find(c => conditions.includes(c.id)) ?? null;
  }

  function densifyPath(pts: [number, number][], maxStepUnits = 0.75): [number, number][] {
    if (pts.length < 2) return [...pts];
    const out: [number, number][] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = distUnits(a, b);
      if (d > maxStepUnits) {
        const steps = Math.ceil(d / maxStepUnits);
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
      }
      if (!sameCoord(out[out.length - 1], b)) {
        out.push(b);
      }
    }
    return out;
  }

  function pointInPolygon(pt: [number, number], polygon: [number, number][]): boolean {
    if (!polygon || polygon.length < 3) return false;
    const y = pt[0];
    const x = pt[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const yi = polygon[i][0];
      const xi = polygon[i][1];
      const yj = polygon[j][0];
      const xj = polygon[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function getReachableNodes(
    graph: { nodeCoords: Map<string, [number, number]>; edges: RoadEdge[] },
    startNode: string,
    allowSea: boolean
  ): Set<string> {
    const adj = new Map<string, string[]>();
    graph.edges.forEach(e => {
      if (!allowSea && e.kind === 'maritima') return;
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push(e.to);
      adj.get(e.to)!.push(e.from);
    });
    const visited = new Set<string>([startNode]);
    const queue: string[] = [startNode];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const nbrs = adj.get(curr) || [];
      for (const nx of nbrs) {
        if (!visited.has(nx)) {
          visited.add(nx);
          queue.push(nx);
        }
      }
    }
    return visited;
  }

  function attachPointToGraph(
    graph: { nodeCoords: Map<string, [number, number]>; edges: RoadEdge[] },
    pt: [number, number],
    nodeId: string,
    allowedNodes?: Set<string>,
    allowSea = true
  ): string | null {
    let bestEdgeIdx = -1;
    let bestSegmentIdx = -1;
    let bestProj: [number, number] | null = null;
    let minD = Infinity;

    graph.edges.forEach((edge, eIdx) => {
      if (!allowSea && edge.kind === 'maritima') return;
      if (allowedNodes && !allowedNodes.has(edge.from) && !allowedNodes.has(edge.to)) return;
      for (let i = 1; i < edge.path.length; i++) {
        const proj = closestPointOnSegment(pt, edge.path[i - 1], edge.path[i]);
        const d = distUnits(pt, proj);
        if (d < minD) {
          minD = d;
          bestEdgeIdx = eIdx;
          bestSegmentIdx = i;
          bestProj = proj;
        }
      }
    });

    if (bestEdgeIdx < 0 || !bestProj) return null;

    const edge = graph.edges[bestEdgeIdx];
    if (sameCoord(bestProj, edge.path[0])) return edge.from;
    if (sameCoord(bestProj, edge.path[edge.path.length - 1])) return edge.to;

    const partA = edge.path.slice(0, bestSegmentIdx);
    const partB = edge.path.slice(bestSegmentIdx);
    const pathA: [number, number][] = sameCoord(partA[partA.length - 1], bestProj) ? partA : [...partA, bestProj];
    const pathB: [number, number][] = sameCoord(partB[0], bestProj) ? partB : [bestProj, ...partB];

    graph.nodeCoords.set(nodeId, bestProj);
    graph.edges.splice(
      bestEdgeIdx,
      1,
      { id: `${edge.id}::a`, from: edge.from, to: nodeId, kind: edge.kind, name: edge.name, conditions: edge.conditions, path: pathA, lengthKm: pathKm(pathA) },
      { id: `${edge.id}::b`, from: nodeId, to: edge.to, kind: edge.kind, name: edge.name, conditions: edge.conditions, path: pathB, lengthKm: pathKm(pathB) }
    );
    return nodeId;
  }

  interface RouteStep {
    icon: 'walk' | 'sea';
    text: string;
    km?: number;
  }

  interface RouteSegment {
    type: 'road' | 'sea' | 'offgrid';
    kind?: 'estrada' | 'trilha' | 'maritima';
    name?: string;
    conditions?: string[];
    connectorPos?: 'start' | 'end';
    path: [number, number][];
    km: number;
  }

  interface CalculatedRouteResult {
    path: [number, number][];
    roadPath: [number, number][];
    segments: RouteSegment[];
    roadKm: number;
    seaKm: number;
    totalKm: number;
    offGridStartKm: number;
    offGridEndKm: number;
    tormentaKm: number;
    difficultKm: number;
    difficultSeaKm?: number;
    warKm?: number;
    conditionKm: Record<string, number>;
    steps: RouteStep[];
    edgeKeys?: string[];
    edgeKmMap?: Map<string, number>;
  }

  function runAStar(
    graph: { nodeCoords: Map<string, [number, number]>; edges: RoadEdge[] },
    startNode: string,
    endNode: string,
    options: {
      allowSea?: boolean;
      preferSea?: boolean;
      penalizedEdges?: Set<string>;
      penaltyMultiplier?: number;
    } = {}
  ): RoadEdge[] | null {
    const allowSea = options.allowSea !== false;
    const landMultiplier = options.preferSea ? 25 : 1;
    const adj = new Map<string, Array<{ to: string; edge: RoadEdge; km: number }>>();

    graph.edges.forEach(e => {
      if (!allowSea && e.kind === 'maritima') return;
      const km = e.lengthKm || pathKm(e.path);
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, edge: e, km });
      adj.get(e.to)!.push({ to: e.from, edge: e, km });
    });

    const heuristic = (n: string) => {
      const c1 = graph.nodeCoords.get(n);
      const c2 = graph.nodeCoords.get(endNode);
      return c1 && c2 ? distUnits(c1, c2) * KM_PER_MAP_UNIT : 0;
    };

    const gScore = new Map<string, number>([[startNode, 0]]);
    const fScore = new Map<string, number>([[startNode, heuristic(startNode)]]);
    const cameFrom = new Map<string, { node: string; edge: RoadEdge }>();
    const openSet = new Set<string>([startNode]);
    const closedSet = new Set<string>();

    while (openSet.size > 0) {
      let current = '';
      let lowestF = Infinity;
      openSet.forEach(n => {
        const f = fScore.get(n) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = n;
        }
      });

      if (current === endNode) {
        const routeEdges: RoadEdge[] = [];
        let curr = endNode;
        while (curr !== startNode) {
          const step = cameFrom.get(curr);
          if (!step) break;
          routeEdges.unshift(step.edge);
          curr = step.node;
        }
        return routeEdges;
      }

      openSet.delete(current);
      closedSet.add(current);

      const neighbors = adj.get(current) || [];
      for (const nbr of neighbors) {
        if (closedSet.has(nbr.to)) continue;
        const isDiff = Array.isArray(nbr.edge.conditions) && nbr.edge.conditions.includes('terrenoDificil');
        let weight = isDiff ? nbr.km * 2 : nbr.km;
        if (nbr.edge.kind !== 'maritima') {
          weight *= landMultiplier;
        }

        const edgeKey1 = `${nbr.edge.from}->${nbr.edge.to}`;
        const edgeKey2 = `${nbr.edge.to}->${nbr.edge.from}`;
        const baseEdgeId = nbr.edge.id.split('::')[0];
        if (
          options.penalizedEdges &&
          (options.penalizedEdges.has(nbr.edge.id) ||
            options.penalizedEdges.has(baseEdgeId) ||
            options.penalizedEdges.has(edgeKey1) ||
            options.penalizedEdges.has(edgeKey2))
        ) {
          weight *= (options.penaltyMultiplier || 2.2);
        }

        const tentativeG = (gScore.get(current) ?? Infinity) + weight;
        if (tentativeG < (gScore.get(nbr.to) ?? Infinity)) {
          cameFrom.set(nbr.to, { node: current, edge: nbr.edge });
          gScore.set(nbr.to, tentativeG);
          fScore.set(nbr.to, tentativeG + heuristic(nbr.to));
          openSet.add(nbr.to);
        }
      }
    }

    return null;
  }

  function findRoadRoute(
    rawGraph: RoadGraph,
    startCoord: [number, number],
    endCoord: [number, number],
    allCities: CityLocation[] = [],
    options: {
      allowSea?: boolean;
      preferSea?: boolean;
      avoidDifficult?: boolean;
      avoidTormenta?: boolean;
      penalizedEdges?: Set<string>;
      penaltyMultiplier?: number;
    } = {}
  ): CalculatedRouteResult | null {
    if (!rawGraph || !rawGraph.nodes || !rawGraph.edges) return null;

    const allowSea = options.allowSea !== false;
    const filteredEdges = rawGraph.edges.filter(e => {
      if (!allowSea && e.kind === 'maritima') return false;
      if (options.avoidDifficult && Array.isArray(e.conditions) && e.conditions.includes('terrenoDificil')) {
        return false;
      }
      if (options.avoidTormenta && Array.isArray(e.conditions) && e.conditions.includes('zonaTormenta')) {
        return false;
      }
      return true;
    });

    if (filteredEdges.length === 0) return null;

    // Identifica o maior componente conexo caso filtros tenham criado ilhas isoladas
    const nodeAdj = new Map<string, string[]>();
    filteredEdges.forEach(e => {
      if (!nodeAdj.has(e.from)) nodeAdj.set(e.from, []);
      if (!nodeAdj.has(e.to)) nodeAdj.set(e.to, []);
      nodeAdj.get(e.from)!.push(e.to);
      nodeAdj.get(e.to)!.push(e.from);
    });

    const graph = {
      nodeCoords: new Map<string, [number, number]>(rawGraph.nodes.map(n => [n.id, n.coord])),
      edges: filteredEdges.map(e => ({ ...e, path: [...e.path] }))
    };

    // Encontra o maior componente conexo para garantir que a origem não caia numa ilha isolada de 1-2 arestas
    const visitedAll = new Set<string>();
    let largestComponent = new Set<string>();
    for (const nId of nodeAdj.keys()) {
      if (visitedAll.has(nId)) continue;
      const comp = getReachableNodes(graph, nId, allowSea);
      comp.forEach(v => visitedAll.add(v));
      if (comp.size > largestComponent.size) {
        largestComponent = comp;
      }
    }

    const allowedForStart = largestComponent.size > 5 ? largestComponent : undefined;
    const startNode = attachPointToGraph(graph, startCoord, '::start', allowedForStart, allowSea);
    if (!startNode) return null;

    const reachableFromStart = getReachableNodes(graph, startNode, allowSea);
    const endNode = attachPointToGraph(graph, endCoord, '::end', reachableFromStart, allowSea);
    if (!endNode) return null;

    const edges = runAStar(graph, startNode, endNode, options);
    if (!edges || edges.length === 0) return null;

    const startNodeCoord = graph.nodeCoords.get(startNode);
    const endNodeCoord = graph.nodeCoords.get(endNode);
    const offGridStartKm = startNodeCoord ? distUnits(startCoord, startNodeCoord) * KM_PER_MAP_UNIT : 0;
    const offGridEndKm = endNodeCoord ? distUnits(endCoord, endNodeCoord) * KM_PER_MAP_UNIT : 0;

    const fullPath: [number, number][] = [startCoord];
    const rawRoadPath: [number, number][] = [];
    const segments: RouteSegment[] = [];

    if (offGridStartKm > 0.5 && startNodeCoord) {
      segments.push({
        type: 'offgrid',
        connectorPos: 'start',
        path: [startCoord, startNodeCoord],
        km: Math.round(offGridStartKm)
      });
    }

    const condKey = (conds?: string[]) => [...(conds ?? [])].sort().join(',');

    let currNode = startNode;
    let roadKm = 0;
    let seaKm = 0;
    let tormentaKm = 0;
    let difficultKm = 0;
    let difficultSeaKm = 0;
    let warKm = 0;
    const conditionKm: Record<string, number> = {
      terrenoDificil: 0,
      zonaTormenta: 0,
      guerra: 0
    };
    const edgeKmMap = new Map<string, number>();

    edges.forEach(e => {
      const forward = e.from === currNode;
      const pts = forward ? e.path : [...e.path].reverse();
      const edgeType: 'road' | 'sea' = e.kind === 'maritima' ? 'sea' : 'road';
      const km = pathKm(e.path);
      const baseId = e.id.split('::')[0];
      edgeKmMap.set(baseId, (edgeKmMap.get(baseId) ?? 0) + km);

      pts.forEach(p => {
        if (rawRoadPath.length === 0 || !sameCoord(rawRoadPath[rawRoadPath.length - 1], p)) {
          rawRoadPath.push(p);
        }
        if (fullPath.length === 0 || !sameCoord(fullPath[fullPath.length - 1], p)) {
          fullPath.push(p);
        }
      });

      const lastSeg = segments[segments.length - 1];
      if (
        lastSeg &&
        lastSeg.type === edgeType &&
        lastSeg.kind === e.kind &&
        lastSeg.name === e.name &&
        condKey(lastSeg.conditions) === condKey(e.conditions)
      ) {
        pts.forEach(p => {
          if (lastSeg.path.length === 0 || !sameCoord(lastSeg.path[lastSeg.path.length - 1], p)) {
            lastSeg.path.push(p);
          }
        });
        lastSeg.km = Math.round(lastSeg.km + km);
      } else {
        segments.push({
          type: edgeType,
          kind: e.kind,
          name: e.name,
          conditions: [...(e.conditions ?? [])],
          path: [...pts],
          km: Math.round(km)
        });
      }

      if (e.kind === 'maritima') {
        seaKm += km;
      } else {
        roadKm += km;
      }

      if (Array.isArray(e.conditions)) {
        e.conditions.forEach(c => {
          conditionKm[c] = (conditionKm[c] ?? 0) + km;
        });
        if (e.conditions.includes('zonaTormenta')) tormentaKm += km;
        if (e.conditions.includes('guerra')) warKm += km;
        if (e.conditions.includes('terrenoDificil')) {
          if (e.kind === 'maritima') difficultSeaKm += km;
          else difficultKm += km;
        }
      }

      currNode = forward ? e.to : e.from;
    });

    if (offGridEndKm > 0.5 && endNodeCoord) {
      segments.push({
        type: 'offgrid',
        connectorPos: 'end',
        path: [endNodeCoord, endCoord],
        km: Math.round(offGridEndKm)
      });
    }

    if (segments.length === 0) {
      segments.push({
        type: 'offgrid',
        connectorPos: 'start',
        path: fullPath,
        km: Math.round(roadKm + seaKm + offGridStartKm + offGridEndKm)
      });
    }

    if (!sameCoord(fullPath[fullPath.length - 1], endCoord)) {
      fullPath.push(endCoord);
    }

    const roadPath = densifyPath(rawRoadPath.length >= 2 ? rawRoadPath : fullPath, 0.75);

    // Gerador de passos detalhados (estilo Fichas de Nimb)
    const steps: RouteStep[] = [];
    if (Math.round(offGridStartKm) >= 1) {
      steps.push({
        icon: 'walk',
        text: `Siga por ${Math.round(offGridStartKm)} km fora da estrada até alcançar a malha`,
        km: Math.round(offGridStartKm)
      });
    }

    let walkSegKm = 0;
    let seaSegKm = 0;
    let inSea = false;
    currNode = startNode;

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const isSea = e.kind === 'maritima';
      const km = Math.round(e.lengthKm || pathKm(e.path));
      const nextNode = e.from === currNode ? e.to : e.from;
      const nextCoord = graph.nodeCoords.get(nextNode);

      let waypointCity: string | null = null;
      if (nextCoord) {
        const found = allCities.find(c => distUnits(c.coordinates, nextCoord) * KM_PER_MAP_UNIT <= 12);
        if (found) waypointCity = found.name;
      }

      if (isSea && !inSea) {
        if (walkSegKm > 0) {
          steps.push({
            icon: 'walk',
            text: `Após ${walkSegKm} km, embarque no porto`,
            km: walkSegKm
          });
          walkSegKm = 0;
        } else {
          steps.push({
            icon: 'walk',
            text: `Embarque no porto`,
            km: 0
          });
        }
        inSea = true;
      } else if (!isSea && inSea) {
        if (seaSegKm > 0) {
          steps.push({
            icon: 'sea',
            text: `Navegue por ${seaSegKm} km e desembarque`,
            km: seaSegKm
          });
          seaSegKm = 0;
        }
        inSea = false;
      }

      if (isSea) {
        seaSegKm += km;
        if (waypointCity || i === edges.length - 1 || seaSegKm >= 450) {
          const via = e.name ? ` via ${e.name}` : '';
          const dest = waypointCity ? ` até ${waypointCity}` : (i === edges.length - 1 ? ' até o ponto de desembarque' : '');
          steps.push({
            icon: 'sea',
            text: `Navegue por ${seaSegKm} km${via}${dest}`,
            km: seaSegKm
          });
          seaSegKm = 0;
        }
      } else {
        walkSegKm += km;
        if (waypointCity || i === edges.length - 1 || walkSegKm >= 400) {
          const via = e.name ? ` via ${e.name}` : '';
          const dest = waypointCity ? ` até ${waypointCity}` : (i === edges.length - 1 ? ' até a saída da malha' : '');
          steps.push({
            icon: 'walk',
            text: `Siga por ${walkSegKm} km${via}${dest}`,
            km: walkSegKm
          });
          walkSegKm = 0;
        }
      }

      currNode = nextNode;
    }

    if (inSea && seaSegKm > 0) {
      steps.push({
        icon: 'sea',
        text: `Navegue por ${seaSegKm} km e desembarque`,
        km: seaSegKm
      });
    } else if (!inSea && walkSegKm > 0) {
      steps.push({
        icon: 'walk',
        text: `Siga por ${walkSegKm} km até a saída da malha`,
        km: walkSegKm
      });
    }

    if (Math.round(offGridEndKm) >= 1) {
      steps.push({
        icon: 'walk',
        text: `Deixe a estrada e siga por ${Math.round(offGridEndKm)} km até o destino`,
        km: Math.round(offGridEndKm)
      });
    }

    const totalKm = Math.round(roadKm + seaKm + offGridStartKm + offGridEndKm);

    return {
      path: fullPath,
      roadPath,
      segments,
      roadKm: Math.round(roadKm),
      seaKm: Math.round(seaKm),
      totalKm,
      offGridStartKm: Math.round(offGridStartKm),
      offGridEndKm: Math.round(offGridEndKm),
      tormentaKm: Math.round(tormentaKm),
      difficultKm: Math.round(difficultKm),
      difficultSeaKm: Math.round(difficultSeaKm),
      warKm: Math.round(warKm),
      conditionKm: {
        terrenoDificil: Math.round(conditionKm.terrenoDificil || 0),
        zonaTormenta: Math.round(conditionKm.zonaTormenta || 0),
        guerra: Math.round(conditionKm.guerra || 0)
      },
      steps,
      edgeKeys: edges.map(e => e.id.split('::')[0]),
      edgeKmMap
    };
  }

  function calculateAerialBalloonRoutes(
    orig: CityLocation,
    dest: CityLocation,
    kingdoms: KingdomBoundary[]
  ): Array<{ id: string; label: string; isParabola: boolean; calc: CalculatedRouteResult; crossesUivantes: boolean }> {
    const p0 = orig.coordinates;
    const p1 = dest.coordinates;
    const uivantes = kingdoms.find(k => k.name.toLowerCase().includes('uivan'));
    const uivPoly = uivantes && Array.isArray(uivantes.coordinates) ? uivantes.coordinates : [];

    // 1. Analisa a linha reta dividindo os trechos dentro e fora das Montanhas Uivantes
    const sampleSteps = 160;
    const straightSegments: RouteSegment[] = [];
    const straightPoints: [number, number][] = [p0];
    let uivantesDiffKm = 0;
    let totalStraightKm = 0;

    let currentInside = uivPoly.length >= 3 ? pointInPolygon(p0, uivPoly) : false;
    let currentSegPath: [number, number][] = [p0];
    let currentSegKm = 0;

    for (let i = 1; i <= sampleSteps; i++) {
      const t = i / sampleSteps;
      const pt: [number, number] = [
        p0[0] + (p1[0] - p0[0]) * t,
        p0[1] + (p1[1] - p0[1]) * t
      ];
      const prev = straightPoints[straightPoints.length - 1];
      const stepKm = distUnits(prev, pt) * KM_PER_MAP_UNIT;
      totalStraightKm += stepKm;
      straightPoints.push(pt);

      const midPt: [number, number] = [(prev[0] + pt[0]) / 2, (prev[1] + pt[1]) / 2];
      const inside = uivPoly.length >= 3 ? pointInPolygon(midPt, uivPoly) : false;

      if (inside) {
        uivantesDiffKm += stepKm;
      }

      if (inside !== currentInside && currentSegPath.length >= 2) {
        straightSegments.push({
          type: 'road',
          kind: 'estrada',
          conditions: currentInside ? ['terrenoDificil'] : [],
          path: [...currentSegPath],
          km: Math.round(currentSegKm)
        });
        currentInside = inside;
        currentSegPath = [prev, pt];
        currentSegKm = stepKm;
      } else {
        currentSegPath.push(pt);
        currentSegKm += stepKm;
      }
    }

    if (currentSegPath.length >= 2) {
      straightSegments.push({
        type: 'road',
        kind: 'estrada',
        conditions: currentInside ? ['terrenoDificil'] : [],
        path: [...currentSegPath],
        km: Math.round(currentSegKm)
      });
    }

    const roundedStraightKm = Math.round(totalStraightKm);
    const roundedUivDiffKm = Math.round(uivantesDiffKm);
    const crossesUivantes = roundedUivDiffKm >= 5;

    const straightSteps: RouteStep[] = [
      {
        icon: 'walk',
        text: crossesUivantes
          ? `Voo direto em linha reta por ${roundedStraightKm.toLocaleString('pt-BR')} km de ${orig.name} até ${dest.name} (${roundedUivDiffKm.toLocaleString('pt-BR')} km atravessando o clima hostil das Montanhas Uivantes)`
          : `Voo aéreo direto em linha reta por ${roundedStraightKm.toLocaleString('pt-BR')} km de ${orig.name} até ${dest.name}`,
        km: roundedStraightKm
      }
    ];

    const straightCalc: CalculatedRouteResult = {
      path: straightPoints,
      roadPath: densifyPath([p0, p1], 0.75),
      segments: straightSegments,
      roadKm: roundedStraightKm,
      seaKm: 0,
      totalKm: roundedStraightKm,
      offGridStartKm: 0,
      offGridEndKm: 0,
      tormentaKm: 0,
      difficultKm: crossesUivantes ? roundedUivDiffKm : 0,
      difficultSeaKm: 0,
      warKm: 0,
      conditionKm: {
        terrenoDificil: crossesUivantes ? roundedUivDiffKm : 0,
        zonaTormenta: 0,
        guerra: 0
      },
      steps: straightSteps
    };

    const results: Array<{ id: string; label: string; isParabola: boolean; calc: CalculatedRouteResult; crossesUivantes: boolean }> = [
      {
        id: 'air-balloon',
        label: 'Balão Goblin',
        isParabola: false,
        calc: straightCalc,
        crossesUivantes
      }
    ];

    // 2. Se cruzar as Montanhas Uivantes e os extremos não estiverem dentro delas, calcula o arco enxuto de menor concavidade rente à borda
    if (crossesUivantes && uivPoly.length >= 3 && !pointInPolygon(p0, uivPoly) && !pointInPolygon(p1, uivPoly)) {
      const dy = p1[0] - p0[0];
      const dx = p1[1] - p0[1];
      const chordLen = Math.hypot(dy, dx);
      if (chordLen > 1e-5) {
        const ny = -dx / chordLen;
        const nx = dy / chordLen;
        const M = 120;

        const parabolaAvoidsUivantes = (pts: [number, number][]): boolean => {
          for (let i = 0; i < pts.length; i++) {
            if (pointInPolygon(pts[i], uivPoly)) return false;
            if (i > 0) {
              const mid: [number, number] = [
                (pts[i - 1][0] + pts[i][0]) / 2,
                (pts[i - 1][1] + pts[i][1]) / 2
              ];
              if (pointInPolygon(mid, uivPoly)) return false;
            }
          }
          return true;
        };

        let bestArc: { path: [number, number][]; km: number } | null = null;

        for (const sign of [-1, 1]) {
          const req = new Array<number>(M + 1).fill(0);
          let feasible = true;

          for (let i = 1; i < M; i++) {
            const u = i / M;
            let furthest = 0;
            let hit = false;
            for (let mag = 0; mag <= 36; mag += 0.15) {
              const p = sign * mag;
              const pt: [number, number] = [
                p0[0] + dy * u + ny * p,
                p0[1] + dx * u + nx * p
              ];
              if (pointInPolygon(pt, uivPoly)) {
                furthest = mag;
                hit = true;
              }
            }
            if (furthest >= 35.5) {
              feasible = false;
              break;
            }
            req[i] = hit ? sign * (furthest + 0.35) : 0;
          }

          if (!feasible) continue;

          // Envoltória convexa estrita para formar um único arco enxuto sem ondulações
          const hull: Array<{ i: number; u: number; p: number }> = [];
          for (let i = 0; i <= M; i++) {
            const pt = { i, u: i / M, p: req[i] };
            while (hull.length >= 2) {
              const a = hull[hull.length - 2];
              const b = hull[hull.length - 1];
              const cross = (b.u - a.u) * (pt.p - a.p) - (b.p - a.p) * (pt.u - a.u);
              if (sign < 0 ? cross <= 0 : cross >= 0) {
                hull.pop();
              } else {
                break;
              }
            }
            hull.push(pt);
          }

          let prof = new Array<number>(M + 1).fill(0);
          for (let h = 0; h < hull.length - 1; h++) {
            const a = hull[h];
            const b = hull[h + 1];
            const spanU = b.u - a.u;
            for (let i = a.i; i <= b.i; i++) {
              const t = b.i === a.i ? 0 : (i - a.i) / (b.i - a.i);
              if (a.i === 0) {
                prof[i] = b.p * (1 - Math.pow(1 - t, 1.55));
              } else if (b.i === M) {
                prof[i] = a.p * (1 - Math.pow(t, 1.55));
              } else {
                const lin = a.p + (b.p - a.p) * t;
                const bow = sign * 0.25 * spanU * Math.max(Math.abs(a.p), Math.abs(b.p)) * 4 * t * (1 - t);
                prof[i] = lin + bow;
              }
            }
          }

          // Suavização gaussiana livre para arredondar cantos sem quinas triangulares
          for (let iter = 0; iter < 40; iter++) {
            const next = new Array<number>(M + 1).fill(0);
            for (let i = 1; i < M; i++) {
              next[i] = 0.25 * prof[i - 1] + 0.5 * prof[i] + 0.25 * prof[i + 1];
            }
            prof = next;
          }

          // Restaura suavemente qualquer ponto que tenha encostado na fronteira com um sino gaussiano adaptativo
          for (let pass = 0; pass < 8; pass++) {
            let worstI = -1;
            let worstDef = 0;
            for (let i = 1; i < M; i++) {
              const def = Math.abs(req[i]) - Math.abs(prof[i]);
              if (def > worstDef) {
                worstDef = def;
                worstI = i;
              }
            }
            if (worstDef <= 0 || worstI < 0) break;
            const sigma = Math.max(2.5, Math.min(14, worstI * 0.65, (M - worstI) * 0.65));
            for (let i = 1; i < M; i++) {
              const w = Math.exp(-Math.pow((i - worstI) / sigma, 2));
              prof[i] += sign * (worstDef + 0.05) * w;
            }
          }
          prof[0] = 0;
          prof[M] = 0;

          let pts: [number, number][] = [];
          for (let i = 0; i <= M; i++) {
            const u = i / M;
            pts.push([
              p0[0] + dy * u + ny * prof[i],
              p0[1] + dx * u + nx * prof[i]
            ]);
          }

          for (let iter = 0; iter < 30; iter++) {
            const next: [number, number][] = [pts[0]];
            for (let i = 1; i < pts.length - 1; i++) {
              const cand: [number, number] = [
                0.25 * pts[i - 1][0] + 0.5 * pts[i][0] + 0.25 * pts[i + 1][0],
                0.25 * pts[i - 1][1] + 0.5 * pts[i][1] + 0.25 * pts[i + 1][1]
              ];
              const mid1: [number, number] = [(pts[i - 1][0] + cand[0]) / 2, (pts[i - 1][1] + cand[1]) / 2];
              const mid2: [number, number] = [(pts[i + 1][0] + cand[0]) / 2, (pts[i + 1][1] + cand[1]) / 2];
              next.push(
                pointInPolygon(cand, uivPoly) || pointInPolygon(mid1, uivPoly) || pointInPolygon(mid2, uivPoly)
                  ? pts[i]
                  : cand
              );
            }
            next.push(pts[pts.length - 1]);
            pts = next;
          }

          if (parabolaAvoidsUivantes(pts)) {
            const km = pathKm(pts);
            if (!bestArc || km < bestArc.km) {
              bestArc = { path: pts, km };
            }
          }
        }

        if (bestArc) {
          const curveKm = Math.round(bestArc.km);
          const parabolaCalc: CalculatedRouteResult = {
            path: bestArc.path,
            roadPath: densifyPath(bestArc.path, 0.75),
            segments: [
              {
                type: 'road',
                kind: 'estrada',
                conditions: [],
                path: bestArc.path,
                km: curveKm
              }
            ],
            roadKm: curveKm,
            seaKm: 0,
            totalKm: curveKm,
            offGridStartKm: 0,
            offGridEndKm: 0,
            tormentaKm: 0,
            difficultKm: 0,
            difficultSeaKm: 0,
            warKm: 0,
            conditionKm: {
              terrenoDificil: 0,
              zonaTormenta: 0,
              guerra: 0
            },
            steps: [
              {
                icon: 'walk',
                text: `Voo contornando as Montanhas Uivantes por ${curveKm.toLocaleString('pt-BR')} km de ${orig.name} até ${dest.name}`,
                km: curveKm
              }
            ]
          };

          results.push({
            id: 'air-balloon-parabola',
            label: 'Balão Goblin',
            isParabola: true,
            calc: parabolaCalc,
            crossesUivantes: true
          });
        }
      }
    }

    return results;
  }

  /* ==============================================================
     INICIALIZAÇÃO DO VISUALIZADOR DE MAPA
     ============================================================== */
  function initMap() {
    if (typeof L === 'undefined') {
      setTimeout(initMap, 100);
      return;
    }

    const viewport = document.getElementById('mapViewport');
    const mapContainer = document.getElementById('artonLeafletMap');
    if (!viewport || !mapContainer) return;

    // Inicializar mapa
    const defaultDef = MAP_DEFINITIONS.arton;
    const map = L.map('artonLeafletMap', {
      crs: L.CRS.Simple,
      center: defaultDef.center,
      zoom: defaultDef.defaultZoom,
      minZoom: defaultDef.minZoom,
      maxZoom: defaultDef.maxZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Grupos de camadas
    const kingdomsLayer = L.layerGroup();
    const capitalsLayer = L.layerGroup().addTo(map);
    const citiesLayer = L.layerGroup().addTo(map);
    const customMarkersLayer = L.layerGroup().addTo(map);
    const measureLayer = L.layerGroup().addTo(map);
    const routeVisualLayer = L.layerGroup().addTo(map);

    let currentMapId = 'arton';
    let currentTileLayer: any = null;
    let citiesDef: CityLocation[] = [];
    let kingdomsDef: KingdomBoundary[] = [];
    let roadGraphData: RoadGraph | null = null;
    let customMarkers: CustomMarker[] = loadSavedMarkers();
    const cityMarkerMap = new Map<string, any>();

    function loadMapDataFor(mapId: string) {
      const dataStore = (window as any).__FORJA_DATA__?.DATA || (window as any).DATA || {};
      if (mapId === 'arton') {
        const artonData = dataStore.mapLocations || {};
        citiesDef = Array.isArray(artonData.citiesDef) ? artonData.citiesDef : [];
        kingdomsDef = Array.isArray(artonData.kingdomsDef) ? artonData.kingdomsDef : [];
        roadGraphData = dataStore.mapRoads || null;
      } else if (mapId === 'tamura') {
        const tamuraData = dataStore.mapTamura || {};
        citiesDef = Array.isArray(tamuraData.cities) ? tamuraData.cities : [];
        kingdomsDef = [];
        roadGraphData = null;
      } else if (mapId === 'lamnor') {
        const lamnorData = dataStore.mapLamnor || {};
        citiesDef = Array.isArray(lamnorData.cities) ? lamnorData.cities : [];
        kingdomsDef = [];
        roadGraphData = null;
      } else if (mapId === 'doherimm') {
        const doherimmData = dataStore.mapDoherimm || {};
        citiesDef = Array.isArray(doherimmData.cities) ? doherimmData.cities : [];
        kingdomsDef = [];
        roadGraphData = null;
      } else if (mapId === 'moreania') {
        const moreaniaData = dataStore.mapMoreania || {};
        citiesDef = Array.isArray(moreaniaData.cities) ? moreaniaData.cities : [];
        kingdomsDef = [];
        roadGraphData = null;
      }
    }

    function renderKingdomBoundaries() {
      kingdomsLayer.clearLayers();
      kingdomsDef.forEach(kingdom => {
        if (!Array.isArray(kingdom.coordinates) || kingdom.coordinates.length < 3) return;
        const color = kingdom.color || '#9932CC';
        const poly = L.polygon(kingdom.coordinates, {
          color: color,
          fillColor: color,
          fillOpacity: 0.16,
          weight: 2,
          bubblingMouseEvents: true,
          className: 'kingdom-boundary-polygon'
        });
        poly.bindTooltip(kingdom.name, {
          sticky: true,
          direction: 'auto',
          className: 'leaflet-tooltip'
        });
        kingdomsLayer.addLayer(poly);
      });
    }

    function renderCityMarkers() {
      capitalsLayer.clearLayers();
      citiesLayer.clearLayers();
      cityMarkerMap.clear();

      citiesDef.forEach(city => {
        if (!Array.isArray(city.coordinates) || city.coordinates.length < 2) return;
        const icon = city.isCapital ? createCapitalPinIcon(getCityColor(city)) : createCityPinIcon(getCityColor(city));
        const marker = L.marker(city.coordinates, { icon, title: city.name });

        marker.bindTooltip(city.name, {
          direction: 'top',
          offset: city.isCapital ? [0, -24] : [0, -16],
          className: 'leaflet-tooltip'
        });

        marker.bindPopup(() => createLocationPopupHtml(city));
        cityMarkerMap.set(city.name.toLowerCase(), { marker, city });

        if (city.isCapital) capitalsLayer.addLayer(marker);
        else citiesLayer.addLayer(marker);
      });
    }

    function updateKingdomFilterSelect() {
      const searchInp = document.getElementById('mapSearchInput') as HTMLInputElement | null;
      if (searchInp) searchInp.value = '';
      const searchDrop = document.getElementById('mapSearchDropdownList');
      if (searchDrop) searchDrop.style.display = 'none';
    }

    function switchMap(mapId: string) {
      const def = MAP_DEFINITIONS[mapId] || MAP_DEFINITIONS.arton;
      currentMapId = def.id;

      clearMeasure();
      clearRoute();

      if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
      }

      currentTileLayer = L.tileLayer(getMapTileUrl(def.id), {
        tms: true,
        minZoom: def.minZoom,
        maxZoom: def.maxZoom,
        maxNativeZoom: def.maxZoom,
        noWrap: true
      }).addTo(map);

      map.setMinZoom(def.minZoom);
      map.setMaxZoom(def.maxZoom);
      map.setView(def.center, def.defaultZoom);

      loadMapDataFor(def.id);
      renderKingdomBoundaries();
      renderCityMarkers();
      updateKingdomFilterSelect();

      const mapSelector = document.getElementById('mapSelector') as HTMLSelectElement | null;
      if (mapSelector && mapSelector.value !== def.id) {
        mapSelector.value = def.id;
      }

      document.title = def.id === 'arton' ? 'Mapa de Arton · Forja Rubra' : `Mapa de ${def.name} · Forja Rubra`;
    }

    /* ==============================================================
       1 & 2. ARRASTAR COM BOTÃO DIREITO E CANCELAR MEDIÇÃO
       ============================================================== */
    let isRightMouseDown = false;
    let rightStartX = 0;
    let rightStartY = 0;
    let rightMovedDistance = 0;

    // Previne o menu de contexto do navegador no mapa
    viewport.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });

    viewport.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown = true;
        rightStartX = e.clientX;
        rightStartY = e.clientY;
        rightMovedDistance = 0;
        viewport.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (isRightMouseDown) {
        const dx = e.clientX - rightStartX;
        const dy = e.clientY - rightStartY;
        rightMovedDistance += Math.hypot(dx, dy);
        map.panBy([-dx, -dy], { animate: false });
        rightStartX = e.clientX;
        rightStartY = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 2) {
        viewport.style.cursor = '';
        const wasDrag = rightMovedDistance > 5;
        isRightMouseDown = false;

        // Se foi apenas um clique com o botão direito (sem arrasto significativo):
        if (!wasDrag) {
          if (measureState.active) {
            clearMeasure();
            showMapToast('Medição cancelada.', 2500);
          } else if (routeState.active) {
            clearRoute();
            showMapToast('Escolhas de rota limpas.', 2500);
          }
        }
      }
    });

    function createLocationPopupHtml(city: CityLocation): string {
      const isCap = !!city.isCapital;
      const color = getCityColor(city);
      const desc = city.description || 'Nenhum detalhe histórico registrado nos anais de Arton.';
      const kingdomHtml = city.kingdom ? `
        <div style="font-size:0.75rem;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
          Reino: ${city.kingdom}
        </div>
      ` : '';

      let isSettingDest = false;
      let btnText = 'Rotas';
      let btnBg = '#b91c1c';
      let btnBorder = '#dc2626';

      if (routeState.active && routeState.originCity && routeState.originCity.name !== city.name) {
        isSettingDest = true;
        if (!routeState.destCity) {
          btnText = 'Definir destino';
          btnBg = '#991b1b';
          btnBorder = '#ef4444';
        } else {
          btnText = 'Redefinir Destino';
          btnBg = '#991b1b';
          btnBorder = '#ef4444';
        }
      }

      return `
        <div style="padding:14px 16px;min-width:240px;max-width:320px;font-family:'Cinzel',serif;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:4px;background:rgba(212,175,55,0.18);border:1px solid rgba(212,175,55,0.45);color:#f0d28c;">
              ${isCap ? 'Capital' : 'Localidade Oficial'}
            </span>
          </div>
          <h3 style="margin:4px 0 8px;font-size:1.15rem;color:#ffffff;border-bottom:1px solid #1e293b;padding-bottom:6px;line-height:1.2;">
            ${city.name}
          </h3>
          ${kingdomHtml}
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:0.83rem;color:#cbd5e1;line-height:1.5;margin-bottom:12px;max-height:180px;overflow-y:auto;">
            ${desc}
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button type="button" class="btn-start-road-route" data-lat="${city.coordinates[0]}" data-lng="${city.coordinates[1]}" data-name="${city.name}" style="background:${btnBg};border:1px solid ${btnBorder};color:#ffffff;padding:6px 14px;border-radius:5px;font-size:0.78rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(0,0,0,0.4);transition:all 0.15s;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${isSettingDest ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>' : '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a3 3 0 0 1 0-6h11"></path><circle cx="18" cy="4" r="3"></circle>'}
              </svg>
              ${btnText}
            </button>
          </div>
        </div>
      `;
    }

    citiesDef.forEach(city => {
      if (!Array.isArray(city.coordinates) || city.coordinates.length < 2) return;
      const icon = city.isCapital ? createCapitalPinIcon(getCityColor(city)) : createCityPinIcon(getCityColor(city));
      const marker = L.marker(city.coordinates, { icon, title: city.name });

      marker.bindTooltip(city.name, {
        direction: 'top',
        offset: city.isCapital ? [0, -24] : [0, -16],
        className: 'leaflet-tooltip'
      });

      marker.bindPopup(() => createLocationPopupHtml(city));

      cityMarkerMap.set(city.name.toLowerCase(), { marker, city });

      if (city.isCapital) capitalsLayer.addLayer(marker);
      else citiesLayer.addLayer(marker);
    });

    function renderCustomMarkers() {
      customMarkersLayer.clearLayers();
      customMarkers.forEach(m => {
        const marker = L.marker(m.coordinates, {
          icon: createCustomPinIcon(CUSTOM_MARKER_COLOR),
          title: m.name
        });

        marker.bindTooltip(m.name, {
          direction: 'top',
          offset: [0, -19],
          className: 'leaflet-tooltip'
        });

        marker.bindPopup(() => {
          let isSettingDest = false;
          let btnText = 'Rotas';
          let btnBg = '#b91c1c';
          let btnBorder = '#dc2626';

          if (routeState.active && routeState.originCity && routeState.originCity.name !== m.name) {
            isSettingDest = true;
            if (!routeState.destCity) {
              btnText = 'Definir destino';
              btnBg = '#991b1b';
              btnBorder = '#ef4444';
            } else {
              btnText = 'Redefinir Destino';
              btnBg = '#991b1b';
              btnBorder = '#ef4444';
            }
          }

          return `
            <div style="padding:14px 16px;min-width:220px;max-width:280px;font-family:'Cinzel',serif;">
              <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:rgba(212,175,55,0.18);border:1px solid rgba(212,175,55,0.45);color:#f0d28c;">
                Meu Marcador
              </span>
              <h3 style="margin:6px 0 8px;font-size:1.1rem;color:#ffffff;line-height:1.2;">${m.name}</h3>
              <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:0.82rem;color:#cbd5e1;line-height:1.4;margin-bottom:12px;">
                ${m.description || 'Ponto de interesse personalizado.'}
              </p>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <button type="button" class="btn-start-road-route" data-lat="${m.coordinates[0]}" data-lng="${m.coordinates[1]}" data-name="${m.name}" style="background:${btnBg};border:1px solid ${btnBorder};color:#fff;padding:5px 12px;border-radius:4px;font-size:0.74rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${isSettingDest ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>' : '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a3 3 0 0 1 0-6h11"></path><circle cx="18" cy="4" r="3"></circle>'}
                  </svg>
                  ${btnText}
                </button>
                <button type="button" class="btn-delete-custom" data-id="${m.id}" style="background:#7f1d1d;border:1px solid #ef4444;color:#fff;padding:5px 10px;border-radius:4px;font-size:0.72rem;font-weight:700;cursor:pointer;">
                  Excluir
                </button>
              </div>
            </div>
          `;
        });

        customMarkersLayer.addLayer(marker);
      });
    }
    renderCustomMarkers();

    // Snapping magnético estrito para cidades (apenas se o cursor estiver a <= 12 pixels de tela da cidade)
    function getMagneticSnap(cursorLatLng: any): { point: [number, number]; city?: CityLocation } {
      const curLat = cursorLatLng.lat;
      const curLng = cursorLatLng.lng;
      const areVisible = map.hasLayer(capitalsLayer) || map.hasLayer(citiesLayer);
      if (!areVisible) return { point: [curLat, curLng] };

      let closest: CityLocation | null = null;
      let minPixelDist = Infinity;

      try {
        const cursorPt = map.latLngToContainerPoint([curLat, curLng]);
        citiesDef.forEach(c => {
          if (!Array.isArray(c.coordinates)) return;
          const cPt = map.latLngToContainerPoint(c.coordinates);
          const distPx = cursorPt.distanceTo(cPt);
          if (distPx < minPixelDist) {
            minPixelDist = distPx;
            closest = c;
          }
        });

        // Se e somente se o clique ou cursor estiver colado no marcador (<= 12px)
        if (closest && minPixelDist <= 12) {
          return { point: (closest as CityLocation).coordinates, city: closest };
        }
      } catch {
        let minD = Infinity;
        citiesDef.forEach(c => {
          if (!Array.isArray(c.coordinates)) return;
          const d = Math.hypot(c.coordinates[0] - curLat, c.coordinates[1] - curLng);
          if (d < minD) {
            minD = d;
            closest = c;
          }
        });
        if (closest && minD <= 0.6) {
          return { point: (closest as CityLocation).coordinates, city: closest };
        }
      }

      return { point: [curLat, curLng] };
    }

    /* ==============================================================
       3A. SISTEMA DE MEDIÇÃO DE DISTÂNCIA DIRETA (LINHA DINÂMICA)
       ============================================================== */
    const measureState = {
      active: false,
      startPoint: null as [number, number] | null,
      fixed: false
    };

    let measurePolyline: any = null;
    let measureStartPin: any = null;
    let measureEndPin: any = null;
    let measureTooltip: any = null;

    const btnToggleMeasure = document.getElementById('btnToggleMeasure');

    function clearMeasure() {
      measureState.active = false;
      measureState.startPoint = null;
      measureState.fixed = false;
      measureLayer.clearLayers();
      measurePolyline = null;
      measureStartPin = null;
      measureEndPin = null;
      measureTooltip = null;
      mapContainer.classList.remove('is-measuring');
      if (btnToggleMeasure) btnToggleMeasure.classList.remove('active');
    }

    function startMeasureAt(point: [number, number]) {
      clearMeasure();
      clearRoute();
      deactivateAddMarkerMode();

      measureState.active = true;
      measureState.startPoint = point;
      measureState.fixed = false;

      mapContainer.classList.add('is-measuring');
      if (btnToggleMeasure) btnToggleMeasure.classList.add('active');

      measureStartPin = L.marker(point, {
        icon: createEndpointIcon('#f59e0b'),
        interactive: false
      }).addTo(measureLayer);

      measureEndPin = L.marker(point, {
        icon: createEndpointIcon('#f59e0b'),
        interactive: false
      }).addTo(measureLayer);

      measurePolyline = L.polyline([point, point], {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '8, 6',
        opacity: 0.95
      }).addTo(measureLayer);

      measureTooltip = L.tooltip({
        permanent: true,
        direction: 'top',
        className: 'arton-measure-tooltip',
        offset: [0, -10]
      });
      measureTooltip.setLatLng(point);
      measureTooltip.setContent(`
        <div class="measure-km">0 km</div>
        <div class="measure-days">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          0 dias (9m)
        </div>
      `);
      measureTooltip.addTo(measureLayer);
    }

    function updateMeasureHover(point: [number, number]) {
      if (!measureState.active || !measureState.startPoint || measureState.fixed) return;
      if (!measurePolyline) return;

      measurePolyline.setLatLngs([measureState.startPoint, point]);

      if (measureEndPin) {
        measureEndPin.setLatLng(point);
      } else {
        measureEndPin = L.marker(point, {
          icon: createEndpointIcon('#f59e0b'),
          interactive: false
        }).addTo(measureLayer);
      }

      const dUnits = Math.hypot(point[0] - measureState.startPoint[0], point[1] - measureState.startPoint[1]);
      const km = Math.round(dUnits * KM_PER_MAP_UNIT);
      const days = Math.max(1, Math.round(km / KM_PER_TRAVEL_DAY_LAND));

      if (measureTooltip) {
        measureTooltip.setLatLng(point);
        measureTooltip.setContent(`
          <div class="measure-km">${km.toLocaleString('pt-BR')} km</div>
          <div class="measure-days">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${days} ${days === 1 ? 'dia' : 'dias'} (9m)
          </div>
        `);
      }
    }

    function fixMeasureAt(point: [number, number]) {
      if (!measureState.startPoint || !measurePolyline) return;
      measureState.fixed = true;

      measurePolyline.setLatLngs([measureState.startPoint, point]);

      if (measureEndPin) {
        measureEndPin.setLatLng(point);
      } else {
        measureEndPin = L.marker(point, {
          icon: createEndpointIcon('#f59e0b'),
          interactive: false
        }).addTo(measureLayer);
      }

      const dUnits = Math.hypot(point[0] - measureState.startPoint[0], point[1] - measureState.startPoint[1]);
      const km = Math.round(dUnits * KM_PER_MAP_UNIT);
      const days = Math.max(1, Math.round(km / KM_PER_TRAVEL_DAY_LAND));

      if (measureTooltip) {
        measureTooltip.setLatLng(point);
        measureTooltip.setContent(`
          <div class="measure-km">${km.toLocaleString('pt-BR')} km</div>
          <div class="measure-days">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${days} ${days === 1 ? 'dia' : 'dias'} (9m)
          </div>
        `);
      }
    }

    if (btnToggleMeasure) {
      btnToggleMeasure.addEventListener('click', () => {
        if (measureState.active) {
          clearMeasure();
        } else {
          clearRoute();
          deactivateAddMarkerMode();
          measureState.active = true;
          measureState.startPoint = null;
          measureState.fixed = false;
          mapContainer.classList.add('is-measuring');
          btnToggleMeasure.classList.add('active');
        }
      });
    }

    /* ==============================================================
       3B. SISTEMA DE ROTAS ESTILO GOOGLE MAPS / FICHAS DE NIMB
       ============================================================== */
    interface RouteOption {
      id: string;
      mode: 'land' | 'sea' | 'air';
      label: string;
      calc: CalculatedRouteResult;
      hasWarning: boolean;
      warningText?: string;
      isParabola?: boolean;
      crossesUivantes?: boolean;
    }

    type RouteTransportType = 'pe' | 'cavalo' | 'carruagem' | 'balao';
    type RouteBoatType = 'veleiro' | 'barco' | 'gale' | 'barcaca' | 'jangada';

    interface CustomDifficultStretch {
      a: number;
      b: number;
      km: number;
    }

    interface RouteSystemState {
      active: boolean;
      originCity: CityLocation | null;
      destCity: CityLocation | null;
      options: RouteOption[];
      selectedOptionIndex: number;
      selectedMode: 'land' | 'sea' | 'air';
      transportType: RouteTransportType;
      boatType: RouteBoatType;
      speedLandKmPerDay: number;
      speedSeaKmPerDay: number;
      isDifficult: boolean;
      avoidDifficult: boolean;
      avoidTormenta: boolean;
      expandedRoutes: boolean;
      canLoadMoreRoutes: boolean;
      isMarkingDifficult: boolean;
      markStartIdx: number | null;
      customDifficultStretches: CustomDifficultStretch[];
      customConnectorDifficult: { start: boolean; end: boolean };
      showSteps: boolean;
    }

    const routeState: RouteSystemState = {
      active: false,
      originCity: null,
      destCity: null,
      options: [],
      selectedOptionIndex: 0,
      selectedMode: 'land',
      transportType: 'pe',
      boatType: 'veleiro',
      speedLandKmPerDay: 36,
      speedSeaKmPerDay: 48,
      isDifficult: false,
      avoidDifficult: false,
      avoidTormenta: false,
      expandedRoutes: false,
      canLoadMoreRoutes: false,
      isMarkingDifficult: false,
      markStartIdx: null,
      customDifficultStretches: [],
      customConnectorDifficult: { start: false, end: false },
      showSteps: false
    };

    const routePanel = document.getElementById('mapRoutePanel');
    const btnToggleRoutes = document.getElementById('btnToggleRoutes');
    const btnCloseRoutePanel = document.getElementById('btnCloseRoutePanel');
    const routeOriginInput = document.getElementById('routeOriginInput') as HTMLInputElement | null;
    const routeDestInput = document.getElementById('routeDestInput') as HTMLInputElement | null;
    const routeOriginList = document.getElementById('routeOriginList');
    const routeDestList = document.getElementById('routeDestList');
    const btnSwapRoutePoints = document.getElementById('btnSwapRoutePoints');
    const routeSummaryBox = document.getElementById('routeSummaryBox');
    const routeKmHighlight = document.getElementById('routeKmHighlight');
    const routeTypeBadgeText = document.getElementById('routeTypeBadgeText');
    const routeBreakdownText = document.getElementById('routeBreakdownText');
    const routeWarningsContainer = document.getElementById('routeWarningsContainer');
    const routeOptionsCards = document.getElementById('routeOptionsCards');
    const btnLoadMoreRoutes = document.getElementById('btnLoadMoreRoutes');
    const btnToggleRouteSteps = document.getElementById('btnToggleRouteSteps');
    const routeStepsCount = document.getElementById('routeStepsCount');
    const routeStepsList = document.getElementById('routeStepsList');
    const routeTransportSelect = document.getElementById('routeTransportSelect') as HTMLSelectElement | null;
    const routeSpeedRow = document.getElementById('routeSpeedRow');
    const routeSpeedSelect = document.getElementById('routeSpeedSelect') as HTMLSelectElement | null;
    const routeBoatRow = document.getElementById('routeBoatRow');
    const routeBoatSelect = document.getElementById('routeBoatSelect') as HTMLSelectElement | null;
    const routeDifficultToggle = document.getElementById('routeDifficultToggle') as HTMLInputElement | null;
    const routeDifficultDesc = document.getElementById('routeDifficultDesc');
    const btnMarkDifficultStretch = document.getElementById('btnMarkDifficultStretch');
    const routeAvoidDifficultRow = document.getElementById('routeAvoidDifficultRow');
    const routeAvoidDifficultToggle = document.getElementById('routeAvoidDifficultToggle') as HTMLInputElement | null;
    const routeAvoidTormentaRow = document.getElementById('routeAvoidTormentaRow');
    const routeAvoidTormentaToggle = document.getElementById('routeAvoidTormentaToggle') as HTMLInputElement | null;
    const routeAerialBox = document.getElementById('routeAerialBox');
    const aerialTestsSummary = document.getElementById('aerialTestsSummary');
    const btnRollBalloonApp = document.getElementById('btnRollBalloonApp');
    const btnRollBalloonTable = document.getElementById('btnRollBalloonTable');
    const aerialDiceResults = document.getElementById('aerialDiceResults');
    const routeDaysText = document.getElementById('routeDaysText');
    const routeTransportCostVal = document.getElementById('routeTransportCostVal');
    const routeTransportCostDetails = document.getElementById('routeTransportCostDetails');
    const btnHireTransport = document.getElementById('btnHireTransport');
    const routeHireFeedback = document.getElementById('routeHireFeedback');
    const routeHeroWallet = document.getElementById('routeHeroWallet');
    const btnRouteInvert = document.getElementById('btnRouteInvert');
    const btnRouteClear = document.getElementById('btnRouteClear');

    // Modal de Contratação Estilo Taverna e Ajuda de Controles
    const mapHireTransportModal = document.getElementById('mapHireTransportModal');
    const hireModalTitle = document.getElementById('hireModalTitle');
    const btnCloseHireModal = document.getElementById('btnCloseHireModal');
    const hireModalDesc = document.getElementById('hireModalDesc');
    const hireModalUnitPrice = document.getElementById('hireModalUnitPrice');
    const hireUnitLabel = document.getElementById('hireUnitLabel');
    const btnHireQtyDec = document.getElementById('btnHireQtyDec');
    const hireQtyDisplay = document.getElementById('hireQtyDisplay');
    const btnHireQtyInc = document.getElementById('btnHireQtyInc');
    const btnBargainDec = document.getElementById('btnBargainDec');
    const hirePercentDisplay = document.getElementById('hirePercentDisplay');
    const btnBargainInc = document.getElementById('btnBargainInc');
    const btnBargainReset = document.getElementById('btnBargainReset');
    const hireTotalPrice = document.getElementById('hireTotalPrice');
    const hireBalanceNote = document.getElementById('hireBalanceNote');
    const hireModalAlert = document.getElementById('hireModalAlert');
    const btnCancelHireModal = document.getElementById('btnCancelHireModal');
    const btnConfirmHireModal = document.getElementById('btnConfirmHireModal');

    const btnMapControlsHelp = document.getElementById('btnMapControlsHelp');
    const mapControlsModal = document.getElementById('mapControlsModal');
    const btnCloseMapControlsModal = document.getElementById('btnCloseMapControlsModal');

    function getHeroWalletFunds(): number {
      try {
        const published = JSON.parse(localStorage.getItem('forja-saldo-personagem-ativo-v1') || 'null');
        if (published && Number.isFinite(Number(published.funds)) && Number(published.funds) >= 0) {
          return Number(published.funds);
        }
      } catch {}
      try {
        const rawW = localStorage.getItem('forja-taverna-wallet-v1');
        if (rawW && Number.isFinite(Number(rawW))) return Number(rawW);
      } catch {}
      try {
        const rawH = localStorage.getItem('forja-heroi-t20-v1');
        if (rawH) {
          const hero = JSON.parse(rawH);
          if (hero.funds != null) return Number(hero.funds);
          if (hero.dinheiro != null) return Number(hero.dinheiro);
        }
      } catch {}
      return 140;
    }

    function deductHeroWalletFunds(amount: number): boolean {
      const current = getHeroWalletFunds();
      if (current < amount) return false;
      const updated = Math.max(0, Math.round((current - amount) * 10) / 10);
      try {
        localStorage.setItem('forja-saldo-personagem-ativo-v1', JSON.stringify({ funds: updated, timestamp: Date.now() }));
        localStorage.setItem('forja-taverna-wallet-v1', String(updated));
        const rawH = localStorage.getItem('forja-heroi-t20-v1');
        if (rawH) {
          const hero = JSON.parse(rawH);
          hero.funds = updated;
          hero.dinheiro = updated;
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
        }
      } catch {}
      window.dispatchEvent(new Event('storage'));
      return true;
    }

    function updateHeroWalletDisplay() {
      if (routeHeroWallet) {
        const funds = getHeroWalletFunds();
        routeHeroWallet.textContent = `Saldo: T$ ${funds.toLocaleString('pt-BR')}`;
      }
    }

    function formatDaysValue(days: number): string {
      if (days < 1) return 'menos de 1 dia';
      if (days >= 60) {
        const at = Math.round(days);
        const rt = Math.floor(at / 30);
        const nt = at % 30;
        const ot = rt === 1 ? '1 mês' : `${rt} meses`;
        return nt === 0 ? ot : `${ot} e ${nt} ${nt === 1 ? 'dia' : 'dias'}`;
      }
      const et = Math.round(days * 10) / 10;
      const tt = et.toLocaleString('pt-BR');
      return et === 1 ? `${tt} dia` : `${tt} dias`;
    }

    function resetCustomDifficultOnRouteChange() {
      routeState.isMarkingDifficult = false;
      routeState.markStartIdx = null;
      routeState.customDifficultStretches = [];
      routeState.customConnectorDifficult = { start: false, end: false };
    }

    function clearRoute() {
      routeState.active = false;
      routeState.originCity = null;
      routeState.destCity = null;
      routeState.options = [];
      routeState.selectedOptionIndex = 0;
      routeState.selectedMode = 'land';
      routeState.expandedRoutes = false;
      routeState.canLoadMoreRoutes = false;
      routeState.showSteps = false;
      resetCustomDifficultOnRouteChange();

      routeVisualLayer.clearLayers();

      if (routeOriginInput) routeOriginInput.value = '';
      if (routeDestInput) routeDestInput.value = '';
      if (routeOriginList) routeOriginList.style.display = 'none';
      if (routeDestList) routeDestList.style.display = 'none';
      if (routeSummaryBox) routeSummaryBox.style.display = 'none';
      if (routePanel) routePanel.style.display = 'none';
      if (routeAerialBox) routeAerialBox.style.display = 'none';
      if (aerialDiceResults) {
        aerialDiceResults.style.display = 'none';
        aerialDiceResults.innerHTML = '';
      }
      if (btnToggleRoutes) btnToggleRoutes.classList.remove('active');
    }

    function openRoutePanel(initialOrigin?: CityLocation) {
      clearMeasure();
      deactivateAddMarkerMode();
      routeState.active = true;

      if (btnToggleRoutes) btnToggleRoutes.classList.add('active');
      if (routePanel) routePanel.style.display = 'flex';
      updateHeroWalletDisplay();

      if (initialOrigin) {
        routeState.originCity = initialOrigin;
        if (routeOriginInput) routeOriginInput.value = initialOrigin.name;
        if (routeDestInput) {
          routeDestInput.value = '';
          routeDestInput.focus();
        }
      }
    }

    function getRouteModeLabel(calc: CalculatedRouteResult): string {
      const totalRoadAndSea = calc.roadKm + calc.seaKm;
      const seaRatio = totalRoadAndSea > 0 ? calc.seaKm / totalRoadAndSea : 0;
      if (seaRatio >= 0.85) return 'Pelo mar';
      if (calc.seaKm > 0.5) return 'Terra + mar';
      return 'Por terra';
    }

    function computeOverlapRatio(candidate: CalculatedRouteResult, existing: CalculatedRouteResult): number {
      if (!candidate.edgeKmMap || !existing.edgeKmMap) return 0;
      let sharedKm = 0;
      candidate.edgeKmMap.forEach((km, edgeId) => {
        if (existing.edgeKmMap!.has(edgeId)) {
          sharedKm += km;
        }
      });
      const denom = Math.max(1, candidate.roadKm + candidate.seaKm);
      return sharedKm / denom;
    }

    function calculateAndRenderRoutes(preserveSelection = false) {
      if (!routeState.originCity || !routeState.destCity) {
        if (routeSummaryBox) routeSummaryBox.style.display = 'none';
        routeVisualLayer.clearLayers();
        return;
      }

      const prevSelectedOpt = preserveSelection ? routeState.options[routeState.selectedOptionIndex] : null;
      if (!preserveSelection) {
        resetCustomDifficultOnRouteChange();
      }

      const orig = routeState.originCity;
      const dest = routeState.destCity;
      const opts: RouteOption[] = [];

      const avoidDiffActive = routeState.avoidDifficult && routeState.transportType === 'pe';
      const avoidTormentaActive = routeState.avoidTormenta;

      if (roadGraphData && roadGraphData.edges && roadGraphData.edges.length > 0) {
        const maxRoutes = routeState.expandedRoutes ? 8 : 3;
        const maxAttempts = routeState.expandedRoutes ? 14 : 5;
        const maxLengthRatio = routeState.expandedRoutes ? 2.6 : 1.7;
        const maxOverlapRatio = routeState.expandedRoutes ? 0.9 : 0.8;

        const acceptedCalcs: CalculatedRouteResult[] = [];
        const penalizedEdges = new Set<string>();

        for (let attempt = 0; attempt < maxAttempts && acceptedCalcs.length < maxRoutes; attempt++) {
          const candidate = findRoadRoute(roadGraphData, orig.coordinates, dest.coordinates, citiesDef, {
            allowSea: true,
            preferSea: false,
            avoidDifficult: avoidDiffActive,
            avoidTormenta: avoidTormentaActive,
            penalizedEdges: penalizedEdges.size > 0 ? new Set(penalizedEdges) : undefined,
            penaltyMultiplier: 2.2
          });
          if (!candidate) break;

          (candidate.edgeKeys || []).forEach(k => penalizedEdges.add(k));

          let accept = true;
          if (acceptedCalcs.length > 0) {
            const firstTotal = acceptedCalcs[0].totalKm;
            if (candidate.totalKm > firstTotal * maxLengthRatio) {
              accept = false;
            } else {
              const overlapsTooMuch = acceptedCalcs.some(prev => computeOverlapRatio(candidate, prev) > maxOverlapRatio);
              if (overlapsTooMuch) accept = false;
            }
          }

          if (accept) {
            acceptedCalcs.push(candidate);
            const isSeaRoute = candidate.seaKm > 0.5;
            opts.push({
              id: `route-${opts.length + 1}`,
              mode: isSeaRoute ? 'sea' : 'land',
              label: getRouteModeLabel(candidate),
              calc: candidate,
              hasWarning: candidate.tormentaKm > 0 || candidate.difficultKm > 0 || (candidate.warKm || 0) > 0 || routeState.isDifficult
            });
          }
        }

        // Busca dedicada a rotas marítimas / fluviais (preferSea) como no Fichas de Nimb
        const seaPenalized = new Set<string>();
        const seaAttempts = routeState.expandedRoutes ? 3 : 1;
        for (let sAtt = 0; sAtt < seaAttempts; sAtt++) {
          const seaCandidate = findRoadRoute(roadGraphData, orig.coordinates, dest.coordinates, citiesDef, {
            allowSea: true,
            preferSea: true,
            avoidDifficult: avoidDiffActive,
            avoidTormenta: avoidTormentaActive,
            penalizedEdges: seaPenalized.size > 0 ? new Set(seaPenalized) : undefined,
            penaltyMultiplier: 2.2
          });
          if (!seaCandidate || seaCandidate.seaKm <= 0.5) break;

          (seaCandidate.edgeKeys || []).forEach(k => seaPenalized.add(k));

          const overlapsExisting = acceptedCalcs.some(prev => computeOverlapRatio(seaCandidate, prev) > 0.9);
          if (!overlapsExisting) {
            acceptedCalcs.push(seaCandidate);
            opts.push({
              id: `sea-pref-${sAtt + 1}`,
              mode: 'sea',
              label: getRouteModeLabel(seaCandidate),
              calc: seaCandidate,
              hasWarning: seaCandidate.tormentaKm > 0 || seaCandidate.difficultKm > 0 || (seaCandidate.warKm || 0) > 0 || routeState.isDifficult
            });
          }
        }

        routeState.canLoadMoreRoutes = !routeState.expandedRoutes && acceptedCalcs.length >= 1;
      } else {
        routeState.canLoadMoreRoutes = false;
      }

      // Fallback fora da malha se não houver conexão no grafo
      if (opts.length === 0) {
        const dUnits = Math.hypot(dest.coordinates[0] - orig.coordinates[0], dest.coordinates[1] - orig.coordinates[1]);
        const km = Math.round(dUnits * KM_PER_MAP_UNIT);
        const fbPath: [number, number][] = [orig.coordinates, dest.coordinates];
        const fb: CalculatedRouteResult = {
          path: fbPath,
          roadPath: densifyPath(fbPath, 0.75),
          segments: [
            { type: 'offgrid', connectorPos: 'start', path: fbPath, km }
          ],
          roadKm: km,
          seaKm: 0,
          totalKm: km,
          offGridStartKm: 0,
          offGridEndKm: 0,
          tormentaKm: 0,
          difficultKm: 0,
          difficultSeaKm: 0,
          warKm: 0,
          conditionKm: { terrenoDificil: 0, zonaTormenta: 0, guerra: 0 },
          steps: [
            { icon: 'walk', text: `Siga em linha reta fora da malha por ${km} km de ${orig.name} até ${dest.name}`, km }
          ]
        };
        opts.push({
          id: 'land-fallback',
          mode: 'land',
          label: 'Por terra',
          calc: fb,
          hasWarning: false
        });
      }

      // Rotas Aéreas: Balão Goblin (Linha Reta + Contorno em Parábola de Menor Concavidade se cruzar Montanhas Uivantes)
      const aerialRoutes = calculateAerialBalloonRoutes(orig, dest, kingdomsDef);
      aerialRoutes.forEach(airOpt => {
        opts.push({
          id: airOpt.id,
          mode: 'air',
          label: airOpt.label,
          calc: airOpt.calc,
          hasWarning: airOpt.calc.difficultKm > 0 || routeState.isDifficult,
          warningText: airOpt.calc.difficultKm > 0 ? 'Terreno difícil (Montanhas Uivantes)' : undefined,
          isParabola: airOpt.isParabola,
          crossesUivantes: airOpt.crossesUivantes
        });
      });

      routeState.options = opts;

      if (preserveSelection && prevSelectedOpt) {
        const matchIdx = opts.findIndex(
          o => o.id === prevSelectedOpt.id || (o.mode === prevSelectedOpt.mode && Math.abs(o.calc.totalKm - prevSelectedOpt.calc.totalKm) <= 3)
        );
        routeState.selectedOptionIndex = matchIdx >= 0 ? matchIdx : 0;
      } else if (routeState.selectedOptionIndex >= opts.length) {
        routeState.selectedOptionIndex = 0;
      }

      routeState.selectedMode = opts[routeState.selectedOptionIndex].mode;

      renderRouteDetails({ skipFitBounds: preserveSelection });
    }

    let lastTransportSelectMode: 'land' | 'sea' | 'air' | '' = '';

    function syncTransportSelectOptions(mode: 'land' | 'sea' | 'air') {
      if (!routeTransportSelect) return;
      if (lastTransportSelectMode === mode) return;
      lastTransportSelectMode = mode;

      if (mode === 'air') {
        routeTransportSelect.innerHTML = `
          <option value="balao" selected>Balão Goblin · 48 km/dia · T$ 10/km</option>
        `;
        routeState.transportType = 'balao';
        if (routeSpeedRow) routeSpeedRow.style.display = 'none';
        if (routeBoatRow) routeBoatRow.style.display = 'none';
      } else {
        const cur = routeState.transportType === 'balao' ? 'pe' : routeState.transportType;
        routeTransportSelect.innerHTML = `
          <option value="pe"${cur === 'pe' ? ' selected' : ''}>A pé (marcha própria) · T$ 0</option>
          <option value="cavalo"${cur === 'cavalo' ? ' selected' : ''}>Montaria / Cavalo · 72 km/dia · T$ 0,2/km</option>
          <option value="carruagem"${cur === 'carruagem' ? ' selected' : ''}>Carruagem / Diligência · 36 km/dia · T$ 0,5/km</option>
        `;
        routeState.transportType = cur;
        routeTransportSelect.value = cur;
      }
    }

    function getCustomDifficultKmForActiveRoute(routeCalc: CalculatedRouteResult): { land: number; sea: number } {
      let extraLand = 0;
      let extraSea = 0;
      routeState.customDifficultStretches.forEach(st => {
        if (routeCalc.seaKm > 0 && routeCalc.roadKm === 0) {
          extraSea += st.km;
        } else {
          extraLand += st.km;
        }
      });
      if (routeState.customConnectorDifficult.start) {
        extraLand += routeCalc.offGridStartKm;
      }
      if (routeState.customConnectorDifficult.end) {
        extraLand += routeCalc.offGridEndKm;
      }
      return { land: extraLand, sea: extraSea };
    }

    function calculateDaysForRoute(routeCalc: CalculatedRouteResult, mode: 'land' | 'sea' | 'air', isActiveRoute = false): number {
      const customExtra = isActiveRoute ? getCustomDifficultKmForActiveRoute(routeCalc) : { land: 0, sea: 0 };

      if (mode === 'air' || routeState.transportType === 'balao') {
        // Balão Goblin: 48 km/dia normal; terreno difícil (ex: Montanhas Uivantes ou marcado) reduz à metade (+100% distância efetiva)
        let diffAir = routeCalc.difficultKm + customExtra.land;
        if (routeState.isDifficult) {
          diffAir = routeCalc.totalKm;
        }
        diffAir = Math.min(diffAir, routeCalc.totalKm);
        return Math.max(0.1, (routeCalc.totalKm + diffAir) / 48);
      }

      let speedLand = 36;
      if (routeState.transportType === 'pe') {
        speedLand = routeState.speedLandKmPerDay || 36;
      } else if (routeState.transportType === 'cavalo') {
        speedLand = 72;
      } else if (routeState.transportType === 'carruagem') {
        speedLand = 36;
      }

      let speedSea = 48;
      const bType = routeState.boatType || 'veleiro';
      if (bType === 'barco' || bType === 'barcaca') {
        speedSea = 24;
      } else if (bType === 'gale' || bType === 'jangada') {
        speedSea = 36;
      } else {
        speedSea = routeState.speedSeaKmPerDay || 48;
      }

      const landTotalKm = routeCalc.roadKm + routeCalc.offGridStartKm + routeCalc.offGridEndKm;
      let diffLand = routeCalc.difficultKm + customExtra.land;
      let diffSea = (routeCalc.difficultSeaKm || 0) + customExtra.sea;

      if (routeState.isDifficult) {
        diffLand = landTotalKm;
        diffSea = routeCalc.seaKm;
      }

      diffLand = Math.min(diffLand, landTotalKm);
      diffSea = Math.min(diffSea, routeCalc.seaKm);

      const landDays = (landTotalKm > 0 && speedLand > 0) ? (landTotalKm + diffLand) / speedLand : 0;
      const seaDays = (routeCalc.seaKm > 0 && speedSea > 0) ? (routeCalc.seaKm + diffSea) / speedSea : 0;

      return Math.max(0.1, landDays + seaDays);
    }

    function updateDifficultControlsUI() {
      if (routeDifficultToggle) {
        routeDifficultToggle.checked = routeState.isDifficult;
      }
      if (btnMarkDifficultStretch) {
        btnMarkDifficultStretch.style.display = routeState.isDifficult ? 'none' : 'inline-flex';
        btnMarkDifficultStretch.classList.toggle('active', routeState.isMarkingDifficult);
        btnMarkDifficultStretch.textContent = routeState.isMarkingDifficult ? 'Marcando…' : 'Marcar trecho';
      }
      if (routeDifficultDesc) {
        if (routeState.isDifficult) {
          routeDifficultDesc.textContent = 'Rota inteira em terreno difícil: metade da distância por dia.';
        } else if (routeState.isMarkingDifficult) {
          routeDifficultDesc.textContent = routeState.markStartIdx === null
            ? 'Clique sobre a rota ativa no INÍCIO do trecho difícil. Trechos fora da malha marcam/desmarcam com um clique.'
            : 'Agora clique sobre a rota ativa no FIM do trecho difícil.';
        } else {
          routeDifficultDesc.textContent = 'Ative para a rota inteira ou use "Marcar trecho" para clicar na rota.';
        }
      }
    }

    function handleMarkDifficultClickOnActiveRoute(latlng: [number, number]): boolean {
      const activeOption = routeState.options[routeState.selectedOptionIndex] || routeState.options[0];
      if (!activeOption) return false;
      const rPath = activeOption.calc.roadPath;
      if (!rPath || rPath.length < 2) return false;

      let bestIdx = -1;
      let bestDistPx = 32;
      try {
        const clickPt = map.latLngToContainerPoint(latlng);
        rPath.forEach((pt, idx) => {
          const d = clickPt.distanceTo(map.latLngToContainerPoint(pt));
          if (d < bestDistPx) {
            bestDistPx = d;
            bestIdx = idx;
          }
        });
      } catch {
        let bestUnits = 1.5;
        rPath.forEach((pt, idx) => {
          const d = distUnits(latlng, pt);
          if (d < bestUnits) {
            bestUnits = d;
            bestIdx = idx;
          }
        });
      }

      if (bestIdx < 0) return false;

      if (routeState.markStartIdx === null) {
        routeState.markStartIdx = bestIdx;
        showMapToast('Início do trecho marcado! Agora clique no fim do trecho sobre a rota ativa.', 2800);
        renderRouteDetails({ skipFitBounds: true });
      } else if (bestIdx !== routeState.markStartIdx) {
        const a = Math.min(routeState.markStartIdx, bestIdx);
        const b = Math.max(routeState.markStartIdx, bestIdx);
        const subPath = rPath.slice(a, b + 1);
        const km = Math.max(1, Math.round(pathKm(subPath)));
        routeState.customDifficultStretches.push({ a, b, km });
        routeState.markStartIdx = null;
        routeState.isMarkingDifficult = false;
        showMapToast(`Trecho difícil marcado (${km} km).`, 2500);
        renderRouteDetails({ skipFitBounds: true });
      }
      return true;
    }

    function isClickNearActiveRoute(latlng: [number, number], maxPx = 11): boolean {
      const activeOption = routeState.options[routeState.selectedOptionIndex] || routeState.options[0];
      if (!activeOption || !activeOption.calc.roadPath) return false;
      try {
        const clickPt = map.latLngToContainerPoint(latlng);
        for (const pt of activeOption.calc.roadPath) {
          if (clickPt.distanceTo(map.latLngToContainerPoint(pt)) <= maxPx) {
            return true;
          }
        }
      } catch {}
      return false;
    }

    function renderRouteDetails(renderOpts: { skipFitBounds?: boolean } = {}) {
      if (!routeState.originCity || !routeState.destCity || routeState.options.length === 0) return;

      const activeOption = routeState.options[routeState.selectedOptionIndex] || routeState.options[0];
      const activeCalc = activeOption.calc;
      routeState.selectedMode = activeOption.mode;

      syncTransportSelectOptions(activeOption.mode);
      updateDifficultControlsUI();

      const orig = routeState.originCity;
      const dest = routeState.destCity;

      if (routeSummaryBox) routeSummaryBox.style.display = 'block';

      // 1. Quilometragem total e badges
      if (routeKmHighlight) routeKmHighlight.textContent = `${activeCalc.totalKm.toLocaleString('pt-BR')} KM`;
      const isSeaActive = activeCalc.seaKm > 0.5;
      if (routeTypeBadgeText) {
        if (activeOption.mode === 'air') {
          routeTypeBadgeText.textContent = activeOption.isParabola ? 'Voo em parábola' : 'Voo goblin direto';
        } else {
          routeTypeBadgeText.textContent = getRouteModeLabel(activeCalc) === 'Pelo mar'
            ? 'Quase todo por mar'
            : (isSeaActive ? 'Inclui embarcação' : 'Todo por terra');
        }
      }
      if (routeBreakdownText) {
        if (activeOption.mode === 'air') {
          routeBreakdownText.textContent = activeOption.isParabola
            ? `${activeCalc.totalKm.toLocaleString('pt-BR')} km contornando as Montanhas Uivantes`
            : `${activeCalc.totalKm.toLocaleString('pt-BR')} km em linha reta aérea`;
        } else {
          const parts: string[] = [];
          if (activeCalc.roadKm > 0) parts.push(`${activeCalc.roadKm} km por estrada`);
          if (activeCalc.seaKm > 0) parts.push(`${activeCalc.seaKm} km por mar`);
          const offTotal = activeCalc.offGridStartKm + activeCalc.offGridEndKm;
          if (offTotal > 0) parts.push(`${offTotal} km fora da malha`);
          routeBreakdownText.textContent = parts.join(' + ');
        }
      }

      // 2. Alertas de Condições da Rota (Zona de Tormenta, Estrada em Guerra, Terreno Difícil e Trechos Marcados)
      if (routeWarningsContainer) {
        routeWarningsContainer.innerHTML = '';

        ROAD_CONDITIONS.forEach(cond => {
          const condKm = Math.round(activeCalc.conditionKm?.[cond.id] || 0);
          if (condKm <= 0) return;

          const warnEl = document.createElement('div');
          warnEl.className = 'route-warning-item';

          let actionBtnHtml = '';
          if (cond.id === 'zonaTormenta' && activeOption.mode !== 'air') {
            actionBtnHtml = `<button type="button" class="route-warning-remove-btn" data-action="avoid-tormenta" title="Remover área afetada pela Tormenta">Remover</button>`;
          } else if (cond.id === 'terrenoDificil' && activeOption.mode === 'land' && routeState.transportType === 'pe') {
            actionBtnHtml = `<button type="button" class="route-warning-remove-btn" data-action="avoid-difficult" title="Excluir terreno difícil da caminhada a pé">Excluir</button>`;
          } else if (cond.id === 'terrenoDificil' && activeOption.mode === 'air' && activeOption.crossesUivantes && !activeOption.isParabola) {
            actionBtnHtml = `<button type="button" class="route-warning-remove-btn" data-action="contour-uivantes" title="Contornar as Montanhas Uivantes em parábola">Contornar</button>`;
          }

          const descText = (cond.id === 'terrenoDificil' && activeOption.mode === 'air')
            ? 'Travessia aérea pelas Montanhas Uivantes: a distância por dia cai pela metade.'
            : cond.description;

          warnEl.innerHTML = `
            <div class="route-warning-content">
              <span class="route-warning-dot ${cond.dotClass}"></span>
              <div>
                <strong style="color:${cond.color};">${cond.label} (${condKm} km):</strong>
                <span style="color:#cbd5e1;">${descText}</span>
              </div>
            </div>
            ${actionBtnHtml}
          `;
          routeWarningsContainer.appendChild(warnEl);
        });

        // Trechos difíceis marcados manualmente pelo usuário
        if (!routeState.isDifficult) {
          routeState.customDifficultStretches.forEach((st, stIdx) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'route-warning-item';
            itemEl.innerHTML = `
              <div class="route-warning-content">
                <span class="route-warning-dot difficult"></span>
                <div>
                  <strong style="color:${CUSTOM_DIFFICULT_COLOR};">Trecho difícil (${st.km} km):</strong>
                  <span style="color:#cbd5e1;">Marcado manualmente sobre a rota.</span>
                </div>
              </div>
              <button type="button" class="route-warning-remove-btn" data-remove-stretch="${stIdx}" title="Remover trecho difícil">×</button>
            `;
            routeWarningsContainer.appendChild(itemEl);
          });

          (['start', 'end'] as const).forEach(pos => {
            if (!routeState.customConnectorDifficult[pos]) return;
            const km = pos === 'start' ? activeCalc.offGridStartKm : activeCalc.offGridEndKm;
            if (km <= 0) return;
            const labelPos = pos === 'start' ? 'origem' : 'destino';
            const itemEl = document.createElement('div');
            itemEl.className = 'route-warning-item';
            itemEl.innerHTML = `
              <div class="route-warning-content">
                <span class="route-warning-dot difficult"></span>
                <div>
                  <strong style="color:${CUSTOM_DIFFICULT_COLOR};">Fora da malha (${labelPos}) difícil (${km} km)</strong>
                </div>
              </div>
              <button type="button" class="route-warning-remove-btn" data-remove-conn="${pos}" title="Desmarcar conector difícil">×</button>
            `;
            routeWarningsContainer.appendChild(itemEl);
          });
        }

        // Eventos dos botões rápidos dentro dos avisos
        routeWarningsContainer.querySelectorAll('[data-action]').forEach(btn => {
          btn.addEventListener('click', () => {
            const act = (btn as HTMLElement).dataset.action;
            if (act === 'avoid-tormenta') {
              routeState.avoidTormenta = true;
              if (routeAvoidTormentaToggle) routeAvoidTormentaToggle.checked = true;
              calculateAndRenderRoutes(false);
            } else if (act === 'avoid-difficult') {
              routeState.avoidDifficult = true;
              if (routeAvoidDifficultToggle) routeAvoidDifficultToggle.checked = true;
              calculateAndRenderRoutes(false);
            } else if (act === 'contour-uivantes') {
              const pIdx = routeState.options.findIndex(o => o.id === 'air-balloon-parabola');
              if (pIdx >= 0) {
                routeState.selectedOptionIndex = pIdx;
                resetCustomDifficultOnRouteChange();
                renderRouteDetails({ skipFitBounds: true });
              }
            }
          });
        });

        routeWarningsContainer.querySelectorAll('[data-remove-stretch]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number((btn as HTMLElement).dataset.removeStretch);
            routeState.customDifficultStretches = routeState.customDifficultStretches.filter((_, i) => i !== idx);
            renderRouteDetails({ skipFitBounds: true });
          });
        });

        routeWarningsContainer.querySelectorAll('[data-remove-conn]').forEach(btn => {
          btn.addEventListener('click', () => {
            const pos = (btn as HTMLElement).dataset.removeConn as 'start' | 'end';
            if (pos === 'start' || pos === 'end') {
              routeState.customConnectorDifficult[pos] = false;
              renderRouteDetails({ skipFitBounds: true });
            }
          });
        });
      }

      const iconWalkSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;"><circle cx="13" cy="4" r="2.2"/><path d="M10 21l3-6.5 2 3v4.5h2v-6l-2-2.8.9-3.7c.9 1 2.2 1.5 3.6 1.5v-2c-1.3 0-2.3-.6-3-1.4l-.9-1.2c-.4-.5-1-.9-1.7-.9-.6 0-1.1.2-1.5.5L7 10v5h2v-3.8l1.8-1.2-1.8 8h1z"/></svg>`;
      const iconBoatSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M3.5 16l2.2 3.5h12.6l2.2-3.5H3.5z" fill="currentColor" fill-opacity="0.15"/><path d="M12 3v13"/><path d="M12 4.5l6 4.5h-6"/><path d="M2 21.5c2.5-1 4.5-1 7 0s4.5 1 7 0 4.5-1 6 0"/></svg>`;
      const iconBalloonSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M12 2a7 7 0 0 0-5.3 11.9L9.5 17h5l2.8-3.1A7 7 0 0 0 12 2z"/><path d="M12 2c1.8 3.5 1.8 11.5 0 15"/><path d="M12 2c-1.8 3.5-1.8 11.5 0 15"/><line x1="9.5" y1="17" x2="9.5" y2="19.5"/><line x1="14.5" y1="17" x2="14.5" y2="19.5"/><rect x="9" y="19.5" width="6" height="2.5" rx="0.5" fill="currentColor" fill-opacity="0.2"/></svg>`;

      // 3. Cards de Múltiplas Opções de Rotas + Botão "Carregar mais rotas"
      if (routeOptionsCards) {
        routeOptionsCards.innerHTML = '';
        routeState.options.forEach((opt, idx) => {
          const isSelected = idx === routeState.selectedOptionIndex;
          const days = calculateDaysForRoute(opt.calc, opt.mode, isSelected);
          const card = document.createElement('div');
          card.className = `route-option-card ${isSelected ? 'selected' : ''}`;

          let iconSvg = iconWalkSvg;
          if (opt.mode === 'sea') iconSvg = iconBoatSvg;
          else if (opt.mode === 'air') iconSvg = iconBalloonSvg;

          const dotsHtml = ROAD_CONDITIONS
            .filter(c => (opt.calc.conditionKm?.[c.id] || 0) > 0.5)
            .map(c => `<span class="route-warning-dot ${c.dotClass}" style="margin:0" title="${c.label} (${Math.round(opt.calc.conditionKm[c.id])} km)"></span>`)
            .join('');

          card.innerHTML = `
            <div class="route-option-info">
              ${iconSvg}
              <span>${opt.label}</span>
              ${dotsHtml}
            </div>
            <div class="route-option-meta">
              ${opt.calc.totalKm.toLocaleString('pt-BR')} km · ${formatDaysValue(days)}
            </div>
          `;

          card.addEventListener('click', () => {
            if (routeState.selectedOptionIndex !== idx) {
              routeState.selectedOptionIndex = idx;
              routeState.selectedMode = opt.mode;
              resetCustomDifficultOnRouteChange();
              renderRouteDetails({ skipFitBounds: true });
            }
          });
          routeOptionsCards.appendChild(card);
        });
      }

      if (btnLoadMoreRoutes) {
        btnLoadMoreRoutes.style.display = (routeState.canLoadMoreRoutes && !routeState.expandedRoutes) ? 'inline-block' : 'none';
      }

      // 4. Passos da Rota
      if (routeStepsCount) routeStepsCount.textContent = String(activeCalc.steps.length);
      if (btnToggleRouteSteps) {
        btnToggleRouteSteps.innerHTML = routeState.showSteps
          ? 'Ocultar passos'
          : `Passos da rota (<span id="routeStepsCount">${activeCalc.steps.length}</span>)`;
      }
      if (routeStepsList) {
        routeStepsList.innerHTML = '';
        activeCalc.steps.forEach((step, idx) => {
          const item = document.createElement('div');
          item.className = 'route-step-item';
          const iconSvg = step.icon === 'sea'
            ? `<span class="route-step-icon sea">${iconBoatSvg}</span>`
            : `<span class="route-step-icon">${iconWalkSvg}</span>`;
          item.innerHTML = `
            ${iconSvg}
            <span><strong>${idx + 1}.</strong> ${step.text}</span>
          `;
          routeStepsList.appendChild(item);
        });
      }

      // 5. Linhas condicionais do painel
      const hasSeaStretch = activeCalc.seaKm > 0.5 && activeOption.mode !== 'air';
      const hasLandStretch = (activeCalc.roadKm + activeCalc.offGridStartKm + activeCalc.offGridEndKm) > 0.5 && activeOption.mode !== 'air';

      if (routeBoatRow) {
        routeBoatRow.style.display = hasSeaStretch ? 'flex' : 'none';
        if (hasSeaStretch && routeBoatSelect) {
          routeBoatSelect.value = routeState.boatType;
        }
      }
      if (routeSpeedRow) {
        routeSpeedRow.style.display = (hasLandStretch && routeState.transportType === 'pe') ? 'flex' : 'none';
      }
      if (routeAvoidDifficultRow) {
        routeAvoidDifficultRow.style.display = (hasLandStretch && routeState.transportType === 'pe') ? 'flex' : 'none';
        if (routeAvoidDifficultToggle) routeAvoidDifficultToggle.checked = routeState.avoidDifficult;
      }
      if (routeAvoidTormentaRow) {
        routeAvoidTormentaRow.style.display = (activeOption.mode !== 'air') ? 'flex' : 'none';
        if (routeAvoidTormentaToggle) routeAvoidTormentaToggle.checked = routeState.avoidTormenta;
      }
      if (routeAerialBox) {
        routeAerialBox.style.display = (activeOption.mode === 'air') ? 'flex' : 'none';
        if (activeOption.mode === 'air' && aerialTestsSummary) {
          const testsCount = Math.floor(activeCalc.totalKm / 100);
          aerialTestsSummary.textContent = `Distância aérea: ${activeCalc.totalKm.toLocaleString('pt-BR')} km · ${testsCount} ${testsCount === 1 ? 'teste necessário' : 'testes necessários'} (1d20 a cada 100 km)`;
        }
      }

      // 6. Tempo de Viagem Total Calculado
      const days = calculateDaysForRoute(activeCalc, activeOption.mode, true);
      if (routeDaysText) {
        routeDaysText.textContent = formatDaysValue(days);
      }

      // 7. Custo de Transporte da Taverna
      let landCost = 0;
      let seaCost = 0;
      let airCost = 0;
      let totalCost = 0;

      if (activeOption.mode === 'air' || routeState.transportType === 'balao') {
        airCost = activeCalc.totalKm * 10;
        totalCost = airCost;
        if (routeTransportCostVal) routeTransportCostVal.textContent = `T$ ${totalCost.toLocaleString('pt-BR')}`;
        if (routeTransportCostDetails) {
          routeTransportCostDetails.textContent = `Balão Goblin: T$ ${airCost.toLocaleString('pt-BR')} (T$ 10/km · ${activeCalc.totalKm} km)`;
        }
      } else {
        const landKm = activeCalc.roadKm + activeCalc.offGridStartKm + activeCalc.offGridEndKm;
        let landRate = 0;
        let landLabel = 'A pé';
        if (routeState.transportType === 'cavalo') {
          landRate = 0.2;
          landCost = Math.round(landKm * landRate * 10) / 10;
          landLabel = 'Montaria / Cavalo';
        } else if (routeState.transportType === 'carruagem') {
          landRate = 0.5;
          landCost = Math.round(landKm * landRate * 10) / 10;
          landLabel = 'Carruagem / Diligência';
        }

        const bType = routeState.boatType || 'veleiro';
        let seaRate = 0.5;
        let seaLabel = 'Veleiro Mercante';
        if (bType === 'barco') {
          seaRate = 0.2;
          seaLabel = 'Barco / Canoa';
        } else if (bType === 'gale') {
          seaRate = 1.0;
          seaLabel = 'Galé / Navio de Guerra';
        } else if (bType === 'barcaca') {
          seaRate = 0.2;
          seaLabel = 'Barcaça';
        } else if (bType === 'jangada') {
          seaRate = 0.2;
          seaLabel = 'Jangada';
        }

        if (activeCalc.seaKm > 0.5) {
          seaCost = Math.round(activeCalc.seaKm * seaRate * 10) / 10;
        }

        totalCost = Math.round((landCost + seaCost) * 10) / 10;

        if (routeTransportCostVal) routeTransportCostVal.textContent = `T$ ${totalCost.toLocaleString('pt-BR')}`;
        if (routeTransportCostDetails) {
          const parts: string[] = [];
          if (landKm > 0.5) {
            if (routeState.transportType === 'pe') {
              parts.push('A pé (T$ 0)');
            } else {
              parts.push(`${landLabel}: T$ ${landCost.toLocaleString('pt-BR')} (T$ ${landRate.toLocaleString('pt-BR')}/km)`);
            }
          }
          if (activeCalc.seaKm > 0.5) {
            parts.push(`${seaLabel}: T$ ${seaCost.toLocaleString('pt-BR')} (T$ ${seaRate.toLocaleString('pt-BR')}/km)`);
          }
          routeTransportCostDetails.textContent = parts.join(' · ') || 'Sem condução';
        }
      }

      updateHeroWalletDisplay();

      // 8. Renderização no Mapa com Leaflet (fiel ao Fichas de Nimb e livre do bug de troca de rota ao marcar trecho)
      routeVisualLayer.clearLayers();

      // 8a. Desenha primeiro as rotas alternativas (inativas)
      routeState.options.forEach((opt, idx) => {
        if (idx === routeState.selectedOptionIndex) return;
        // Mostra rotas aéreas alternativas somente quando o modo aéreo está selecionado
        if (opt.mode === 'air' && activeOption.mode !== 'air') return;
        if (opt.mode !== 'air' && activeOption.mode === 'air') return;

        (opt.calc.segments || []).forEach(seg => {
          if (seg.type === 'offgrid') return;
          const condDef = getConditionDef(seg.conditions);
          const altColor = condDef ? condDef.altColor : ROUTE_ALT_COLOR;
          const dashArray = seg.type === 'sea' ? '10, 10' : (opt.mode === 'air' ? '8, 8' : undefined);

          L.polyline(seg.path, {
            color: altColor,
            weight: 5,
            dashArray,
            opacity: 0.85,
            interactive: false
          }).addTo(routeVisualLayer);

          // Só permite clique para alternar rota se NÃO estiver no modo "Marcar trecho"
          if (!routeState.isMarkingDifficult) {
            const hitAlt = L.polyline(seg.path, {
              color: altColor,
              weight: 16,
              opacity: 0,
              interactive: true,
              bubblingMouseEvents: false
            }).addTo(routeVisualLayer);

            hitAlt.on('click', (ev: any) => {
              const clickCoord: [number, number] = [ev.latlng.lat, ev.latlng.lng];
              // Se o clique foi em um trecho compartilhado com a rota ativa, preserva a rota ativa
              if (isClickNearActiveRoute(clickCoord, 10)) {
                return;
              }
              routeState.selectedOptionIndex = idx;
              routeState.selectedMode = opt.mode;
              resetCustomDifficultOnRouteChange();
              renderRouteDetails({ skipFitBounds: true });
            });
          }
        });
      });

      // 8b. Desenha os segmentos da rota ativa com cores por condição (terrenoDificil = #F9A825, zonaTormenta = #d13235, guerra = #EF6C00, normal = #42A5F5)
      (activeCalc.segments || []).forEach(seg => {
        if (seg.type === 'offgrid') {
          const pos = seg.connectorPos || 'start';
          const isConnDiff = routeState.isDifficult || routeState.customConnectorDifficult[pos];
          L.polyline(seg.path, {
            color: isConnDiff ? CUSTOM_DIFFICULT_COLOR : CONNECTOR_COLOR,
            weight: isConnDiff ? 5 : 3.5,
            dashArray: '2, 8',
            opacity: 0.92,
            interactive: false
          }).addTo(routeVisualLayer);

          if (routeState.isMarkingDifficult) {
            const hitConn = L.polyline(seg.path, {
              color: CUSTOM_DIFFICULT_COLOR,
              weight: 22,
              opacity: 0,
              interactive: true,
              bubblingMouseEvents: false
            }).addTo(routeVisualLayer);
            hitConn.on('click', () => {
              routeState.customConnectorDifficult[pos] = !routeState.customConnectorDifficult[pos];
              routeState.isMarkingDifficult = false;
              routeState.markStartIdx = null;
              renderRouteDetails({ skipFitBounds: true });
            });
          }
          return;
        }

        const condDef = getConditionDef(seg.conditions);
        const segColor = routeState.isDifficult
          ? CUSTOM_DIFFICULT_COLOR
          : (condDef ? condDef.color : ROUTE_COLOR);

        if (seg.type === 'sea') {
          L.polyline(seg.path, {
            color: '#FFFFFF',
            weight: 7,
            opacity: 0.8,
            dashArray: '10, 10',
            interactive: false
          }).addTo(routeVisualLayer);

          L.polyline(seg.path, {
            color: segColor,
            weight: 4,
            opacity: 1,
            dashArray: '10, 10',
            interactive: false
          }).addTo(routeVisualLayer);
        } else {
          const isAirDash = activeOption.mode === 'air' ? '8, 6' : undefined;
          L.polyline(seg.path, {
            color: ROUTE_CASING_COLOR,
            weight: 8,
            opacity: 0.9,
            dashArray: isAirDash,
            interactive: false
          }).addTo(routeVisualLayer);

          L.polyline(seg.path, {
            color: segColor,
            weight: 4.5,
            opacity: 1,
            dashArray: isAirDash,
            interactive: false
          }).addTo(routeVisualLayer);
        }
      });

      // 8c. Desenha os trechos difíceis personalizados pelo usuário sobre a rota ativa
      if (!routeState.isDifficult && activeCalc.roadPath && activeCalc.roadPath.length >= 2) {
        routeState.customDifficultStretches.forEach(st => {
          const slicePts = activeCalc.roadPath.slice(st.a, st.b + 1);
          if (slicePts.length >= 2) {
            L.polyline(slicePts, {
              color: CUSTOM_DIFFICULT_COLOR,
              weight: 5.5,
              opacity: 1,
              interactive: false
            }).addTo(routeVisualLayer);
          }
        });
      }

      // 8d. Se estiver marcando trecho difícil, adiciona camada de captura prioritária na rota ativa e marcador de início
      if (routeState.isMarkingDifficult && activeCalc.roadPath && activeCalc.roadPath.length >= 2) {
        const hitActive = L.polyline(activeCalc.roadPath, {
          color: CUSTOM_DIFFICULT_COLOR,
          weight: 26,
          opacity: 0,
          interactive: true,
          bubblingMouseEvents: false
        }).addTo(routeVisualLayer);

        hitActive.on('click', (ev: any) => {
          handleMarkDifficultClickOnActiveRoute([ev.latlng.lat, ev.latlng.lng]);
        });

        if (routeState.markStartIdx !== null && activeCalc.roadPath[routeState.markStartIdx]) {
          L.circleMarker(activeCalc.roadPath[routeState.markStartIdx], {
            radius: 7,
            color: '#FFFFFF',
            weight: 2,
            fillColor: CUSTOM_DIFFICULT_COLOR,
            fillOpacity: 1,
            interactive: false
          }).addTo(routeVisualLayer);
        }
      }

      // Marcador A (Origem - Dourado)
      L.marker(orig.coordinates, {
        icon: createEndpointIcon('#d4af37'),
        title: orig.name
      }).addTo(routeVisualLayer);

      // Marcador B (Destino - Vermelho)
      L.marker(dest.coordinates, {
        icon: createEndpointIcon('#dc2626'),
        title: dest.name
      }).addTo(routeVisualLayer);

      // Ajusta zoom para enquadrar a rota inteira apenas quando uma nova rota é traçada
      if (!renderOpts.skipFitBounds) {
        const bounds = L.latLngBounds(activeCalc.path);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 5, duration: 0.8 });
      }
    }

    // Sugestões de Autocomplete e Dropdown Completo para Origem e Destino
    const btnDropdownOrigin = document.getElementById('btnDropdownOrigin');
    const btnDropdownDest = document.getElementById('btnDropdownDest');

    function renderFullCityDropdown(list: HTMLElement, input: HTMLInputElement, onSelect: (city: CityLocation) => void) {
      const isVisible = list.style.display !== 'none';
      if (isVisible) {
        list.style.display = 'none';
        return;
      }
      if (routeOriginList && routeOriginList !== list) routeOriginList.style.display = 'none';
      if (routeDestList && routeDestList !== list) routeDestList.style.display = 'none';

      list.innerHTML = '';
      const sorted = [...citiesDef].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      sorted.forEach(city => {
        const li = document.createElement('li');
        const badge = city.kingdom ? `<span class="city-badge-type">${city.kingdom}</span>` : (city.isCapital ? '<span class="city-badge-type">Capital</span>' : '');
        li.innerHTML = `<span>${city.name}</span>${badge}`;
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = city.name;
          list.style.display = 'none';
          onSelect(city);
        });
        list.appendChild(li);
      });
      list.style.display = 'block';
    }

    btnDropdownOrigin?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (routeOriginList && routeOriginInput) {
        renderFullCityDropdown(routeOriginList, routeOriginInput, (city) => {
          routeState.originCity = city;
          routeState.expandedRoutes = false;
          calculateAndRenderRoutes();
        });
      }
    });

    btnDropdownDest?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (routeDestList && routeDestInput) {
        renderFullCityDropdown(routeDestList, routeDestInput, (city) => {
          routeState.destCity = city;
          routeState.expandedRoutes = false;
          calculateAndRenderRoutes();
        });
      }
    });

    function setupAutocomplete(input: HTMLInputElement, list: HTMLElement, onSelect: (city: CityLocation) => void) {
      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          list.style.display = 'none';
          return;
        }

        const matches = citiesDef.filter(c =>
          c.name.toLowerCase().includes(query) ||
          (c.kingdom && c.kingdom.toLowerCase().includes(query))
        ).slice(0, 15);

        list.innerHTML = '';
        if (matches.length === 0) {
          list.style.display = 'none';
          return;
        }

        matches.forEach(city => {
          const li = document.createElement('li');
          const badge = city.kingdom ? `<span class="city-badge-type">${city.kingdom}</span>` : (city.isCapital ? '<span class="city-badge-type">Capital</span>' : '');
          li.innerHTML = `<span>${city.name}${city.isCapital ? ' ★' : ''}</span>${badge}`;
          li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = city.name;
            list.style.display = 'none';
            onSelect(city);
          });
          list.appendChild(li);
        });
        list.style.display = 'block';
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          list.style.display = 'none';
        }, 200);
      });
    }

    if (routeOriginInput && routeOriginList) {
      setupAutocomplete(routeOriginInput, routeOriginList, (city) => {
        routeState.originCity = city;
        routeState.expandedRoutes = false;
        calculateAndRenderRoutes();
      });
    }

    if (routeDestInput && routeDestList) {
      setupAutocomplete(routeDestInput, routeDestList, (city) => {
        routeState.destCity = city;
        routeState.expandedRoutes = false;
        calculateAndRenderRoutes();
      });
    }

    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (target) {
        if (routeOriginList && !routeOriginList.contains(target) && !btnDropdownOrigin?.contains(target) && routeOriginInput !== target) {
          routeOriginList.style.display = 'none';
        }
        if (routeDestList && !routeDestList.contains(target) && !btnDropdownDest?.contains(target) && routeDestInput !== target) {
          routeDestList.style.display = 'none';
        }
      }
    });

    btnToggleRoutes?.addEventListener('click', () => {
      if (routeState.active && routePanel?.style.display !== 'none') {
        clearRoute();
      } else {
        openRoutePanel();
      }
    });

    btnCloseRoutePanel?.addEventListener('click', clearRoute);
    btnRouteClear?.addEventListener('click', clearRoute);

    function swapOriginDest() {
      const temp = routeState.originCity;
      routeState.originCity = routeState.destCity;
      routeState.destCity = temp;
      routeState.expandedRoutes = false;

      if (routeOriginInput) routeOriginInput.value = routeState.originCity?.name || '';
      if (routeDestInput) routeDestInput.value = routeState.destCity?.name || '';

      calculateAndRenderRoutes();
    }

    btnSwapRoutePoints?.addEventListener('click', swapOriginDest);
    btnRouteInvert?.addEventListener('click', swapOriginDest);

    btnLoadMoreRoutes?.addEventListener('click', () => {
      routeState.expandedRoutes = true;
      calculateAndRenderRoutes(true);
    });

    btnToggleRouteSteps?.addEventListener('click', () => {
      routeState.showSteps = !routeState.showSteps;
      if (routeStepsList) {
        routeStepsList.style.display = routeState.showSteps ? 'flex' : 'none';
      }
      const activeOpt = routeState.options[routeState.selectedOptionIndex] || routeState.options[0];
      const count = activeOpt ? activeOpt.calc.steps.length : 0;
      if (btnToggleRouteSteps) {
        btnToggleRouteSteps.innerHTML = routeState.showSteps
          ? 'Ocultar passos'
          : `Passos da rota (<span id="routeStepsCount">${count}</span>)`;
      }
    });

    routeTransportSelect?.addEventListener('change', () => {
      const val = (routeTransportSelect.value || 'pe') as RouteTransportType;
      const prevWasPe = routeState.transportType === 'pe';
      routeState.transportType = val;
      if (routeSpeedRow) {
        const hasLand = routeState.selectedMode !== 'air';
        routeSpeedRow.style.display = (hasLand && val === 'pe') ? 'flex' : 'none';
      }
      if (routeState.avoidDifficult && prevWasPe !== (val === 'pe')) {
        calculateAndRenderRoutes(true);
      } else {
        renderRouteDetails({ skipFitBounds: true });
      }
    });

    routeSpeedSelect?.addEventListener('change', () => {
      const val = Number(routeSpeedSelect.value);
      routeState.speedLandKmPerDay = val * 4;
      renderRouteDetails({ skipFitBounds: true });
    });

    routeBoatSelect?.addEventListener('change', () => {
      const val = (routeBoatSelect.value || 'veleiro') as RouteBoatType;
      routeState.boatType = val;
      if (val === 'barco' || val === 'barcaca') routeState.speedSeaKmPerDay = 24;
      else if (val === 'gale' || val === 'jangada') routeState.speedSeaKmPerDay = 36;
      else routeState.speedSeaKmPerDay = 48;
      renderRouteDetails({ skipFitBounds: true });
    });

    routeDifficultToggle?.addEventListener('change', () => {
      routeState.isDifficult = !!routeDifficultToggle.checked;
      if (routeState.isDifficult) {
        routeState.isMarkingDifficult = false;
        routeState.markStartIdx = null;
      }
      renderRouteDetails({ skipFitBounds: true });
    });

    btnMarkDifficultStretch?.addEventListener('click', () => {
      routeState.isMarkingDifficult = !routeState.isMarkingDifficult;
      routeState.markStartIdx = null;
      renderRouteDetails({ skipFitBounds: true });
    });

    routeAvoidDifficultToggle?.addEventListener('change', () => {
      routeState.avoidDifficult = !!routeAvoidDifficultToggle.checked;
      calculateAndRenderRoutes(false);
    });

    routeAvoidTormentaToggle?.addEventListener('change', () => {
      routeState.avoidTormenta = !!routeAvoidTormentaToggle.checked;
      calculateAndRenderRoutes(false);
    });

    // Rolagens do Balão Goblin (App e Mesa Presencial)
    btnRollBalloonApp?.addEventListener('click', () => {
      const activeOpt = routeState.options[routeState.selectedOptionIndex] || routeState.options.find(o => o.mode === 'air');
      if (!aerialDiceResults || !activeOpt) return;
      const km = activeOpt.calc.totalKm;
      const testsCount = Math.floor(km / 100);

      aerialDiceResults.style.display = 'block';
      if (testsCount <= 0) {
        aerialDiceResults.innerHTML = `
          <div style="color:#22c55e;font-weight:700;font-size:0.82rem;">
            Trajeto menor que 100 km: nenhum teste de queda necessário! Viagem rápida e segura.
          </div>
        `;
        return;
      }

      const rolls: number[] = [];
      const falls: number[] = [];
      for (let i = 1; i <= testsCount; i++) {
        const roll = Math.floor(Math.random() * 20) + 1;
        rolls.push(roll);
        if (roll === 1) {
          falls.push(i * 100);
        }
      }

      let rollsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;">';
      rolls.forEach((r, idx) => {
        const isOne = r === 1;
        const color = isOne ? '#ef4444' : '#94a3b8';
        const bg = isOne ? 'rgba(239,68,68,0.2)' : 'rgba(30,41,59,0.8)';
        const border = isOne ? '#ef4444' : '#334155';
        rollsHtml += `
          <span style="display:inline-flex;align-items:center;padding:3px 7px;border-radius:4px;font-size:0.75rem;font-weight:700;background:${bg};border:1px solid ${border};color:${color};">
            ${(idx + 1) * 100}km: d20=${r}${isOne ? ' [FALHA]' : ''}
          </span>
        `;
      });
      rollsHtml += '</div>';

      if (falls.length > 0) {
        aerialDiceResults.innerHTML = `
          <div style="font-weight:700;color:#ef4444;font-size:0.85rem;margin-bottom:4px;">
            QUEDA DO BALÃO! (${falls.length} ${falls.length === 1 ? 'acidente' : 'acidentes'})
          </div>
          <div style="font-size:0.78rem;color:#cbd5e1;line-height:1.4;margin-bottom:6px;">
            O balão sofreu pane crítica por volta do <strong>km ${falls.join(', ')}</strong> e caiu (queda não fatal)!
            A tripulação precisa fazer um teste de reparos para recuperar <strong>1d8 PV</strong> do balão antes de retomar viagem.
          </div>
          ${rollsHtml}
        `;
      } else {
        aerialDiceResults.innerHTML = `
          <div style="font-weight:700;color:#22c55e;font-size:0.85rem;margin-bottom:4px;">
            Voo seguro e tranquilo!
          </div>
          <div style="font-size:0.78rem;color:#cbd5e1;line-height:1.4;margin-bottom:6px;">
            Nenhuma falha crítica (resultado 1) ocorreu durante os ${km.toLocaleString('pt-BR')} km da viagem aérea.
          </div>
          ${rollsHtml}
        `;
      }
    });

    btnRollBalloonTable?.addEventListener('click', () => {
      const activeOpt = routeState.options[routeState.selectedOptionIndex] || routeState.options.find(o => o.mode === 'air');
      if (!aerialDiceResults || !activeOpt) return;
      const km = activeOpt.calc.totalKm;
      const testsCount = Math.floor(km / 100);

      aerialDiceResults.style.display = 'block';
      aerialDiceResults.innerHTML = `
        <div style="font-weight:700;color:#f59e0b;font-size:0.85rem;margin-bottom:4px;">
          Instruções para a Mesa Presencial
        </div>
        <div style="font-size:0.78rem;color:#cbd5e1;line-height:1.45;">
          • O Mestre ou jogador deve rolar <strong>1d20 a cada 100 km</strong> de voo.<br>
          • Total necessário para este trajeto (${km.toLocaleString('pt-BR')} km): <strong>${testsCount} ${testsCount === 1 ? 'rolagem' : 'rolagens'} de 1d20</strong>.<br>
          • <strong>Resultado 1 no dado</strong>: Falha mecânica ou turbulência! O balão sofre uma queda não fatal.<br>
          • <strong>Reparos</strong>: Um teste bem-sucedido de Ofício (engenhoqueiro) recupera 1d8 PV da condução.
        </div>
      `;
    });

    // Modal de Contratação de Condução (Idêntico ao da Taverna de Tormenta 20)
    let hireState = {
      km: 1,
      unitPrice: 0.5,
      percent: 100,
      transportName: 'Carruagem / Diligência',
      desc: 'Transporte por terra em carruagem ou diligência comercial entre cidades de Arton.',
      title: 'CONTRATAR CONDUÇÃO TERRESTRE'
    };

    function updateHireModalCalculation() {
      const baseCost = hireState.km * hireState.unitPrice;
      const total = Math.max(0, Math.ceil(baseCost * (hireState.percent / 100)));
      const currentFunds = getHeroWalletFunds();
      const canAfford = currentFunds >= total;

      if (hireQtyDisplay) hireQtyDisplay.textContent = String(hireState.km);
      if (hirePercentDisplay) hirePercentDisplay.textContent = `${hireState.percent}%`;
      if (hireTotalPrice) hireTotalPrice.textContent = `T$ ${total.toLocaleString('pt-BR')}`;

      if (hireBalanceNote) {
        if (canAfford) {
          hireBalanceNote.textContent = `Saldo restante após a contratação: T$ ${(currentFunds - total).toLocaleString('pt-BR')}`;
          hireBalanceNote.style.color = '#94a3b8';
        } else {
          hireBalanceNote.textContent = `Saldo insuficiente! Você possui T$ ${currentFunds.toLocaleString('pt-BR')} e faltam T$ ${(total - currentFunds).toLocaleString('pt-BR')}.`;
          hireBalanceNote.style.color = '#ef4444';
        }
      }

      if (hireModalAlert) {
        if (!canAfford) {
          hireModalAlert.style.display = 'block';
          hireModalAlert.textContent = `Saldo insuficiente para contratar esta condução.`;
        } else {
          hireModalAlert.style.display = 'none';
          hireModalAlert.textContent = '';
        }
      }

      if (btnConfirmHireModal) {
        (btnConfirmHireModal as HTMLButtonElement).disabled = !canAfford;
        btnConfirmHireModal.style.opacity = canAfford ? '1' : '0.4';
        btnConfirmHireModal.style.cursor = canAfford ? 'pointer' : 'not-allowed';
      }
    }

    function openHireTransportModal() {
      if (!mapHireTransportModal) return;

      if (hireModalTitle) hireModalTitle.textContent = hireState.title;
      if (hireModalDesc) hireModalDesc.textContent = hireState.desc;
      if (hireModalUnitPrice) hireModalUnitPrice.textContent = `T$ ${hireState.unitPrice.toLocaleString('pt-BR')} por km`;
      if (hireUnitLabel) hireUnitLabel.textContent = 'Quilômetro(s):';

      updateHireModalCalculation();
      mapHireTransportModal.style.display = 'flex';
    }

    function closeHireTransportModal() {
      if (mapHireTransportModal) mapHireTransportModal.style.display = 'none';
    }

    btnHireQtyDec?.addEventListener('click', () => {
      const step = hireState.km > 10 ? 10 : 1;
      hireState.km = Math.max(1, hireState.km - step);
      updateHireModalCalculation();
    });

    btnHireQtyInc?.addEventListener('click', () => {
      const step = hireState.km >= 10 ? 10 : 1;
      hireState.km += step;
      updateHireModalCalculation();
    });

    btnBargainDec?.addEventListener('click', () => {
      hireState.percent = Math.max(10, hireState.percent - 10);
      updateHireModalCalculation();
    });

    btnBargainInc?.addEventListener('click', () => {
      hireState.percent = Math.min(300, hireState.percent + 10);
      updateHireModalCalculation();
    });

    btnBargainReset?.addEventListener('click', () => {
      hireState.percent = 100;
      updateHireModalCalculation();
    });

    btnCloseHireModal?.addEventListener('click', closeHireTransportModal);
    btnCancelHireModal?.addEventListener('click', closeHireTransportModal);

    btnConfirmHireModal?.addEventListener('click', () => {
      const baseCost = hireState.km * hireState.unitPrice;
      const total = Math.max(0, Math.ceil(baseCost * (hireState.percent / 100)));
      const currentFunds = getHeroWalletFunds();

      if (currentFunds < total) {
        if (hireModalAlert) {
          hireModalAlert.style.display = 'block';
          hireModalAlert.textContent = `T$ insuficientes! Você possui T$ ${currentFunds.toLocaleString('pt-BR')}, mas o serviço custa T$ ${total.toLocaleString('pt-BR')}.`;
        }
        return;
      }

      const success = deductHeroWalletFunds(total);
      if (success) {
        updateHeroWalletDisplay();
        closeHireTransportModal();
        if (routeHireFeedback) {
          routeHireFeedback.style.display = 'block';
          routeHireFeedback.innerHTML = `✓ Condução (${hireState.transportName}) contratada com sucesso por <strong>T$ ${total.toLocaleString('pt-BR')}</strong>! Boa viagem.`;
          setTimeout(() => {
            if (routeHireFeedback) routeHireFeedback.style.display = 'none';
          }, 7000);
        }
      }
    });

    mapHireTransportModal?.addEventListener('click', (e) => {
      if (e.target === mapHireTransportModal) closeHireTransportModal();
    });

    btnHireTransport?.addEventListener('click', () => {
      const activeOption = routeState.options[routeState.selectedOptionIndex] || routeState.options[0];
      if (!activeOption || !routeState.originCity || !routeState.destCity) return;
      const activeCalc = activeOption.calc;

      // Configuração base da condução conforme o modo e tipo
      if (activeOption.mode === 'air' || routeState.transportType === 'balao') {
        hireState.title = 'CONTRATAR BALÃO GOBLIN';
        hireState.desc = 'Viagem aérea direta em balão goblin entre regiões e cidades.';
        hireState.unitPrice = 10;
        hireState.transportName = 'Balão Goblin';
        hireState.km = Math.max(1, Math.round(activeCalc.totalKm));
      } else {
        const landKm = activeCalc.roadKm + activeCalc.offGridStartKm + activeCalc.offGridEndKm;
        const hasSea = activeCalc.seaKm > 0.5;
        const hasLand = landKm > 0.5;
        const isLandPaid = routeState.transportType !== 'pe' && hasLand;

        if (!hasSea && !isLandPaid) {
          if (routeHireFeedback) {
            routeHireFeedback.style.display = 'block';
            routeHireFeedback.innerHTML = `Viagem a pé: nenhum custo de condução contratada é necessário!`;
            setTimeout(() => {
              if (routeHireFeedback) routeHireFeedback.style.display = 'none';
            }, 5000);
          }
          return;
        }

        const bType = routeState.boatType || 'veleiro';
        let seaRate = 0.5;
        let seaLabel = 'Veleiro Mercante';
        if (bType === 'barco') {
          seaRate = 0.2;
          seaLabel = 'Barco / Canoa';
        } else if (bType === 'gale') {
          seaRate = 1.0;
          seaLabel = 'Galé / Navio de Guerra';
        } else if (bType === 'barcaca') {
          seaRate = 0.2;
          seaLabel = 'Barcaça';
        } else if (bType === 'jangada') {
          seaRate = 0.2;
          seaLabel = 'Jangada';
        }

        let landRate = 0;
        let landLabel = 'A pé';
        if (routeState.transportType === 'cavalo') {
          landRate = 0.2;
          landLabel = 'Montaria / Cavalo';
        } else if (routeState.transportType === 'carruagem') {
          landRate = 0.5;
          landLabel = 'Carruagem / Diligência';
        }

        if (hasSea && isLandPaid) {
          hireState.title = 'CONTRATAR CONDUÇÃO COMBINADA';
          hireState.desc = `Transporte terrestre (${landLabel}) e náutico (${seaLabel}) para todo o itinerário.`;
          hireState.transportName = `${landLabel} + ${seaLabel}`;
          const landC = Math.round(landKm * landRate * 10) / 10;
          const seaC = Math.round(activeCalc.seaKm * seaRate * 10) / 10;
          const totalBase = landC + seaC;
          const totalKm = Math.max(1, Math.round(landKm + activeCalc.seaKm));
          hireState.km = totalKm;
          hireState.unitPrice = Math.round((totalBase / totalKm) * 100) / 100;
        } else if (hasSea) {
          hireState.title = 'CONTRATAR EMBARCAÇÃO';
          hireState.desc = 'Transporte por via marítima ou fluvial em embarcações de Arton.';
          hireState.unitPrice = seaRate;
          hireState.transportName = seaLabel;
          hireState.km = Math.max(1, Math.round(activeCalc.seaKm));
        } else {
          hireState.title = 'CONTRATAR CONDUÇÃO TERRESTRE';
          hireState.desc = 'Transporte por terra em carruagem ou diligência comercial entre cidades de Arton.';
          hireState.unitPrice = landRate;
          hireState.transportName = landLabel;
          hireState.km = Math.max(1, Math.round(landKm));
        }
      }

      hireState.percent = 100;
      openHireTransportModal();
    });

    // Modal de Atalhos e Controles do Mapa
    btnMapControlsHelp?.addEventListener('click', () => {
      if (mapControlsModal) mapControlsModal.style.display = 'flex';
    });

    btnCloseMapControlsModal?.addEventListener('click', () => {
      if (mapControlsModal) mapControlsModal.style.display = 'none';
    });

    mapControlsModal?.addEventListener('click', (e) => {
      if (e.target === mapControlsModal) mapControlsModal.style.display = 'none';
    });

    function startRoadRouteFromCity(city: CityLocation) {
      routeState.expandedRoutes = false;
      openRoutePanel(city);
    }

    function finishRoadRouteToCity(destCity: CityLocation) {
      routeState.destCity = destCity;
      routeState.expandedRoutes = false;
      if (routeDestInput) routeDestInput.value = destCity.name;
      calculateAndRenderRoutes();
    }

    // Clique em "Rotas" dentro dos popups
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const routeBtn = target.closest('.btn-start-road-route') as HTMLElement;
      if (routeBtn) {
        const lat = Number(routeBtn.dataset.lat);
        const lng = Number(routeBtn.dataset.lng);
        const name = routeBtn.dataset.name || 'Localidade';
        map.closePopup();

        // Se o painel já tiver origem e a nova localidade for diferente da origem:
        if (routeState.active && routeState.originCity && routeState.originCity.name !== name) {
          const isRedefining = !!routeState.destCity;
          finishRoadRouteToCity({ name, coordinates: [lat, lng] });
          showMapToast(isRedefining ? `Destino redefinido para ${name}` : `Destino definido: ${name}`, 3000);
        } else {
          startRoadRouteFromCity({ name, coordinates: [lat, lng] });
          showMapToast(`Origem definida: ${name}. Clique em outra cidade ou ponto para definir o destino.`, 3000);
        }
        return;
      }

      const deleteBtn = target.closest('.btn-delete-custom') as HTMLElement;
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        customMarkers = customMarkers.filter(m => m.id !== id);
        saveSavedMarkers(customMarkers);
        map.closePopup();
        renderCustomMarkers();
        return;
      }
    });

    // Modal para Adicionar Marcador Pessoal
    let isAddingMarker = false;
    let pendingMarkerCoords: [number, number] | null = null;
    const btnToggleAddMarker = document.getElementById('btnToggleAddMarker');
    const customMarkerModal = document.getElementById('mapCustomMarkerModal');
    const btnCloseCustomMarkerModal = document.getElementById('btnCloseCustomMarkerModal');
    const btnCancelCustomMarker = document.getElementById('btnCancelCustomMarker');
    const btnSaveCustomMarker = document.getElementById('btnSaveCustomMarker');
    const customMarkerNameInput = document.getElementById('customMarkerNameInput') as HTMLInputElement | null;
    const customMarkerColorSelect = document.getElementById('customMarkerColorSelect') as HTMLSelectElement | null;
    const customMarkerDescInput = document.getElementById('customMarkerDescInput') as HTMLTextAreaElement | null;

    function deactivateAddMarkerMode() {
      isAddingMarker = false;
      pendingMarkerCoords = null;
      mapContainer.classList.remove('is-adding-marker');
      if (btnToggleAddMarker) btnToggleAddMarker.classList.remove('active');
      if (customMarkerModal) customMarkerModal.style.display = 'none';
    }

    function openCustomMarkerModal(coords: [number, number]) {
      pendingMarkerCoords = coords;
      if (customMarkerNameInput) {
        customMarkerNameInput.value = '';
        customMarkerNameInput.style.borderColor = '#334155';
        customMarkerNameInput.placeholder = 'Ex: Covil do Troll, Acampamento...';
        customMarkerNameInput.focus();
      }
      if (customMarkerDescInput) customMarkerDescInput.value = '';
      if (customMarkerModal) customMarkerModal.style.display = 'flex';
    }

    customMarkerNameInput?.addEventListener('input', () => {
      if (customMarkerNameInput) customMarkerNameInput.style.borderColor = '#334155';
    });

    btnToggleAddMarker?.addEventListener('click', () => {
      isAddingMarker = !isAddingMarker;
      if (isAddingMarker) {
        clearMeasure();
        clearRoute();
        mapContainer.classList.add('is-adding-marker');
        btnToggleAddMarker.classList.add('active');
      } else {
        deactivateAddMarkerMode();
      }
    });

    btnCloseCustomMarkerModal?.addEventListener('click', deactivateAddMarkerMode);
    btnCancelCustomMarker?.addEventListener('click', deactivateAddMarkerMode);

    btnSaveCustomMarker?.addEventListener('click', () => {
      if (!pendingMarkerCoords) return;
      const name = customMarkerNameInput?.value.trim();
      if (!name) {
        if (customMarkerNameInput) {
          customMarkerNameInput.style.borderColor = '#ef4444';
          customMarkerNameInput.placeholder = 'Nome do marcador obrigatório!';
          customMarkerNameInput.focus();
        }
        return;
      }

      const color = customMarkerColorSelect?.value || '#2563eb';
      const description = customMarkerDescInput?.value.trim() || '';

      const newMarker: CustomMarker = {
        id: 'custom_' + Date.now(),
        name,
        coordinates: [pendingMarkerCoords[0], pendingMarkerCoords[1]],
        description,
        createdAt: Date.now()
      };

      customMarkers.push(newMarker);
      saveSavedMarkers(customMarkers);
      renderCustomMarkers();

      deactivateAddMarkerMode();
      map.flyTo(newMarker.coordinates, map.getZoom(), { duration: 0.5 });
    });

    // Atualização elástica em tempo real da régua ao mover o cursor pelo mapa
    map.on('mousemove', (e: any) => {
      if (measureState.active && measureState.startPoint && !measureState.fixed) {
        const snap = getMagneticSnap(e.latlng);
        updateMeasureHover(snap.point);
      }
    });

    // Clique no mapa para medição, criação de marcador, marcação de trecho difícil ou seleção de ponto livre para rotas
    map.on('click', (e: any) => {
      const rawPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const snap = getMagneticSnap(e.latlng);
      const clickedPoint = snap.point;

      if (isAddingMarker) {
        openCustomMarkerModal(clickedPoint);
        return;
      }

      if (measureState.active) {
        if (!measureState.startPoint) {
          startMeasureAt(clickedPoint);
        } else if (!measureState.fixed) {
          fixMeasureAt(clickedPoint);
        } else {
          startMeasureAt(clickedPoint);
        }
        return;
      }

      // Se estiver marcando trecho difícil na rota ativa, processa exclusivamente a marcação sem trocar rota nem destino
      if (routeState.active && routeState.isMarkingDifficult) {
        handleMarkDifficultClickOnActiveRoute(rawPoint);
        return;
      }

      // Se o painel de rotas estiver aberto, clicar no mapa seleciona o ponto (inclusive no meio do nada)
      if (routeState.active) {
        const pointLocation: CityLocation = snap.city || {
          name: `Ponto no Mapa (${Math.round(clickedPoint[0])}, ${Math.round(clickedPoint[1])})`,
          coordinates: clickedPoint
        };

        if (!routeState.originCity) {
          startRoadRouteFromCity(pointLocation);
          showMapToast(`Origem definida: ${pointLocation.name}. Clique em outro ponto ou cidade para definir o destino.`, 3000);
        } else if (!routeState.destCity || routeState.destCity.name !== pointLocation.name) {
          const isRedefining = !!routeState.destCity;
          finishRoadRouteToCity(pointLocation);
          showMapToast(isRedefining ? `Destino redefinido para ${pointLocation.name}` : `Destino definido: ${pointLocation.name}`, 3000);
        }
      }
    });

    // Banner de Tutorial Discreto na Base do Mapa (some ao clicar)
    const mapTutorialBanner = document.getElementById('mapTutorialBanner');
    const btnCloseTutorialBanner = document.getElementById('btnCloseTutorialBanner');
    if (mapTutorialBanner) {
      const isDismissed = localStorage.getItem('forja-map-tutorial-banner-v1') === 'dismissed';
      if (isDismissed) {
        mapTutorialBanner.style.display = 'none';
      } else {
        mapTutorialBanner.style.display = 'flex';
      }

      const hideBanner = () => {
        mapTutorialBanner.style.display = 'none';
        try {
          localStorage.setItem('forja-map-tutorial-banner-v1', 'dismissed');
        } catch {}
      };

      mapTutorialBanner.addEventListener('click', hideBanner);
      btnCloseTutorialBanner?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideBanner();
      });
    }

    // Teclas de Atalho: Esc para cancelar, R para rotas, M para medir distância, P para marcador, C para camadas, F para tela cheia
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      if (e.key === 'Escape') {
        if (measureState.active) clearMeasure();
        if (routeState.active) clearRoute();
        if (isAddingMarker) deactivateAddMarkerMode();
      } else if (!isInput) {
        if (e.key === 'r' || e.key === 'R') {
          btnToggleRoutes?.click();
        } else if (e.key === 'm' || e.key === 'M') {
          if (measureState.active) clearMeasure();
          else btnToggleMeasure?.click();
        } else if (e.key === 'p' || e.key === 'P') {
          btnToggleAddMarker?.click();
        } else if (e.key === 'c' || e.key === 'C') {
          document.getElementById('btnToggleLayers')?.click();
        } else if (e.key === 'f' || e.key === 'F') {
          document.getElementById('btnFullscreen')?.click();
        }
      }
    });

    // 6. Controles de Camadas
    const btnToggleLayers = document.getElementById('btnToggleLayers');
    const mapLayersPopover = document.getElementById('mapLayersPopover');
    const layerCapitals = document.getElementById('layerCapitals') as HTMLInputElement | null;
    const layerCities = document.getElementById('layerCities') as HTMLInputElement | null;
    const layerKingdoms = document.getElementById('layerKingdoms') as HTMLInputElement | null;
    const layerCustom = document.getElementById('layerCustom') as HTMLInputElement | null;

    if (btnToggleLayers && mapLayersPopover) {
      btnToggleLayers.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = mapLayersPopover.style.display === 'none' || !mapLayersPopover.style.display;
        mapLayersPopover.style.display = isHidden ? 'block' : 'none';
        btnToggleLayers.classList.toggle('active', isHidden);
      });

      document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as Node | null;
        if (
          mapLayersPopover.style.display !== 'none' &&
          target &&
          !mapLayersPopover.contains(target) &&
          !btnToggleLayers.contains(target)
        ) {
          mapLayersPopover.style.display = 'none';
          btnToggleLayers.classList.remove('active');
        }
      });
    }

    if (layerCapitals) {
      layerCapitals.addEventListener('change', () => {
        if (layerCapitals.checked) map.addLayer(capitalsLayer);
        else map.removeLayer(capitalsLayer);
      });
    }
    if (layerCities) {
      layerCities.addEventListener('change', () => {
        if (layerCities.checked) map.addLayer(citiesLayer);
        else map.removeLayer(citiesLayer);
      });
    }
    if (layerKingdoms) {
      layerKingdoms.addEventListener('change', () => {
        if (layerKingdoms.checked) map.addLayer(kingdomsLayer);
        else map.removeLayer(kingdomsLayer);
      });
    }
    if (layerCustom) {
      layerCustom.addEventListener('change', () => {
        if (layerCustom.checked) map.addLayer(customMarkersLayer);
        else map.removeLayer(customMarkersLayer);
      });
    }

    // 7. Busca Unificada (Cidades + Reinos)
    const searchInput = document.getElementById('mapSearchInput') as HTMLInputElement | null;
    const searchArrowBtn = document.getElementById('mapSearchDropdownArrow');
    const searchDropdown = document.getElementById('mapSearchDropdownList');
    const searchPill = document.getElementById('mapUnifiedSearchPill');

    function renderUnifiedSearchList(filterText = '') {
      if (!searchDropdown) return;
      const query = filterText.trim().toLowerCase();
      searchDropdown.innerHTML = '';

      // 1. Reinos correspondentes
      const matchingKingdoms = kingdomsDef.filter(k => !query || k.name.toLowerCase().includes(query));
      if (matchingKingdoms.length > 0) {
        const header = document.createElement('li');
        header.className = 'map-unified-suggestion-header';
        header.textContent = 'Reinos / Regiões';
        searchDropdown.appendChild(header);

        matchingKingdoms.forEach(kDef => {
          const li = document.createElement('li');
          li.className = 'map-unified-suggestion-item';
          li.innerHTML = `<strong>${esc(kDef.name)}</strong><span class="map-unified-suggestion-sub">Reino</span>`;
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchInput) searchInput.value = kDef.name;
            searchDropdown.style.display = 'none';
            if (Array.isArray(kDef.coordinates) && kDef.coordinates.length > 0) {
              const bounds = L.latLngBounds(kDef.coordinates);
              map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
            }
          });
          searchDropdown.appendChild(li);
        });
      }

      // 2. Cidades correspondentes
      const matchingCities = citiesDef.filter(c => !query || c.name.toLowerCase().includes(query) || (c.kingdom && c.kingdom.toLowerCase().includes(query)));
      if (matchingCities.length > 0) {
        const header = document.createElement('li');
        header.className = 'map-unified-suggestion-header';
        header.textContent = 'Cidades e Localidades';
        searchDropdown.appendChild(header);

        matchingCities.slice(0, 40).forEach(cDef => {
          const li = document.createElement('li');
          li.className = 'map-unified-suggestion-item';
          const subText = cDef.kingdom || (cDef.isCapital ? 'Capital' : 'Localidade');
          li.innerHTML = `<span><strong>${esc(cDef.name)}</strong>${cDef.isCapital ? ' ★' : ''}</span><span class="map-unified-suggestion-sub">${esc(subText)}</span>`;
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchInput) searchInput.value = cDef.name;
            searchDropdown.style.display = 'none';
            map.flyTo(cDef.coordinates, 5, { duration: 0.8 });
            const entry = cityMarkerMap.get(cDef.name.toLowerCase());
            if (entry) {
              setTimeout(() => entry.marker.openPopup(), 850);
            }
          });
          searchDropdown.appendChild(li);
        });
      }

      if (matchingKingdoms.length === 0 && matchingCities.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'map-unified-suggestion-item';
        emptyLi.style.cursor = 'default';
        emptyLi.style.color = '#94a3b8';
        emptyLi.textContent = 'Nenhuma localidade encontrada.';
        searchDropdown.appendChild(emptyLi);
      }

      searchDropdown.style.display = 'block';
    }

    if (searchArrowBtn) {
      searchArrowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (searchDropdown && searchDropdown.style.display === 'block') {
          searchDropdown.style.display = 'none';
        } else {
          renderUnifiedSearchList(searchInput?.value || '');
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        renderUnifiedSearchList(searchInput.value || '');
      });
      searchInput.addEventListener('input', () => {
        renderUnifiedSearchList(searchInput.value || '');
      });
      searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim().toLowerCase();
          if (!query) return;
          if (searchDropdown) searchDropdown.style.display = 'none';
          const matchCity = citiesDef.find(c => c.name.toLowerCase().includes(query));
          if (matchCity) {
            map.flyTo(matchCity.coordinates, 5, { duration: 0.8 });
            const entry = cityMarkerMap.get(matchCity.name.toLowerCase());
            if (entry) {
              setTimeout(() => entry.marker.openPopup(), 850);
            }
            return;
          }
          const matchKingdom = kingdomsDef.find(k => k.name.toLowerCase().includes(query));
          if (matchKingdom && Array.isArray(matchKingdom.coordinates) && matchKingdom.coordinates.length > 0) {
            const bounds = L.latLngBounds(matchKingdom.coordinates);
            map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
          }
        } else if (e.key === 'Escape') {
          if (searchDropdown) searchDropdown.style.display = 'none';
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (searchDropdown && !searchPill?.contains(e.target as Node)) {
        searchDropdown.style.display = 'none';
      }
    });

    // 8. Barra Lateral Direita: Zoom e Navegação
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const zoomSlider = document.getElementById('mapZoomSlider') as HTMLInputElement | null;
    const zoomDisplay = document.getElementById('mapZoomDisplay');
    const btnResetView = document.getElementById('btnResetView');
    const btnFullscreen = document.getElementById('btnFullscreen');

    function syncZoomUI() {
      const z = map.getZoom();
      if (zoomSlider) zoomSlider.value = String(z);
      if (zoomDisplay) zoomDisplay.textContent = `${Math.round((z / 4) * 100)}%`;
    }

    map.on('zoomend', syncZoomUI);
    syncZoomUI();

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => map.zoomIn());
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => map.zoomOut());
    }
    if (zoomSlider) {
      const curDef = MAP_DEFINITIONS[currentMapId] || MAP_DEFINITIONS.arton;
      zoomSlider.min = String(curDef.minZoom);
      zoomSlider.max = String(curDef.maxZoom);
      zoomSlider.step = '0.1';
      zoomSlider.value = String(curDef.defaultZoom);
      zoomSlider.addEventListener('input', () => {
        map.setZoom(Number(zoomSlider.value));
      });
    }
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        const curDef = MAP_DEFINITIONS[currentMapId] || MAP_DEFINITIONS.arton;
        map.setView(curDef.center, curDef.defaultZoom);
      });
    }
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        const el = document.getElementById('mapViewport') || document.documentElement;
        if (!document.fullscreenElement) {
          el.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      });
    }

    const mapSelector = document.getElementById('mapSelector') as HTMLSelectElement | null;
    if (mapSelector) {
      mapSelector.addEventListener('change', () => {
        switchMap(mapSelector.value);
      });
    }

    // Inicializa o mapa inicial com tiles, fronteiras e localidades
    switchMap('arton');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
