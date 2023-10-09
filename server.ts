import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import * as crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors());

interface UserData {
  email: string;
  newPublicKey: string;
  ondertekening: string;
  signing1?: string;
  signing2?: string;
  signing3?: string;
  signing4?: string;
}
let newDatabase: UserData[] = [];
let sign3: string = "";
let sign4: string = "";

// Controleer of het bestand bestaat
if (fs.existsSync("serverDatabase.json")) {
  const data = fs.readFileSync("serverDatabase.json", "utf-8");
  newDatabase = JSON.parse(data);
}

function saveDatabase() {
  const dataToSave = JSON.stringify(newDatabase, null, 2);
  fs.writeFileSync("serverDatabase.json", dataToSave, "utf-8");
}

app.post("/registerUser", (req, res) => {
  const { getEmail, newerPublicKey, ondertekening, sign1, sign2 } = req.body;

  if (getEmail && newerPublicKey) {
    // Controleer of de gebruiker al in de database staat
    const existingUser = newDatabase.find((user) => user.email === getEmail);

    if (existingUser) {
      res.json({ success: false, message: "Je bent al geregistreerd" });
      return;
    }
    let email = getEmail;
    let newPublicKey = newerPublicKey;
    let signing1 = sign1;
    let signing2 = sign2;
    // Voeg de gebruiker toe aan de database
    newDatabase.push({
      email,
      newPublicKey,
      ondertekening,
      signing1,
      signing2,
    });
    saveDatabase(); // Sla de gegevens op naar het JSON-bestand

    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Ongeldige gegevens" });
  }
});

app.get("/viewDatabase", (req: Request, res: Response) => {
  res.json(newDatabase);
});

app.get("/logout", (req, res) => {
  res.sendFile(__dirname + "/logout.html");
});

app.post("/savedData", (req, res) => {
  const userDetails = req.body;

  let existingDetails =
    JSON.parse(fs.readFileSync("browserData.json", "utf-8")) || [];

  if (!Array.isArray(existingDetails)) {
    existingDetails = [];
  }

  existingDetails.push(userDetails);

  fs.writeFileSync(
    "browserData.json",
    JSON.stringify(existingDetails, null, 2)
  );

  res.send({ success: true });
});

app.post("/newerLogin", async (req, res) => {
  const { email } = req.body;
  let database = JSON.parse(fs.readFileSync("serverDatabase.json", "utf8"));

  const user = database.find((entry: { email: any }) => entry.email === email);

  if (user) {
    // Als de gebruiker gevonden is, stuur de ondertekening terug naar de client
    await printIt(user.ondertekening);
    // Update de gebruiker in de database
    user.signing3 = sign3;
    user.signing4 = sign4;
    //Schrijf de bijgewerkte database terug naar het bestand
    // fs.writeFileSync("serverDatabase.json", JSON.stringify(database, null, 2));
    res.json({ success: true, signature: user.ondertekening });
  } else {
    res.json({ success: false, signature: null });
  }
});

app.post("/newerLogin1", (req, res) => {
  // Laad de bestaande database bij elk verzoek
  const database = JSON.parse(fs.readFileSync("serverDatabase.json", "utf8"));
  const { email, sign1, sign2 } = req.body;

  const user = database.find((entry: { email: any }) => entry.email === email);

  if (user) {
    user.signing3 = sign3;
    user.signing4 = sign4;
    if (sign1 === user.signing1 && sign2 === user.signing2) {
      res.json({ success: true, token: "sampletoken" }); // Vervang "sampletoken" door de gegenereerde JWT token
      fs.writeFileSync(
        "serverDatabase.json",
        JSON.stringify(database, null, 2)
      );
    } else {
      res.json({ success: false, token: null });
    }
  } else {
    res.json({ success: false, token: null });
  }
});

async function retrieveDetailsFromPublicKey(opdracht: any) {
  const signal1 = hexToString(opdracht.slice(0, 10));
  const signal2 = hexToString(opdracht.slice(10));
  return [signal1, signal2];
}
function hexToString(hex: any) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(charCode);
  }
  return str;
}
async function printIt(opdracht: any) {
  const details = await retrieveDetailsFromPublicKey(opdracht);
  if (details) {
    const [signal3, signal4] = details;
    sign3 = signal3;
    sign4 = signal4;
  }
}

app.listen(4000, () => {
  console.log("Server is gestart op http://localhost:4000");
});
