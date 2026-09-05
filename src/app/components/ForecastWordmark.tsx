export default function ForecastWordmark() {
  return (
    <div className="flex items-center gap-[8px]">
      {/* Pink live-signal pill */}
      <span
        className="h-[18px] w-[3.5px] shrink-0 rounded-full"
        style={{
          background: "linear-gradient(to bottom, #fb7185, #B8082E)",
          boxShadow: "0 0 8px rgba(251,113,133,0.65), 0 0 3px rgba(251,113,133,0.40)",
        }}
      />
      {/* Wordmark */}
      <span
        className="text-[1rem] font-black uppercase leading-none tracking-[0.16em] text-white"
      >
        Forecast
      </span>
    </div>
  );
}
