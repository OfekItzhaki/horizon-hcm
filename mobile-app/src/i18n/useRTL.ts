import { useAppStore } from '@horizon-hcm/shared';
import { FlexStyle, TextStyle } from 'react-native';

interface RTLHelpers {
  isRTL: boolean;
  textAlign: TextStyle['textAlign'];
  flexDirection: FlexStyle['flexDirection'];
  /** Flip left/right margins for RTL — pass the LTR value */
  marginStart: (value: number) => { marginLeft?: number; marginRight?: number };
  marginEnd: (value: number) => { marginLeft?: number; marginRight?: number };
}

export function useRTL(): RTLHelpers {
  const language = useAppStore((state) => state.language);
  const isRTL = language === 'he';

  return {
    isRTL,
    textAlign: isRTL ? 'right' : 'left',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    marginStart: (value) => (isRTL ? { marginRight: value } : { marginLeft: value }),
    marginEnd: (value) => (isRTL ? { marginLeft: value } : { marginRight: value }),
  };
}
