import { useLanguage } from '../context/LanguageContext';

const WeeklyInfo = ({ weekData }) => {
  const { t, language } = useLanguage();
  if (!weekData) return null;

  const getTrimesterColor = (trimester) => {
    switch (trimester) {
      case 1:
        return 'bg-purple-500/20 border-purple-500/50 text-purple-100';
      case 2:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-100';
      case 3:
        return 'bg-teal-500/20 border-teal-500/50 text-teal-100';
      default:
        return 'bg-white/20 border-white/50 text-white';
    }
  };

  const getTrimesterLabel = (trimester) => {
    return t('weekly.trimester', { number: trimester });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
          {t('weekly.week', { week: weekData.week })}
        </h2>
        <div className={`px-4 py-2 rounded-full border font-semibold text-sm ${getTrimesterColor(weekData.trimester)}`}>
          {getTrimesterLabel(weekData.trimester)}
        </div>
      </div>

      {/* Size Comparison */}
      <div className="mb-6">
        <div className="text-white/70 text-sm mb-2">{t('weekly.babySize')}</div>
        <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md capitalize">
          {weekData.size}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {weekData.weight && (
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <span className="text-white/70 text-sm mr-2">{t('weekly.weight')}</span>
            <span className="text-white font-semibold">{weekData.weight}</span>
          </div>
        )}
        {weekData.length && (
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <span className="text-white/70 text-sm mr-2">{t('weekly.length')}</span>
            <span className="text-white font-semibold">{weekData.length}</span>
          </div>
        )}
      </div>

      {/* Development Section */}
      {weekData.development && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 drop-shadow-sm">{t('weekly.whatsHappening')}</h3>
          <p className="text-white/90 leading-relaxed">{weekData.development}</p>
        </div>
      )}

      {/* Tip Section */}
      {weekData.tip && (
        <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">💡</div>
            <div>
              <h4 className="text-yellow-100 font-semibold mb-1">{t('weekly.weekTip')}</h4>
              <p className="text-yellow-50 leading-relaxed">{weekData.tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyInfo;
