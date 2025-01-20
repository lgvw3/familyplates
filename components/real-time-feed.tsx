'use client';

import { useWebSocket } from '@/hooks/use-websockets';
import React, { useState } from 'react';

const RealTimeFeed = () => {
    const [input, setInput] = useState('');
    const { messages, sendMessage } = useWebSocket();

    const handleSend = () => {
        sendMessage(input); // Send the input as a message
        setInput(''); // Clear the input field
    };

    return (
        <div>
            <h1>Real-Time Feed</h1>
            <ul>
                {
                    messages.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                    ))
                }
            </ul>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default RealTimeFeed;
