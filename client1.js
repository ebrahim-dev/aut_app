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

async function generateRegistrationOptions() {
  const response = await postData("/generate-registration-options", {});
  // Handle the response (e.g., show QR code, etc.)
}

async function verifyRegistrationResponse(response) {
  const registrationResponse = await postData("/verify-registration", response);
  // Handle the registration verification response
}

async function generateAuthenticationOptions() {
  const response = await postData("/generate-authentication-options", {});
  // Handle the response (e.g., initiate biometric authentication, etc.)
}

async function verifyAuthenticationResponse(response) {
  const authenticationResponse = await postData(
    "/verify-authentication",
    response
  );
  // Handle the authentication verification response
}
