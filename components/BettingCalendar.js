import { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const BettingCalendar = ({ bets = [], dueDate, settings = {}, onSelectDate, isOwner = false }) => {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (dueDate) {
      const due = new Date(dueDate);
      return new Date(due.getFullYear(), due.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const dueDateObj = dueDate ? new Date(dueDate) : null;

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  
  // Adjust for Monday as first day (0 = Sunday, so we shift)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Create calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }
    
    return days;
  }, [currentMonth, adjustedFirstDay, daysInMonth]);

  // Check if date has a bet
  const getBetForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toDateString();
    return bets.find(bet => {
      const betDate = new Date(bet.betDate);
      return betDate.toDateString() === dateStr;
    });
  };

  // Check if date is clickable
  const isDateClickable = (date) => {
    if (!date || !onSelectDate) return false;
    const bet = getBetForDate(date);
    if (!bet) return true; // No bet, clickable
    if (isOwner) return true; // Owner can always click
    if (settings.allowSameDay === false && bet?.verified) return false; // Verified bet, not clickable
    return true; // Pending bet or same-day allowed
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format month/year header
  const monthYearHeader = currentMonth.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });

  // Day names
  const dayNames = [t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun')];

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-white">{monthYearHeader}</h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-white/70 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const bet = getBetForDate(date);
          const isDueDate = dueDateObj && date.toDateString() === dueDateObj.toDateString();
          const isClickable = isDateClickable(date);
          const isToday = date.toDateString() === new Date().toDateString();

          let bgColor = 'bg-white/10';
          let textColor = 'text-white';
          let borderColor = '';
          let cursorStyle = 'cursor-default';

          if (bet?.verified) {
            bgColor = 'bg-green-500/80';
            textColor = 'text-white';
          } else if (bet && !bet.verified) {
            bgColor = 'bg-amber-500/80';
            textColor = 'text-white';
          } else {
            bgColor = 'bg-white/10';
            textColor = 'text-white';
          }

          if (isDueDate) {
            borderColor = 'ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent';
          }

          if (isClickable) {
            cursorStyle = 'cursor-pointer hover:bg-white/20 transition-all';
          }

          return (
            <div
              key={date.toISOString()}
              onClick={() => isClickable && onSelectDate(date)}
              className={`
                aspect-square rounded-lg p-1 flex flex-col items-center justify-center
                ${bgColor} ${textColor} ${borderColor} ${cursorStyle}
                ${isToday ? 'font-bold' : ''}
              `}
            >
              <span className="text-sm">{date.getDate()}</span>
              {bet && (
                <span className="text-xs truncate w-full text-center px-1" title={bet.betterName}>
                  {bet.betterName}
                </span>
              )}
              {bet && !bet.verified && (
                <span className="text-xs text-white/80">{t('calendar.pending')}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/80"></div>
          <span className="text-white/80">{t('calendar.verifiedBet')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/80"></div>
          <span className="text-white/80">{t('calendar.pendingBet')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white/10 ring-2 ring-purple-400"></div>
          <span className="text-white/80">{t('calendar.dueDateLabel')}</span>
        </div>
      </div>
    </div>
  );
};

export default BettingCalendar;
