# Recipe: Onboard a natural-person client

Demonstrates: `clients create` → `cases create` → `id-docs upload` → `screenings run-full` → `ids create` → `ids complete`.

---

USER: Aggiungi un nuovo cliente: Mario Rossi, codice fiscale RSSMRA80A01H501U, email mario@esempio.it. Poi aprigli un fascicolo per assistenza tributaria.

ASSISTANT: Creo il cliente e poi il fascicolo.

[tool_use: aegis_clients_create]
```json
{
  "data": {
    "type": "INDIVIDUAL",
    "firstName": "Mario",
    "lastName": "Rossi",
    "fiscalCode": "RSSMRA80A01H501U",
    "email": "mario@esempio.it"
  }
}
```

TOOL: `{"id":"c_example_client001","type":"INDIVIDUAL","firstName":"Mario","lastName":"Rossi",...}`

[tool_use: aegis_cases_create]
```json
{
  "data": {
    "clientId": "c_example_client001",
    "engagementType": "ASSISTENZA_TRIBUTARIA"
  }
}
```

TOOL: `{"id":"c_example_case001","status":"DRAFT","clientId":"c_example_client001",...}`

ASSISTANT: Fatto. Cliente creato (ID `c_example_client001`) e fascicolo aperto (ID `c_example_case001`, status DRAFT). Vuoi che proceda con screening PEP/sanzioni e caricamento documento d'identità?

---

USER: Sì, ho la scansione della sua carta d'identità in /tmp/ci-mario.pdf. Procedi.

ASSISTANT: Carico il documento e lancio lo screening completo.

[tool_use: aegis_id_docs_upload]
```json
{
  "case": "c_example_case001",
  "type": "CARTA_IDENTITA",
  "file": "/tmp/ci-mario.pdf",
  "document_number": "AB1234567"
}
```

TOOL: `{"id":"c_example_doc001","filename":"ci-mario.pdf","size":234567,...}`

[tool_use: aegis_screenings_run_full]
```json
{
  "case": "c_example_case001",
  "data": {
    "personType": "CLIENT",
    "searchTerm": "Mario Rossi"
  }
}
```

TOOL: `{"screenings":[{"id":"c_example_scr001","type":"SANCTIONS","status":"COMPLETED","results":[]},{"id":"c_example_scr002","type":"PEP",...},{"id":"c_example_scr003","type":"ADVERSE_MEDIA",...}],"creditsConsumed":3}`

ASSISTANT: Documento caricato e screening completo eseguito (3 crediti consumati). Nessun match su sanzioni, PEP o adverse media. Vuoi creare anche il record di identificazione (KYC step 3) collegato al documento?

---

USER: Sì, tipo ORDINARY.

ASSISTANT:

[tool_use: aegis_ids_create]
```json
{
  "case": "c_example_case001",
  "data": {
    "type": "ORDINARY",
    "firstName": "Mario",
    "lastName": "Rossi",
    "fiscalCode": "RSSMRA80A01H501U",
    "identityDocumentId": "c_example_doc001"
  }
}
```

TOOL: `{"id":"c_example_ident001","type":"ORDINARY","status":"PENDING",...}`

[tool_use: aegis_ids_complete]
```json
{
  "case": "c_example_case001",
  "id_id": "c_example_ident001"
}
```

TOOL: `{"id":"c_example_ident001","status":"COMPLETED",...}`

ASSISTANT: Identificazione creata e marcata COMPLETED. Onboarding base concluso. Prossimi passi tipici: valutazione del rischio (`aegis risk create`) e compilazione dei moduli CNDCEC. Vuoi procedere?
