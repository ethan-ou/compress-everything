module.exports = {
    theme: {
      fontFamily: {
        'sans': [
          'Inter',
          'system-ui',
          'BlinkMacSystemFont',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ]
      }
    },
    variants: {
      backgroundColor: ['responsive', 'hover', 'focus', 'disabled'],
      opacity: ['responsive', 'hover', 'focus', 'disabled'],
    },
    plugins: [
      require('@tailwindcss/custom-forms')
    ],
  }