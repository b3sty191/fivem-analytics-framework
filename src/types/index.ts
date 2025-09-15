export interface Player {
  name?: string;
  identifiers?: string[];
  endpoint?: string;
  ping?: number;
  id?: number;
}

export interface ServerData {
  svMaxclients?: number;
  clients?: number;
  protocol?: number;
  hostname?: string;
  gametype?: string;
  mapname?: string;
  resources?: string[];
  server?: string;
  players?: Player[];
  iconVersion?: number;
  vars?: { [key: string]: string };
  enhancedHostSupport?: boolean;
  upvotePower?: number;
  connectEndPoints?: string[];
  burstPower?: number;
}

export interface ServerInfo {
  EndPoint?: string;
  Data?: ServerData;
}

export interface StreamEventHandlers {
  onServer?: (serverInfo: ServerInfo) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

export interface ServerStats {
  totalServers: number;
  totalPlayers: number;
  totalMaxSlots: number;
  averagePopulation: number;
  popularGameTypes: { [gameType: string]: number };
  popularMaps: { [mapName: string]: number };
  serverVersions: { [version: string]: number };
  protocolVersions: { [protocol: string]: number };
  operatingSystems: { [os: string]: number };
  resourceUsage: {
    totalResources: number;
    averageResourcesPerServer: number;
    popularResources: { [resource: string]: number };
  };
}

export interface FiveMStreamConfig {
  streamSince?: number;
  maxServers?: number;
  handlers?: StreamEventHandlers;
}