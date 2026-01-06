import { ThemeConfig } from 'antd';

// Light theme for admin portal - matches Vite version
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#C8102E',
    colorLink: '#C8102E',
    colorLinkHover: '#A00D25',
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: '0 0 0 0 rgba(0,0,0,0)',
    },
  },
};

// Dark theme for public pages - matches Vite version
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#C8102E',
    colorLink: '#C8102E',
    colorLinkHover: '#A00D25',
    colorBgContainer: '#2a2a2a',
    colorText: '#ffffff',
    colorTextSecondary: '#cccccc',
    colorTextTertiary: '#999999',
    colorBorder: '#3a3a3a',
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: '0 0 0 0 rgba(0,0,0,0)',
    },
  },
};

