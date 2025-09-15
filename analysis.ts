import { FiveMServerStream, ServerAnalyzer, ReportFormatter, ConsoleChart } from './src/index.js';
import type { ServerInfo } from './src/index.js';

async function analyzeServers() {
  const analyzer = new ServerAnalyzer();
  let collectedCount = 0;
  const maxServers = 9999999;

  const startTime = Date.now();
  let lastUpdateTime = startTime;

  const showProgress = () => {
    const elapsed = Date.now() - startTime;
    const rate = collectedCount / (elapsed / 1000);
    const progressBar = ConsoleChart.progressBar(collectedCount, maxServers, {
      width: 40,
      showPercentage: true,
      showNumbers: true,
      label: '📊 Progress'  
    });
    
    process.stdout.write(`\r${progressBar} | Rate: ${rate.toFixed(1)} servers/sec`);
  };

  const progressInterval = setInterval(showProgress, 200);

  try {
    const streamClient = new FiveMServerStream({
      streamSince: 300,
      maxServers: maxServers,
      handlers: {
        onServer: (serverInfo: ServerInfo) => {
          analyzer.addServer(serverInfo);
          collectedCount++;
        },

        onError: (error: Error) => {
          console.error('\n❌ Stream Error:', error.message);
        },

        onEnd: () => {
          clearInterval(progressInterval);
          console.log(`\n\n✅ Data collection completed!`);
          console.log(`🕐 Collection time: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
          
          console.log('\n🔬 Analyzing data...');
          const report = analyzer.analyze();
          
          console.clear();
          console.log('🎯 FiveM Server Analysis Complete!');
          console.log('═'.repeat(80));
          
          console.log(ReportFormatter.formatFullReport(report));
          
          console.log('\n' + '═'.repeat(80));
          console.log('📋 EXECUTIVE SUMMARY');
          console.log('═'.repeat(80));
          console.log(ReportFormatter.formatSummary(report));
          
          process.exit(0);
        }
      }
    });

    await streamClient.start();

  } catch (error) {
    clearInterval(progressInterval);
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

function demonstrateAnalyzer() {
  console.clear();
  console.log('🎨 FiveM Server Analyzer - Chart Demo');
  console.log('═'.repeat(50));
  
  console.log('\n1️⃣ Horizontal Bar Chart Demo:');
  const sampleGameTypes = {
    'Roleplay': 450,
    'Racing': 250, 
    'Freeroam': 180,
    'Survival': 120,
    'Deathmatch': 90
  };
  
  console.log(ConsoleChart.horizontalBar(sampleGameTypes, {
    title: '🎮 Sample Game Types',
    maxWidth: 40,
    colors: true
  }));

  console.log('\n2️⃣ Pie Chart Demo:');
  const sampleOS = {
    'Windows': 680,
    'Linux': 320,
    'Unknown': 150,
    'macOS': 45
  };
  
  console.log(ConsoleChart.pieChart(sampleOS, {
    title: '💻 Sample Operating Systems'
  }));

  console.log('\n3️⃣ Progress Bar Demo:');
  for (let i = 0; i <= 100; i += 25) {
    console.log(ConsoleChart.progressBar(i, 100, {
      width: 30,
      label: `Step ${i/25 + 1}`,
      showPercentage: true
    }));
  }

  console.log('\n4️⃣ Table Demo:');
  const sampleCountries = [
    { Country: '🇺🇸 United States', Servers: '425', Players: '5,250', 'Avg Pop': '12.4' },
    { Country: '🇩🇪 Germany', Servers: '180', Players: '2,150', 'Avg Pop': '11.9' },
    { Country: '🇹🇭 Thailand', Servers: '95', Players: '1,200', 'Avg Pop': '12.6' }
  ];
  
  console.log(ConsoleChart.table(sampleCountries, {
    showIndex: true
  }));

  console.log('\n5️⃣ Sparkline Demo:');
  const sampleData = [1, 3, 2, 5, 8, 4, 6, 9, 7, 10, 8, 6];
  console.log('Server Population Trend: ' + ConsoleChart.sparkline(sampleData));

  console.log('\n✨ Ready to use these charts in real analysis!');
  console.log('Run without --demo to see live server data analysis.');
}

process.on('SIGINT', () => {
  console.log('\n⏹️  Analysis interrupted. Shutting down...');
  process.exit(0);
});

const args = process.argv.slice(2);

if (args.includes('--demo')) {
  demonstrateAnalyzer();
} else {
  console.log('🎯 FiveM Server Analysis Tool');
  console.log('');
  console.log('Options:');
  console.log('  --demo    Show analyzer demo with sample data');
  console.log('  (none)    Start live server analysis');
  console.log('');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  bun run analysis.ts         # Live analysis');
    console.log('  bun run analysis.ts --demo  # Demo mode');
    process.exit(0);
  }
  
  analyzeServers();
}