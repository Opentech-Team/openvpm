# Glosario de traducción — español latinoamericano (es-419)

Términos oficiales para el catálogo `apps/web/lib/i18n/messages/es.json`. Un término en inglés tiene **una sola**
traducción en `es`. La columna `es-VE` solo se llena cuando Venezuela usa otra palabra; esas claves van en
`es-VE.json`.

## Reglas de estilo

- Español latinoamericano neutro. **Prohibido**: vosotros, voseo y españolismos (ordenador → computadora,
  móvil → celular, coger → tomar, fichero → archivo, vale → de acuerdo).
- **"Usted"** en todo lo que lee el propietario (portal, correos, PDF para el propietario). En la interfaz del
  personal se usa el imperativo neutro en botones ("Guardar", "Buscar") y se evita el tuteo directo: "Su
  clínica", no "Tu clínica".
- Mayúscula solo al inicio de la frase o del título: "Historia clínica", no "Historia Clínica".
- Siglas clínicas internacionales sin traducir: SOAP, IM, IV, SC, PO, SID, BID, TID, QID, PRN, mg/kg.
- Nombres propios y de producto sin traducir: OpenVPM, Stripe, Telnyx, Twilio, IDEXX, Antech, Zoetis.
- Unidades sin traducir: kg, lb, mg, mL.
- Fragmentos sueltos ("at", "by", "of", "to", "on", "or") se traducen según dónde aparecen (ver la ubicación en
  `scripts/i18n/messages_en.json`). Si el orden de las palabras queda mal en español, se marca para reescribir
  la frase con marcadores.

## Términos

| Inglés | es-419 | es-VE | Nota |
|---|---|---|---|
| Client / Owner (pet owner) | Propietario | | Persona dueña de la mascota. "Clients" → "Propietarios" |
| Patient | Paciente | | El animal |
| Pet | Mascota | | Lenguaje cercano, sobre todo en el portal |
| Practice | Clínica | | La clínica veterinaria como organización |
| Location | Sede | | |
| Room | Consultorio | | Sala de atención |
| Appointment | Cita | | |
| Appointment type | Tipo de cita | | |
| Schedule / Calendar | Agenda | | |
| Check in | Registrar llegada | | Estado: "Llegó" |
| Checked in | Llegó | | Estado |
| In exam | En consulta | | Estado |
| Check out / Checked out | Dar salida / Salió | | |
| No-show | No asistió | | |
| Encounter | Atención | | Episodio clínico de una cita |
| Visit | Visita | | |
| Medical record / Chart | Historia clínica | | |
| SOAP note | Nota SOAP | | Subjetivo, Objetivo, Evaluación, Plan |
| Assessment | Evaluación | | |
| Problem list | Lista de problemas | | |
| Diagnosis | Diagnóstico | | |
| Treatment | Tratamiento | | |
| Treatment plan | Plan de tratamiento | | |
| Procedure | Procedimiento | | |
| Discharge | Alta | | |
| Prescription | Receta | **Récipe** | `es-VE` cambia todas las apariciones |
| Prescriptions | Recetas | **Récipes** | |
| Prescribe | Recetar | | El verbo no cambia en Venezuela |
| Prescribed by | Recetado por | **Indicado por** | |
| Refill | Reposición | | Reposición de una receta |
| Medication | Medicamento | | |
| Dose / Dosage | Dosis | | |
| Frequency | Frecuencia | | |
| Route | Vía de administración | | |
| Dispense | Despachar | | |
| Controlled substance | Sustancia controlada | | |
| Vaccination / Vaccine | Vacunación / Vacuna | | |
| Vaccination certificate | Certificado de vacunación | | |
| Reminder | Recordatorio | | |
| Lab results | Resultados de laboratorio | | |
| Reference range | Rango de referencia | | |
| Weight | Peso | | |
| Species | Especie | | |
| Breed | Raza | | |
| Sex | Sexo | | |
| Neutered / Spayed | Castrado / Esterilizada | | |
| Intact | Entero | | |
| Allergy / Reaction | Alergia / Reacción | | |
| Microchip | Microchip | | |
| Canine / Feline / Equine / Bovine / Avian | Canino / Felino / Equino / Bovino / Ave | | |
| Invoice | Factura | | |
| Estimate | Presupuesto | | |
| Payment | Pago | | |
| Balance | Saldo | | |
| Deposit | Anticipo | | |
| Refund | Reembolso | | |
| Tax | Impuesto | | Sin nombrar el impuesto de ningún país |
| No-charge | Sin cargo | | |
| Inventory | Inventario | | |
| Product | Producto | | |
| Service | Servicio | | |
| Supplier | Proveedor | | |
| Lot / Batch | Lote | | |
| Expiration date | Fecha de vencimiento | | |
| Reorder point | Punto de reposición | | |
| Stock | Existencias | | |
| Dashboard | Panel | | |
| Whiteboard | Pizarra | | |
| Inbox | Bandeja de entrada | | |
| Settings | Configuración | | |
| Staff / Team | Personal / Equipo | | |
| Veterinarian / Doctor | Médico veterinario / Veterinario | | "Dr." se mantiene |
| Technician | Técnico veterinario | | |
| Front desk | Recepción | | |
| Admin | Administrador | | |
| User | Usuario | | |
| Client portal | Portal del propietario | | |
| Sign in / Sign out | Iniciar sesión / Cerrar sesión | | |
| Sign up / Register | Registrarse | | |
| Email | Correo electrónico | | "Correo" en espacios cortos |
| Phone | Teléfono | | |
| Text message / SMS | Mensaje de texto | | |
| Save / Cancel / Delete / Edit | Guardar / Cancelar / Eliminar / Editar | | |
| Search | Buscar | | |
| Upload / Download | Subir / Descargar | | |
| Export / Import | Exportar / Importar | | |
| Trial | Prueba | | Período de prueba |
| Subscription | Suscripción | | |
| Card | Tarjeta | | |
| Backup | Respaldo | | |

## Términos de la capa es-VE

Solo cambian en Venezuela: **receta → récipe** (y sus formas: recetas → récipes, recetado por → indicado por).
Cualquier otra diferencia se agrega aquí antes de tocar `es-VE.json`.
