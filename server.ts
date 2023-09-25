import express, { Request, Response } from "express";
import * as crypto from "crypto";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

interface User {
  publicKey: string;
  privateKey: string;
  generatedNumber?: number; // Voeg de gegenereerde nummer eigenschap toe als een optioneel veld
  newValue?: string; // Voeg de newValue eigenschap toe
  newerValue?: string; // Voeg de newerValue eigenschap toe
}

function loadUsers(): { [key: string]: User } {
  try {
    const data = fs.readFileSync("database.json", "utf-8");
    const loadedUsers = JSON.parse(data).users || {};

    // Voeg de newValue eigenschap toe aan bestaande gebruikers
    for (const key in loadedUsers) {
      if (
        loadedUsers.hasOwnProperty(key) &&
        !loadedUsers[key].newValue &&
        !loadedUsers[key].newerValue
      ) {
        loadedUsers[key].newValue = "2"; // Voeg hier de gewenste waarde toe
        loadedUsers[key].newerValue = "3"; // Voeg hier de gewenste waarde toe
      }
    }

    return loadedUsers;
  } catch (error) {
    return {};
  }
}

function saveUsers(users: { [key: string]: User }) {
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

let users: { [key: string]: User } = loadUsers();

app.post("/register", (req: Request, res: Response) => {
  const { email, publicKey, privateKey } = req.body;

  if (!users[email] && privateKeyIsValid(privateKey)) {
    users[email] = { publicKey, privateKey };
    saveUsers(users);
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

app.get("/users", (req: Request, res: Response) => {
  res.json(users);
});

function privateKeyIsValid(privateKey: string): boolean {
  return privateKey.length >= 8;
}

app.post("/passwordless", (req: Request, res: Response) => {
  const { email } = req.body;
  if (users[email]) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/addNewValue", (req, res) => {
  try {
    const { email, privateKey } = req.body;

    // Voer hier de benodigde validaties uit
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

    // Haal de public key op uit de gebruikersgegevens
    const publicKey = users[email].publicKey;

    // Genereer de nieuwe waarde
    const newValue = generateNewValue(publicKey, privateKey);

    // Genereer een willekeurig nummer (voorbeeld)
    const generatedNumber = Math.floor(Math.random() * 1000000);

    // Voeg de waarden toe aan de database
    users[email] = {
      publicKey,
      privateKey,
      generatedNumber,
      newValue,
    };

    // Sla de gebruikersgegevens op
    saveUsers(users);

    res.json({ success: true });
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});

app.post("/compaireNewValue", (req, res) => {
  try {
    const { email, privateKey } = req.body;

    // Voer hier de benodigde validaties uit
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

    // Haal de public key op uit de gebruikersgegevens
    const publicKey = users[email].publicKey;
    // Haal de bestaande 'newValue' op uit de database
    const existingValue = users[email].newValue;
    // Genereer de nieuwe waarde
    const newerValue = generateNewerValue(publicKey, privateKey);

    // Vergelijk 'newerValue' met 'existingValue'
    if (newerValue !== existingValue) {
      res.json({
        success: false,
        message: "Nieuwe waarde komt niet overeen met bestaande waarde",
      });
      return;
    }

    // Genereer een willekeurig nummer (voorbeeld)
    const generatedNumber = users[email].generatedNumber;

    // Voeg de waarden toe aan de database
    users[email] = {
      publicKey,
      privateKey,
      generatedNumber,
      newerValue,
      // Voeg 'existingValue' toe als 'newValue'
      newValue: existingValue,
    };
    // Wacht 30 seconden voordat je newerValue naar een lege string wijzigt
    setTimeout(() => {
      users[email].newerValue = "";
      saveUsers(users);
    }, 30000);
    // Sla de gebruikersgegevens op
    saveUsers(users);

    res.json({ success: true });
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});
app.get("/public/getLoginStatus", (req, res) => {
  const email = req.query.email as string; // Specificeer dat 'email' een string is

  try {
    if (!email) {
      res.json({
        success: false,
        message: "E-mail is vereist",
      });
      return;
    }

    const user = users[email];

    if (!user) {
      res.json({
        success: false,
        message: "Gebruiker niet gevonden",
      });
      return;
    }

    const newerValue = user.newerValue;
    const newValue = user.newValue;
    if (newValue !== newerValue) {
      res.json({
        success: false,
        message: "Nog niet ingelogd niet gevonden",
      });
      return;
    } else if (newValue === newerValue) {
      res.json({ success: true, newerValue, newValue });
    } else {
      res.json({
        success: false,
        message: "Database fout",
      });
    }
  } catch (error) {
    console.error("Fout bij het ophalen van de loginstatus:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});

app.listen(4000, () => {
  console.log("Server is gestart op http://localhost:4000");
});
