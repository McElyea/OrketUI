import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

export const orketPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e0f7ff',
      100: '#b3ecff',
      200: '#80dfff',
      300: '#4dd4ff',
      400: '#26caff',
      500: '#00d4ff',
      600: '#00a8cc',
      700: '#007d99',
      800: '#005266',
      900: '#002833',
      950: '#001a22',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: '#e8eaf0',
          100: '#c8ccd8',
          200: '#8892a4',
          300: '#4a5568',
          400: '#3a4560',
          500: '#2a3245',
          600: '#232a3b',
          700: '#1a1f2e',
          800: '#111620',
          900: '#0a0e14',
          950: '#060910',
        },
        primary: {
          color: '#00d4ff',
          contrastColor: '#0a0e14',
          hoverColor: '#26caff',
          activeColor: '#00a8cc',
        },
      },
    },
  },
});
