declare module 'react-native-svg-charts' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export const BarChart: ComponentType<ViewProps & any>;
  export const LineChart: ComponentType<ViewProps & any>;
  export const Grid: ComponentType<any>;
  export const XAxis: ComponentType<any>;
}
