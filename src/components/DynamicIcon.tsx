import { useEffect, useState } from "react";
import { LucideIcon, LucideProps, Package } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

interface DynamicIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const [Icon, setIcon] = useState<LucideIcon | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        // Convert name to kebab-case for lucide
        const kebabName = name
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase() as keyof typeof dynamicIconImports;
        
        if (dynamicIconImports[kebabName]) {
          const iconModule = await dynamicIconImports[kebabName]();
          setIcon(() => iconModule as unknown as LucideIcon);
        } else {
          // Fallback to Package icon
          setIcon(() => Package);
        }
      } catch (error) {
        console.error(`Error loading icon: ${name}`, error);
        setIcon(() => Package);
      }
    };

    loadIcon();
  }, [name]);

  if (!Icon) {
    return <div className="h-4 w-4" />;
  }

  return <Icon {...props} />;
};