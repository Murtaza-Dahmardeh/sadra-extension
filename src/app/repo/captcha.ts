import { Repo } from "./repo";

export interface CaptchaItem {
  id?: number;
  key: string;
  value: any;
  image?: string; // base64 encoded image
  isUsed: boolean; // whether the captcha has been used
  isCorrect: boolean; // whether the captcha answer is correct
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