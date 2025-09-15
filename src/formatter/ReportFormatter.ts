import type { AnalysisReport, ServerStats, CountryStats } from '../analyzer/ServerAnalyzer.js';
import { ConsoleChart } from '../utils/ConsoleChart.js';

export class ReportFormatter {
  
  static formatFullReport(report: AnalysisReport): string {
    const lines: string[] = [];
    
    lines.push('');
    lines.push('🔍 FiveM Server Analysis Report');
    lines.push('═'.repeat(70));
    lines.push(`📅 Analysis Time: ${report.timestamp.toLocaleString()}`);
    lines.push(`⚡ Processing Time: ${report.analysisTime}ms`);
    lines.push('');

    lines.push(...this.formatOverviewWithCharts(report.overview));
    lines.push('');

    lines.push(...this.formatCountryAnalysisWithCharts(report.byCountry));

    return lines.join('\n');
  }

  static formatOverviewWithCharts(stats: ServerStats): string[] {
    const lines: string[] = [];
    
    lines.push('📊 OVERVIEW STATISTICS');
    lines.push('━'.repeat(50));
    lines.push(`🖥️  Total Servers: ${stats.totalServers.toLocaleString()}`);
    lines.push(`👥 Total Players: ${stats.totalPlayers.toLocaleString()}`);
    lines.push(`🎯 Total Capacity: ${stats.totalMaxSlots.toLocaleString()}`);
    lines.push(`📈 Average Population: ${stats.averagePopulation.toFixed(1)} players/server`);
    lines.push(`📦 Total Resources: ${stats.resourceUsage.totalResources.toLocaleString()}`);
    lines.push(`📋 Avg Resources/Server: ${stats.resourceUsage.averageResourcesPerServer.toFixed(1)}`);
    
    lines.push(ConsoleChart.horizontalBar(stats.popularGameTypes, {
      title: '🎮 POPULAR GAME TYPES',
      maxWidth: 40,
      maxItems: 8,
      colors: true
    }));

    if (Object.keys(stats.operatingSystems).length > 0) {
      lines.push(ConsoleChart.pieChart(stats.operatingSystems, {
        title: '💻 OPERATING SYSTEMS',
        maxItems: 6
      }));
    }

    lines.push(ConsoleChart.horizontalBar(stats.popularMaps, {
      title: '🗺️  POPULAR MAPS',
      maxWidth: 35,
      maxItems: 6,
      colors: true
    }));

    lines.push(ConsoleChart.horizontalBar(stats.resourceUsage.popularResources, {
      title: '📦 POPULAR RESOURCES',
      maxWidth: 30,
      maxItems: 10,
      colors: true
    }));

    return lines;
  }

  static formatCountryAnalysisWithCharts(countries: CountryStats[]): string[] {
    const lines: string[] = [];
    
    lines.push('🌍 ANALYSIS BY COUNTRY');
    lines.push('━'.repeat(50));
    
    const sortedByPlayers = [...countries].sort((a, b) => b.playerCount - a.playerCount);
    const topPlayerCountry = sortedByPlayers[0];
    const sortedByServers = [...countries].sort((a, b) => b.serverCount - a.serverCount);
    const topServerCountry = sortedByServers[0];
    
    lines.push('🏆 TOP COUNTRIES HIGHLIGHTS');
    lines.push('━'.repeat(30));
    if (topPlayerCountry) {
      lines.push(`👥 Most Players: ${topPlayerCountry.country} (${topPlayerCountry.playerCount.toLocaleString()} players)`);
    }
    if (topServerCountry) {
      lines.push(`🖥️  Most Servers: ${topServerCountry.country} (${topServerCountry.serverCount.toLocaleString()} servers)`);
    }
    
    const bestRatioCountry = countries
      .filter(c => c.serverCount >= 5)
      .sort((a, b) => b.averagePopulation - a.averagePopulation)[0];
    
    if (bestRatioCountry) {
      lines.push(`📈 Best Avg Population: ${bestRatioCountry.country} (${bestRatioCountry.averagePopulation.toFixed(1)} players/server)`);
    }
    lines.push('');
    
    const countryServerData: { [key: string]: number } = {};
    const countryPlayerData: { [key: string]: number } = {};
    
    countries.slice(0, 12).forEach(country => {
      countryServerData[this.addCountryFlag(country.country)] = country.serverCount;
      countryPlayerData[this.addCountryFlag(country.country)] = country.playerCount;
    });

    lines.push(ConsoleChart.horizontalBar(countryServerData, {
      title: '🖥️  SERVERS BY COUNTRY',
      maxWidth: 40,
      colors: true,
      maxItems: 10
    }));

    lines.push(ConsoleChart.horizontalBar(countryPlayerData, {
      title: '👥 PLAYERS BY COUNTRY', 
      maxWidth: 40,
      colors: true,
      maxItems: 10
    }));

    lines.push('\n📊 DETAILED COUNTRY STATISTICS');
    lines.push('─'.repeat(40));

    const tableData = countries.slice(0, 15).map(country => ({
      'Country': this.getCountryFlag(country.country) + ' ' + country.country,
      'Servers': country.serverCount,
      'Players': country.playerCount,
      'Avg Pop': Number(country.averagePopulation.toFixed(1)),
      'Top Type': (country.topGameTypes[0] || 'N/A').substring(0, 15)
    }));

    console.table(tableData);
    lines.push('Table displayed above ↑');

    return lines;
  }

  static formatOverview(stats: ServerStats): string[] {
    const lines: string[] = [];
    
    lines.push('📊 OVERVIEW STATISTICS');
    lines.push('━'.repeat(30));
    lines.push(`🖥️  Total Servers: ${stats.totalServers.toLocaleString()}`);
    lines.push(`👥 Total Players: ${stats.totalPlayers.toLocaleString()}`);
    lines.push(`🎯 Total Capacity: ${stats.totalMaxSlots.toLocaleString()}`);
    lines.push(`📈 Average Population: ${stats.averagePopulation.toFixed(1)} players/server`);
    lines.push(`📦 Total Resources: ${stats.resourceUsage.totalResources.toLocaleString()}`);
    lines.push(`📋 Avg Resources/Server: ${stats.resourceUsage.averageResourcesPerServer.toFixed(1)}`);
    lines.push('');

    lines.push('🎮 POPULAR GAME TYPES');
    lines.push('─'.repeat(25));
    const gameTypes = Object.entries(stats.popularGameTypes).slice(0, 10);
    gameTypes.forEach(([gameType, count], index) => {
      const percentage = ((count / stats.totalServers) * 100).toFixed(1);
      lines.push(`${index + 1}. ${gameType}: ${count} servers (${percentage}%)`);
    });
    lines.push('');

    lines.push('🗺️  POPULAR MAPS');
    lines.push('─'.repeat(20));
    const maps = Object.entries(stats.popularMaps).slice(0, 10);
    maps.forEach(([map, count], index) => {
      const percentage = ((count / stats.totalServers) * 100).toFixed(1);
      lines.push(`${index + 1}. ${map}: ${count} servers (${percentage}%)`);
    });
    lines.push('');

    lines.push('🔧 SERVER VERSIONS');
    lines.push('─'.repeat(20));
    const versions = Object.entries(stats.serverVersions).slice(0, 5);
    versions.forEach(([version, count], index) => {
      const percentage = ((count / stats.totalServers) * 100).toFixed(1);
      const displayVersion = version.length > 30 ? version.substring(0, 30) + '...' : version;
      lines.push(`${index + 1}. ${displayVersion}: ${count} (${percentage}%)`);
    });
    lines.push('');

    lines.push('📦 POPULAR RESOURCES');
    lines.push('─'.repeat(25));
    const resources = Object.entries(stats.resourceUsage.popularResources).slice(0, 10);
    resources.forEach(([resource, count], index) => {
      const percentage = ((count / stats.totalServers) * 100).toFixed(1);
      lines.push(`${index + 1}. ${resource}: ${count} servers (${percentage}%)`);
    });

    return lines;
  }

  static formatCountryAnalysis(countries: CountryStats[]): string[] {
    const lines: string[] = [];
    
    lines.push('🌍 ANALYSIS BY COUNTRY');
    lines.push('━'.repeat(30));
    lines.push('');

    countries.forEach((country, index) => {
      lines.push(`${index + 1}. 🏴 ${country.country}`);
      lines.push(`   🖥️  Servers: ${country.serverCount.toLocaleString()}`);
      lines.push(`   👥 Players: ${country.playerCount.toLocaleString()}`);
      lines.push(`   📊 Avg Population: ${country.averagePopulation.toFixed(1)} players/server`);
      
      if (country.topGameTypes.length > 0) {
        lines.push(`   🎮 Popular Types: ${country.topGameTypes.join(', ')}`);
      }

      if (country.topServers.length > 0) {
        lines.push(`   ⭐ Top Servers:`);
        country.topServers.slice(0, 3).forEach((server, i) => {
          const hostname = server.hostname.length > 40 
            ? server.hostname.substring(0, 40) + '...' 
            : server.hostname;
          lines.push(`      ${i + 1}. ${hostname}`);
          lines.push(`         👥 ${server.players}/${server.maxSlots} - ${server.endpoint}`);
        });
      }
      
      lines.push('');
    });

    return lines;
  }

  static formatSummary(report: AnalysisReport): string {
    const stats = report.overview;
    const topCountry = report.byCountry[0];
    
    return [
      '📊 Quick Summary:',
      `   🖥️  ${stats.totalServers} servers | 👥 ${stats.totalPlayers} players`,
      `   📈 ${stats.averagePopulation.toFixed(1)} avg players/server`,
      `   🏴 Top country: ${topCountry?.country} (${topCountry?.serverCount} servers)`,
      `   ⚡ Analysis time: ${report.analysisTime}ms`
    ].join('\n');
  }

  static formatCountrySummary(countries: CountryStats[]): string {
    const lines: string[] = [];
    
    lines.push('🌍 Server Distribution by Country:');
    lines.push('─'.repeat(35));
    
    countries.slice(0, 15).forEach((country, index) => {
      const flag = this.getCountryFlag(country.country);
      const num = (index + 1).toString().padStart(2);
      lines.push(`${num}. ${flag} ${country.country.padEnd(15)} | ` +
                 `${country.serverCount.toString().padStart(4)} servers | ` +
                 `${country.playerCount.toString().padStart(5)} players`);
    });

    return lines.join('\n');
  }

  private static addCountryFlag(country: string): string {
    return this.getCountryFlag(country) + ' ' + country;
  }

  private static getCountryFlag(country: string): string {
    const flags: { [key: string]: string } = {
      'Thailand': '🇹🇭',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'Australia': '🇦🇺',
      'Canada': '🇨🇦',
      'Brazil': '🇧🇷',
      'Russia': '🇷🇺',
      'China': '🇨🇳',
      'South Korea': '🇰🇷',
      'Singapore': '🇸🇬',
      'Netherlands': '🇳🇱',
      'Sweden': '🇸🇪',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'Portugal': '🇵🇹',
      'Poland': '🇵🇱',
      'Turkey': '🇹🇷',
      'India': '🇮🇳',
      'Vietnam': '🇻🇳',
      'Malaysia': '🇲🇾',
      'Indonesia': '🇮🇩',
      'Philippines': '🇵🇭',
      'International': '🌐',
      'Local/Private': '🏠',
      'Unknown': '🏴'
    };

    return flags[country] || '🏴';
  }
}