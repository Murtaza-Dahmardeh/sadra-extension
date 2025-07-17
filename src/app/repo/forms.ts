import { Repo } from "./repo";

export interface FormsItem {
  id?: number;
  key: string;
  value: any;
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