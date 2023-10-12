// webauthn.js

async function generateWebAuthnPublicKey() {
  const publicKey = await navigator.credentials.create({
    publicKey: {
      challenge: new Uint8Array(32),
      rp: {
        id: "localhost",
        name: "SimpleWebAuthn Example",
      },
      user: {
        id: new Uint8Array(16),
        name: "testuser",
        displayName: "Test User",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        userVerification: "required", // Biometrische verificatie vereist
      },
      timeout: 60000,
      attestation: "none",
    },
  });

  return arrayBufferToHex(publicKey.response.signature);
}

async function startWebAuthnAuthentication() {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array(32),
      rpId: "localhost",
      allowCredentials: [
        {
          type: "public-key",
          id: new Uint8Array(16),
        },
      ],
      userVerification: "required", // Biometrische verificatie vereist
      timeout: 60000,
    },
  });

  return {
    id: assertion.id,
    rawId: arrayBufferToBase64(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: arrayBufferToBase64(
        assertion.response.authenticatorData
      ),
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
      signature: arrayBufferToBase64(assertion.response.signature),
      userHandle: arrayBufferToBase64(assertion.response.userHandle),
    },
  };
}

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary);
}

// ... (voeg de bestaande code toe)
