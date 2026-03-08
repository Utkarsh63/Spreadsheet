export default function DocumentLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-2">
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-9 animate-pulse border-b border-gray-200 bg-gray-50" />
      <div className="h-9 animate-pulse border-b border-gray-200 bg-gray-50" />
      <div className="flex-1 animate-pulse bg-gray-50" />
    </div>
  );
}
