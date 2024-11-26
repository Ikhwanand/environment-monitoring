import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f6ff',
      100: '#b3e3ff',
      200: '#80d0ff',
      300: '#4dbdff',
      400: '#1aabff',
      500: '#0098e6',
      600: '#0076b3',
      700: '#005580',
      800: '#00334d',
      900: '#00121a',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

export default theme;
