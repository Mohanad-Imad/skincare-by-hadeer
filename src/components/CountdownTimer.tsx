import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

const CountdownTimer = ({ endDate, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const timeUnits = [
    { value: timeLeft.days, label: "يوم" },
    { value: timeLeft.hours, label: "ساعة" },
    { value: timeLeft.minutes, label: "دقيقة" },
    { value: timeLeft.seconds, label: "ثانية" },
  ];

  return (
    <div className={`flex gap-2 md:gap-3 ${className}`} dir="ltr">
      {timeUnits.map((unit, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="bg-primary text-primary-foreground w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-lg md:text-2xl font-bold shadow-lg shadow-primary/30">
            {String(unit.value).padStart(2, "0")}
          </div>
          <span className="text-[10px] md:text-xs font-medium mt-1.5 text-muted-foreground">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
