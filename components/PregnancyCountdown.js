import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PregnancyCountdown = ({ daysRemaining, progressPercent, currentWeek, dueDate }) => {
  const { t, language } = useLanguage();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl sm:text-6xl font-bold text-white drop-shadow-lg">
            {daysRemaining}
          </div>
          <div className="text-sm sm:text-base text-white/80 mt-1">
            {daysRemaining === 1 ? t('pregnancy.day') : t('pregnancy.days')} {t('pregnancy.left')}
          </div>
        </div>
      </div>

      {/* Week and Due Date Info */}
      <div className="mt-6 text-center">
        <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md mb-2">
          {t('pregnancy.week', { week: currentWeek })}
        </div>
        <div className="text-white/80 text-sm sm:text-base">
          {t('pregnancy.due', { date: formatDate(dueDate) })}
        </div>
      </div>
    </div>
  );
};

export default PregnancyCountdown;
