// Convert segments to SRT format
const toSRT = (segments) => {
  return segments.map((segment, index) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
  }).join('\n');
};

// Convert segments to VTT format
const toVTT = (segments) => {
  let vtt = 'WEBVTT\n\n';
  vtt += segments.map((segment, index) => {
    const startTime = formatVTTTime(segment.start);
    const endTime = formatVTTTime(segment.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
  }).join('\n');
  return vtt;
};

// Convert segments to JSON format
const toJSON = (segments, fullText) => {
  return JSON.stringify({
    full_text: fullText,
    segments: segments.map(segment => ({
      start: segment.start,
      end: segment.end,
      text: segment.text.trim()
    }))
  }, null, 2);
};

// Convert segments to plain text
const toTXT = (segments) => {
  return segments.map(segment => segment.text.trim()).join('\n\n');
};

// Format time for SRT (HH:MM:SS,mmm)
const formatSRTTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
};

// Format time for VTT (HH:MM:SS.mmm)
const formatVTTTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
};

// Pad number with zeros
const pad = (num, size) => {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
};

// Parse SRT format to segments
const parseSRT = (srtContent) => {
  const segments = [];
  const blocks = srtContent.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (timeMatch) {
        const start = parseSRTTime(timeMatch[1]);
        const end = parseSRTTime(timeMatch[2]);
        const text = lines.slice(2).join('\n');
        segments.push({ start, end, text });
      }
    }
  }

  return segments;
};

// Parse SRT time to seconds
const parseSRTTime = (timeStr) => {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/);
  if (match) {
    const hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const ms = parseInt(match[4], 10);
    return hrs * 3600 + mins * 60 + secs + ms / 1000;
  }
  return 0;
};

// Export function
const exportTranscription = (segments, fullText, format) => {
  switch (format.toLowerCase()) {
    case 'srt':
      return {
        content: toSRT(segments),
        contentType: 'text/plain',
        extension: 'srt'
      };
    case 'vtt':
      return {
        content: toVTT(segments),
        contentType: 'text/vtt',
        extension: 'vtt'
      };
    case 'json':
      return {
        content: toJSON(segments, fullText),
        contentType: 'application/json',
        extension: 'json'
      };
    case 'txt':
    default:
      return {
        content: toTXT(segments),
        contentType: 'text/plain',
        extension: 'txt'
      };
  }
};

module.exports = {
  toSRT,
  toVTT,
  toJSON,
  toTXT,
  parseSRT,
  exportTranscription
};
