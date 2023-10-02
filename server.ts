import express, { Request, Response } from "express";
import * as crypto from "crypto";
import cors from "cors";
import fs from "fs";
import { timingSafeEqual } from "crypto";
import {
  generateRegistrationOptions,
  VerifyRegistrationResponseOpts,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import bodyParser from "body-parser";
// CommonJS (NodeJS)

// ES Module (NodeJS w/module support, TypeScript, Babel, etc...)
import SimpleWebAuthnServer from "@simplewebauthn/server";

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

interface User {
  publicKey: string;
  privateKey: string;
  generatedNumber?: number;
  newValue?: string;
  newerValue?: string;
  oneTimeToken?: string;
  authenticator?: any; // Voeg een veld voor authenticator toe
  newestValue?: any;
  credential?: any;
}

const users: Record<string, User> = {}; // Database simulatie
function generateServerPublicKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
app.get("/getPublicKey", (req, res) => {
  const publicKey = generateServerPublicKey(); // Genereer een willekeurige openbare sleutel
  res.json(publicKey);
});

function saveUsers(): void {
  const dataToSave = JSON.stringify({ users }, null, 2);
  fs.writeFileSync("database.json", dataToSave, "utf-8");
}

function generateNewValue(publicKey: string, privateKey: string): string {
  const combinedValue = `${publicKey}-${privateKey}`;
  const hashedValue = crypto
    .createHash("md5")
    .update(combinedValue)
    .digest("hex");
  return hashedValue;
}

function generateNewerValue(publicKey: string, privateKey: string): string {
  const combinedValue = `${publicKey}-${privateKey}`;
  const hashedValue = crypto
    .createHash("md5")
    .update(combinedValue)
    .digest("hex");
  return hashedValue;
}

function generateOneTimeToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
}

app.post("/register", (req: Request, res: Response) => {
  const { email, publicKey, privateKey } = req.body;

  if (!users[email] && privateKeyIsValid(privateKey)) {
    users[email] = { publicKey, privateKey };
    saveUsers();
    res.json({ success: true });
  } else if (users[email]) {
    res.json({
      success: false,
      message: "Dit e-mailadres is al geregistreerd",
    });
  } else {
    res.json({ success: false, message: "Ongeldige private sleutel" });
  }
});
app.get("/generate-registration-options", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!users[email]) {
    // (Pseudocode) Retrieve the user from the database
    // after they've logged in
    const user: UserModel = getUserFromDB(loggedInUserId);
    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

    const options = generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.username,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: "none",
      // Prevent users from re-registering existing authenticators
      excludeCredentials: userAuthenticators.map((authenticator) => ({
        id: authenticator.credentialID,
        type: "public-key",
        // Optional
        transports: authenticator.transports,
      })),
    });

    // (Pseudocode) Remember the challenge for this user
    setUserCurrentChallenge(user, options.challenge);

    return options;
  }
  const { body } = req;

  // (Pseudocode) Retrieve the logged-in user
  const user: UserModel = getUserFromDB(loggedInUserId);
  // (Pseudocode) Get `options.challenge` that was saved above
  const expectedChallenge: string = getUserCurrentChallenge(user);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: error.message });
  }

  const { verified } = verification;
  const { registrationInfo } = verification;
  const { credentialPublicKey, credentialID, counter } = registrationInfo;

  const newAuthenticator: Authenticator = {
    credentialID,
    credentialPublicKey,
    counter,
  };

  // (Pseudocode) Save the authenticator info so that we can
  // get it by user ID later
  saveNewUserAuthenticatorInDB(user, newAuthenticator);
});

app.get("/users", (req: Request, res: Response) => {
  res.json(users);
});

function privateKeyIsValid(privateKey: string): boolean {
  return privateKey.length >= 8;
}

app.post("/passwordless", (req: Request, res: Response) => {
  const { email, token } = req.body;

  if (users[email]) {
    const oneTimeToken = users[email].oneTimeToken;

    if (oneTimeToken && oneTimeToken === token) {
      delete users[email].oneTimeToken;
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Ongeldige token" });
    }
  } else {
    res.json({ success: false, message: "Gebruiker niet gevonden" });
  }
});

app.post("/addNewValue", (req, res) => {
  try {
    const { email, privateKey } = req.body;

    if (!email || !privateKey) {
      res.json({
        success: false,
        message: "E-mail en privésleutel zijn vereist",
      });
      return;
    }

    if (!privateKeyIsValid(privateKey)) {
      console.log(email);
      res.json({ success: false, message: "Ongeldige private-key" });
      return;
    }

    const publicKey = users[email].publicKey;

    const newValue = generateNewValue(publicKey, privateKey);

    const generatedNumber = Math.floor(Math.random() * 1000000);

    users[email] = {
      publicKey,
      privateKey,
      generatedNumber,
      newValue,
    };

    saveUsers();

    res.json({ success: true });
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});

app.post("/compaireNewValue", (req, res) => {
  try {
    const { email, privateKey } = req.body;

    if (!email || !privateKey) {
      res.json({
        success: false,
        message: "E-mail en privésleutel zijn vereist",
      });
      return;
    }

    if (!privateKeyIsValid(privateKey)) {
      res.json({ success: false, message: "Ongeldige privésleutel" });
      return;
    }

    const publicKey = users[email].publicKey;
    const existingValue = users[email].newValue;
    const newerValue = generateNewerValue(publicKey, privateKey);

    if (newerValue !== existingValue) {
      res.json({
        success: false,
        message:
          "Wil je alsjeblieft in onze nieuwe wachtwoordloze inlogmethode registreren?",
      });
      return;
    }

    const generatedNumber = users[email].generatedNumber;

    users[email] = {
      publicKey,
      privateKey,
      generatedNumber,
      newerValue,
      newValue: existingValue,
    };

    setTimeout(() => {
      users[email].newerValue = "";
      saveUsers();
    }, 30000);

    saveUsers();

    res.json({ success: true });
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});

app.get("/public/getLoginStatus", (req, res) => {
  const { email } = req.query;

  if (users[email as string]) {
    const { generatedNumber, newerValue } = users[email as string];
    res.json({ success: true, generatedNumber, newerValue });
  } else {
    res.json({ success: false, message: "Gebruiker niet gevonden" });
  }
});

app.post("/verifyFingerprint", async (req, res) => {
  try {
    const { email, assertion } = req.body;
    console.log(req.body);

    const user = users[email];
    if (!user) {
      res.json({ success: false, message: "Gebruiker niet gevonden" });
      return;
    }

    const publicKeyBytes = new Uint8Array(
      atob(user.publicKey)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const authenticator = {
      id: assertion.id,
      type: "public-key",
    };

    const expectedChallenge = assertion.challenge;
    const expectedOrigin = "http://localhost:4000"; // Pas dit aan naar de juiste URL

    const verificationResult = await verifyRegistrationResponse({
      response: {
        /* Voeg hier de eigenschappen toe die vereist zijn voor RegistrationResponseJSON */
      },
      expectedChallenge,
      expectedOrigin,
    } as VerifyRegistrationResponseOpts);

    if (verificationResult.verified) {
      res.json({ success: true });
    } else {
      res.json({
        success: false,
        message: "Vingerafdruk kon niet worden geverifieerd",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message:
        "Er is een fout opgetreden bij het verifiëren van de vingerafdruk.",
    });
  }
});
app.post("/registerUser", (req, res) => {
  try {
    const { email, fingerprint } = req.body;

    // Voeg de gebruiker toe aan de database en koppel de vingerafdruk
    users[email] = {
      publicKey: email.publicKey,
      privateKey: email.privateKey,
      newestValue: fingerprint, // Koppel de vingerafdruk aan de gebruiker
    };

    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Er is een fout opgetreden bij het registreren.",
    });
  }
});

app.get("/logout", (req, res) => {
  res.sendFile(__dirname + "/logout.html");
});

app.listen(4000, () => {
  console.log("Server is gestart op http://localhost:4000");
});
