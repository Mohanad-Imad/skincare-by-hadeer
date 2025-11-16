import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Target {
  id: number;
  x: number;
  y: number;
}

export const NotFoundGame = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("notfound-game-highscore");
    return saved ? parseInt(saved) : 0;
  });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetIdCounter, setTargetIdCounter] = useState(0);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setTargets([]);
    setTargetIdCounter(0);
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setTargets([]);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("notfound-game-highscore", score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, endGame]);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      const newTarget: Target = {
        id: targetIdCounter,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 10,
      };
      setTargets((prev) => [...prev, newTarget]);
      setTargetIdCounter((prev) => prev + 1);

      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== newTarget.id));
      }, 2000);
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, targetIdCounter]);

  const handleTargetClick = (targetId: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
    setScore((prev) => prev + 10);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">النقاط</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm text-muted-foreground">الوقت المتبقي</p>
            <p className="text-2xl font-bold text-primary">{timeLeft}ث</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">أعلى نقاط</p>
            <p className="text-2xl font-bold text-foreground">{highScore}</p>
          </div>
        </div>

        {!isPlaying ? (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-xl font-bold text-foreground">اصطد البتّات المفقودة!</h3>
            <p className="text-muted-foreground">
              انقر على البتّات الملونة قبل أن تختفي
            </p>
            <Button onClick={startGame} size="lg">
              ابدأ اللعبة
            </Button>
          </div>
        ) : (
          <div className="relative h-80 bg-muted/20 rounded-lg border border-border overflow-hidden">
            <AnimatePresence>
              {targets.map((target) => (
                <motion.button
                  key={target.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => handleTargetClick(target.id)}
                  className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 hover:from-primary/80 hover:to-primary/40 shadow-lg cursor-pointer transition-all hover:scale-110"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-lg">🎯</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
