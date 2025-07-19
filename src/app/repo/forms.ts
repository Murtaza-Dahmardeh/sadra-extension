import { Repo } from "./repo";

export interface FormsItem {
  id?: number;
  key: string;
  name: string;
  lastname: string;
  fathername: string;
  gender: string;
  birth: string;
  passport: string;
  issue: string;
  expire: string;
  job: string;
  mobile: string;
  iranPhone: string;
  address: string;
  iranAddress: string;
  duration: string;
  entry: string;
  purpose: string;
  arrival: string;
  departure: string;
  photo?: string;
  pass?: string;
  tsf?: string;
  tsb?: string;
  update?: string;
  isAuto: boolean; // whether the form is auto-filled
  isKabul: boolean; // Kabul-specific flag
  isJalal: boolean; // Jalal-specific flag
  order: number; // order/priority number
  createtime: number;
  updatetime: number;
}

export class FormsDAO extends Repo<FormsItem> {
  constructor() {
    super("forms");
  }
  save(value: FormsItem) {
    return super._save(value.key, value);
  }
} 