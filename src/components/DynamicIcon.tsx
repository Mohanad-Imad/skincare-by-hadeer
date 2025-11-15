import { useEffect, useState } from "react";
import { LucideIcon, LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

interface DynamicIconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof dynamicIconImports;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const [Icon, setIcon] = useState<LucideIcon | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const iconModule = await dynamicIconImports[name]();
        setIcon(() => iconModule as unknown as LucideIcon);
      } catch (error) {
        console.error(`Error loading icon: ${name}`, error);
      }
    };

    loadIcon();
  }, [name]);

  if (!Icon) {
    return <div className="h-4 w-4" />;
  }

  return <Icon {...props} />;
};