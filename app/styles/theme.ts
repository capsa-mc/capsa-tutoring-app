export const theme = {
  colors: {
    primary: {
      main: 'text-sky-500',     // bright blue
      dark: 'text-sky-700',     // darker blue for hover
      light: 'text-sky-400',    // lighter blue for accents
    },
    secondary: {
      main: 'text-sky-900',     // navy blue
      dark: 'text-sky-800',     // darker navy for hover
      light: 'text-sky-500',    // lighter navy for accents
    },
    text: {
      primary: 'text-slate-900',   // dark slate for main text
      secondary: 'text-slate-600', // slate for secondary text
      light: 'text-slate-400',    // light slate for subtle text
      white: 'text-white',     // white text
    },
    background: {
      primary: 'bg-white',   // white
      secondary: 'bg-slate-50', // very light slate
      dark: 'bg-sky-900',     // navy blue for dark sections
      gradient: 'bg-gradient-to-b from-sky-50 to-white',
    },
    border: {
      light: 'border-slate-200',    // light slate
      dark: 'border-slate-700',     // dark slate
    }
  },
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: {
      default: 'py-12 md:py-16',
      hero: 'pt-12 pb-16 md:pt-20 md:pb-24',
    },
    card: 'p-6 rounded-lg shadow-sm bg-white',
    maxWidth: {
      sm: 'max-w-2xl mx-auto',
    },
    grid: {
      features: 'grid gap-6 md:grid-cols-3',
      footer: 'flex flex-col items-center gap-8 md:flex-row md:justify-between',
      form: {
        row: 'grid md:grid-cols-2 gap-6',
      }
    },
    flex: {
      center: 'flex items-center',
      between: 'flex items-center justify-between',
      gap: {
        small: 'gap-2',
        medium: 'gap-4',
        large: 'gap-6'
      }
    },
    auth: {
      card: 'bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-white/90',
      form: 'space-y-6',
    },
    height: {
      header: '4rem',  // 64px
      footer: '5rem',  // 80px
    }
  },
  spacing: {
    section: 'mb-8',
    element: 'mb-4',
    small: 'mb-2',
    padding: {
      small: 'p-2',
      medium: 'p-4',
      vertical: {
        small: 'py-2',
        medium: 'py-4'
      }
    }
  },
  button: {
    primary: {
      base: 'px-6 py-2 rounded-lg font-medium transition-colors',
      default: 'bg-sky-500 text-white hover:bg-sky-600',
      outline: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-50',
    },
    secondary: {
      base: 'px-6 py-2 rounded-lg font-medium transition-colors',
      default: 'border border-sky-500 text-sky-500 hover:bg-sky-50',
      outline: 'text-sky-500 hover:text-sky-600',
    },
    group: {
      vertical: 'flex flex-col gap-4',
      horizontal: 'flex flex-row gap-4',
      responsive: 'flex flex-col sm:flex-row gap-4',
    }
  },
  text: {
    align: {
      center: 'text-center',
      left: 'text-left md:text-left',
      right: 'text-right',
    },
    heading: {
      h1: 'text-5xl md:text-6xl font-bold tracking-tight',
      h2: 'text-3xl md:text-4xl font-bold text-sky-500',
      h3: 'text-2xl md:text-3xl font-bold text-slate-900',
      h4: 'text-xl md:text-2xl font-semibold text-slate-900',
    },
    body: {
      large: 'text-lg md:text-xl text-slate-600',
      base: 'text-base text-slate-600',
      small: 'text-sm md:text-base text-slate-600',
      tiny: 'text-sm text-slate-600',
    },
    gradient: {
      blue: 'bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent',
      title: 'bg-gradient-to-r from-sky-800 via-sky-600 to-sky-400 bg-clip-text text-transparent font-extrabold tracking-tight drop-shadow-sm',
    },
    label: 'block text-base font-medium tracking-wide text-sky-900 mb-1.5',
    error: 'text-sm text-red-600 mt-1',
  },
  header: {
    wrapper: 'sticky top-0 bg-white shadow-sm z-50',
    nav: {
      wrapper: 'flex items-center justify-between py-4',
      logo: {
        wrapper: 'flex items-center gap-3',
        text: 'hidden md:block font-semibold text-xl tracking-wide text-sky-500',
        image: 'object-contain'
      },
      menu: {
        desktop: 'hidden md:flex items-center gap-6',
        mobile: 'md:hidden p-2',
        link: {
          base: 'transition-colors',
          hover: 'hover:text-sky-500'
        }
      }
    }
  },
  footer: {
    wrapper: 'bg-sky-500 text-white',
    text: {
      primary: 'text-white/90 text-sm',
      secondary: 'text-white/70 text-sm',
    },
    border: 'border-t border-white/20',
    spacing: 'py-8 md:py-12',
    nav: {
      wrapper: 'flex flex-col items-center gap-2 md:flex-row md:gap-12',
      links: 'flex gap-6'
    }
  },
  input: {
    base: 'block w-full px-4 py-3 rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors',
    error: 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
    select: 'block w-full px-4 py-3 rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 bg-white',
  },
  form: {
    group: 'space-y-2',
    spacing: {
      section: 'mt-6',
      field: 'mt-4',
    }
  }
} 