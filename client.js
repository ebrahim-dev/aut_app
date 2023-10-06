let verwerken = [];
async function login() {
  const email = document.getElementById("email").value;

  const response = await fetch("http://localhost:4000/newerLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (data.success) {
    // Toon de ondertekening in de HTML
    const signatureDisplay = document.getElementById("signatureDisplay");
    if (signatureDisplay) {
      signatureDisplay.innerText = `Ondertekening: ${data.signature}`;
    }
    document.getElementById("opdracht").value = data.signature;
    retrieve();
  } else {
    alert("Inloggen mislukt. Controleer je gegevens.");
  }
}
async function login1() {
  const email = document.getElementById("email").value;
  const sign1 = document.getElementById("sign1").value;
  const sign2 = document.getElementById("sign2").value;
  console.log(sign1);
  console.log(sign2);

  if (!sign1 || !sign2) {
    alert("Vul zowel sign1 als sign2 in.");
    return;
  }

  const response = await fetch("http://localhost:4000/newerLogin1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, sign1, sign2 }), // Stuur sign1 en sign2 afzonderlijk
  });

  const data = await response.json();
  console.log(data);

  if (data.success) {
    const token = data.token;
    localStorage.setItem("token", token);
    window.location.href = "/dashboard.html";
  } else {
    alert("Inloggen mislukt. Controleer je gegevens.");
  }
}

async function retrieve() {
  const publicKey = document.getElementById("opdracht").value;

  if (publicKey) {
    const details = await retrieveDetailsFromPublicKey(publicKey);

    if (details) {
      const [sign1, sign2] = details;
      document.getElementById("sign1").value = sign1;
      document.getElementById("sign2").value = sign2;
      const resultText = `Sign1: ${sign1}\nSign2: ${sign2}`;
      document.getElementById("retrievedDetails").innerText = resultText;
      generateFromDetails();
    } else {
      document.getElementById("retrievedDetails").innerText =
        "Geen details gevonden voor deze Public Key";
    }
  } else {
    document.getElementById("retrievedDetails").innerText =
      "Vul een Public Key in om details op te halen.";
  }
}
async function generateFromDetails() {
  const retrievedDetails =
    document.getElementById("retrievedDetails").innerText;
  const [sign1, sign2] = parseDetails(retrievedDetails);

  if (sign1 && sign2) {
    return { sign1, sign2 };
  } else {
    document.getElementById("generatedFromDetails").innerText =
      "Kan geen nieuwe openbare sleutel genereren zonder geldige gegevens.";
    return null;
  }
}
async function retrieveDetailsFromPublicKey(publicKey) {
  const sign1 = hexToString(publicKey.slice(0, 10));
  const sign2 = hexToString(publicKey.slice(10));
  return [sign1, sign2];
}
function hexToString(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(charCode);
  }
  return str;
}
function parseDetails(details) {
  const matches = details.match(/Sign1: (.+)\nSign2: (.+)/);
  if (matches && matches.length === 3) {
    return [matches[1], matches[2]];
  } else {
    return [null, null];
  }
}
