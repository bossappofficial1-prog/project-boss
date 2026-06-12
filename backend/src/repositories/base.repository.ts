import { db } from "../config/prisma";
import { PrismaClient } from "@prisma/client";

export abstract class BaseRepository {
  protected db: PrismaClient;

  constructor() {
    this.db = db;
  }
}
