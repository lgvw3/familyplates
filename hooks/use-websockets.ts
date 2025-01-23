'use client';

import { useCallback, useEffect, useState } from 'react';
import { Annotation, AnnotationComment, AnnotationLike } from "@/types/scripture";


export const useWebSocket = (initialAnnotations: Annotation[] = [], isFeed?: boolean, bookId?: string, chapterNumber?: number) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
    const [retryCount, setRetryCount] = useState(0);
    const [notification, setNotification] = useState<Annotation | null>()

    useEffect(() => {
        let ws: WebSocket | null = null;
        const connect = () => {
            ws = new WebSocket(process.env.NEXT_PUBLIC_WEB_SOCKET_URL ?? '');
            ws.onopen = () => {
                console.log('WebSocket connected');
                if (socket) {
                    console.log('Closing old connection')
                    socket.close()
                }
                setSocket(ws)
                setRetryCount(0); // Reset retry count on successful connection
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.channel == 'annotations') {
                    const ann: Annotation = JSON.parse(data.data)
                    setNotification(ann)
                    if (isFeed) {
                        addAnnotationToTopOfFeed(ann)
                    }
                    else {
                        addAnnotation(ann)
                    }
                }
                else if (data.channel == 'comments') {
                    addComment(JSON.parse(data.data))
                }
                else if (data.channel == "likes") {
                    addLikes(JSON.parse(data.data))
                }
                else if (data.channel == 'bookmarks') {
                    // local save of bookmarks of family members
                    // when they are active display just once in feed
                    // do a notification and invite to "read along"
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
        if (!bookId && !chapterNumber || (annotation.bookId == bookId && annotation.chapterNumber == chapterNumber )) {
            setAnnotations(prev => {
                const temp = prev.filter(a => a._id != annotation._id)
                return [...temp, annotation]
            })
        }
    }, [bookId, chapterNumber])

    const addAnnotationToTopOfFeed = useCallback((annotation: Annotation) => {
        setAnnotations(prev => {
            const temp = prev.filter(a => a._id != annotation._id)
            return [annotation, ...temp]
        })
    }, [])

    const addAnnotationsToBottomOfFeed = useCallback((annotations: Annotation[]) => {
        setAnnotations(prev => {
            return [...prev, ...annotations]
        })
    }, [])

    const addComment = useCallback((commentData: { annotationId: string; comment: AnnotationComment; }) => {
        setAnnotations(prev => {
            const temp = prev.find(val => val._id?.toString() === commentData.annotationId);
            if (temp) {
                const updatedTemp = {
                    ...temp,
                    comments: [...(temp.comments || []), { ...commentData.comment, _id: commentData.comment._id.toString() }],
                };
                return prev.map(val => (val._id?.toString() === commentData.annotationId ? updatedTemp : val));
            } else {
                return prev;
            }
        })
    }, [])

    const addLikes = useCallback((likeData: { likes: boolean, like: AnnotationLike; annotationId: string; }) => {
        setAnnotations(prev => {
            const temp = prev.find(val => val._id?.toString() === likeData.annotationId);
            if (temp) {
                const updatedTemp = {
                    ...temp,
                    likes: likeData.likes ? [...(temp.likes || []), { ...likeData.like, _id: likeData.like._id.toString() }] : [...(temp.likes?.filter(val => val.userId != likeData.like.userId) || [])],
                };
                return prev.map(val => (val._id?.toString() === likeData.annotationId ? updatedTemp : val));
            } else {
                return prev;
            }
        })
    }, [])

    return { messages, sendMessage, annotations, setAnnotations, addAnnotation, addAnnotationToTopOfFeed, addAnnotationsToBottomOfFeed, notification, setNotification };
};
