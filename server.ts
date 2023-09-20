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
}

function loadUsers(): { [key: string]: User } {
  try {
    const data = fs.readFileSync("database.json", "utf-8");
    return JSON.parse(data).users || {};
  } catch (error) {
    return {};
  }
}

function saveUsers(users: { [key: string]: User }) {
  const dataToSave = JSON.stringify({ users }, null, 2);
  fs.writeFileSync("database.json", dataToSave, "utf-8");
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

app.post("/login", (req: Request, res: Response) => {
  const { email, generatedCode } = req.body;

  if (users[email] && users[email].generatedNumber == generatedCode) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Ongeldige inloggegevens" });
  }
});

app.get("/users", (req: Request, res: Response) => {
  res.json(users);
});

function privateKeyIsValid(privateKey: string): boolean {
  return privateKey.length >= 8;
}

app.post("/updateNumber", (req, res) => {
  try {
    const { email, number } = req.body;

    if (users[email]) {
      users[email].generatedNumber = number;
      saveUsers(users);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Gebruiker niet gevonden" });
    }
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});
app.post("/updateAllNumbers", (req, res) => {
  try {
    const { numbers } = req.body;

    for (const email in numbers) {
      if (users[email]) {
        users[email].generatedNumber = numbers[email];
      }
    }

    saveUsers(users);
    res.json({ success: true });
  } catch (error) {
    console.error("Fout bij het verwerken van het verzoek:", error);
    res.status(500).json({ success: false, message: "Interne serverfout" });
  }
});
app.post("/privatelogin", (req: Request, res: Response) => {
  const { email, privateKey } = req.body;

  if (users[email] && users[email].privateKey === privateKey) {
    const generatedCode = users[email].generatedNumber;
    res.json({ success: true, generatedCode });
  } else {
    res.json({ success: false, message: "Ongeldige inloggegevens" });
  }
});
app.get("/getGeneratedCode", (req, res) => {
  const email = req.query.email as string; // Gebruik 'as string' om de query parameter als een string te interpreteren

  if (typeof email === "string" && users[email]) {
    // Controleer of email een string is
    const generatedCode = users[email].generatedNumber;
    res.json({ success: true, generatedCode });
  } else {
    res.json({ success: false, message: "Gebruiker niet gevonden" });
  }
});

app.listen(4000, () => {
  console.log("Server is gestart op http://localhost:4000");
});
