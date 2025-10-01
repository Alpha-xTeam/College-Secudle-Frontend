// 🎨 إعدادات لوجو فريق Alpha

export const TEAM_CONFIG = {
  // معلومات الفريق
  teamName: 'Alpha',
  teamNameArabic: 'فريق Alpha',
  fullName: 'Alpha Team Development',
  
  // مسارات اللوجو
  logoPath: '/images/team/alpha-logo.png', // ⚠️ غيّر هذا المسار عند إضافة اللوجو
  logoAlt: 'Alpha Team Logo',
  
  // إعدادات اللوجو
  mainLogoSize: '80px',
  footerLogoSize: '40px',
  
  // حالة اللوجو (غيّر إلى true عند إضافة ملف اللوجو)
  hasLogo: true,
  
  // أيقونة احتياطية (في حالة عدم وجود لوجو)
  fallbackIcon: '🏆',
  footerFallbackIcon: '⚡'
};

// دالة للحصول على عنصر اللوجو الرئيسي
export const getMainLogo = () => {
  if (TEAM_CONFIG.hasLogo) {
    return {
      type: 'image',
      src: TEAM_CONFIG.logoPath,
      alt: TEAM_CONFIG.logoAlt,
      style: {
        width: TEAM_CONFIG.mainLogoSize,
        height: TEAM_CONFIG.mainLogoSize,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }
    };
  } else {
    return {
      type: 'icon',
      icon: TEAM_CONFIG.fallbackIcon,
      style: {
        fontSize: '2rem',
        color: 'white'
      }
    };
  }
};

// دالة للحصول على عنصر لوجو الفوتر
export const getFooterLogo = () => {
  if (TEAM_CONFIG.hasLogo) {
    return {
      type: 'image',
      src: TEAM_CONFIG.logoPath,
      alt: TEAM_CONFIG.logoAlt,
      style: {
        width: TEAM_CONFIG.footerLogoSize,
        height: TEAM_CONFIG.footerLogoSize,
        borderRadius: '50%',
        objectFit: 'cover'
      }
    };
  } else {
    return {
      type: 'icon',
      icon: TEAM_CONFIG.footerFallbackIcon,
      style: {
        color: 'white',
        fontSize: '1.2rem'
      }
    };
  }
};
