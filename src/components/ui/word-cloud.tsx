'use client';

import React, { useEffect, useRef } from 'react';

interface WordCloudProps {
  words: { text: string; weight: number }[];
}

const WordCloudComponent: React.FC<WordCloudProps> = ({ words }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const loadWordCloud = async () => {
      try {
        const WordCloud = (await import('wordcloud/src/wordcloud2.js')).default;
        const wordList: [string, number][] = words.map((word) => [word.text, word.weight]);
        
        WordCloud(canvasRef.current as HTMLCanvasElement, {
          list: wordList,
          gridSize: Math.round(16 * window.innerWidth / 1024),
          weightFactor: 2,
          fontFamily: 'Times, serif',
          color: () => `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
          rotateRatio: 0.5,
          rotationSteps: 2,
          backgroundColor: '#ffffff',
        });
      } catch (error) {
        console.error('Error loading WordCloud:', error);
      }
    };

    loadWordCloud();
  }, [words]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />;
};

export default WordCloudComponent;