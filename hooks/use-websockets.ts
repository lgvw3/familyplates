'use client';

import { useCallback, useEffect, useState } from 'react';
import { Annotation } from "@/types/scripture";


export const useWebSocket = (initialAnnotations: Annotation[] = [], isFeed?: boolean) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let ws: WebSocket | null = null;
        const connect = () => {
            ws = new WebSocket(process.env.NEXT_PUBLIC_WEB_SOCKET_URL ?? '');
            console.log(process.env.NEXT_PUBLIC_WEB_SOCKET_URL)
            ws.onopen = () => {
                console.log('WebSocket connected');
                setSocket(ws)
                setRetryCount(0); // Reset retry count on successful connection
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type == 'annotation') {
                    if (isFeed) {
                        addAnnotationToTopOfFeed(data.data)
                    }
                    else {
                        addAnnotation(data.data)
                    }
                }
                else {
                    setMessages((prev) => [...prev, data]);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected. Retrying...');
                // Retry with exponential backoff
                setTimeout(() => {
                    setRetryCount((prev) => prev + 1);
                    connect();
                }, Math.min(1000 * 2 ** retryCount, 30000)); // Max delay: 30s
            };
        };

        connect();

        return () => {
            ws?.close();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/*     const checkServerHealth = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_WEB_SOCKET_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }; */
      

    const sendMessage = (message: string) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open');
        }
    };

    const addAnnotation = useCallback((annotation: Annotation) => {
        setAnnotations(prev => {
            const temp = prev.filter(a => a._id != annotation._id)
            return [...temp, annotation]
        })
    }, [])

    const addAnnotationToTopOfFeed = useCallback((annotation: Annotation) => {
        setAnnotations(prev => {
            const temp = prev.filter(a => a._id != annotation._id)
            return [annotation, ...temp]
        })
    }, [])

    return { messages, sendMessage, annotations, setAnnotations, addAnnotation, addAnnotationToTopOfFeed };
};
