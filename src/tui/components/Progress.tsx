import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';

const STATUS_STYLES = {
  solved: {color: '#50fa7b', icon: '✓', label: 'solved'},
  skipped: {color: '#888', icon: '→', label: 'skipped'},
  skipped_summary: {color: '#888', icon: '→', label: 'skipped'},
  premium: {color: '#ffb86c', icon: '◆', label: 'premium'},
  failed: {color: '#ff5555', icon: '✗', label: 'failed'},
  judging: {color: '#f1fa8c', icon: '◎', label: 'judging'},
  queued: {color: '#666', icon: '·', label: 'queued'},
};

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatETA = (seconds) => {
  if (!isFinite(seconds) || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m left`;
  return `~${m}m left`;
};

const Progress = ({results, total, current, limit, startTime}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const solved = results.filter(r => r.status === 'solved').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const skippedSummary = results.filter(r => r.status === 'skipped_summary');
  const skippedTotal = skipped + skippedSummary.reduce((acc, r) => acc + parseInt(r.detail) || 0, 0);
  const failed = results.filter(r => r.status === 'failed').length;
  const processed = solved + skipped + failed + results.filter(r => r.status === 'premium').length;
  const target = limit === Infinity ? total : limit;
  const remaining = Math.max(0, target - processed);

  const rate = elapsed > 0 ? (solved / elapsed) * 3600 : 0;
  const eta = rate > 0 ? remaining / (rate / 3600) : Infinity;

  return (
    <Box flexDirection="column" marginTop={1} paddingX={2}>
      <Box marginBottom={1} gap={2}>
        <Text color="#FFA116" bold>{'  PROGRESS'}</Text>
        <Text color="#555">{'───'}</Text>
        <Text color="#888">{`${processed}/${target}`}</Text>
        <Text color="#555">{'│'}</Text>
        <Text color="#f1fa8c">{'⏱ '}{formatTime(elapsed)}</Text>
        <Text color="#555">{'│'}</Text>
        <Text color="#50fa7b">{'⚡ '}{rate.toFixed(1)}{'/hr'}</Text>
        <Text color="#555">{'│'}</Text>
        <Text color="#ffb86c">{'⏳ '}{formatETA(eta)}</Text>
      </Box>

      <Box flexDirection="column" gap={0}>
        {results.map((r, i) => {
          const style = STATUS_STYLES[r.status] || STATUS_STYLES.queued;
          return (
            <Box key={i}>
              <Text color={style.color}>
                {'  '}{style.icon}{' '}
              </Text>
              <Text color="#ccc" strikethrough={r.status === 'skipped'}>
                {r.name}
              </Text>
              <Text color={style.color}>
                {' '}{'→'}{' '}{style.label}
              </Text>
              {r.detail && (
                <Text color="#555">
                  {' '}{r.detail}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {results.length > 0 && (
        <Box marginTop={1}>
          <Text color="#555">{'  ────────────────────────────'}</Text>
        </Box>
      )}

      <Box justifyContent="space-between">
        <Text color="#666">
          {'  '}{solved}{' solved'}
          {'  ·  '}
          {skippedTotal}{' skipped'}
          {failed > 0 && <>{'  ·  '}{<Text color="#ff5555">{failed} failed</Text>}</>}
        </Text>
        {current && (
          <Text color="#FFA116" bold>
            {'▸ '}{current}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default Progress;
