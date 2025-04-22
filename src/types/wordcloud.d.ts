declare module 'wordcloud' {
  interface WordCloudOptions {
    list: [string, number][];
    gridSize?: number;
    weightFactor?: number | ((size: number) => number);
    fontFamily?: string;
    color?: string | (() => string);
    rotateRatio?: number;
    rotationSteps?: number;
    backgroundColor?: string;
    fontWeight?: string | number;
    minSize?: number;
    drawOutOfBound?: boolean;
    shrinkToFit?: boolean;
    shape?: 'circle' | 'cardioid' | 'diamond' | 'square' | 'triangle-forward' | 'triangle' | 'pentagon' | 'star';
    classes?: string | ((word: string, weight: number, fontSize: number) => string);
  }

  function WordCloud(
    element: HTMLCanvasElement | string,
    options: WordCloudOptions
  ): void;

  export = WordCloud;
}