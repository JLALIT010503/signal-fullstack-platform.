export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-64 rounded bg-slate-800/70 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-[#0D1322] border border-slate-800/80 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
