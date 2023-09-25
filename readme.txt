In dit document wil ik uitleggen hoe ik een nieuwe wachtwoordmethode heb ontwikkeld. Ik heb meerdere opties:

Eerste optie: De gebruiker is nog niet geregistreerd in ons systeem. Hij moet zich eerst registreren in het systeem. Vervolgens kan hij zich registreren voor de nieuwe wachtwoordloze inlogmethode. Daarna kan hij inloggen.
1- In index.html wordt de gebruiker in het systeem geregistreerd.
2- In Register.html wordt de gebruiker geregistreerd voor de nieuwe wachtwoordloze methode.
3- In Login.html en via een private key krijgt de gebruiker gedurende 30 seconden toegang tot het inloggen met de wachtwoordloze methode in wachtwoordloze.html

Tweede optie: De gebruiker is al geregistreerd in het systeem, maar hij wil zich registreren voor de nieuwe wachtwoordloze inlogmethode. Hij moet zich dus eerst registreren in het nieuwe systeem voordat hij zonder wachtwoord kan inloggen.
1- In Register.html wordt de gebruiker geregistreerd voor de nieuwe wachtwoordloze methode.
2- In Login.html en via een private key krijgt de gebruiker gedurende 30 seconden toegang tot het inloggen met de wachtwoordloze methode in wachtwoordloze.html

Hoe werkt het?
1- Open het via VS.
2- in VS zelf open een nieuwe terminal.
3- In de nieuwe terminal type: ts-node server.ts om de server live te hebben
4- open de volgende bestanden met "open with live server": index.html, Login.html, Register.htm en wachtwoordloze.html
5- om de database in je browser te kunnen zien: in je eigen browser open: http://localhost:4000/users