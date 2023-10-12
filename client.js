// In dit script verwerk je de clientzijde van je applicatie.

// Functie om een e-mailadres op te halen uit het invoerveld
function getEmail() {
  return document.getElementById("email").value.trim();
}

// Functie om een handtekening op te halen uit het invoerveld
function getSignature(id) {
  return document.getElementById(id).value.trim();
}

// Functie om een POST-verzoek uit te voeren
async function postData(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

// Functie om een melding weer te geven
function showAlert(message) {
  alert(message);
}

// Inlogfunctie
async function loginUser() {
  const email = getEmail();

  if (!email) {
    showAlert("Vul een geldig e-mailadres in.");
    return;
  }

  const response = await postData("http://localhost:4000/newerLogin", {
    email,
  });

  const { success, signature } = response;

  if (success) {
    const signatureDisplay = document.getElementById("signatureDisplay");

    if (signatureDisplay) {
      signatureDisplay.innerText = `Ondertekening: ${signature}`;
    }

    document.getElementById("opdracht").value = signature;
    await retrieve();
  } else {
    showAlert("Inloggen mislukt. Controleer je gegevens.");
  }
}

// Functie om de handtekeningdetails op te halen
async function retrieve() {
  const signature = getSignature("opdracht");

  if (!signature) {
    showAlert("Vul een Public Key in om details op te halen.");
    return;
  }

  const details = await retrieveDetailsFromPublicKey(signature);

  if (details) {
    const [sign1, sign2] = details;
    document.getElementById("sign1").value = sign1;
    document.getElementById("sign2").value = sign2;
    const resultText = `Sign1: ${sign1}\nSign2: ${sign2}`;
    document.getElementById("retrievedDetails").innerText = resultText;
    await generateFromDetails(signature);
  } else {
    document.getElementById("retrievedDetails").innerText =
      "Geen details gevonden voor deze Public Key";
  }
}

// Hulpprogrammafunctie om hex naar string om te zetten
function hexToString(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(charCode);
  }
  return str;
}

// Functie om details op te halen uit een handtekening
async function retrieveDetailsFromPublicKey(signature) {
  const sign1 = hexToString(signature.slice(0, 10));
  const sign2 = hexToString(signature.slice(10));
  return [sign1, sign2];
}

// Functie om details te genereren vanuit handtekeningdetails
async function generateFromDetails(signature) {
  const retrievedDetails =
    document.getElementById("retrievedDetails").innerText;
  const [sign1, sign2] = parseDetails(retrievedDetails);

  if (sign1 && sign2) {
    return { sign1, sign2 };
  } else {
    console.log(signature);
    console.log(sign1, sign2);
    console.log(
      "Kan geen nieuwe openbare sleutel genereren zonder geldige gegevens."
    );
    return null;
  }
}

// Hulpprogrammafunctie om details te parsen uit een string
function parseDetails(details) {
  const matches = details.match(/Sign1: (.+)\nSign2: (.+)/);
  if (matches && matches.length > 0) {
    return [matches[1], matches[2]];
  } else {
    return [null, null];
  }
}

// Inlogfunctie 1
async function login1() {
  const email = getEmail();
  const sign1 = getSignature("sign1");
  const sign2 = getSignature("sign2");

  if (!sign1 || !sign2) {
    showAlert("Vul zowel sign1 als sign2 in.");
    return;
  }

  const response = await postData("http://localhost:4000/newerLogin1", {
    email,
    sign1,
    sign2,
  });

  if (response.success) {
    await changingSignature();
    const token = response.token;
    localStorage.setItem("token", token);
    window.location.href = "/dashboard.html";
  } else {
    showAlert("Inloggen mislukt. Controleer je gegevens.");
  }
}

// Functie om handtekening te wijzigen
async function changingSignature() {
  const email = getEmail();
  const sign1 = getSignature("sign1");
  const sign2 = getSignature("sign2");

  const response = await postData("http://localhost:4000/newerLogin2", {
    email,
    sign1,
    sign2,
  });

  if (response.success) {
    const token = response.token;
    localStorage.setItem("token", token);
    window.location.href = "/dashboard.html";
  } else {
    showAlert("Inloggen mislukt. Controleer je gegevens.");
  }
}
