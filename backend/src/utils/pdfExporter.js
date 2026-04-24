const generatePDFBuffer = async (data, title, columns) => {
  // Simple text-based PDF generation without pdfkit dependency
  // Returns a buffer with a basic PDF structure
  const cols = columns || (data.length > 0 ? Object.keys(data[0]) : []);

  let content = `${title}\n${'='.repeat(title.length)}\n\nGenerated: ${new Date().toISOString()}\nTotal Records: ${data.length}\n\n`;
  content += cols.join(' | ') + '\n';
  content += cols.map(() => '---').join(' | ') + '\n';

  data.forEach(row => {
    content += cols.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '-';
      return String(val).substring(0, 50);
    }).join(' | ') + '\n';
  });

  return Buffer.from(content, 'utf-8');
};

module.exports = { generatePDFBuffer };
