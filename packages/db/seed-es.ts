// Spanish (Latin America) demo clinic. Generated from seed.ts by
// scripts/i18n/make-seed-es.mjs and scripts/i18n/seed_es_strings.json — do not edit by hand.
import { config } from "dotenv";
config({ path: "../../.env" });
import crypto from "crypto";
import { db } from "./client";
import {
  practices,
  locations,
  users,
  clients,
  patients,
  patientWeights,
  patientAllergies,
  appointmentTypes,
  rooms,
  appointments,
  soapNotes,
  vaccinationRecords,
  prescriptions,
  labResults,
  labResultEvents,
  clinicalRecordCorrections,
  labResultReplacements,
  procedures,
  invoices,
  invoiceItems,
  products,
  services,
  payments,
  communications,
  auditLog,
  controlledSubstanceLog,
  treatmentTemplates,
  treatmentTemplateItems,
} from "./schema/index";

// Pre-hashed bcrypt value for "password123"
const PASSWORD_HASH =
  "$2a$10$1Ui3ssO.fTXmUiyu4B7n0.EWb/M9fGHlZ5mjCXaq.Xqf1OdXwLs/K";

// ---------------------------------------------------------------------------
// Helper: date math
// ---------------------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function setTime(d: Date, hours: number, minutes: number): Date {
  const copy = new Date(d);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  console.log("Sembrando la base de datos...\n");

  // =========================================================================
  // 1. Practice
  // =========================================================================
  const [practice] = await db
    .insert(practices)
    .values({
      name: "Clínica Veterinaria Los Samanes",
      address: "Av. Principal de Los Samanes, Local 3, Puerto Ordaz, Bolívar 8050",
      phone: "(555) 867-5309",
      email: "hello@neighborhoodvet.example.com",
      website: "https://neighborhoodvet.example.com",
      timezone: "America/Caracas",
      subscriptionTier: "cloud",
      // The demo practice is a fully set-up clinic; the first-run wizard
      // must not greet it like a new signup.
      settings: { onboardingCompletedAt: new Date().toISOString() },
    })
    .returning();
  console.log(`Practice: ${practice!.name} (${practice!.id})`);
  const practiceId = practice!.id;

  // =========================================================================
  // 2. Location
  // =========================================================================
  const [location] = await db
    .insert(locations)
    .values({
      practiceId,
      name: "Sede principal",
      address: "Av. Principal de Los Samanes, Local 3, Puerto Ordaz, Bolívar 8050",
      phone: "(555) 867-5309",
      isPrimary: true,
    })
    .returning();
  console.log(`Location: ${location!.name}`);
  const locationId = location!.id;

  // =========================================================================
  // 3. Users (7 staff)
  // =========================================================================
  const usersData = [
    {
      email: "admin@neighborhoodvet.example.com",
      name: "Administrador de la clínica",
      role: "admin" as const,
      licenseNumber: null,
      phone: "0286-000-0000 ext. 100",
    },
    {
      email: "sarah.chen@neighborhoodvet.example.com",
      name: "Dra. Carolina Rangel",
      role: "veterinarian" as const,
      licenseNumber: "MV-28491",
      phone: "0286-000-0000 ext. 101",
    },
    {
      email: "marcus.rivera@neighborhoodvet.example.com",
      name: "Dr. Gustavo Colmenares",
      role: "veterinarian" as const,
      licenseNumber: "MV-31057",
      phone: "0286-000-0000 ext. 102",
    },
    {
      email: "emily.walsh@neighborhoodvet.example.com",
      name: "Dra. Valentina Briceño",
      role: "veterinarian" as const,
      licenseNumber: "MV-34219",
      phone: "0286-000-0000 ext. 103",
    },
    {
      email: "jamie.torres@neighborhoodvet.example.com",
      name: "Gabriela Salazar",
      role: "technician" as const,
      licenseNumber: "TV-7823",
      phone: "0286-000-0000 ext. 201",
    },
    {
      email: "alex.kim@neighborhoodvet.example.com",
      name: "Alejandro Quintero",
      role: "technician" as const,
      licenseNumber: "TV-8104",
      phone: "0286-000-0000 ext. 202",
    },
    {
      email: "morgan.bailey@neighborhoodvet.example.com",
      name: "Mariana Bastidas",
      role: "front_desk" as const,
      licenseNumber: null,
      phone: "0286-000-0000 ext. 301",
    },
    {
      email: "casey.reed@neighborhoodvet.example.com",
      name: "Cristina Ledezma",
      role: "front_desk" as const,
      licenseNumber: null,
      phone: "0286-000-0000 ext. 302",
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(
      usersData.map((u) => ({
        ...u,
        isVeterinarian: u.role === "veterinarian",
        passwordHash: PASSWORD_HASH,
        practiceId,
        locationId,
      }))
    )
    .returning();
  console.log(`Users: ${insertedUsers.length} created`);

  const vets = insertedUsers.filter((u) => u.role === "veterinarian");
  const techs = insertedUsers.filter((u) => u.role === "technician");

  // =========================================================================
  // 4. Clients (25)
  // =========================================================================
  const clientsData = [
    { firstName: "José", lastName: "Pacheco", address: "Calle Orinoco, Casa 12", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1001", email: "james.patterson@example.com" },
    { firstName: "María", lastName: "González", address: "Av. Guayana, Casa 45", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1002", email: "maria.gonzalez@example.com" },
    { firstName: "Roberto", lastName: "Tovar", address: "Calle Caroní, Casa 78", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1003", email: "robert.thompson@example.com" },
    { firstName: "Yennifer", lastName: "Ochoa", address: "Av. Las Américas, Edif. 234", city: "San Félix", state: "NJ", zip: "07079", phone: "(555) 010-1004", email: "jennifer.obrien@example.com" },
    { firstName: "Miguel", lastName: "Rosales", address: "Calle Cachamay, Casa 56", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1005", email: "michael.rossi@example.com" },
    { firstName: "Susana", lastName: "Paredes", address: "Calle Orinoco, Casa 89", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1006", email: "susan.park@example.com" },
    { firstName: "Darwin", lastName: "Marcano", address: "Carretera Troncal 10, Quinta 123", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1007", email: "david.murphy@example.com" },
    { firstName: "Lisbeth", lastName: "Herrera", address: "Av. Roraima, Casa 456", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1008", email: "linda.hoffman@example.com" },
    { firstName: "Wilmer", lastName: "Arias", address: "Calle Real, Casa 22", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1009", email: "william.anderson@example.com" },
    { firstName: "Patricia", lastName: "León", address: "Calle Tumeremo, Casa 67", city: "Ciudad Bolívar", state: "NJ", zip: "07052", phone: "(555) 010-1010", email: "patricia.lee@example.com" },
    { firstName: "Ricardo", lastName: "Navarro", address: "Av. Paseo Caroní, Edif. 301", city: "San Félix", state: "NJ", zip: "07079", phone: "(555) 010-1011", email: "richard.nguyen@example.com" },
    { firstName: "Bárbara", lastName: "Salcedo", address: "Calle Orinoco, Casa 15", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1012", email: "barbara.schmidt@example.com" },
    { firstName: "Tomás", lastName: "Villegas", address: "Carretera Troncal 10, Quinta 88", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1013", email: "thomas.wilson@example.com" },
    { firstName: "Isabel", lastName: "Martínez", address: "Av. Atlántico, Casa 42", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1014", email: "elizabeth.martin@example.com" },
    { firstName: "Carlos", lastName: "Toro", address: "Calle El Roble, Casa 19", city: "Ciudad Bolívar", state: "NJ", zip: "07052", phone: "(555) 010-1015", email: "charles.taylor@example.com" },
    { firstName: "Karina", lastName: "Duarte", address: "Av. Guayana, Edif. 200", city: "San Félix", state: "NJ", zip: "07079", phone: "(555) 010-1016", email: "karen.davis@example.com" },
    { firstName: "Daniel", lastName: "Carrasquel", address: "Calle Caroní, Casa 77", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1017", email: "daniel.clark@example.com" },
    { firstName: "Nelly", lastName: "Linares", address: "Calle Los Mangos, Casa 33", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1018", email: "nancy.lewis@example.com" },
    { firstName: "Josué", lastName: "Velásquez", address: "Calle Cachamay, Casa 55", city: "Ciudad Bolívar", state: "NJ", zip: "07052", phone: "(555) 010-1019", email: "joseph.walker@example.com" },
    { firstName: "Margarita", lastName: "Yánez", address: "Av. Guayana, Casa 99", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1020", email: "margaret.young@example.com" },
    { firstName: "Esteban", lastName: "Hernández", address: "Carretera Troncal 10, Quinta 144", city: "San Félix", state: "NJ", zip: "07079", phone: "(555) 010-1021", email: "steven.hall@example.com" },
    { firstName: "Dolores", lastName: "Alvarado", address: "Calle Cachamay, Casa 28", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1022", email: "dorothy.allen@example.com" },
    { firstName: "Andrés", lastName: "Cabrera", address: "Av. Las Américas, Casa 61", city: "Upata", state: "NJ", zip: "07041", phone: "(555) 010-1023", email: "andrew.king@example.com" },
    { firstName: "Sandra", lastName: "Rojas", address: "Calle Tumeremo, Casa 73", city: "Ciudad Bolívar", state: "NJ", zip: "07052", phone: "(555) 010-1024", email: "sandra.wright@example.com" },
    { firstName: "Kelvin", lastName: "López", address: "Av. Roraima, Casa 180", city: "Puerto Ordaz", state: "NJ", zip: "07040", phone: "(555) 010-1025", email: "kevin.lopez@example.com" },
  ];

  const insertedClients = await db
    .insert(clients)
    .values(
      clientsData.map((c) => ({
        ...c,
        practiceId,
        preferredContactMethod: "phone" as const,
        accessToken: null,
      })),
    )
    .returning();
  console.log(`Clients: ${insertedClients.length} created`);

  // =========================================================================
  // 5. Patients (40) — dogs ~20, cats ~15, rabbits 2, birds 2, reptile 1
  // =========================================================================
  const patientsData: {
    clientIdx: number;
    name: string;
    species: "canine" | "feline" | "avian" | "rabbit" | "reptile";
    breed: string;
    sex: "male" | "female" | "male_neutered" | "female_spayed";
    dob: string;
    color: string;
    weightKg: string;
  }[] = [
    // Dogs (20)
    { clientIdx: 0, name: "Max", species: "canine", breed: "Golden retriever", sex: "male_neutered", dob: "2020-03-15", color: "Dorado", weightKg: "31.8" },
    { clientIdx: 1, name: "Luna", species: "canine", breed: "Pastor alemán", sex: "female_spayed", dob: "2019-08-22", color: "Negro y canela", weightKg: "28.6" },
    { clientIdx: 2, name: "Toby", species: "canine", breed: "Labrador retriever", sex: "male_neutered", dob: "2021-01-10", color: "Chocolate", weightKg: "33.2" },
    { clientIdx: 3, name: "Canela", species: "canine", breed: "Bulldog francés", sex: "female_spayed", dob: "2022-05-18", color: "Leonado", weightKg: "11.3" },
    { clientIdx: 4, name: "Rufo", species: "canine", breed: "Beagle", sex: "male_neutered", dob: "2020-11-03", color: "Tricolor", weightKg: "10.9" },
    { clientIdx: 5, name: "Dalia", species: "canine", breed: "Poodle", sex: "female_spayed", dob: "2018-06-25", color: "Blanco", weightKg: "6.8" },
    { clientIdx: 6, name: "Rocky", species: "canine", breed: "Rottweiler", sex: "male", dob: "2021-09-14", color: "Negro y fuego", weightKg: "45.4" },
    { clientIdx: 7, name: "Dulce", species: "canine", breed: "Cavalier King Charles spaniel", sex: "female_spayed", dob: "2022-02-28", color: "Blenheim", weightKg: "7.3" },
    { clientIdx: 8, name: "Thor", species: "canine", breed: "Pastor australiano", sex: "male_neutered", dob: "2020-07-12", color: "Azul merle", weightKg: "25.0" },
    { clientIdx: 9, name: "Mora", species: "canine", breed: "Bóxer", sex: "female_spayed", dob: "2019-04-05", color: "Atigrado", weightKg: "27.2" },
    { clientIdx: 10, name: "Oso", species: "canine", breed: "Boyero de Berna", sex: "male_neutered", dob: "2021-12-01", color: "Tricolor", weightKg: "43.5" },
    { clientIdx: 11, name: "Rosita", species: "canine", breed: "Cocker spaniel", sex: "female_spayed", dob: "2020-10-17", color: "Crema", weightKg: "12.7" },
    { clientIdx: 12, name: "Duque", species: "canine", breed: "Gran danés", sex: "male", dob: "2022-08-09", color: "Azul", weightKg: "54.4" },
    { clientIdx: 13, name: "Pepita", species: "canine", breed: "Shih tzu", sex: "female_spayed", dob: "2019-01-20", color: "Dorado y blanco", weightKg: "5.9" },
    { clientIdx: 14, name: "Fito", species: "canine", breed: "Border collie", sex: "male_neutered", dob: "2021-04-30", color: "Blanco y negro", weightKg: "18.6" },
    { clientIdx: 15, name: "Zoe", species: "canine", breed: "Dachshund", sex: "female_spayed", dob: "2020-02-14", color: "Rojo", weightKg: "5.4" },
    { clientIdx: 16, name: "Gus", species: "canine", breed: "Schnauzer miniatura", sex: "male_neutered", dob: "2022-11-25", color: "Sal y pimienta", weightKg: "7.7" },
    { clientIdx: 0, name: "Firulais", species: "canine", breed: "Mestizo", sex: "male_neutered", dob: "2018-09-08", color: "Marrón claro", weightKg: "22.7" },
    { clientIdx: 3, name: "Kira", species: "canine", breed: "Yorkshire terrier", sex: "female", dob: "2023-03-12", color: "Azul y fuego", weightKg: "3.2" },
    { clientIdx: 7, name: "Bruno", species: "canine", breed: "Bulldog inglés", sex: "male_neutered", dob: "2021-06-15", color: "Blanco y rojo", weightKg: "22.0" },
    // Cats (15)
    { clientIdx: 1, name: "Bigotes", species: "feline", breed: "Doméstico de pelo corto", sex: "male_neutered", dob: "2019-05-10", color: "Atigrado naranja", weightKg: "5.0" },
    { clientIdx: 4, name: "Pelusa", species: "feline", breed: "Siamés", sex: "female_spayed", dob: "2020-12-05", color: "Seal point", weightKg: "3.9" },
    { clientIdx: 6, name: "Sombra", species: "feline", breed: "Doméstico de pelo largo", sex: "male_neutered", dob: "2018-03-18", color: "Negro", weightKg: "5.9" },
    { clientIdx: 9, name: "Tigre", species: "feline", breed: "Maine coon", sex: "male", dob: "2021-07-22", color: "Atigrado marrón", weightKg: "7.3" },
    { clientIdx: 11, name: "Cleo", species: "feline", breed: "Azul ruso", sex: "female_spayed", dob: "2020-09-30", color: "Azul", weightKg: "4.1" },
    { clientIdx: 14, name: "Oliver", species: "feline", breed: "Británico de pelo corto", sex: "male_neutered", dob: "2022-01-14", color: "Azul", weightKg: "5.4" },
    { clientIdx: 17, name: "Nala", species: "feline", breed: "Abisinio", sex: "female_spayed", dob: "2021-11-08", color: "Rojizo", weightKg: "3.6" },
    { clientIdx: 18, name: "Simba", species: "feline", breed: "Persa", sex: "male_neutered", dob: "2019-06-17", color: "Blanco", weightKg: "4.5" },
    { clientIdx: 19, name: "Lila", species: "feline", breed: "Ragdoll", sex: "female_spayed", dob: "2020-04-25", color: "Bicolor azul", weightKg: "4.8" },
    { clientIdx: 20, name: "Pinto", species: "feline", breed: "Bengalí", sex: "male_neutered", dob: "2022-06-03", color: "Marrón manchado", weightKg: "5.0" },
    { clientIdx: 21, name: "Mochi", species: "feline", breed: "Scottish fold", sex: "female_spayed", dob: "2021-02-20", color: "Gris", weightKg: "3.8" },
    { clientIdx: 22, name: "Félix", species: "feline", breed: "Doméstico de pelo corto", sex: "male_neutered", dob: "2018-10-11", color: "Esmoquin", weightKg: "5.7" },
    { clientIdx: 23, name: "Luna", species: "feline", breed: "Sphynx", sex: "female", dob: "2023-01-05", color: "Rosado", weightKg: "3.4" },
    { clientIdx: 24, name: "Oreo", species: "feline", breed: "Doméstico de pelo corto", sex: "male_neutered", dob: "2020-08-15", color: "Blanco y negro", weightKg: "4.9" },
    { clientIdx: 5, name: "Chispa", species: "feline", breed: "Calicó", sex: "female_spayed", dob: "2019-12-01", color: "Calicó", weightKg: "4.0" },
    // Rabbits (2)
    { clientIdx: 10, name: "Saltarín", species: "rabbit", breed: "Holland lop", sex: "male_neutered", dob: "2022-04-10", color: "Carey", weightKg: "1.8" },
    { clientIdx: 16, name: "Trébol", species: "rabbit", breed: "Mini rex", sex: "female_spayed", dob: "2023-02-14", color: "Castor", weightKg: "1.5" },
    // Birds (2)
    { clientIdx: 13, name: "Kiwi", species: "avian", breed: "Ninfa", sex: "male", dob: "2021-08-05", color: "Gris y amarillo", weightKg: "0.09" },
    { clientIdx: 19, name: "Solcito", species: "avian", breed: "Aratinga solar", sex: "female", dob: "2022-03-20", color: "Amarillo y naranja", weightKg: "0.11" },
    // Reptile (1)
    { clientIdx: 20, name: "Rex", species: "reptile", breed: "Dragón barbudo", sex: "male", dob: "2021-05-15", color: "Marrón claro", weightKg: "0.45" },
  ];

  const insertedPatients = await db
    .insert(patients)
    .values(
      patientsData.map((p) => ({
        practiceId,
        clientId: insertedClients[p.clientIdx]!.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        sex: p.sex,
        dob: p.dob,
        color: p.color,
        status: "active" as const,
      }))
    )
    .returning();
  console.log(`Patients: ${insertedPatients.length} created`);

  // Patient weights
  await db.insert(patientWeights).values(
    patientsData.map((p, i) => ({
      patientId: insertedPatients[i]!.id,
      weightKg: p.weightKg,
      recordedAt: daysAgo(Math.floor(Math.random() * 30)),
      recordedBy: pickRandom(techs).id,
    }))
  );
  console.log("Pesos de pacientes registrados");

  // Patient allergies (a few)
  await db.insert(patientAllergies).values([
    { patientId: insertedPatients[0]!.id, allergen: "Penicilina", reaction: "Urticaria, hinchazón facial", severity: "severe" as const, notedBy: vets[0]!.id },
    { patientId: insertedPatients[3]!.id, allergen: "Pollo", reaction: "Malestar gastrointestinal, picazón", severity: "moderate" as const, notedBy: vets[1]!.id },
    { patientId: insertedPatients[9]!.id, allergen: "Picaduras de abeja", reaction: "Anafilaxia", severity: "severe" as const, notedBy: vets[2]!.id },
    { patientId: insertedPatients[21]!.id, allergen: "Látex", reaction: "Dermatitis de contacto", severity: "mild" as const, notedBy: vets[0]!.id },
  ]);
  console.log("Alergias de pacientes registradas");

  // =========================================================================
  // 6. Appointment Types
  // =========================================================================
  const apptTypesData = [
    { name: "Control de salud", durationMinutes: 30, color: "#0d9488", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "Consulta por enfermedad", durationMinutes: 30, color: "#dc2626", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "Vacunación", durationMinutes: 15, color: "#2563eb", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "Cirugía", durationMinutes: 60, color: "#7c3aed", requiresDoctor: 1, defaultRoomType: "surgery" as const },
    { name: "Odontología", durationMinutes: 45, color: "#ea580c", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "Seguimiento", durationMinutes: 15, color: "#16a34a", requiresDoctor: 1, defaultRoomType: "exam" as const },
  ];

  const insertedApptTypes = await db
    .insert(appointmentTypes)
    .values(apptTypesData.map((t) => ({ ...t, practiceId })))
    .returning();
  console.log(`Appointment types: ${insertedApptTypes.length} created`);

  // =========================================================================
  // 7. Exam Rooms (3)
  // =========================================================================
  const insertedRooms = await db
    .insert(rooms)
    .values([
      { practiceId, locationId, name: "Consultorio 1", type: "exam" as const },
      { practiceId, locationId, name: "Consultorio 2", type: "exam" as const },
      { practiceId, locationId, name: "Consultorio 3", type: "exam" as const },
    ])
    .returning();
  console.log(`Rooms: ${insertedRooms.length} created`);

  // =========================================================================
  // 8. Appointments — 2 weeks (past week + current week)
  //    ~5-8 per day per vet, Mon-Fri, 9am-5pm
  // =========================================================================
  const appointmentValues: {
    practiceId: string;
    locationId: string;
    startTime: Date;
    endTime: Date;
    typeId: string;
    patientId: string;
    clientId: string;
    doctorId: string;
    roomId: string;
    status: "scheduled" | "confirmed" | "checked_in" | "in_exam" | "checked_out" | "no_show" | "cancelled";
    notes: string | null;
  }[] = [];

  const today = new Date();
  const currentDow = today.getDay(); // 0=Sun

  // Generate 10 weekdays: 5 from last week (Mon-Fri) + 5 from this week
  const weekdays: Date[] = [];
  // Last Monday = today - currentDow - 6 (if currentDow is e.g. 3/Wed, last Mon = -8)
  // More robust: last week Mon = this week Mon - 7
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - (currentDow === 0 ? 6 : currentDow - 1));
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  for (let w = 0; w < 2; w++) {
    const weekStart = w === 0 ? lastMonday : thisMonday;
    for (let d = 0; d < 5; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      weekdays.push(day);
    }
  }

  const timeSlots = [
    { hour: 9, min: 0 },
    { hour: 9, min: 30 },
    { hour: 10, min: 0 },
    { hour: 10, min: 30 },
    { hour: 11, min: 0 },
    { hour: 11, min: 30 },
    { hour: 13, min: 0 },
    { hour: 13, min: 30 },
    { hour: 14, min: 0 },
    { hour: 14, min: 30 },
    { hour: 15, min: 0 },
    { hour: 15, min: 30 },
    { hour: 16, min: 0 },
    { hour: 16, min: 30 },
  ];

  const pastStatuses: ("checked_out" | "no_show" | "cancelled")[] = [
    "checked_out", "checked_out", "checked_out", "checked_out",
    "checked_out", "checked_out", "checked_out", "checked_out",
    "no_show", "cancelled",
  ];

  const futureStatuses: ("scheduled" | "confirmed")[] = ["scheduled", "confirmed", "confirmed"];

  for (const day of weekdays) {
    const isPast = day < today && day.toDateString() !== today.toDateString();
    const isToday = day.toDateString() === today.toDateString();

    for (const vet of vets) {
      // 5-8 appointments per day per vet
      const numAppts = 5 + Math.floor(Math.random() * 4);
      const daySlots = pickN(timeSlots, numAppts);
      daySlots.sort((a, b) => a.hour * 60 + a.min - (b.hour * 60 + b.min));

      for (const slot of daySlots) {
        const apptType = pickRandom(insertedApptTypes);
        const patient = pickRandom(insertedPatients);
        // The appointment's client MUST be the patient's actual owner. The
        // schedule/dashboard patient-name join requires
        // patient.clientId === appointment.clientId, so a mismatched client
        // makes the name resolve to null and render as "Unknown Patient".
        // Map by the patient's own clientIdx, not its position in the array.
        const patientIdx = insertedPatients.indexOf(patient);
        const clientForPatient = insertedClients[patientsData[patientIdx]!.clientIdx];
        const startTime = setTime(day, slot.hour, slot.min);
        const endTime = addMinutes(startTime, apptType.durationMinutes);

        let status: typeof appointmentValues[0]["status"];
        if (isPast) {
          status = pickRandom(pastStatuses);
        } else if (isToday) {
          const nowHour = today.getHours();
          if (slot.hour < nowHour) {
            status = pickRandom(["checked_out", "checked_out", "checked_out", "no_show"] as const);
          } else if (slot.hour === nowHour) {
            status = pickRandom(["in_exam", "checked_in"] as const);
          } else {
            status = pickRandom(["scheduled", "confirmed", "confirmed"] as const);
          }
        } else {
          status = pickRandom(futureStatuses);
        }

        appointmentValues.push({
          practiceId,
          locationId,
          startTime,
          endTime,
          typeId: apptType.id,
          patientId: patient.id,
          clientId: clientForPatient
            ? clientForPatient.id
            : insertedClients[0]!.id,
          doctorId: vet.id,
          roomId: pickRandom(insertedRooms).id,
          status,
          notes: crypto.randomInt(10) > 6 ? "El propietario no refiere inquietudes" : null,
        });
      }
    }
  }

  const insertedAppointments = await db
    .insert(appointments)
    .values(appointmentValues)
    .returning();
  console.log(`Appointments: ${insertedAppointments.length} created`);

  // =========================================================================
  // 9. SOAP Notes for past checked_out appointments (sample)
  // =========================================================================
  const pastCheckedOut = insertedAppointments.filter(
    (a) => a.status === "checked_out"
  );

  const soapTemplates = [
    {
      subjective: "El propietario refiere que el paciente come y bebe con normalidad. Sin vómitos ni diarrea. Nivel de actividad normal. Al día con la prevención de pulgas y garrapatas.",
      objective: "T: 101.2F, FC: 80 lpm, FR: 20. CC: 5/9. Brillante, alerta y receptivo. Pelaje en buen estado. Sin hallazgos anormales en el examen físico. Los dientes muestran acumulación leve de sarro en los molares.",
      assessment: "Paciente sano, control de salud de rutina. Se observa sarro dental leve: se recomienda limpieza dental en los próximos 6 meses.",
      plan: "Continuar con la dieta y el ejercicio actuales. Programar limpieza dental. Actualizar las vacunas según el protocolo. Control en 1 año o según sea necesario.",
    },
    {
      subjective: "El propietario refiere disminución del apetito desde hace 2 días. El paciente luce aletargado. Sin vómitos, pero con heces blandas. Toma agua con normalidad.",
      objective: "T: 102.8F, FC: 110 lpm, FR: 28. CC: 4/9. Deshidratación leve. Abdomen ligeramente tenso a la palpación. No se palpan masas. Molestia leve en el abdomen craneal.",
      assessment: "Sospecha de gastroenteritis. Los diagnósticos diferenciales incluyen indiscreción alimentaria, pancreatitis y cuerpo extraño. Se recomiendan exámenes de sangre y vigilancia.",
      plan: "Se enviaron hemograma y panel de química. Dieta blanda (pollo hervido con arroz) durante 3-5 días. Se administró Cerenia 1mg/kg SC. Control en 48 horas si no mejora. Acudir a emergencias si comienza el vómito o empeora la letargia.",
    },
    {
      subjective: "Visita anual de vacunación. El propietario no tiene inquietudes. El paciente recibe Heartgard y NexGard cada mes.",
      objective: "T: 100.8F, FC: 90 lpm, FR: 18. CC: 6/9. Ligero sobrepeso. Todos los sistemas dentro de los límites normales en el examen. Corazón y pulmones sin alteraciones a la auscultación.",
      assessment: "Paciente sano, con ligero sobrepeso. Vacunas actualizadas hoy.",
      plan: "Se administraron las vacunas DHPP y antirrábica. Se recomienda reducir 10% la comida diaria y aumentar el ejercicio. Control de peso en 3 meses. Próxima vacunación anual en 1 año.",
    },
    {
      subjective: "El paciente consulta por cojera en el miembro anterior derecho, notada por el propietario tras jugar en el parque ayer. Sin traumatismo conocido. No mejoró durante la noche.",
      objective: "T: 101.5F, FC: 95 lpm, FR: 22. Cojera de grado 2/5 en el miembro anterior derecho. Dolor a la flexión del codo derecho. Inflamación leve de tejidos blandos sobre el codo lateral. Sin crepitación. Buen rango de movimiento en hombro y carpo.",
      assessment: "Cojera del miembro anterior derecho, probable lesión de tejidos blandos en la región del codo. Radiografías sin hallazgos: no se identifica fractura ni lesión de OCD.",
      plan: "Rimadyl 2mg/kg BID durante 7 días con alimento. Reposo estricto por 2 semanas: solo paseos con correa. Compresas frías 10 min TID los primeros 3 días. Control en 2 semanas. Si no mejora, considerar referencia para estudios de imagen avanzados.",
    },
    {
      subjective: "Limpieza dental de rutina bajo anestesia. Los exámenes de sangre preanestésicos se realizaron la semana pasada y estuvieron dentro de los límites normales. En ayuno (NPO) desde las 10 p. m. de anoche.",
      objective: "Signos vitales preanestésicos: T: 101.0F, FC: 88 lpm, FR: 16. ASA clase I. Enfermedad dental de grado 2 con sarro moderado en premolares y molares. Gingivitis leve. Se tomaron radiografías de toda la boca.",
      assessment: "Enfermedad dental de grado 2. Acumulación moderada de sarro. Sin absceso en la raíz dental en las radiografías. Todos los dientes están intactos y son viables.",
      plan: "Profilaxis dental completa bajo anestesia general (inducción con propofol, mantenimiento con isoflurane). Se retiró todo el sarro. Dientes pulidos. Se aplicó tratamiento con flúor. Recuperación sin complicaciones. Alta esta tarde con alimento blando durante 3 días.",
    },
  ];

  const soapNotesCount = Math.min(pastCheckedOut.length, 40);
  const soapNotesToCreate = pastCheckedOut.slice(0, soapNotesCount);
  await db.insert(soapNotes).values(
    soapNotesToCreate.map((appt) => {
      const template = pickRandom(soapTemplates);
      const author = insertedUsers.find((user) => user.id === appt.doctorId)!;
      const finalizedAt = new Date();
      return {
        practiceId,
        patientId: appt.patientId!,
        appointmentId: appt.id,
        authorId: author.id,
        authorName: author.name,
        status: "finalized" as const,
        revision: 1,
        finalizedAt,
        finalizedBy: author.id,
        finalizerName: author.name,
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan,
      };
    })
  );
  console.log(`SOAP notes: ${soapNotesCount} created`);

  // =========================================================================
  // 10. Vaccination Records
  // =========================================================================
  const vaccineData = [
    { name: "DHPP (Moquillo/Hepatitis/Parainfluenza/Parvovirus)", manufacturer: "Zoetis", nextDueMonths: 12 },
    { name: "Rabia (3 años)", manufacturer: "Boehringer Ingelheim", nextDueMonths: 36 },
    { name: "Bordetella", manufacturer: "Zoetis", nextDueMonths: 12 },
    { name: "Lyme (Borrelia burgdorferi)", manufacturer: "Zoetis", nextDueMonths: 12 },
    { name: "Influenza canina (H3N2/H3N8)", manufacturer: "Zoetis", nextDueMonths: 12 },
    { name: "Leptospirosis", manufacturer: "Nobivac", nextDueMonths: 12 },
    { name: "FVRCP (Rinotraqueítis viral felina/Calicivirus/Panleucopenia)", manufacturer: "Boehringer Ingelheim", nextDueMonths: 12 },
    { name: "FeLV (Leucemia felina)", manufacturer: "Boehringer Ingelheim", nextDueMonths: 12 },
    { name: "Rabia (1 año, felina)", manufacturer: "Boehringer Ingelheim", nextDueMonths: 12 },
  ];

  const vaccinationValues: {
    practiceId: string;
    patientId: string;
    vaccineName: string;
    lotNumber: string;
    manufacturer: string;
    administeredBy: string;
    administeredAt: Date;
    nextDueDate: string;
  }[] = [];

  // Dogs get DHPP, Rabies, Bordetella; Cats get FVRCP, Rabies, FeLV
  for (const patient of insertedPatients) {
    const pData = patientsData[insertedPatients.indexOf(patient)]!;
    let applicableVaccines: typeof vaccineData;
    if (pData.species === "canine") {
      applicableVaccines = vaccineData.filter((v) =>
        ["DHPP", "Rabia (3 años)", "Bordetella", "Lyme", "Leptospirosis"].some((n) => v.name.startsWith(n))
      );
    } else if (pData.species === "feline") {
      applicableVaccines = vaccineData.filter((v) =>
        ["FVRCP", "FeLV", "Rabia (1 año"].some((n) => v.name.startsWith(n))
      );
    } else if (pData.species === "rabbit") {
      // Rabbits: RHDV2
      applicableVaccines = [{ name: "RHDV2 (Enfermedad hemorrágica del conejo)", manufacturer: "Medgene", nextDueMonths: 12 }];
    } else {
      continue; // Birds/reptiles — skip vaccines
    }

    // Give 1-3 vaccines per patient
    const numVax = 1 + Math.floor(Math.random() * Math.min(3, applicableVaccines.length));
    const selectedVax = pickN(applicableVaccines, numVax);

    for (const vax of selectedVax) {
      const adminDate = daysAgo(Math.floor(Math.random() * 180) + 30);
      const nextDue = new Date(adminDate);
      nextDue.setMonth(nextDue.getMonth() + vax.nextDueMonths);

      vaccinationValues.push({
        practiceId,
        patientId: patient.id,
        vaccineName: vax.name,
        lotNumber: `LOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        manufacturer: vax.manufacturer,
        administeredBy: pickRandom(vets).id,
        administeredAt: adminDate,
        nextDueDate: dateStr(nextDue),
      });
    }
  }

  await db.insert(vaccinationRecords).values(vaccinationValues);
  console.log(`Vaccination records: ${vaccinationValues.length} created`);

  // =========================================================================
  // 11. Prescriptions
  // =========================================================================
  const prescriptionData = [
    { medicationName: "Rimadyl (Carprofen)", dosage: "75mg", frequency: "BID con alimento", quantity: 60, instructions: "Administre una tableta por vía oral dos veces al día con alimento. Vigile si hay malestar gastrointestinal. No la use junto con otros AINE ni corticosteroides." },
    { medicationName: "Metacam (Meloxicam)", dosage: "0.1mg/kg", frequency: "SID", quantity: 30, instructions: "Administre por vía oral una vez al día. Use la jeringa incluida para dosificar con exactitud. Dé el medicamento con alimento." },
    { medicationName: "Clavamox (Amoxicillin/Clavulanate)", dosage: "250mg", frequency: "BID", quantity: 28, instructions: "Administre una tableta por vía oral dos veces al día durante 14 días. Complete todo el tratamiento antibiótico aunque los síntomas mejoren." },
    { medicationName: "Apoquel (Oclacitinib)", dosage: "16mg", frequency: "BID x14d y luego SID", quantity: 42, instructions: "Administre una tableta dos veces al día durante 14 días y luego una vez al día como mantenimiento. Vigile si aparecen infecciones." },
    { medicationName: "Gabapentin", dosage: "100mg", frequency: "BID", quantity: 60, instructions: "Administre una cápsula por vía oral dos veces al día para el manejo del dolor. Puede causar sedación al inicio." },
    { medicationName: "Cerenia (Maropitant)", dosage: "24mg", frequency: "SID x5d", quantity: 5, instructions: "Administre una tableta una vez al día durante un máximo de 5 días para náuseas o vómitos. Puede darse con o sin alimento." },
    { medicationName: "Trazodone", dosage: "50mg", frequency: "BID PRN", quantity: 30, instructions: "Administre una tableta por vía oral dos veces al día según sea necesario para la ansiedad. Puede causar sedación." },
    { medicationName: "Prednisone", dosage: "10mg", frequency: "SID en reducción gradual", quantity: 21, instructions: "Día 1-7: 2 tabletas al día. Día 8-14: 1 tableta al día. Día 15-21: 1 tableta día por medio. Administre con alimento." },
    { medicationName: "Vetmedin (Pimobendan)", dosage: "2.5mg", frequency: "BID", quantity: 60, instructions: "Administre una tableta por vía oral dos veces al día, 1 hora antes de la comida. No la administre con alimento. Es esencial para la función cardíaca." },
    { medicationName: "Convenia (Cefovecin)", dosage: "8mg/kg", frequency: "Inyección única", quantity: 1, instructions: "Inyección subcutánea única administrada en la clínica. Brinda 14 días de cobertura antibiótica." },
    { medicationName: "Metronidazole", dosage: "250mg", frequency: "BID x10d", quantity: 20, instructions: "Administre una tableta por vía oral dos veces al día durante 10 días. Puede disminuir el apetito. Complete todo el tratamiento." },
    { medicationName: "Fortiflora (Probiótico)", dosage: "1 sobre", frequency: "SID", quantity: 30, instructions: "Espolvoree un sobre sobre el alimento una vez al día. Puede usarse a largo plazo para la salud gastrointestinal." },
  ];

  const prescriptionValues = [];
  // Create ~15 prescriptions for various patients
  for (let i = 0; i < 15; i++) {
    const rx = prescriptionData[i % prescriptionData.length]!;
    const patient = pickRandom(insertedPatients.slice(0, 20)); // mostly dogs/cats
    const startDate = daysAgo(crypto.randomInt(60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (rx.quantity / (rx.frequency.includes("BID") ? 2 : 1)));

    const isCompleted = endDate < new Date();
    prescriptionValues.push({
      practiceId,
      patientId: patient.id,
      medicationName: rx.medicationName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      quantity: rx.quantity,
      refillsRemaining: isCompleted ? 0 : Math.floor(Math.random() * 3),
      prescribedBy: pickRandom(vets).id,
      startDate: dateStr(startDate),
      endDate: dateStr(endDate),
      status: isCompleted ? ("completed" as const) : ("active" as const),
      instructions: rx.instructions,
    });
  }

  await db.insert(prescriptions).values(prescriptionValues);
  console.log(`Prescriptions: ${prescriptionValues.length} created`);

  // =========================================================================
  // 11b. Lab Results
  // =========================================================================
  const labTestData = [
    { testName: "CBC (Hemograma completo)", unit: "x10^9/L", low: "5.5", high: "16.9", normalValue: () => (5.5 + Math.random() * 11.4).toFixed(1) },
    { testName: "BUN (Nitrógeno ureico en sangre)", unit: "mg/dL", low: "7.0", high: "27.0", normalValue: () => (7 + Math.random() * 20).toFixed(1) },
    { testName: "Creatinina", unit: "mg/dL", low: "0.5", high: "1.8", normalValue: () => (0.5 + Math.random() * 1.3).toFixed(2) },
    { testName: "ALT (Alanina aminotransferasa)", unit: "U/L", low: "10.0", high: "125.0", normalValue: () => (10 + Math.random() * 115).toFixed(0) },
    { testName: "Glucosa", unit: "mg/dL", low: "74.0", high: "143.0", normalValue: () => (74 + Math.random() * 69).toFixed(0) },
    { testName: "Proteínas totales", unit: "g/dL", low: "5.2", high: "8.2", normalValue: () => (5.2 + Math.random() * 3).toFixed(1) },
    { testName: "Examen de orina - Gravedad específica", unit: "", low: "1.015", high: "1.045", normalValue: () => (1.015 + Math.random() * 0.03).toFixed(3) },
    { testName: "T4 (Tiroides)", unit: "ug/dL", low: "1.0", high: "4.0", normalValue: () => (1 + Math.random() * 3).toFixed(1) },
    { testName: "Fosfatasa alcalina (ALP)", unit: "U/L", low: "23.0", high: "212.0", normalValue: () => (23 + Math.random() * 189).toFixed(0) },
    { testName: "Albúmina", unit: "g/dL", low: "2.3", high: "4.0", normalValue: () => (2.3 + Math.random() * 1.7).toFixed(1) },
  ];

  const labResultValues: (typeof labResults.$inferInsert)[] = [];

  // Create 12 lab results across different patients. Pending rows intentionally
  // carry no partial values; completed/reviewed rows carry explicit evidence.
  const labPatients = pickN(insertedPatients.slice(0, 20), 8);
  for (let i = 0; i < 12; i++) {
    const patient = labPatients[i % labPatients.length]!;
    const test = labTestData[i % labTestData.length]!;
    const vet = pickRandom(vets);

    let measuredValue: string;
    if (i === 1) {
      measuredValue = "42.5";
    } else if (i === 3) {
      measuredValue = "198";
    } else if (i === 7) {
      measuredValue = "0.6";
    } else {
      measuredValue = test.normalValue();
    }

    const status: "pending" | "completed" | "reviewed" =
      i < 3 ? "pending" : i < 7 ? "completed" : "reviewed";
    const hasValues = status !== "pending";
    const createdAt = daysAgo(14 - i);
    const completedAt = hasValues ? addMinutes(createdAt, 30) : null;
    const reviewedAt = status === "reviewed"
      ? addMinutes(completedAt!, 45)
      : null;
    const creationOperationId = crypto.randomUUID();
    const creationPayloadHash = crypto
      .createHash("sha256")
      .update(`seed:lab:create:${creationOperationId}`)
      .digest("hex");
    const resultFlag = status === "pending"
      ? "unknown"
      : i === 3 || i === 7
        ? "abnormal"
        : "normal";

    labResultValues.push({
      practiceId,
      patientId: patient.id,
      creationOperationId,
      creationPayloadHash,
      testName: test.testName,
      resultValue: hasValues ? measuredValue : null,
      unit: hasValues ? test.unit : null,
      referenceRangeLow: hasValues ? test.low : null,
      referenceRangeHigh: hasValues ? test.high : null,
      status,
      resultFlag,
      orderedBy: vet.id,
      completedAt,
      reviewedBy: status === "reviewed" ? vet.id : null,
      reviewedAt,
      createdAt,
      updatedAt: reviewedAt ?? completedAt ?? createdAt,
    });
  }

  const insertedLabResults = await db
    .insert(labResults)
    .values(labResultValues)
    .returning();

  const userNameById = new Map(insertedUsers.map((user) => [user.id, user.name]));
  const labEventValues: (typeof labResultEvents.$inferInsert)[] = [];
  for (const result of insertedLabResults) {
    const actorName = userNameById.get(result.orderedBy ?? "") ?? "Clínico de ejemplo";
    labEventValues.push({
      practiceId,
      labResultId: result.id,
      patientId: result.patientId,
      appointmentId: result.appointmentId,
      eventType: "created",
      statusBefore: null,
      statusAfter: "pending",
      resultValue: null,
      unit: null,
      referenceRangeLow: null,
      referenceRangeHigh: null,
      resultFlag: "unknown",
      followUpStatus: "not_required",
      actorId: result.orderedBy!,
      actorName,
      createdAt: result.createdAt,
      operationId: result.creationOperationId!,
      operationPayloadHash: result.creationPayloadHash!,
    });
    if (result.status !== "pending") {
      const completionOperationId = crypto.randomUUID();
      labEventValues.push({
        practiceId,
        labResultId: result.id,
        patientId: result.patientId,
        appointmentId: result.appointmentId,
        eventType: "completed",
        statusBefore: "pending",
        statusAfter: "completed",
        resultValue: result.resultValue,
        unit: result.unit,
        referenceRangeLow: result.referenceRangeLow,
        referenceRangeHigh: result.referenceRangeHigh,
        resultFlag: result.resultFlag,
        followUpStatus: "not_required",
        actorId: result.orderedBy!,
        actorName,
        note: "Valores de resultado de ejemplo registrados.",
        createdAt: result.completedAt!,
        operationId: completionOperationId,
        operationPayloadHash: crypto
          .createHash("sha256")
          .update(`seed:lab:complete:${completionOperationId}`)
          .digest("hex"),
      });
    }
    if (result.status === "reviewed") {
      const reviewOperationId = crypto.randomUUID();
      labEventValues.push({
        practiceId,
        labResultId: result.id,
        patientId: result.patientId,
        appointmentId: result.appointmentId,
        eventType: "reviewed",
        statusBefore: "completed",
        statusAfter: "reviewed",
        resultValue: result.resultValue,
        unit: result.unit,
        referenceRangeLow: result.referenceRangeLow,
        referenceRangeHigh: result.referenceRangeHigh,
        resultFlag: result.resultFlag,
        followUpStatus: "not_required",
        actorId: result.reviewedBy!,
        actorName,
        createdAt: result.reviewedAt!,
        operationId: reviewOperationId,
        operationPayloadHash: crypto
          .createHash("sha256")
          .update(`seed:lab:review:${reviewOperationId}`)
          .digest("hex"),
      });
    }
  }
  await db.insert(labResultEvents).values(labEventValues);
  const enteredInErrorSource = insertedLabResults.find(
    (result) => result.status === "completed",
  );
  if (!enteredInErrorSource?.orderedBy) {
    throw new Error("El caso de demostración de corrección de laboratorio requiere un origen completado.");
  }
  const correctionOperationId = crypto.randomUUID();
  const correctionPayloadHash = crypto
    .createHash("sha256")
    .update(`seed:lab:entered-in-error:${correctionOperationId}`)
    .digest("hex");
  const correctionCreatedAt = addMinutes(
    enteredInErrorSource.completedAt ?? enteredInErrorSource.createdAt,
    5,
  );
  const [labCorrection] = await db
    .insert(clinicalRecordCorrections)
    .values({
      practiceId,
      recordType: "lab_result",
      action: "entered_in_error",
      labResultId: enteredInErrorSource.id,
      patientId: enteredInErrorSource.patientId,
      appointmentId: enteredInErrorSource.appointmentId,
      reason:
        "Valor transcrito incorrecto conservado para demostración y auditoría.",
      correctedBy: enteredInErrorSource.orderedBy,
      correctedByName:
        userNameById.get(enteredInErrorSource.orderedBy) ?? "Clínico de ejemplo",
      operationId: correctionOperationId,
      operationPayloadHash: correctionPayloadHash,
      createdAt: correctionCreatedAt,
    })
    .returning();
  const replacementOperationId = crypto.randomUUID();
  const replacementPayloadHash = crypto
    .createHash("sha256")
    .update(`seed:lab:replacement:${replacementOperationId}`)
    .digest("hex");
  const replacementCreatedAt = addMinutes(correctionCreatedAt, 5);
  const replacementCompletedAt = addMinutes(replacementCreatedAt, 15);
  const replacementReviewedAt = addMinutes(replacementCompletedAt, 10);
  const replacementValue = "87";
  const [replacementResult] = await db
    .insert(labResults)
    .values({
      practiceId,
      patientId: enteredInErrorSource.patientId,
      creationOperationId: replacementOperationId,
      creationPayloadHash: replacementPayloadHash,
      testName: enteredInErrorSource.testName,
      resultValue: replacementValue,
      unit: enteredInErrorSource.unit,
      referenceRangeLow: enteredInErrorSource.referenceRangeLow,
      referenceRangeHigh: enteredInErrorSource.referenceRangeHigh,
      status: "reviewed",
      resultFlag: "normal",
      orderedBy: enteredInErrorSource.orderedBy,
      completedAt: replacementCompletedAt,
      reviewedBy: enteredInErrorSource.orderedBy,
      reviewedAt: replacementReviewedAt,
      createdAt: replacementCreatedAt,
      updatedAt: replacementReviewedAt,
    })
    .returning();
  const replacementCompletionOperationId = crypto.randomUUID();
  const replacementReviewOperationId = crypto.randomUUID();
  const replacementActorName =
    userNameById.get(enteredInErrorSource.orderedBy) ?? "Clínico de ejemplo";
  await db.insert(labResultEvents).values([
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "created",
      statusBefore: null,
      statusAfter: "pending",
      resultValue: null,
      unit: null,
      referenceRangeLow: null,
      referenceRangeHigh: null,
      resultFlag: "unknown",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      createdAt: replacementCreatedAt,
      operationId: replacementOperationId,
      operationPayloadHash: replacementPayloadHash,
    },
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "completed",
      statusBefore: "pending",
      statusAfter: "completed",
      resultValue: replacementValue,
      unit: replacementResult!.unit,
      referenceRangeLow: replacementResult!.referenceRangeLow,
      referenceRangeHigh: replacementResult!.referenceRangeHigh,
      resultFlag: "normal",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      note: "Nuevo valor de reemplazo registrado tras la corrección.",
      createdAt: replacementCompletedAt,
      operationId: replacementCompletionOperationId,
      operationPayloadHash: crypto
        .createHash("sha256")
        .update(
          `seed:lab:replacement-complete:${replacementCompletionOperationId}`,
        )
        .digest("hex"),
    },
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "reviewed",
      statusBefore: "completed",
      statusAfter: "reviewed",
      resultValue: replacementValue,
      unit: replacementResult!.unit,
      referenceRangeLow: replacementResult!.referenceRangeLow,
      referenceRangeHigh: replacementResult!.referenceRangeHigh,
      resultFlag: "normal",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      createdAt: replacementReviewedAt,
      operationId: replacementReviewOperationId,
      operationPayloadHash: crypto
        .createHash("sha256")
        .update(`seed:lab:replacement-review:${replacementReviewOperationId}`)
        .digest("hex"),
    },
  ]);
  await db.insert(labResultReplacements).values({
    practiceId,
    correctionId: labCorrection!.id,
    sourceLabResultId: enteredInErrorSource.id,
    replacementLabResultId: replacementResult!.id,
    actorId: enteredInErrorSource.orderedBy,
    actorName: replacementActorName,
    operationId: replacementOperationId,
    operationPayloadHash: replacementPayloadHash,
    createdAt: replacementCreatedAt,
  });
  console.log(
    `Lab results: ${insertedLabResults.length + 1} created with ${labEventValues.length + 3} evidence events`,
  );

  // =========================================================================
  // 11c. Procedures
  // =========================================================================
  const procedureData = [
    { name: "Profilaxis dental", description: "Limpieza dental completa con raspado y pulido bajo anestesia general", anesthesiaUsed: "Isoflurane + inducción con Propofol", durationMinutes: 60 },
    { name: "Extirpación de masa", description: "Escisión quirúrgica de masa subcutánea en el flanco derecho, enviada a histopatología", anesthesiaUsed: "Isoflurane + bloqueo local con lidocaine", durationMinutes: 45 },
    { name: "Reparación de laceración", description: "Desbridamiento de la herida y cierre primario de laceración de 4cm en el miembro anterior izquierdo", anesthesiaUsed: "Sedación (Dexdomitor) + lidocaine local", durationMinutes: 30 },
    { name: "Extracción de cuerpo extraño", description: "Extracción endoscópica de un fragmento de media del estómago", anesthesiaUsed: "Anestesia general con Isoflurane", durationMinutes: 90 },
    { name: "Esterilización (Ovariohisterectomía)", description: "Ovariohisterectomía de rutina por abordaje de línea media ventral", anesthesiaUsed: "Isoflurane + inducción con Propofol + Meloxicam", durationMinutes: 45 },
    { name: "Castración (Orquiectomía)", description: "Castración de rutina, abordaje prescrotal, técnica cerrada", anesthesiaUsed: "Isoflurane + inducción con Propofol", durationMinutes: 25 },
    { name: "Cistotomía", description: "Extracción quirúrgica de cálculos vesicales mediante cistotomía ventral", anesthesiaUsed: "Anestesia general con Isoflurane + epidural", durationMinutes: 75 },
  ];

  const procedureValues: {
    practiceId: string;
    patientId: string;
    name: string;
    description: string;
    performedBy: string;
    anesthesiaUsed: string;
    durationMinutes: number;
    notes: string;
  }[] = [];

  const procPatients = pickN(insertedPatients.slice(0, 20), 7);
  for (let i = 0; i < 7; i++) {
    const patient = procPatients[i % procPatients.length]!;
    const proc = procedureData[i]!;
    const vet = pickRandom(vets);

    procedureValues.push({
      practiceId,
      patientId: patient.id,
      name: proc.name,
      description: proc.description,
      performedBy: vet.id,
      anesthesiaUsed: proc.anesthesiaUsed,
      durationMinutes: proc.durationMinutes,
      notes: `El paciente se recuperó bien. Monitoreo posoperatorio durante ${Math.floor(proc.durationMinutes / 2)} minutos. Se dio de alta con las indicaciones posoperatorias habituales.`,
    });
  }

  await db.insert(procedures).values(procedureValues);
  console.log(`Procedures: ${procedureValues.length} created`);

  // =========================================================================
  // 12. Services
  // =========================================================================
  const servicesData = [
    { name: "Examen de control de salud", code: "EXAM-WE", category: "Consulta", defaultPrice: "65.00" },
    { name: "Examen por enfermedad", code: "EXAM-SV", category: "Consulta", defaultPrice: "75.00" },
    { name: "Consulta prequirúrgica", code: "EXAM-SC", category: "Consulta", defaultPrice: "85.00" },
    { name: "Profilaxis dental", code: "DENT-01", category: "Odontología", defaultPrice: "350.00" },
    { name: "Extracción dental (simple)", code: "DENT-02", category: "Odontología", defaultPrice: "150.00" },
    { name: "Esterilización (menos de 50 lb)", code: "SURG-01", category: "Cirugía", defaultPrice: "400.00" },
    { name: "Castración (menos de 50 lb)", code: "SURG-02", category: "Cirugía", defaultPrice: "300.00" },
    { name: "Extirpación de masa", code: "SURG-03", category: "Cirugía", defaultPrice: "500.00" },
    { name: "Radiografía (2 vistas)", code: "DIAG-01", category: "Diagnóstico", defaultPrice: "185.00" },
    { name: "Hemograma y panel de química", code: "LAB-01", category: "Laboratorio", defaultPrice: "145.00" },
    { name: "Examen de orina", code: "LAB-02", category: "Laboratorio", defaultPrice: "55.00" },
    { name: "Flotación fecal", code: "LAB-03", category: "Laboratorio", defaultPrice: "35.00" },
    { name: "Vacuna DHPP", code: "VAX-01", category: "Vacuna", defaultPrice: "28.00" },
    { name: "Vacuna antirrábica", code: "VAX-02", category: "Vacuna", defaultPrice: "22.00" },
    { name: "Vacuna Bordetella", code: "VAX-03", category: "Vacuna", defaultPrice: "25.00" },
    { name: "Vacuna FVRCP", code: "VAX-04", category: "Vacuna", defaultPrice: "28.00" },
    { name: "Vacuna FeLV", code: "VAX-05", category: "Vacuna", defaultPrice: "30.00" },
    { name: "Corte de uñas", code: "GROO-01", category: "Peluquería", defaultPrice: "18.00" },
    { name: "Expresión de glándulas anales", code: "GROO-02", category: "Peluquería", defaultPrice: "25.00" },
    { name: "Implantación de microchip", code: "MISC-01", category: "Varios", defaultPrice: "55.00" },
  ];

  const insertedServices = await db
    .insert(services)
    .values(servicesData.map((s) => ({ ...s, practiceId, taxable: true })))
    .returning();
  console.log(`Services: ${insertedServices.length} created`);

  // =========================================================================
  // 13. Invoices (various states)
  // =========================================================================
  const invoiceStatuses: ("draft" | "sent" | "paid" | "overdue")[] = [
    "paid", "paid", "paid", "paid", "paid",
    "paid", "paid", "sent", "sent", "sent",
    "draft", "draft", "overdue", "overdue",
  ];

  const invoiceValues: {
    practiceId: string;
    clientId: string;
    patientId: string;
    appointmentId: string | null;
    status: "draft" | "sent" | "paid" | "overdue";
    subtotal: string;
    tax: string;
    total: string;
    paidAmount: string;
    dueDate: string;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < invoiceStatuses.length; i++) {
    const status = invoiceStatuses[i]!;
    const client = insertedClients[i % insertedClients.length]!;
    const patientIdx = patientsData.findIndex(
      (p) => insertedClients[p.clientIdx]?.id === client.id
    );
    const patient = patientIdx >= 0 ? insertedPatients[patientIdx]! : insertedPatients[0]!;
    const appt = i < insertedAppointments.length ? insertedAppointments[i]! : null;

    const subtotal = (50 + Math.floor(Math.random() * 400)).toFixed(2);
    const tax = (parseFloat(subtotal) * 0.08).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
    const paidAmount = status === "paid" ? total : status === "overdue" ? "0.00" : "0.00";

    // Issue every invoice before its due date so no invoice reads as "due
    // before it was created" in the UI.
    let dueDate: string;
    let createdAt: Date;
    if (status === "paid") {
      const dueDaysAgo = Math.floor(Math.random() * 30);
      createdAt = daysAgo(dueDaysAgo + 14);
      dueDate = dateStr(daysAgo(dueDaysAgo));
    } else if (status === "overdue") {
      const dueDaysAgo = Math.floor(Math.random() * 14) + 1;
      createdAt = daysAgo(dueDaysAgo + 14);
      dueDate = dateStr(daysAgo(dueDaysAgo));
    } else {
      createdAt = daysAgo(Math.floor(Math.random() * 5));
      dueDate = dateStr(daysFromNow(30));
    }

    invoiceValues.push({
      practiceId,
      clientId: client.id,
      patientId: patient.id,
      appointmentId: appt?.id ?? null,
      status,
      subtotal,
      tax,
      total,
      paidAmount,
      dueDate,
      createdAt,
    });
  }

  const insertedInvoices = await db
    .insert(invoices)
    .values(invoiceValues)
    .returning();
  console.log(`Invoices: ${insertedInvoices.length} created`);

  // Invoice items
  const invoiceItemValues: {
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
    taxable: boolean;
    itemType: "service" | "product";
  }[] = [];

  for (const inv of insertedInvoices) {
    const numItems = 1 + Math.floor(Math.random() * 4);
    let runningTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const svc = pickRandom(insertedServices);
      const qty = 1;
      const unitPrice = svc.defaultPrice;
      const itemTotal = (parseFloat(unitPrice) * qty).toFixed(2);
      runningTotal += parseFloat(itemTotal);

      invoiceItemValues.push({
        invoiceId: inv.id,
        description: svc.name,
        quantity: qty,
        unitPrice,
        total: itemTotal,
        taxable: svc.taxable,
        itemType: "service",
      });
    }
  }

  await db.insert(invoiceItems).values(invoiceItemValues);
  console.log(`Invoice items: ${invoiceItemValues.length} created`);

  // =========================================================================
  // 14. Products (50)
  // =========================================================================
  const productsData = [
    // Medications
    { name: "Rimadyl 75mg tableta", sku: "MED-001", category: "Medicamento", unitPrice: "1.42", costPrice: "0.70", stockQuantity: 2700, reorderPoint: 900 },
    { name: "Metacam 1.5mg/mL suspensión oral — por mL", sku: "MED-002", category: "Medicamento", unitPrice: "2.03", costPrice: "1.00", stockQuantity: 960, reorderPoint: 320 },
    { name: "Clavamox 250mg tableta", sku: "MED-003", category: "Medicamento", unitPrice: "1.71", costPrice: "0.79", stockQuantity: 1400, reorderPoint: 420 },
    { name: "Apoquel 16mg tableta", sku: "MED-004", category: "Medicamento", unitPrice: "4.17", costPrice: "2.60", stockQuantity: 750, reorderPoint: 300 },
    { name: "Gabapentin 100mg cápsula", sku: "MED-005", category: "Medicamento", unitPrice: "0.58", costPrice: "0.20", stockQuantity: 3600, reorderPoint: 1200 },
    { name: "Cerenia 24mg tableta", sku: "MED-006", category: "Medicamento", unitPrice: "23.75", costPrice: "13.75", stockQuantity: 80, reorderPoint: 32 },
    { name: "Trazodone 50mg tableta", sku: "MED-007", category: "Medicamento", unitPrice: "0.93", costPrice: "0.33", stockQuantity: 1200, reorderPoint: 450 },
    { name: "Prednisone 10mg tableta", sku: "MED-008", category: "Medicamento", unitPrice: "0.50", costPrice: "0.17", stockQuantity: 1650, reorderPoint: 600 },
    { name: "Vetmedin 2.5mg tableta", sku: "MED-009", category: "Medicamento", unitPrice: "2.90", costPrice: "1.76", stockQuantity: 750, reorderPoint: 250 },
    { name: "Metronidazole 250mg tableta", sku: "MED-010", category: "Medicamento", unitPrice: "0.73", costPrice: "0.27", stockQuantity: 1500, reorderPoint: 450 },
    { name: "Doxycycline 100mg tableta", sku: "MED-011", category: "Medicamento", unitPrice: "1.07", costPrice: "0.40", stockQuantity: 1200, reorderPoint: 450 },
    { name: "Enrofloxacin 68mg tableta", sku: "MED-012", category: "Medicamento", unitPrice: "1.10", costPrice: "0.56", stockQuantity: 1500, reorderPoint: 500 },
    { name: "Cephalexin 500mg cápsula", sku: "MED-013", category: "Medicamento", unitPrice: "0.45", costPrice: "0.18", stockQuantity: 3500, reorderPoint: 1200 },
    { name: "Tramadol 50mg tableta", sku: "MED-014", category: "Medicamento", unitPrice: "0.63", costPrice: "0.25", stockQuantity: 1500, reorderPoint: 600 },
    { name: "Enalapril 5mg tableta", sku: "MED-015", category: "Medicamento", unitPrice: "0.42", costPrice: "0.13", stockQuantity: 1800, reorderPoint: 600 },
    // Preventives
    { name: "Heartgard Plus (26-50 lb, 6 uds)", sku: "PREV-001", category: "Preventivo", unitPrice: "55.00", costPrice: "32.00", stockQuantity: 40, reorderPoint: 15 },
    { name: "NexGard (24.1-60 lb, 6 uds)", sku: "PREV-002", category: "Preventivo", unitPrice: "120.00", costPrice: "72.00", stockQuantity: 35, reorderPoint: 12 },
    { name: "Simparica Trio (22.1-44 lb, 6 uds)", sku: "PREV-003", category: "Preventivo", unitPrice: "135.00", costPrice: "82.00", stockQuantity: 28, reorderPoint: 10 },
    { name: "Revolution Plus (5.6-11 lb gato, 6 uds)", sku: "PREV-004", category: "Preventivo", unitPrice: "125.00", costPrice: "75.00", stockQuantity: 25, reorderPoint: 10 },
    { name: "Bravecto (22-44 lb, 1 ud)", sku: "PREV-005", category: "Preventivo", unitPrice: "58.00", costPrice: "35.00", stockQuantity: 30, reorderPoint: 10 },
    // Supplements
    { name: "Fortiflora Canino (30 sobres)", sku: "SUP-001", category: "Suplemento", unitPrice: "32.00", costPrice: "18.00", stockQuantity: 45, reorderPoint: 15 },
    { name: "Fortiflora Felino (30 sobres)", sku: "SUP-002", category: "Suplemento", unitPrice: "32.00", costPrice: "18.00", stockQuantity: 35, reorderPoint: 12 },
    { name: "Dasuquin Advanced (84 uds)", sku: "SUP-003", category: "Suplemento", unitPrice: "65.00", costPrice: "38.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "Welactin Omega-3 (120 cápsulas blandas)", sku: "SUP-004", category: "Suplemento", unitPrice: "42.00", costPrice: "22.00", stockQuantity: 20, reorderPoint: 8 },
    { name: "Cosequin DS Plus MSM (132 uds)", sku: "SUP-005", category: "Suplemento", unitPrice: "55.00", costPrice: "30.00", stockQuantity: 22, reorderPoint: 8 },
    // Food
    { name: "Hill's Science Diet Adulto (30 lb)", sku: "FOOD-001", category: "Alimento", unitPrice: "72.00", costPrice: "45.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "Royal Canin GI Bajo en grasa (17.6 lb)", sku: "FOOD-002", category: "Alimento", unitPrice: "85.00", costPrice: "52.00", stockQuantity: 12, reorderPoint: 4 },
    { name: "Hill's Prescription Diet k/d (8.5 lb)", sku: "FOOD-003", category: "Alimento", unitPrice: "48.00", costPrice: "28.00", stockQuantity: 10, reorderPoint: 4 },
    { name: "Royal Canin Urinary SO (17.6 lb)", sku: "FOOD-004", category: "Alimento", unitPrice: "78.00", costPrice: "48.00", stockQuantity: 8, reorderPoint: 3 },
    { name: "Hill's Science Diet Gatito (7 lb)", sku: "FOOD-005", category: "Alimento", unitPrice: "32.00", costPrice: "18.00", stockQuantity: 10, reorderPoint: 4 },
    { name: "Purina Pro Plan Piel sensible (30 lb)", sku: "FOOD-006", category: "Alimento", unitPrice: "62.00", costPrice: "38.00", stockQuantity: 12, reorderPoint: 4 },
    { name: "Royal Canin Proteína hidrolizada (17.6 lb)", sku: "FOOD-007", category: "Alimento", unitPrice: "92.00", costPrice: "58.00", stockQuantity: 6, reorderPoint: 3 },
    { name: "Hill's i/d Cuidado digestivo (8.5 lb)", sku: "FOOD-008", category: "Alimento", unitPrice: "45.00", costPrice: "26.00", stockQuantity: 14, reorderPoint: 5 },
    // Supplies
    { name: "Collar isabelino (mediano)", sku: "SUP-S01", category: "Insumo", unitPrice: "15.00", costPrice: "5.00", stockQuantity: 30, reorderPoint: 10 },
    { name: "Collar isabelino (grande)", sku: "SUP-S02", category: "Insumo", unitPrice: "18.00", costPrice: "6.00", stockQuantity: 25, reorderPoint: 10 },
    { name: "Pill Pockets - Pollo (30 uds)", sku: "SUP-S03", category: "Insumo", unitPrice: "12.00", costPrice: "6.00", stockQuantity: 50, reorderPoint: 15 },
    { name: "Pill Pockets - Mantequilla de maní (30 uds)", sku: "SUP-S04", category: "Insumo", unitPrice: "12.00", costPrice: "6.00", stockQuantity: 45, reorderPoint: 15 },
    { name: "Cabestro Gentle Leader (mediano)", sku: "SUP-S05", category: "Insumo", unitPrice: "22.00", costPrice: "12.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "Microchip (HomeAgain)", sku: "SUP-S06", category: "Insumo", unitPrice: "35.00", costPrice: "18.00", stockQuantity: 40, reorderPoint: 15 },
    { name: "Vendaje Vetrap (4 in x 5 yd)", sku: "SUP-S07", category: "Insumo", unitPrice: "4.00", costPrice: "1.50", stockQuantity: 100, reorderPoint: 30 },
    { name: "Rollo de vendaje adhesivo", sku: "SUP-S08", category: "Insumo", unitPrice: "6.00", costPrice: "2.00", stockQuantity: 80, reorderPoint: 25 },
    { name: "Limpiador de oídos (8 oz)", sku: "SUP-S09", category: "Insumo", unitPrice: "14.00", costPrice: "7.00", stockQuantity: 35, reorderPoint: 10 },
    { name: "Solución de lavado con clorhexidina (8 oz)", sku: "SUP-S10", category: "Insumo", unitPrice: "16.00", costPrice: "8.00", stockQuantity: 30, reorderPoint: 10 },
    { name: "Premios dentales (grande, 30 uds)", sku: "SUP-S11", category: "Insumo", unitPrice: "28.00", costPrice: "14.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "Jeringas de 3mL (100 uds)", sku: "SUP-S12", category: "Insumo", unitPrice: "18.00", costPrice: "8.00", stockQuantity: 20, reorderPoint: 5 },
    { name: "Catéter IV 20ga (50 uds)", sku: "SUP-S13", category: "Insumo", unitPrice: "45.00", costPrice: "22.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "Guantes quirúrgicos (talla M, 100 uds)", sku: "SUP-S14", category: "Insumo", unitPrice: "25.00", costPrice: "12.00", stockQuantity: 18, reorderPoint: 5 },
    { name: "Lubricante KY Jelly (4 oz)", sku: "SUP-S15", category: "Insumo", unitPrice: "8.00", costPrice: "3.00", stockQuantity: 20, reorderPoint: 8 },
    { name: "Frascos para muestras de heces (50 uds)", sku: "SUP-S16", category: "Insumo", unitPrice: "15.00", costPrice: "6.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "Cortauñas para mascotas (profesional)", sku: "SUP-S17", category: "Insumo", unitPrice: "18.00", costPrice: "8.00", stockQuantity: 10, reorderPoint: 3 },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(
      productsData.map((p) => ({
        practiceId,
        locationId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unitPrice: p.unitPrice,
        taxable: true,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        reorderPoint: p.reorderPoint,
      }))
    )
    .returning();
  console.log(`Products: ${insertedProducts.length} created`);

  // =========================================================================
  // 16. Payments — one per paid invoice
  // =========================================================================
  const frontDeskUsers = insertedUsers.filter((u) => u.role === "front_desk");
  const vetUsers = insertedUsers.filter((u) => u.role === "veterinarian");
  const techUsers = insertedUsers.filter((u) => u.role === "technician");
  const adminUser = insertedUsers.find((u) => u.role === "admin")!;
  const paidInvoices = insertedInvoices.filter((i) => i.status === "paid");
  const paymentMethods = ["credit_card", "credit_card", "debit_card", "cash", "check", "credit_card", "online"] as const;

  const paymentValues = paidInvoices.map((inv, i) => ({
    invoiceId: inv.id,
    amount: inv.total,
    method: paymentMethods[i % paymentMethods.length]!,
    receivedBy: frontDeskUsers[i % frontDeskUsers.length]!.id,
    receivedAt: daysAgo(Math.floor(Math.random() * 14)),
    notes: null,
  }));
  const insertedPayments = await db.insert(payments).values(paymentValues).returning();
  console.log(`Payments: ${insertedPayments.length} created`);

  // =========================================================================
  // 17. Communications — messages, calls, emails, portal
  // =========================================================================
  type CommRow = typeof communications.$inferInsert;
  const commValues: CommRow[] = [];
  const someClients = insertedClients.slice(0, 12);

  // SMS appointment reminders (outbound, delivered)
  for (let i = 0; i < 5; i++) {
    commValues.push({
      practiceId,
      clientId: someClients[i]!.id,
      channel: "sms",
      direction: "outbound",
      subject: null,
      content: `Hola, ${someClients[i]!.firstName}. Le escribimos de la Clínica Veterinaria Los Samanes para recordarle su cita de mañana. Responda C para confirmar o R para reprogramar.`,
      status: "delivered",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 7)),
    });
  }

  // Emails — wellness reminders + Rx refill reply + invoice copy
  const emailSubjects = [
    { subject: "Control anual de salud pendiente para su mascota", content: "Es hora de la visita anual de control de salud. Responda a este correo o llame a la clínica para agendar su cita." },
    { subject: "Recordatorio de refuerzo de vacuna", content: "A su mascota le corresponde el refuerzo de DHPP este mes. Tenemos cupos los martes y jueves por la tarde." },
    { subject: "Re: Reposición de la receta de Rimadyl", content: "Gracias por su solicitud de reposición. Aprobamos una reposición para 30 días — puede retirarla cualquier día de esta semana en horario de atención." },
    { subject: "Copia de la factura — visita reciente", content: "Adjuntamos la factura detallada de su visita reciente. Avísenos si tiene alguna pregunta." },
  ];
  emailSubjects.forEach((e, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[5 + i]!.id,
      channel: "email",
      direction: "outbound",
      subject: e.subject,
      content: e.content,
      status: "sent",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 10) + 1),
    });
  });

  // Portal messages — inbound from clients
  const portalMessages = [
    { subject: "Consulta sobre el medicamento de Luna", content: "¿Está bien darle a Luna su Rimadyl con comida? Parece tener malestar estomacal cuando lo toma en ayunas." },
    { subject: "Reprogramación de la cita del martes", content: "Hola — mi horario de trabajo cambió. ¿Podemos mover la cita del martes para más tarde en la semana?" },
    { subject: "Registro de vacunación necesario para hospedaje", content: "Vamos a dejar a Max hospedado el próximo fin de semana. ¿Pueden enviar su registro de vacunación al hotel canino?" },
  ];
  portalMessages.forEach((m, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[9 + i]!.id,
      channel: "portal",
      direction: "inbound",
      subject: m.subject,
      content: m.content,
      status: "delivered",
      assignedTo: i === 0 ? vetUsers[0]!.id : frontDeskUsers[0]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  // Phone call logs
  const callLogs = [
    { content: "El propietario llamó por cojera en la pata trasera izquierda, desde esta mañana. Se le indicó traer al paciente hoy — se agendó el turno de las 3 p. m.", direction: "inbound" as const },
    { content: "Llamada para confirmar el consentimiento quirúrgico de la limpieza dental de mañana. El propietario confirmó la entrega a las 7:30 a. m., en ayuno desde las 10 p. m.", direction: "outbound" as const },
    { content: "Llamada de seguimiento posoperatorio — el paciente come con normalidad y las suturas se ven limpias. Control programado en 10 días.", direction: "outbound" as const },
  ];
  callLogs.forEach((c, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[i]!.id,
      channel: "phone",
      direction: c.direction,
      subject: null,
      content: c.content,
      status: "delivered",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  const insertedComms = await db.insert(communications).values(commValues).returning();
  console.log(`Communications: ${insertedComms.length} created`);

  // =========================================================================
  // 18. Audit log — recent practice activity
  // =========================================================================
  type AuditRow = typeof auditLog.$inferInsert;
  const auditValues: AuditRow[] = [];

  const samplePatients = insertedPatients.slice(0, 15);
  const sampleAppts = insertedAppointments.slice(0, 20);
  const sampleInvoicesForAudit = insertedInvoices.slice(0, 10);
  const auditIp = () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;

  // Appointment lifecycle events
  sampleAppts.slice(0, 12).forEach((appt, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "appointment.created",
      entityType: "appointment",
      entityId: appt.id,
      changes: { status: "scheduled" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 7)),
    });
  });
  sampleAppts.slice(0, 6).forEach((appt, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "appointment.checked_in",
      entityType: "appointment",
      entityId: appt.id,
      changes: { status: "checked_in" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 3)),
    });
  });

  // Invoice lifecycle
  sampleInvoicesForAudit.slice(0, 6).forEach((inv, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "invoice.created",
      entityType: "invoice",
      entityId: inv.id,
      changes: { total: inv.total },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 14)),
    });
  });
  paidInvoices.slice(0, 4).forEach((inv, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "invoice.paid",
      entityType: "invoice",
      entityId: inv.id,
      changes: { status: "paid", paidAmount: inv.total },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 10)),
    });
  });

  // Patient record edits by vets
  samplePatients.slice(0, 5).forEach((patient, i) => {
    auditValues.push({
      practiceId,
      userId: vetUsers[i % vetUsers.length]!.id,
      action: "patient.updated",
      entityType: "patient",
      entityId: patient.id,
      changes: { weight: "updated" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  // Login events (practice-level, not tied to an entity)
  [adminUser, ...vetUsers, ...frontDeskUsers].forEach((user, i) => {
    auditValues.push({
      practiceId,
      userId: user.id,
      action: "user.login",
      entityType: "user",
      entityId: user.id,
      changes: null,
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 2)),
    });
  });

  const insertedAudit = await db.insert(auditLog).values(auditValues).returning();
  console.log(`Audit log entries: ${insertedAudit.length} created`);

  // =========================================================================
  // 19. Controlled substance log — DEA-compliant dispense trail
  // =========================================================================
  type CsLogRow = typeof controlledSubstanceLog.$inferInsert;
  const csEntries: CsLogRow[] = [
    {
      practiceId,
      drugName: "Tramadol HCl 50mg",
      deaSchedule: "IV",
      action: "administered",
      quantity: "2.000",
      unit: "tablet",
      patientId: samplePatients[0]!.id,
      performedBy: vetUsers[0]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "TR-2026-0318-A",
      notes: "Manejo del dolor posoperatorio, extracción dental",
      performedAt: daysAgo(2),
    },
    {
      practiceId,
      drugName: "Buprenorphine 0.3 mg/mL",
      deaSchedule: "III",
      action: "administered",
      quantity: "0.500",
      unit: "mL",
      patientId: samplePatients[1]!.id,
      performedBy: vetUsers[1]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "BUP-2026-Q1-7",
      notes: "Analgesia prequirúrgica",
      performedAt: daysAgo(4),
    },
    {
      practiceId,
      drugName: "Phenobarbital 30mg",
      deaSchedule: "IV",
      action: "administered",
      quantity: "30.000",
      unit: "tablet",
      patientId: samplePatients[2]!.id,
      performedBy: vetUsers[0]!.id,
      witnessedBy: techUsers[1]!.id,
      lotNumber: "PB-2026-0201",
      notes: "Suministro para 30 días despachado para el control de convulsiones",
      performedAt: daysAgo(6),
    },
    {
      practiceId,
      drugName: "Ketamine 100 mg/mL",
      deaSchedule: "III",
      action: "administered",
      quantity: "1.200",
      unit: "mL",
      patientId: samplePatients[3]!.id,
      performedBy: vetUsers[2]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "KET-2026-0405",
      notes: "Inducción para procedimiento de esterilización",
      performedAt: daysAgo(1),
    },
    {
      practiceId,
      drugName: "Morphine 15 mg/mL",
      deaSchedule: "II",
      action: "wasted",
      quantity: "0.200",
      unit: "mL",
      patientId: null,
      performedBy: vetUsers[0]!.id,
      witnessedBy: vetUsers[1]!.id,
      lotNumber: "MOR-2026-0112",
      notes: "Desecho parcial del vial tras preparar la dosis — eliminación presenciada",
      performedAt: daysAgo(3),
    },
    {
      practiceId,
      drugName: "Gabapentin 100mg",
      deaSchedule: "V",
      action: "administered",
      quantity: "60.000",
      unit: "capsule",
      patientId: samplePatients[4]!.id,
      performedBy: vetUsers[1]!.id,
      witnessedBy: techUsers[1]!.id,
      lotNumber: "GAB-2026-0227",
      notes: "Suministro para 30 días para el manejo del dolor crónico",
      performedAt: daysAgo(8),
    },
  ];
  const insertedCs = await db.insert(controlledSubstanceLog).values(csEntries).returning();
  console.log(`Controlled substance log: ${insertedCs.length} created`);

  // =========================================================================
  // 20. Treatment templates — common procedure bundles
  // =========================================================================
  type TemplateRow = typeof treatmentTemplates.$inferInsert;
  const templatesData: Array<TemplateRow & { items: Array<{ description: string; defaultQuantity: number; defaultUnitPrice: string }> }> = [
    {
      practiceId,
      name: "Control de salud — Perro adulto",
      description: "Control anual de salud estándar para perros adultos. Incluye examen físico, prueba de dirofilariosis y análisis de heces.",
      category: "Control de salud",
      isActive: true,
      items: [
        { description: "Examen físico (15 min)", defaultQuantity: 1, defaultUnitPrice: "65.00" },
        { description: "Prueba de antígeno de dirofilariosis", defaultQuantity: 1, defaultUnitPrice: "45.00" },
        { description: "Flotación fecal", defaultQuantity: 1, defaultUnitPrice: "35.00" },
      ],
    },
    {
      practiceId,
      name: "Visita de refuerzo de DHPP para cachorros",
      description: "Visita de vacunación de rutina para cachorros — refuerzo de DHPP con examen breve.",
      category: "Vacunación",
      isActive: true,
      items: [
        { description: "Examen breve (10 min)", defaultQuantity: 1, defaultUnitPrice: "45.00" },
        { description: "Vacuna DHPP", defaultQuantity: 1, defaultUnitPrice: "32.00" },
      ],
    },
    {
      practiceId,
      name: "Profilaxis dental — Estándar",
      description: "Limpieza dental de rutina bajo anestesia. Incluye exámenes de sangre preanestésicos y raspado y pulido.",
      category: "Odontología",
      isActive: true,
      items: [
        { description: "Panel de exámenes de sangre preanestésico", defaultQuantity: 1, defaultUnitPrice: "95.00" },
        { description: "Anestesia general (primeros 30 min)", defaultQuantity: 1, defaultUnitPrice: "180.00" },
        { description: "Raspado y pulido dental", defaultQuantity: 1, defaultUnitPrice: "220.00" },
        { description: "Soporte con líquidos IV", defaultQuantity: 1, defaultUnitPrice: "55.00" },
      ],
    },
    {
      practiceId,
      name: "Esterilización canina — Menos de 40 lb",
      description: "Ovariohisterectomía de rutina para caninos pequeños y medianos. Incluye anestesia, cirugía y analgésicos por 3 días.",
      category: "Cirugía",
      isActive: true,
      items: [
        { description: "Examen prequirúrgico y exámenes de sangre", defaultQuantity: 1, defaultUnitPrice: "135.00" },
        { description: "Cirugía de esterilización — menos de 40 lb", defaultQuantity: 1, defaultUnitPrice: "385.00" },
        { description: "Anestesia general (60 min)", defaultQuantity: 1, defaultUnitPrice: "220.00" },
        { description: "Analgésico para llevar a casa (3 días)", defaultQuantity: 1, defaultUnitPrice: "28.00" },
        { description: "Collar isabelino", defaultQuantity: 1, defaultUnitPrice: "18.00" },
      ],
    },
  ];

  for (const tpl of templatesData) {
    const { items, ...tplFields } = tpl;
    const [inserted] = await db.insert(treatmentTemplates).values(tplFields).returning();
    await db.insert(treatmentTemplateItems).values(
      items.map((item, idx) => ({
        templateId: inserted!.id,
        itemType: "service" as const,
        itemId: null,
        description: item.description,
        defaultQuantity: item.defaultQuantity,
        defaultUnitPrice: item.defaultUnitPrice,
        sortOrder: idx,
      }))
    );
  }
  console.log(`Treatment templates: ${templatesData.length} created`);

  // =========================================================================
  // Done!
  // =========================================================================
  console.log("\n¡Siembra de datos completada con éxito!");
  console.log(`
Summary:
  - 1 practice
  - 1 location
  - ${insertedUsers.length} users (3 vets, 2 techs, 2 front desk)
  - ${insertedClients.length} clients
  - ${insertedPatients.length} patients
  - ${insertedApptTypes.length} appointment types
  - ${insertedRooms.length} exam rooms
  - ${insertedAppointments.length} appointments
  - ${soapNotesCount} SOAP notes
  - ${vaccinationValues.length} vaccination records
  - ${prescriptionValues.length} prescriptions
  - ${labResultValues.length + 1} lab results
  - ${procedureValues.length} procedures
  - ${insertedInvoices.length} invoices with ${invoiceItemValues.length} line items
  - ${insertedPayments.length} payments
  - ${insertedComms.length} communications (SMS/email/portal/phone)
  - ${insertedAudit.length} audit log entries
  - ${insertedCs.length} controlled substance log entries
  - ${templatesData.length} treatment templates
  - ${insertedServices.length} services
  - ${insertedProducts.length} products
  `);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error al sembrar los datos:", err);
    process.exit(1);
  });
