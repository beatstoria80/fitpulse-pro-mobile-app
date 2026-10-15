declare module 'lucide-react' {
  import * as React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  export type Icon = React.FC<IconProps>;
  export const Cloud: Icon;
  export const CloudOff: Icon;
  export const RefreshCw: Icon;
  export const Maximize2: Icon;
  export const Download: Icon;
  export const Flame: Icon;
  export const Droplet: Icon;
  export const Utensils: Icon;
  export const TrendingUp: Icon;
  export const Target: Icon;
  export const Award: Icon;
  export const ArrowDownRight: Icon;
  export const Scale: Icon;
  export const Plus: Icon;
  export const Heart: Icon;
  export const Clock: Icon;
  export const Footprints: Icon;
  export const Sparkles: Icon;
  export const PieChart: Icon;
  export const CheckCircle2: Icon;
  export const User: Icon;
  export const Database: Icon;
  export const ShieldCheck: Icon;
  export const Check: Icon;
  export const ExternalLink: Icon;
  export const Key: Icon;
  export const Globe: Icon;
  export const Home: Icon;
  export const X: Icon;
  export const Activity: Icon;
  const icons: { [key: string]: Icon };
  export default icons;
}
