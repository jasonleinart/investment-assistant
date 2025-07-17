export default {
  plugins: {
    '@tailwindcss/postcss': {
      theme: {
        extend: {
          backgroundImage: {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          }
        }
      }
    },
    autoprefixer: {},
  },
} 