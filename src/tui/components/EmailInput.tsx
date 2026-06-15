import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {saveEmail, setEmail} from '../../config.js';

const EmailInput = ({onSubmit}) => {
  const [email, setEmailState] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (value) => {
    setEmailState(value);
    setError('');
  };

  const handleSubmit = (val) => {
    const input = val.trim();
    if (!input) {
      setError('Please enter your email');
      return;
    }

    if (!input.includes('@') || !input.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    saveEmail(input);
    setEmail(input);
    onSubmit(input);
  };

  return (
    <Box flexDirection="column" marginTop={1} paddingX={2}>
      <Box>
        <Text color="#FFA116">{'  ▸ '}</Text>
        <Text color="#ccc">{'Enter your LeetCode email: '}</Text>
        <TextInput
          value={email}
          onChange={handleEmailChange}
          onSubmit={handleSubmit}
          placeholder="your.email@example.com"
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

export default EmailInput;