import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';

const SECONDS_PER_PROBLEM = 10;
const COOLDOWN_INTERVAL = 5;
const COOLDOWN_SECONDS = 15;

const estimateTime = (count) => {
  if (!isFinite(count)) return '∞';
  const baseSeconds = count * SECONDS_PER_PROBLEM;
  const cooldowns = Math.floor(count / COOLDOWN_INTERVAL) * COOLDOWN_SECONDS;
  const total = baseSeconds + cooldowns;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m}m`;
};

const ProblemInput = ({onSubmit}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [estimate, setEstimate] = useState('');

  const handleSubmit = (val) => {
    const input = val.trim().toLowerCase();
    let count;
    if (input === 'all') {
      count = Infinity;
    } else {
      const num = parseInt(input, 10);
      if (isNaN(num) || num <= 0) {
        setError('Enter a positive number or "all"');
        return;
      }
      count = num;
    }
    setEstimate(estimateTime(count));
    setSubmitted(true);
    setTimeout(() => onSubmit(count), 1500);
  };

  if (submitted) {
    return (
      <Box flexDirection="column" marginTop={1} paddingX={2}>
        <Box>
          <Text color="#50fa7b">{'  ✓ '}</Text>
          <Text color="#ccc">{estimate}</Text>
          <Text color="#555">{' — preparing to solve...'}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1} paddingX={2}>
      <Box>
        <Text color="#FFA116">{'  ▸ '}</Text>
        <Text color="#ccc">{'How many problems to solve? '}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder='number or "all"'
          focusColor="#FFA116"
        />
      </Box>
      {error && (
        <Box marginTop={0}>
          <Text color="#ff5555">{'    '}{error}</Text>
        </Box>
      )}
    </Box>
  );
};

export default ProblemInput;
