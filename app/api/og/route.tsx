import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Get title and description from query params
        const title = searchParams.get('title') ?? 'Family Plates';
        const description = searchParams.get('description') ?? '';

        // Parse description to separate scripture and annotation if present
        const [scripture, ...annotationParts] = description.split('\n\n');
        const annotation = annotationParts.join('\n\n');
        const hasScripture = description.includes(' - '); // Check if there's a scripture reference

        // Book of Mormon inspired colors
        const colors = {
            navy: 'hsl(220, 60%, 20%)',      // Deep navy background
            gold: 'hsl(45, 80%, 60%)',        // Gold/brass for primary accents
            lightGold: 'hsl(45, 70%, 75%)',   // Lighter gold for secondary text
            white: 'hsl(0, 0%, 100%)',        // White for contrast
            cream: 'hsl(45, 30%, 96%)'        // Cream color for softer text
        };

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.navy,
                        padding: '40px 60px',
                        fontFamily: 'serif', // More traditional, book-like feel
                    }}
                >
                    {/* Site name in gold */}
                    <div
                        style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: colors.gold,
                            marginBottom: '20px',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Family Plates
                    </div>
                    
                    {/* Author name in white */}
                    <div
                        style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: colors.white,
                            marginBottom: '20px',
                            textAlign: 'center',
                        }}
                    >
                        {title}
                    </div>
                    
                    {/* Scripture quote in light gold */}
                    {hasScripture && (
                        <div
                            style={{
                                fontSize: '28px',
                                color: colors.lightGold,
                                textAlign: 'center',
                                marginBottom: '20px',
                                maxWidth: '800px',
                                fontStyle: 'italic',
                                lineHeight: '1.4',
                            }}
                        >
                            {scripture}
                        </div>
                    )}
                    
                    {/* Annotation text in cream */}
                    <div
                        style={{
                            fontSize: '24px',
                            color: colors.cream,
                            textAlign: 'center',
                            maxWidth: '800px',
                            lineHeight: '1.5',
                        }}
                    >
                        {hasScripture ? annotation : description}
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e) {
        console.error(e);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
} 