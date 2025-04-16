import DataUpload from '@/components/data-upload';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-2xl font-bold">
          Survey Insights Analyzer
        </h1>
        <DataUpload />
      </main>
    </div>
  );
}

