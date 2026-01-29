interface DEBsHeaderProps {
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function DEBsHeader({ subtitle, rightContent }: DEBsHeaderProps) {
  return (
    <header className="bg-[#001F3F] text-white py-3 px-4 border-b-4 border-[#FFD700] sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0">
            <span className="text-[#001F3F] font-bold text-sm">DEB</span>
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base">D.E.Bs LEARNING ACADEMY</h1>
            <p className="text-[#FFD700] text-xs md:text-sm">
              {subtitle || "DEBs Diagnostic Hub"}
            </p>
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
