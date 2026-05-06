export interface TableColumn {
  id: number;
  name: string;
  title: string;
  check: boolean;
  checkId: string | null;
}

export type VisibilityPref = Record<string, boolean>;

export interface VisibilitySettingsState {
  order: number[];
  visibility: VisibilityPref;
}

export interface VisibilitySettingsTheme {
  overlayBg?: string;
  modalBg?: string;
  titleColor?: string;
  subtitleColor?: string;
  borderColor?: string;
  accentColor?: string;
  accentSoftColor?: string;
  buttonTextColor?: string;
  zIndex?: number;
}

export interface VisibilitySettingsStorage {
  get(key: string): any;
  set(key: string, value: any): void;
  remove?(key: string): void;
}

export interface DataTableVisibilitySettingsOptions {
  table: any;
  columns: TableColumn[];
  classPrefix?: string;
  theme?: VisibilitySettingsTheme;
  texts?: {
    title?: string;
    subtitle?: string;
    save?: string;
    reset?: string;
  };
  storageKey?: string;
  storage?: VisibilitySettingsStorage;
  enableDrag?: boolean;
  enableVisibility?: boolean;
  persist?: boolean;
  fixedColumns?: number[];
  excludedColumns?: number[];
  defaultState?: VisibilitySettingsState;
  onOpen?: (state: VisibilitySettingsState) => void;
  onChange?: (state: VisibilitySettingsState) => void;
  onSave?: (state: VisibilitySettingsState) => void;
  onReset?: (state: VisibilitySettingsState) => void;
  onError?: (error: unknown) => void;
  renderOptionRow?: (column: TableColumn, ctx: { isFixed: boolean; isCheckable: boolean; checked: boolean }) => string;
}

export default class DataTableVisibilitySettings {
  constructor(options: DataTableVisibilitySettingsOptions);
  open(): void;
  close(): void;
  reset(): void;
  destroy(): void;
  getState(): VisibilitySettingsState;
  setState(state: Partial<VisibilitySettingsState>): void;
}

export interface LegacyHelpers {
  setlocalstorage(tmpname: string, tmpvalue: any): void;
  getlocalstorage(tmpname: string): any;
  SetUserPrefs(visibilityPref: VisibilityPref, orderPref: number[]): void;
  SetVsColumns(
    table: any,
    tableColumns: TableColumn[],
    orderPref: number[],
    visibilityPref: VisibilityPref
  ): void;
  SetLabelsFirstData(table: any): void;
  setColumnVisibility(
    table: any,
    tableColumns: TableColumn[],
    visibilityPref?: VisibilityPref
  ): VisibilityPref;
  setColumnOrder(table: any, orderPref: number[]): number[];
  setDefaultColumnOrder(table: any, orderPref: number[]): number[];
  resetColReorderMD(tableId: string): void;
  visSettingsClose(): void;
  visSettingsOpen(): void;
}

export const setlocalstorage: LegacyHelpers['setlocalstorage'];
export const getlocalstorage: LegacyHelpers['getlocalstorage'];
export const SetUserPrefs: LegacyHelpers['SetUserPrefs'];
export const SetVsColumns: LegacyHelpers['SetVsColumns'];
export const SetLabelsFirstData: LegacyHelpers['SetLabelsFirstData'];
export const setColumnVisibility: LegacyHelpers['setColumnVisibility'];
export const setColumnOrder: LegacyHelpers['setColumnOrder'];
export const setDefaultColumnOrder: LegacyHelpers['setDefaultColumnOrder'];
export const resetColReorderMD: LegacyHelpers['resetColReorderMD'];
export const visSettingsClose: LegacyHelpers['visSettingsClose'];
export const visSettingsOpen: LegacyHelpers['visSettingsOpen'];

