// express-session.d.ts
declare module "express-session" {
  import { RequestHandler } from "express";
  import session from "express-session";

  declare module "express" {
    interface Request {
      session: session.Session &
        Partial<session.SessionData> & { currentChallenge?: string };
    }
  }

  function session(
    options?: session.SessionOptions | undefined
  ): RequestHandler;
  export = session;
}
