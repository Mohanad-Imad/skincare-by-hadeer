interface SectionDividerProps {
  imageUrl?: string;
  height?: string;
}

export const SectionDivider = ({ 
  imageUrl = "/placeholder.svg", 
  height = "h-24" 
}: SectionDividerProps) => {
  return (
    <div className={`relative w-full ${height} overflow-hidden`}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url(${imageUrl})`,
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  );
};
