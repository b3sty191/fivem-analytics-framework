import type { ServerInfo, ServerData } from '../types/index.js';

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

export interface CountryStats {
  country: string;
  serverCount: number;
  playerCount: number;
  averagePopulation: number;
  topGameTypes: string[];
  topServers: Array<{
    endpoint: string;
    hostname: string;
    players: number;
    maxSlots: number;
  }>;
}

export interface AnalysisReport {
  overview: ServerStats;
  byCountry: CountryStats[];
  timestamp: Date;
  analysisTime: number;
}

export class ServerAnalyzer {
  private servers: ServerInfo[] = [];
  private countryCodes: { [ip: string]: string } = {};

  addServer(serverInfo: ServerInfo): void {
    if (serverInfo.Data && serverInfo.EndPoint) {
      this.servers.push(serverInfo);
    }
  }

  addServers(servers: ServerInfo[]): void {
    servers.forEach(server => this.addServer(server));
  }

  clear(): void {
    this.servers = [];
    this.countryCodes = {};
  }

  getServerCount(): number {
    return this.servers.length;
  }

  analyze(): AnalysisReport {
    const startTime = Date.now();

    const overview = this.analyzeOverview();
    const byCountry = this.analyzeByCountry();

    return {
      overview,
      byCountry,
      timestamp: new Date(),
      analysisTime: Date.now() - startTime
    };
  }

  private analyzeOverview(): ServerStats {
    const gameTypes: { [key: string]: number } = {};
    const maps: { [key: string]: number } = {};
    const versions: { [key: string]: number } = {};
    const protocols: { [key: string]: number } = {};
    const operatingSystems: { [key: string]: number } = {};
    const resources: { [key: string]: number } = {};

    let totalPlayers = 0;
    let totalMaxSlots = 0;
    let totalResources = 0;

    for (const server of this.servers) {
      const data = server.Data!;

      totalPlayers += data.clients || 0;
      totalMaxSlots += data.svMaxclients || 0;

      if (data.gametype) {
        gameTypes[data.gametype] = (gameTypes[data.gametype] || 0) + 1;
      }

      if (data.mapname) {
        maps[data.mapname] = (maps[data.mapname] || 0) + 1;
      }

      if (data.server) {
        versions[data.server] = (versions[data.server] || 0) + 1;
      }

      if (data.protocol) {
        protocols[data.protocol.toString()] = (protocols[data.protocol.toString()] || 0) + 1;
      }

      const os = this.extractOSFromServer(data.server || '');
      if (os) {
        operatingSystems[os] = (operatingSystems[os] || 0) + 1;
      }

      if (data.resources) {
        totalResources += data.resources.length;
        data.resources.forEach(resource => {
          resources[resource] = (resources[resource] || 0) + 1;
        });
      }
    }

    return {
      totalServers: this.servers.length,
      totalPlayers,
      totalMaxSlots,
      averagePopulation: this.servers.length > 0 ? totalPlayers / this.servers.length : 0,
      popularGameTypes: this.sortByValue(gameTypes),
      popularMaps: this.sortByValue(maps),
      serverVersions: this.sortByValue(versions),
      protocolVersions: this.sortByValue(protocols),
      operatingSystems: this.sortByValue(operatingSystems),
      resourceUsage: {
        totalResources,
        averageResourcesPerServer: this.servers.length > 0 ? totalResources / this.servers.length : 0,
        popularResources: this.sortByValue(resources)
      }
    };
  }

  private analyzeByCountry(): CountryStats[] {
    const countryData: { [country: string]: ServerInfo[] } = {};

    for (const server of this.servers) {
      const country = this.getCountryFromServer(server);
      if (!countryData[country]) {
        countryData[country] = [];
      }
      countryData[country].push(server);
    }

    const countryStats: CountryStats[] = [];

    for (const [country, servers] of Object.entries(countryData)) {
      const gameTypes: { [key: string]: number } = {};
      let totalPlayers = 0;

      for (const server of servers) {
        const data = server.Data!;
        totalPlayers += data.clients || 0;

        if (data.gametype) {
          gameTypes[data.gametype] = (gameTypes[data.gametype] || 0) + 1;
        }
      }

      const topServers = servers
        .filter(s => s.Data)
        .map(s => ({
          endpoint: s.EndPoint!,
          hostname: s.Data!.hostname || 'Unknown',
          players: s.Data!.clients || 0,
          maxSlots: s.Data!.svMaxclients || 0
        }))
        .sort((a, b) => b.players - a.players)
        .slice(0, 5);

      countryStats.push({
        country,
        serverCount: servers.length,
        playerCount: totalPlayers,
        averagePopulation: servers.length > 0 ? totalPlayers / servers.length : 0,
        topGameTypes: Object.entries(gameTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([gameType]) => gameType),
        topServers
      });
    }

    return countryStats.sort((a, b) => {
      if (b.playerCount !== a.playerCount) {
        return b.playerCount - a.playerCount;
      }
      return b.serverCount - a.serverCount;
    });
  }

  private getCountryFromServer(server: ServerInfo): string {
    if (server.Data?.vars?.locale) {
      const country = this.getCountryFromLocale(server.Data.vars.locale);
      if (country !== 'Unknown') {
        return country;
      }
    }

    return this.getCountryFromEndpoint(server.EndPoint!);
  }

  private getCountryFromLocale(locale: string): string {
    const localeMap: { [key: string]: string } = {
      'en_US': 'United States',
      'en_GB': 'United Kingdom',
      'en_AU': 'Australia',
      'en_CA': 'Canada',
      'en_IN': 'India',
      'en_ZA': 'South Africa',
      'en_NZ': 'New Zealand',
      'en_IE': 'Ireland',
      
      'th_TH': 'Thailand',
      'th': 'Thailand',
      
      'de_DE': 'Germany',
      'de_AT': 'Austria',
      'de_CH': 'Switzerland',
      'de': 'Germany',
      
      'fr_FR': 'France',
      'fr_CA': 'Canada',
      'fr_BE': 'Belgium',
      'fr_CH': 'Switzerland',
      'fr': 'France',
      
      'es_ES': 'Spain',
      'es_MX': 'Mexico',
      'es_AR': 'Argentina',
      'es_CO': 'Colombia',
      'es_CL': 'Chile',
      'es': 'Spain',
      
      'pt_BR': 'Brazil',
      'pt_PT': 'Portugal',
      'pt': 'Brazil',
      
      'ru_RU': 'Russia',
      'ru': 'Russia',
      
      'ja_JP': 'Japan',
      'ja': 'Japan',
      
      'ko_KR': 'South Korea',
      'ko': 'South Korea',
      
      'zh_CN': 'China',
      'zh_TW': 'Taiwan',
      'zh_HK': 'Hong Kong',
      'zh': 'China',
      
      'it_IT': 'Italy',
      'it': 'Italy',
      
      'nl_NL': 'Netherlands',
      'nl_BE': 'Belgium',
      'nl': 'Netherlands',
      
      'sv_SE': 'Sweden',
      'sv': 'Sweden',
      
      'no_NO': 'Norway',
      'nb_NO': 'Norway',
      'nn_NO': 'Norway',
      'no': 'Norway',
      
      'da_DK': 'Denmark',
      'da': 'Denmark',
      
      'fi_FI': 'Finland',
      'fi': 'Finland',
      
      'pl_PL': 'Poland',
      'pl': 'Poland',
      
      'cs_CZ': 'Czech Republic',
      'cs': 'Czech Republic',
      
      'hu_HU': 'Hungary',
      'hu': 'Hungary',
      
      'tr_TR': 'Turkey',
      'tr': 'Turkey',
      
      'el_GR': 'Greece',
      'el': 'Greece',
      
      'he_IL': 'Israel',
      'he': 'Israel',
      
      'ar_SA': 'Saudi Arabia',
      'ar_EG': 'Egypt',
      'ar_AE': 'United Arab Emirates',
      'ar': 'Saudi Arabia',
      
      'vi_VN': 'Vietnam',
      'vi': 'Vietnam',
      
      'ms_MY': 'Malaysia',
      'ms': 'Malaysia',
      
      'id_ID': 'Indonesia',
      'id': 'Indonesia',
      
      'fil_PH': 'Philippines',
      'tl_PH': 'Philippines',
      
      'hi_IN': 'India',
      'hi': 'India'
    };

    const normalizedLocale = locale.toLowerCase().replace('-', '_');
    if (localeMap[normalizedLocale]) {
      return localeMap[normalizedLocale];
    }

    const parts = normalizedLocale.split('_');
    if (parts.length > 1) {
      const countryCode = parts[1];
      const countryFromCode = this.getCountryFromCode(countryCode);
      if (countryFromCode !== 'Unknown') {
        return countryFromCode;
      }
    }

    const languageCode = parts[0];
    if (localeMap[languageCode]) {
      return localeMap[languageCode];
    }

    return 'Unknown';
  }

  private getCountryFromCode(code: string): string {
    const countryCodes: { [key: string]: string } = {
      'us': 'United States',
      'gb': 'United Kingdom',
      'uk': 'United Kingdom',
      'au': 'Australia',
      'ca': 'Canada',
      'th': 'Thailand',
      'de': 'Germany',
      'fr': 'France',
      'es': 'Spain',
      'br': 'Brazil',
      'pt': 'Portugal',
      'ru': 'Russia',
      'jp': 'Japan',
      'kr': 'South Korea',
      'cn': 'China',
      'tw': 'Taiwan',
      'hk': 'Hong Kong',
      'it': 'Italy',
      'nl': 'Netherlands',
      'se': 'Sweden',
      'no': 'Norway',
      'dk': 'Denmark',
      'fi': 'Finland',
      'pl': 'Poland',
      'cz': 'Czech Republic',
      'hu': 'Hungary',
      'tr': 'Turkey',
      'gr': 'Greece',
      'il': 'Israel',
      'sa': 'Saudi Arabia',
      'eg': 'Egypt',
      'ae': 'United Arab Emirates',
      'vn': 'Vietnam',
      'my': 'Malaysia',
      'id': 'Indonesia',
      'ph': 'Philippines',
      'in': 'India',
      'sg': 'Singapore',
      'mx': 'Mexico',
      'ar': 'Argentina',
      'co': 'Colombia',
      'cl': 'Chile',
      'at': 'Austria',
      'ch': 'Switzerland',
      'be': 'Belgium',
      'za': 'South Africa',
      'nz': 'New Zealand',
      'ie': 'Ireland'
    };

    return countryCodes[code.toLowerCase()] || 'Unknown';
  }

  private getCountryFromEndpoint(endpoint: string): string {
    const match = endpoint.match(/^([^:]+)/);
    if (!match) return 'Unknown';

    const host = match[1];

    if (this.isIPAddress(host)) {
      return this.getCountryFromIP(host);
    }

    const parts = host.split('.');
    const tld = parts[parts.length - 1].toLowerCase();

    const countryMap: { [key: string]: string } = {
      'th': 'Thailand',
      'us': 'United States',
      'uk': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France',
      'jp': 'Japan',
      'au': 'Australia',
      'ca': 'Canada',
      'br': 'Brazil',
      'ru': 'Russia',
      'cn': 'China',
      'kr': 'South Korea',
      'sg': 'Singapore',
      'nl': 'Netherlands',
      'se': 'Sweden'
    };

    return countryMap[tld] || 'International';
  }

  private isIPAddress(host: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(host);
  }

  private getCountryFromIP(ip: string): string {
    const parts = ip.split('.').map(Number);
    const firstOctet = parts[0];
    const secondOctet = parts[1];

    if ((firstOctet === 202 && secondOctet >= 28 && secondOctet <= 31) ||
        (firstOctet === 203 && secondOctet >= 144 && secondOctet <= 147)) {
      return 'Thailand';
    }

    if ([8, 74, 173, 184].includes(firstOctet)) {
      return 'United States';
    }

    if (firstOctet === 217 || (firstOctet === 62 && secondOctet >= 104 && secondOctet <= 107)) {
      return 'Germany';
    }

    if (firstOctet === 192 || firstOctet === 10 || 
        (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)) {
      return 'Local/Private';
    }

    return 'International';
  }

  private extractOSFromServer(serverString: string): string {
    if (!serverString) return 'Unknown';
    
    const lower = serverString.toLowerCase();
    
    if (lower.includes('win32') || lower.includes('windows') || lower.includes('win64')) {
      return 'Windows';
    }
    
    if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian') || 
        lower.includes('centos') || lower.includes('rhel') || lower.includes('alpine')) {
      return 'Linux';
    }
    
    if (lower.includes('darwin') || lower.includes('macos') || lower.includes('osx')) {
      return 'macOS';
    }
    
    if (lower.includes('freebsd')) {
      return 'FreeBSD';
    }
    
    if (lower.includes('fxserver') || lower.includes('server')) {
      return 'Unknown OS';
    }
    
    return 'Unknown';
  }

  private sortByValue(obj: { [key: string]: number }): { [key: string]: number } {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .reduce((result, [key, value]) => {
        result[key] = value;
        return result;
      }, {} as { [key: string]: number });
  }
}