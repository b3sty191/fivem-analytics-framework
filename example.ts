import { FiveMServerStream } from './src/index.js';
import type { ServerInfo } from './src/index.js';

function parseFiveMColors(text: string): string {
    const colorMap: { [key: string]: string } = {
        '^0': '\x1b[30m',    // Black
        '^1': '\x1b[31m',    // Red
        '^2': '\x1b[32m',    // Green  
        '^3': '\x1b[33m',    // Yellow
        '^4': '\x1b[34m',    // Blue
        '^5': '\x1b[36m',    // Cyan
        '^6': '\x1b[35m',    // Magenta
        '^7': '\x1b[37m',    // White
        '^8': '\x1b[90m',    // Dark Gray
        '^9': '\x1b[91m'     // Light Red
    };

    let result = text;
    
    Object.entries(colorMap).forEach(([code, ansi]) => {
        result = result.replace(new RegExp(code.replace('^', '\\^'), 'g'), ansi);
    });
    
    return result + '\x1b[0m';
}

async function main() {
    console.log('🚀 Starting FiveM Server Stream...');

    const streamClient = new FiveMServerStream({
        streamSince: 300,
        maxServers: Number.MAX_SAFE_INTEGER
    });

    try {
        const thaiServers = await streamClient.getFilteredServers(
            (serverInfo: ServerInfo) => serverInfo.Data?.vars?.locale === "th-TH"
        );
        
        thaiServers.sort((a, b) => (b.Data?.clients || 0) - (a.Data?.clients || 0));
        
        console.log(`🇹🇭 พบเซิร์ฟเวอร์ไทย ${thaiServers.length} เซิร์ฟเวอร์`);
        console.log('━'.repeat(50));

        thaiServers.slice(0, 10).forEach((server, index) => {
            const hostname = server.Data?.hostname || 'Unknown';
            const coloredHostname = parseFiveMColors(hostname);
            
            console.log(`${index + 1}. ${coloredHostname}`);
            console.log(`   👥 ${server.Data?.clients || 0}/${server.Data?.svMaxclients || 0} players`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Failed to get servers:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Shutting down...');
    process.exit(0);
});

main().catch(console.error);