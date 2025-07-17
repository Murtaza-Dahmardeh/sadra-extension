import { Repo } from "./repo";

export interface CaptchaItem {
  id?: number;
  key: string;
  value: any;
  createtime: number;
  updatetime: number;
}

export class CaptchaDAO extends Repo<CaptchaItem> {
  constructor() {
    super("captcha");
  }

  save(value: CaptchaItem) {
    return super._save(value.key, value);
  }
} 