import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, languageOptions, Language } from "@/contexts/LanguageContext";

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const currentOption = languageOptions.find((opt) => opt.value === language);

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
      <SelectTrigger className="w-auto gap-1.5 px-2 sm:px-3 h-9 border-slate-300 text-slate-700 hover:bg-slate-50 bg-white">
        <Globe className="h-4 w-4" />
        <span>{currentOption?.flag}</span>
        <SelectValue className="hidden sm:inline text-xs" />
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
