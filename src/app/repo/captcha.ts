import { DAO, db } from "./dao";

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

export class CaptchaDAO extends DAO<CaptchaItem> {
  public tableName = "captcha";

  constructor() {
    super();
    this.table = db.table(this.tableName);
  }
} 