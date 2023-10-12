// webAuth.ts
import express, { Request, Response } from "express";
import session from "express-session";
import memoryStore from "memorystore";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";

// Voeg hier de code voor de express-session definitie toe (zie hierboven)

const app = express();
const MemoryStore = memoryStore(session);

const rpID = "localhost";
export let expectedOrigin = "";

app.use(express.json());
app.use(
  session({
    secret: "secret123",
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  })
);

app.get(
  "/generate-registration-options",
  async (req: Request, res: Response) => {
    req.session.currentChallenge = "someChallenge"; // Vervang dit door de werkelijke challenge
    // ..
    const opts: GenerateRegistrationOptionsOpts = {
      rpName: "SimpleWebAuthn Example",
      rpID,
      userID: "internalUserId",
      userName: "user@localhost",
      timeout: 60000,
      attestationType: "none",
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: "discouraged",
      },
      supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);
    req.session.currentChallenge = options.challenge;
    res.send(options);
  }
);

app.post("/verify-registration", async (req: Request, res: Response) => {
  const body = req.body;
  const expectedChallenge = req.session.currentChallenge;

  let verification;
  try {
    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };
    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    return res.status(400).send({ error: (error as Error).message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    const newDevice = {
      credentialPublicKey,
      credentialID,
      counter,
    };
    // Voeg newDevice toe aan de lijst met apparaten van de gebruiker
  }

  req.session.currentChallenge = undefined;
  res.send({ verified });
});

app.get(
  "/generate-authentication-options",
  async (req: Request, res: Response) => {
    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: [],
      userVerification: "required",
      rpID,
    };

    try {
      const options = await generateAuthenticationOptions(opts);
      req.session.currentChallenge = options.challenge;
      res.send(options);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  }
);

app.post("/verify-authentication", async (req: Request, res: Response) => {
  const body = req.body;
  const expectedChallenge = req.session.currentChallenge;

  // "Query de DB" hier voor een authenticator die overeenkomt met body.rawId
  const dbAuthenticator = null; // Vervang dit door daadwerkelijke DB-query

  if (!dbAuthenticator) {
    return res.status(400).send({
      error: "Authenticator is niet geregistreerd bij deze site",
    });
  }

  let verification;
  try {
    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: dbAuthenticator,
      requireUserVerification: true,
    };
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    return res.status(400).send({ error: (error as Error).message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Werk de teller van de authenticator in de DB bij naar de nieuwste teller in de authenticatie
    // dbAuthenticator.counter = authenticationInfo.newCounter;
  }

  req.session.currentChallenge = undefined;
  res.send({ verified });
});

const host = "127.0.0.1";
const port = 8000;
expectedOrigin = `http://localhost:${port}`;

app.listen(port, host, () => {
  console.log(`🚀 Server gereed op ${expectedOrigin} (${host}:${port})`);
});
