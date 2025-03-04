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
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      light: 'text-slate-400',    // light slate for subtle text
      white: 'text-white',     // white text
      error: 'text-red-600'
    },
    background: {
      primary: 'bg-white',   // white
      secondary: 'bg-gray-50',
      dark: 'bg-sky-900',     // navy blue for dark sections
      gradient: 'bg-gradient-to-b from-sky-50 to-white'
    },
    border: {
      light: 'border-white',
      dark: 'border-slate-700',     // dark slate
      base: 'border-gray-200'
    }
  },
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: {
      default: 'py-12 sm:py-16'
    },
    card: 'p-8 rounded-2xl bg-white shadow-xl border border-gray-100',
    maxWidth: {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-xl'
    },
    grid: {
      features: 'grid gap-8 md:grid-cols-3',
      footer: 'flex flex-col items-center gap-8 md:flex-row md:justify-between',
      form: {
        row: 'grid grid-cols-1 md:grid-cols-2 gap-4'
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
      card: 'bg-white shadow-xl rounded-2xl p-8 border border-gray-100 backdrop-blur-sm backdrop-filter',
      form: 'space-y-6'
    },
    height: {
      header: '4rem',  // 64px
      footer: '5rem',  // 80px
    }
  },
  spacing: {
    section: 'mb-6',
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
      base: 'px-6 py-3 rounded-lg font-medium transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md active:shadow-sm',
      default: 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500',
      outline: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-50 focus:ring-sky-500'
    },
    secondary: {
      base: 'px-6 py-3 rounded-lg font-medium transition-all duration-200 text-base',
      default: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-50',
      outline: 'text-sky-500 hover:text-sky-600',
    },
    group: {
      vertical: 'flex flex-col gap-4',
      horizontal: 'flex flex-row gap-4',
      responsive: 'flex flex-col sm:flex-row gap-4 justify-center',
    }
  },
  text: {
    align: {
      center: 'text-center',
      left: 'text-left md:text-left',
      right: 'text-right',
    },
    heading: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-bold',
      h3: 'text-2xl font-bold',
      h4: 'text-xl font-bold'
    },
    body: {
      large: 'text-lg',
      base: 'text-base',
      small: 'text-sm',
      tiny: 'text-sm text-slate-600',
    },
    gradient: {
      blue: 'bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent',
      title: 'bg-gradient-to-r from-sky-800 via-sky-600 to-sky-400 bg-clip-text text-transparent font-extrabold tracking-tight drop-shadow-sm',
    },
    label: 'block text-sm font-medium text-gray-700',
    error: 'mt-2 text-sm text-red-600',
  },
  header: {
    wrapper: 'bg-white shadow-sm',
    nav: {
      wrapper: 'flex items-center justify-between h-16',
      logo: {
        wrapper: 'flex items-center space-x-2',
        image: 'w-auto h-6',
        text: 'text-xl font-bold text-gray-900'
      },
      menu: {
        wrapper: 'hidden md:flex md:items-center md:space-x-6',
        link: {
          base: 'px-3 py-2 rounded-md text-sm font-medium',
          hover: 'hover:bg-gray-100'
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
    base: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm',
    error: 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
    select: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm'
  },
  form: {
    group: 'space-y-1',
    spacing: {
      section: 'mt-6',
      element: 'mt-4'
    }
  }
} 