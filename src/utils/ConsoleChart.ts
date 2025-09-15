export class ConsoleChart {
  static horizontalBar(
    data: { [key: string]: number }, 
    options: {
      title?: string;
      maxWidth?: number;
      showPercentage?: boolean;
      showValue?: boolean;
      colors?: boolean;
      maxItems?: number;
    } = {}
  ): string {
    const {
      title = '',
      maxWidth = 300,
      showPercentage = true,
      showValue = true,
      colors = true,
      maxItems = 10
    } = options;

    const lines: string[] = [];
    
    if (title) {
      lines.push(`\n📊 ${title}`);
      lines.push('─'.repeat(title.length + 3));
    }
    const sortedData = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxItems);

    const maxValue = Math.max(...sortedData.map(([,value]) => value));
    const total = sortedData.reduce((sum, [,value]) => sum + value, 0);

    const colorCodes = colors ? [
      '\x1b[32m', // Green
      '\x1b[33m', // Yellow  
      '\x1b[34m', // Blue
      '\x1b[35m', // Magenta
      '\x1b[36m', // Cyan
      '\x1b[31m', // Red
      '\x1b[37m', // White
    ] : [];

    sortedData.forEach(([key, value], index) => {
      const percentage = total > 0 ? ((value / total) * 100) : 0;
      const barLength = maxValue > 0 ? Math.round((value / maxValue) * maxWidth) : 0;
      
      const colorCode = colors ? colorCodes[index % colorCodes.length] : '';
      const resetCode = colors ? '\x1b[0m' : '';
      const bar = colorCode + '█'.repeat(barLength) + resetCode;

      let label = key.length > 25 ? key.substring(0, 22) + '...' : key;
      label = label.padEnd(25);
      
      let valueText = '';
      if (showValue) valueText += `${value.toLocaleString()}`;
      if (showPercentage) valueText += ` (${percentage.toFixed(1)}%)`;
      
      lines.push(`${label} ${bar} ${valueText}`);
    });

    return lines.join('\n');
  }

  static verticalBar(
    data: { [key: string]: number },
    options: {
      title?: string;
      height?: number;
      maxItems?: number;
    } = {}
  ): string {
    const { title = '', height = 10, maxItems = 8 } = options;
    
    const lines: string[] = [];
    
    if (title) {
      lines.push(`\n📊 ${title}`);
      lines.push('─'.repeat(title.length + 3));
    }

    const sortedData = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxItems);

    if (sortedData.length === 0) return 'No data';

    const maxValue = Math.max(...sortedData.map(([,value]) => value));
    
    for (let row = height; row >= 1; row--) {
      let line = '';
      sortedData.forEach(([key, value]) => {
        const barHeight = maxValue > 0 ? Math.round((value / maxValue) * height) : 0;
        const char = barHeight >= row ? '█' : ' ';
        line += char.padEnd(8);
      });
      lines.push(line);
    }

    let valueLine = '';
    sortedData.forEach(([key, value]) => {
      valueLine += value.toString().padEnd(8);
    });
    lines.push(valueLine);

    let labelLine = '';
    sortedData.forEach(([key]) => {
      const shortKey = key.length > 7 ? key.substring(0, 6) + '.' : key;
      labelLine += shortKey.padEnd(8);
    });
    lines.push(labelLine);

    return lines.join('\n');
  }

  static pieChart(
    data: { [key: string]: number },
    options: {
      title?: string;
      maxItems?: number;
      showLegend?: boolean;
    } = {}
  ): string {
    const { title = '', maxItems = 8, showLegend = true } = options;
    
    const lines: string[] = [];
    
    if (title) {
      lines.push(`\n🥧 ${title}`);
      lines.push('─'.repeat(title.length + 3));
    }

    const sortedData = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxItems);

    const total = sortedData.reduce((sum, [,value]) => sum + value, 0);
    
    const symbols = ['█', '▉', '▊', '▋', '▌', '▍', '▎', '▏'];
    const colors = [
      '\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m',
      '\x1b[35m', '\x1b[36m', '\x1b[37m', '\x1b[90m'
    ];

    if (showLegend) {
      sortedData.forEach(([key, value], index) => {
        const percentage = total > 0 ? ((value / total) * 100) : 0;
        const color = colors[index % colors.length];
        const symbol = symbols[index % symbols.length];
        
        lines.push(`${color}${symbol}\x1b[0m ${key}: ${value.toLocaleString()} (${percentage.toFixed(1)}%)`);
      });
    }

    return lines.join('\n');
  }

  static progressBar(
    current: number,
    total: number,
    options: {
      width?: number;
      showPercentage?: boolean;
      showNumbers?: boolean;
      label?: string;
    } = {}
  ): string {
    const { width = 30, showPercentage = true, showNumbers = true, label = '' } = options;
    
    const percentage = total > 0 ? (current / total) : 0;
    const filled = Math.round(percentage * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let result = label ? `${label}: ` : '';
    result += `[${bar}]`;
    
    if (showPercentage) {
      result += ` ${(percentage * 100).toFixed(1)}%`;
    }
    
    if (showNumbers) {
      result += ` (${current.toLocaleString()}/${total.toLocaleString()})`;
    }
    
    return result;
  }

  static sparkline(data: number[], options: { height?: number } = {}): string {
    const { height = 8 } = options;
    
    if (data.length === 0) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    const sparks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    
    return data.map(value => {
      if (range === 0) return sparks[0];
      const normalized = (value - min) / range;
      const index = Math.round(normalized * (sparks.length - 1));
      return sparks[index];
    }).join('');
  }

  static table(
    data: Array<{ [key: string]: string | number }>,
    options: {
      headers?: string[];
      maxWidth?: number;
      showIndex?: boolean;
    } = {}
  ): string {
    if (data.length === 0) return 'No data';
    
    const { headers, maxWidth = 120, showIndex = false } = options;
    const lines: string[] = [];
    
    const cols = headers || Object.keys(data[0]);
    if (showIndex) cols.unshift('#');
    
    const colWidths: number[] = cols.map((col, colIndex) => {
      const headerWidth = this.getDisplayWidth(col);
      const dataWidths = data.map((row, rowIndex) => {
        let value: string;
        if (col === '#') {
          value = (rowIndex + 1).toString();
        } else {
          value = String(row[col] || '');
        }
        return this.getDisplayWidth(value);
      });
      
      const minWidths = [8, 20, 10, 10, 10, 12];
      const minWidth = minWidths[colIndex] || 8;
      
      return Math.max(headerWidth, Math.max(...dataWidths), minWidth);
    });
    
    const headerLine = cols.map((col, i) => 
      this.padDisplayText(col, colWidths[i])
    ).join(' | ');
    lines.push(headerLine);
    lines.push(cols.map((_, i) => '─'.repeat(colWidths[i])).join('─┼─'));
    
    data.forEach((row, index) => {
      const rowData = cols.map((col, i) => {
        let value: string;
        if (col === '#') {
          value = (index + 1).toString();
        } else {
          value = String(row[col] || '');
        }
        
        return this.padDisplayText(value, colWidths[i]);
      });
      
      lines.push(rowData.join(' | '));
    });
    
    return lines.join('\n');
  }

  private static getDisplayWidth(text: string): number {
    const emojiCount = (text.match(/[\u{1F1E6}-\u{1F1FF}]/gu) || []).length / 2;
    return text.length - emojiCount;
  }

  private static padDisplayText(text: string, targetWidth: number): string {
    const displayWidth = this.getDisplayWidth(text);
    const paddingNeeded = Math.max(0, targetWidth - displayWidth);
    return text + ' '.repeat(paddingNeeded);
  }
}