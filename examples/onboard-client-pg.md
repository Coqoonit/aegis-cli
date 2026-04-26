# Recipe: Onboard a legal-entity client with UBO auto-resolution

Demonstrates: `clients create` (COMPANY) → `cases create` → `ubos resolve` → `screenings run-full` per UBO.

Key pattern: confirming destructive or credit-consuming operations before running them.

---

USER: Nuovo cliente azienda: Acme SRL, P.IVA 01234567890. Aprimi il fascicolo per revisione legale.

ASSISTANT: Procedo con creazione cliente e apertura fascicolo.

[tool_use: aegis_clients_create]
```json
{
  "data": {
    "type": "COMPANY",
    "companyName": "Acme SRL",
    "vatNumber": "01234567890"
  }
}
```

TOOL: `{"id":"c_example_acme001","type":"COMPANY","companyName":"Acme SRL","vatNumber":"01234567890",...}`

[tool_use: aegis_cases_create]
```json
{
  "data": {
    "clientId": "c_example_acme001",
    "engagementType": "REVISIONE_LEGALE"
  }
}
```

TOOL: `{"id":"c_example_caseAcme","status":"DRAFT",...}`

ASSISTANT: Cliente e fascicolo creati. Per una PG serve l'analisi dei titolari effettivi (UBO). Posso risolverli automaticamente tramite il registro delle imprese — **l'operazione consuma crediti dal wallet** (tipicamente 1-3 a seconda della profondità). Procedo?

---

USER: Sì procedi.

ASSISTANT:

[tool_use: aegis_ubos_resolve]
```json
{
  "case": "c_example_caseAcme"
}
```

TOOL:
```json
{
  "created": 2,
  "total": 2,
  "ubos": [
    {"id":"c_example_ubo001","firstName":"Luigi","lastName":"Bianchi","fiscalCode":"BNCLGU60A01H501U","ownershipPercentage":60,"controlType":"DIRECT"},
    {"id":"c_example_ubo002","firstName":"Anna","lastName":"Verdi","fiscalCode":"VRDNNA65C41H501V","ownershipPercentage":40,"controlType":"DIRECT"}
  ],
  "missingEntities":[]
}
```

ASSISTANT: Risolti 2 titolari effettivi: Luigi Bianchi (60%) e Anna Verdi (40%). Tutti con controllo DIRECT e nessuna entità irrisolta. Procedo con lo screening completo su entrambi gli UBO? (6 crediti totali: 3 per UBO × 2)

---

USER: Sì.

ASSISTANT: Eseguo gli screening in sequenza.

[tool_use: aegis_screenings_run_full]
```json
{
  "case": "c_example_caseAcme",
  "data": {
    "personType": "UBO",
    "uboId": "c_example_ubo001",
    "searchTerm": "Luigi Bianchi"
  }
}
```

TOOL: `{"screenings":[...],"creditsConsumed":3}`

[tool_use: aegis_screenings_run_full]
```json
{
  "case": "c_example_caseAcme",
  "data": {
    "personType": "UBO",
    "uboId": "c_example_ubo002",
    "searchTerm": "Anna Verdi"
  }
}
```

TOOL: `{"screenings":[{"type":"PEP","results":[{"id":"c_example_res001","reviewStatus":"PENDING_REVIEW","matchedList":"PEP-IT-2024","matchDetails":"Anna Verdi, consigliere comunale 2019-2024"}],...},...]}`

ASSISTANT: Attenzione: Anna Verdi ha un possibile match PEP (consigliere comunale). Il risultato è in PENDING_REVIEW e richiede revisione manuale prima di proseguire. Vuoi che lo marchi CONFIRMED_MATCH (così il calcolo rischio userà verifica rafforzata) o FALSE_POSITIVE?

---

USER: Verifichiamo meglio. Lasciamolo pending e creo il fascicolo di screening sulla società direttamente.

ASSISTANT: Ok, il PEP result resta PENDING_REVIEW. Procedo con lo screening sulla COMPANY (Acme SRL) su sanzioni e adverse media.

[tool_use: aegis_screenings_run_full]
```json
{
  "case": "c_example_caseAcme",
  "data": {
    "personType": "COMPANY",
    "searchTerm": "Acme SRL"
  }
}
```

TOOL: `{"screenings":[...clean results...],"creditsConsumed":3}`

ASSISTANT: Screening societario eseguito, nessun match. Quando avrai deciso sul PEP di Anna Verdi potremo procedere con la risk assessment. Vuoi fare anche il caricamento dei documenti d'identità degli UBO?
