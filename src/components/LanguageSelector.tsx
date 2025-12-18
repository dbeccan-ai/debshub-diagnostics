import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, languageOptions, Language } from "@/contexts/LanguageContext";

export const LanguageSelector = () => {
  const { language, setLanguage, languageLabel } = useLanguage();

  const currentOption = languageOptions.find((opt) => opt.value === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 px-2 sm:px-3 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Globe className="h-4 w-4" />
          <span>{currentOption?.flag}</span>
          <span className="hidden sm:inline text-xs">{languageLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={`flex items-center gap-2 cursor-pointer ${
              language === option.value ? "bg-slate-100" : ""
            }`}
          >
            <span>{option.flag}</span>
            <span>{option.label}</span>
            {language === option.value && (
              <span className="ml-auto text-emerald-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
