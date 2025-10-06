import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design dimensions (based on iPhone 12 Pro as reference)
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

// Calculate responsive dimensions
export const widthPercentageToDP = (widthPercent) => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

export const heightPercentageToDP = (heightPercent) => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

// Scale based on design width
export const scale = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / DESIGN_WIDTH) * size);
};

// Scale height based on design height
export const verticalScale = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / DESIGN_HEIGHT) * size);
};

// Moderate scale - less aggressive scaling for font sizes
export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Font scaling with better control
export const fontScale = (size) => {
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const newSize = size * scale;
  
  // Limit font scaling to prevent extremely large or small text
  if (Platform.OS === 'ios') {
    return Math.max(12, Math.min(newSize, size * 1.5));
  } else {
    return Math.max(12, Math.min(newSize, size * 1.3));
  }
};

// Get responsive dimensions
export const getResponsiveDimensions = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scale: SCREEN_WIDTH / DESIGN_WIDTH,
    isTablet: SCREEN_WIDTH >= 768,
    isSmallDevice: SCREEN_WIDTH < 375,
    isLargeDevice: SCREEN_WIDTH > 414,
  };
};

// Responsive padding/margin
export const responsivePadding = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

// Responsive font sizes
export const responsiveFontSizes = {
  xs: fontScale(10),
  sm: fontScale(12),
  md: fontScale(14),
  lg: fontScale(16),
  xl: fontScale(18),
  xxl: fontScale(20),
  xxxl: fontScale(24),
  title: fontScale(28),
  largeTitle: fontScale(32),
};

// Responsive spacing
export const responsiveSpacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
  huge: scale(40),
};

// Responsive border radius
export const responsiveBorderRadius = {
  xs: scale(4),
  sm: scale(6),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  xxl: scale(20),
  round: scale(50),
};

// Responsive icon sizes
export const responsiveIconSizes = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(28),
  xxl: scale(32),
  xxxl: scale(40),
};

// Grid system
export const getGridDimensions = (columns = 2, spacing = 16) => {
  const totalSpacing = spacing * (columns - 1);
  const itemWidth = (SCREEN_WIDTH - (spacing * 2) - totalSpacing) / columns;
  return {
    itemWidth: Math.floor(itemWidth),
    spacing: scale(spacing),
  };
};

// Safe area helpers
export const getSafeAreaInsets = () => {
  const { height } = Dimensions.get('window');
  const { height: screenHeight } = Dimensions.get('screen');
  
  return {
    top: Platform.OS === 'ios' ? Math.max(44, screenHeight - height) : 0,
    bottom: Platform.OS === 'ios' ? Math.max(34, screenHeight - height) : 0,
  };
};

// Device type detection
export const deviceType = {
  isPhone: SCREEN_WIDTH < 768,
  isTablet: SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024,
  isDesktop: SCREEN_WIDTH >= 1024,
  isSmallPhone: SCREEN_WIDTH < 375,
  isLargePhone: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
};

// Responsive breakpoints
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
  xxl: 1200,
};

// Check if current screen matches breakpoint
export const isBreakpoint = (breakpoint) => {
  return SCREEN_WIDTH >= breakpoints[breakpoint];
};

// Responsive container styles
export const getResponsiveContainerStyles = () => {
  const { isTablet } = getResponsiveDimensions();
  
  return {
    container: {
      paddingHorizontal: isTablet ? responsivePadding.xl : responsivePadding.md,
    },
    card: {
      borderRadius: isTablet ? responsiveBorderRadius.xl : responsiveBorderRadius.lg,
      padding: isTablet ? responsivePadding.xl : responsivePadding.lg,
    },
    button: {
      height: isTablet ? scale(56) : scale(48),
      borderRadius: isTablet ? responsiveBorderRadius.lg : responsiveBorderRadius.md,
    },
  };
};

// Text scaling based on device
export const getTextStyle = (baseSize, weight = 'normal') => {
  return {
    fontSize: fontScale(baseSize),
    fontWeight: weight,
    lineHeight: fontScale(baseSize) * 1.4,
  };
};

// Image scaling
export const getImageDimensions = (width, height, maxWidth = SCREEN_WIDTH) => {
  const aspectRatio = height / width;
  const scaledWidth = Math.min(width, maxWidth);
  const scaledHeight = scaledWidth * aspectRatio;
  
  return {
    width: scale(scaledWidth),
    height: scale(scaledHeight),
  };
};

// Export commonly used responsive values
export const responsive = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  wp: widthPercentageToDP,
  hp: heightPercentageToDP,
  padding: responsivePadding,
  fontSize: responsiveFontSizes,
  spacing: responsiveSpacing,
  borderRadius: responsiveBorderRadius,
  iconSize: responsiveIconSizes,
  deviceType,
  breakpoints,
  isBreakpoint,
  getGridDimensions,
  getSafeAreaInsets,
  getResponsiveContainerStyles,
  getTextStyle,
  getImageDimensions,
  getResponsiveDimensions,
};

export default responsive;
