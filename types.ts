export type PlayMode = 'auto' | 'tap';
export type TimeMode = 'auto' | 'day' | 'night';
export type WeatherMode = 'auto' | 'clear' | 'rain' | 'snow';

export interface GameSettings {
  playMode: PlayMode;
  timeMode: TimeMode;
  weatherMode: WeatherMode;
}

export interface EnvState {
  time: number;
  cycleDuration: number;
  isNight: boolean;
  nightIntensity: number;
  weather: WeatherMode;
  weatherTimer: number;
}

export interface CrossingState {
  state: 'OPEN' | 'WARNING' | 'CLOSING' | 'CLOSED' | 'OPENING';
  timer: number;
  angle: number;
  x: number;
  isAlarmOn: boolean;
}
