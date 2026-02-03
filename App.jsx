import React, { useState, useEffect, useCallback, useMemo } from "react";

// ── Data ──
const VEHICLES = {
  supercar: [
    { id:1, name:"Ferrari F8 Tributo", code:"F8", color:"#E74C3C", price:5500, qty:2, img:"🏎️", specs:"720ch • V8 biturbo" },
    { id:2, name:"Ferrari 488 Challenge", code:"488C", color:"#C0392B", price:5200, qty:2, img:"🏎️", specs:"670ch • V8 biturbo" },
    { id:3, name:"Lamborghini Huracán", code:"HURA", color:"#F39C12", price:5000, qty:1, img:"🏎️", specs:"640ch • V10" },
  ],
  gt: [
    { id:4, name:"Porsche 992.2 GT3", code:"GT3", color:"#3498DB", price:4800, qty:6, img:"🚗", specs:"510ch • Flat-6" },
    { id:5, name:"Porsche 992.2 GT3 Manuel", code:"GT3M", color:"#2980B9", price:4800, qty:1, img:"🚗", specs:"510ch • Flat-6 • BVM" },
    { id:6, name:"Corvette C8", code:"C8", color:"#E67E22", price:3500, qty:2, img:"🚗", specs:"495ch • V8" },
    { id:7, name:"Porsche 991 Carrera 4S", code:"4S", color:"#9B59B6", price:3200, qty:1, img:"🚗", specs:"420ch • Flat-6" },
  ],
  sport: [
    { id:8, name:"Alpine A110", code:"A110", color:"#3498DB", price:2200, qty:5, img:"🚙", specs:"300ch • L4 turbo" },
    { id:9, name:"BMW M2", code:"M2", color:"#2ECC71", price:2000, qty:2, img:"🚙", specs:"460ch • L6 biturbo" },
    { id:10, name:"BMW M240i", code:"M240", color:"#27AE60", price:1600, qty:2, img:"🚙", specs:"374ch • L6 turbo" },
    { id:11, name:"Toyota Yaris GR", code:"GR", color:"#1ABC9C", price:1200, qty:4, img:"🚙", specs:"261ch • L3 turbo • 4WD" },
    { id:12, name:"Mitsubishi Lancer Evo", code:"EVO", color:"#16A085", price:1400, qty:2, img:"🚙", specs:"295ch • L4 turbo • 4WD" },
  ]
};

const MODULES = [
  { id:1, name_fr:"Module Exclusif", name_en:"Exclusive Module", sessions:12, clients:1, coef:1.50, desc_fr:"12 sessions", desc_en:"12 sessions", tier:"exclusive" },
  { id:2, name_fr:"Module Intensif", name_en:"Intensive Module", sessions:8, clients:2, coef:1.0, desc_fr:"8 sessions", desc_en:"8 sessions", tier:"intensive" },
  { id:3, name_fr:"Module Performance", name_en:"Performance Module", sessions:5, clients:3, coef:0.75, desc_fr:"5 sessions", desc_en:"5 sessions", tier:"performance" },
];

const OPTIONS = [
  { code:"biofuel", name_fr:"Carburant bio premium", name_en:"Premium biofuel", price:150, type:"per_day", icon:"🌿" },
  { code:"photo", name_fr:"Pack photos & vidéos HD", name_en:"HD photo & video pack", price:500, type:"fixed", icon:"📸" },
  { code:"transfer", name_fr:"Transfert aéroport Arvidsjaur", name_en:"Arvidsjaur airport transfer", price:300, type:"fixed", icon:"✈️" },
  { code:"helmet_cam", name_fr:"Caméra embarquée casque", name_en:"Helmet onboard camera", price:100, type:"per_day", icon:"🎥" },
];

const ACTIVITIES = [
  { id:1, code:"snowmobile", name_fr:"Motoneige safari", name_en:"Snowmobile safari", price:350, duration:"3h", icon:"🏔️" },
  { id:2, code:"ice_fishing", name_fr:"Pêche sur glace", name_en:"Ice fishing", price:150, duration:"2h", icon:"🎣" },
  { id:3, code:"dog_sled", name_fr:"Traîneau à chiens", name_en:"Dog sledding", price:280, duration:"2h", icon:"🐕" },
  { id:4, code:"aurora", name_fr:"Chasse aux aurores boréales", name_en:"Northern lights hunt", price:200, duration:"3h", icon:"🌌" },
  { id:5, code:"sauna", name_fr:"Sauna & bain glacé", name_en:"Sauna & ice bath", price:100, duration:"1.5h", icon:"🧖" },
];

const SERVICES_FORFAIT = { pilot: { base:645, perDay:210 }, companion: { base:435, perDay:210 } };
const calcForfait = (type, totalDays) => SERVICES_FORFAIT[type].base + SERVICES_FORFAIT[type].perDay * totalDays;

const ROOM_TYPES = [
  { id:"single", name_fr:"Chambre Supérieure LID — Single", name_en:"Superior Room LID — Single", price:355, occupancy:1, icon:"🛏️" },
  { id:"double", name_fr:"Chambre Supérieure LID — Double / Twin", name_en:"Superior Room LID — Double / Twin", price:425, occupancy:2, icon:"🛏️🛏️" },
];
const LUNCH_PRICE = 40; // €/pers/jour — Pub Lunch au lounge privé Silverhatten

const SEASONS = [
  { type:"low", coef:0.90, start:"2026-01-08", end:"2026-01-18", color:"#3498DB", label_fr:"Basse", label_en:"Low" },
  { type:"medium", coef:0.95, start:"2026-01-19", end:"2026-01-31", color:"#F39C12", label_fr:"Moyenne", label_en:"Medium" },
  { type:"peak", coef:1.05, start:"2026-02-01", end:"2026-02-28", color:"#E74C3C", label_fr:"Très haute", label_en:"Peak" },
  { type:"high", coef:1.00, start:"2026-03-01", end:"2026-03-15", color:"#2ECC71", label_fr:"Haute", label_en:"High" },
  { type:"low", coef:0.90, start:"2026-03-16", end:"2026-03-22", color:"#3498DB", label_fr:"Basse", label_en:"Low" },
];

const BOOKINGS_MOCK = [
  { id:1, ref:"LID-2026-0042", client:"Marcus Weber", email:"m.weber@porsche.de", company:"Porsche AG", country:"DE", vehicle_id:4, start:"2026-02-09", end:"2026-02-11", days:3, module_id:1, nbPilots:1, status:"confirmed", payment:"paid", source:"website", amount:15390, admin:false, companions:["Karl Müller"] },
  { id:2, ref:"LID-2026-0043", client:"Pierre Duval", email:"p.duval@ferrari.com", company:"Ferrari France", country:"FR", vehicle_id:1, start:"2026-02-09", end:"2026-02-11", days:3, module_id:1, nbPilots:1, status:"confirmed", payment:"paid", source:"phone", amount:17325, admin:false, companions:["Marie Duval","Jean Leclerc"] },
  { id:3, ref:"LID-2026-0044", client:"James Mitchell", email:"j.mitchell@corvette.com", company:"Corvette UK", country:"UK", vehicle_id:6, start:"2026-02-12", end:"2026-02-14", days:3, module_id:1, nbPilots:1, status:"awaiting_payment", payment:"awaiting_transfer", source:"website", amount:11550, admin:false, companions:[] },
  { id:4, ref:"LID-2026-0045", client:"[VIP] Événement Lamborghini", email:"", company:"Lamborghini", country:"IT", vehicle_id:3, start:"2026-02-14", end:"2026-02-16", days:3, module_id:1, nbPilots:1, status:"confirmed", payment:"not_applicable", source:"event", amount:0, admin:true, companions:[] },
  { id:5, ref:"LID-2026-0046", client:"Akira Tanaka", email:"a.tanaka@lexus.jp", company:"Lexus Japan", country:"JP", vehicle_id:8, start:"2026-02-09", end:"2026-02-11", days:3, module_id:2, nbPilots:2, status:"confirmed", payment:"paid", source:"website", amount:3464, admin:false, companions:["Hiro Yamamoto"] },
  { id:6, ref:"LID-2026-0047", client:"Sophie Martin", email:"s.martin@gmail.com", company:"", country:"FR", vehicle_id:9, start:"2026-02-11", end:"2026-02-13", days:3, module_id:2, nbPilots:2, status:"confirmed", payment:"paid", source:"website", amount:4275, admin:false, companions:["Luc Martin"] },
  { id:7, ref:"LID-2026-0048", client:"[STAFF] Test instructeurs", email:"", company:"LID", country:"SE", vehicle_id:11, start:"2026-02-09", end:"2026-02-09", days:1, module_id:1, nbPilots:1, status:"confirmed", payment:"not_applicable", source:"staff", amount:0, admin:true, companions:[] },
  { id:8, ref:"LID-2026-0049", client:"Hans Keller", email:"h.keller@bmw.de", company:"BMW Motorsport", country:"DE", vehicle_id:10, start:"2026-02-09", end:"2026-02-12", days:4, module_id:3, nbPilots:3, status:"confirmed", payment:"paid", source:"website", amount:5400, admin:false, companions:["Fritz Lang","Otto Braun"] },
  { id:9, ref:"LID-2026-0050", client:"Elena Rossi", email:"e.rossi@ferrari.it", company:"Ferrari VIP", country:"IT", vehicle_id:2, start:"2026-02-10", end:"2026-02-12", days:3, module_id:1, nbPilots:1, status:"confirmed", payment:"paid", source:"phone", amount:16800, admin:false, companions:["Marco Rossi"] },
  { id:10, ref:"LID-2026-0051", client:"Thomas Blanc", email:"t.blanc@alpine.fr", company:"Alpine Racing", country:"FR", vehicle_id:12, start:"2026-02-11", end:"2026-02-14", days:4, module_id:3, nbPilots:2, status:"confirmed", payment:"paid", source:"website", amount:3200, admin:false, companions:["Paul Blanc"] },
  { id:11, ref:"LID-2026-0052", client:"Yuki Sato", email:"y.sato@toyota.jp", company:"Toyota GR", country:"JP", vehicle_id:11, start:"2026-02-10", end:"2026-02-13", days:4, module_id:3, nbPilots:3, status:"confirmed", payment:"paid", source:"website", amount:4800, admin:false, companions:["Kenji Ito","Ryo Tanaka"] },
  { id:12, ref:"LID-2026-0053", client:"Erik Johansson", email:"e.johansson@gmail.com", company:"", country:"SE", vehicle_id:5, start:"2026-02-09", end:"2026-02-10", days:2, module_id:1, nbPilots:1, status:"confirmed", payment:"paid", source:"website", amount:9600, admin:false, companions:[] },
];

const T = {
  fr: {
    booking_title: "Réservez votre expérience", subtitle: "Arjeplog, Laponie suédoise",
    step0: "Langue", step1: "Votre séjour", step2: "Véhicule", step3: "Module",
    step4: "Activités", step5: "Hôtel & Repas", step6: "Options", step7: "Vos informations", step8: "Paiement", step9: "Confirmation",
    next: "Suivant", prev: "Retour", book: "Procéder au paiement",
    supercar: "Supercars", gt: "GT", sport: "Sport",
    places: "places", day: "jour", days: "jours", from: "à partir de",
    name: "Nom complet", email: "Email", phone: "Téléphone", company: "Société",
    country: "Pays", notes: "Notes", nights: "nuits",
    driving_days: "Jours de pilotage", activity_days: "Jours d'activités",
    total_stay: "Séjour total", pilots: "Pilotes", companions: "Accompagnants",
    payment_method: "Moyen de paiement", cb: "Carte bancaire", amex: "American Express",
    virement: "Virement bancaire", surcharge: "surcharge", discount: "remise",
    recap: "Récapitulatif", vehicle: "Véhicule", dates: "Dates", duration: "Durée",
    module: "Module", options: "Options", base_price: "Prix de base/jour",
    season: "Saison", subtotal: "Sous-total", total: "Total à payer",
    pilotage: "Pilotage", services: "Services & hébergement", activities: "Activités",
    cgv: "J'accepte les Conditions Générales de Vente",
    select_dates: "Configurez votre séjour", select_duration: "Jours de pilotage",
    participants: "Participants", per_day: "/jour", fixed: "forfait", per_person: "/pers.",
    confirmed_title: "Réservation confirmée ! ✓", confirmed_msg: "Votre référence :",
    low: "Basse saison", medium: "Moyenne saison", high: "Haute saison", peak: "Très haute saison",
    premium: "Premium", standard: "Standard", exclusive: "Exclusif", intensive: "Intensif", performance: "Performance", sessions: "sessions/jour",
    admin: { planning: "Planning", bookings: "Réservations", new_booking: "Nouvelle réservation",
      settings: "Paramètres", dashboard: "LID Réservations", search: "Rechercher...",
      status: "Statut", all: "Tous", confirmed: "Confirmé", awaiting: "En attente",
      cancelled: "Annulé", expired: "Expiré", export: "Export CSV", total_bookings: "Réservations",
      revenue: "CA confirmé", occupancy: "Taux remplissage", upcoming: "À venir",
      confirm_transfer: "Confirmer virement", cancel: "Annuler", details: "Détails",
      pricing: "Tarification", payment: "Paiement", options_tab: "Options",
      planning_tab: "Planning", content: "Contenus & Langues", emails: "Emails",
      system: "Système", save: "Enregistrer", week: "Semaine", instructors: "Instructeurs requis",
    }
  },
  en: {
    booking_title: "Book your experience", subtitle: "Arjeplog, Swedish Lapland",
    step0: "Language", step1: "Your stay", step2: "Vehicle", step3: "Module",
    step4: "Activities", step5: "Hotel & Meals", step6: "Options", step7: "Your information", step8: "Payment", step9: "Confirmation",
    next: "Next", prev: "Back", book: "Proceed to payment",
    supercar: "Supercars", gt: "GT", sport: "Sport",
    places: "slots", day: "day", days: "days", from: "from",
    name: "Full name", email: "Email", phone: "Phone", company: "Company",
    country: "Country", notes: "Notes", nights: "nights",
    driving_days: "Driving days", activity_days: "Activity days",
    total_stay: "Total stay", pilots: "Drivers", companions: "Companions",
    payment_method: "Payment method", cb: "Credit card", amex: "American Express",
    virement: "Bank transfer", surcharge: "surcharge", discount: "discount",
    recap: "Summary", vehicle: "Vehicle", dates: "Dates", duration: "Duration",
    module: "Module", options: "Options", base_price: "Base price/day",
    season: "Season", subtotal: "Subtotal", total: "Total due",
    pilotage: "Driving", services: "Services & accommodation", activities: "Activities",
    cgv: "I accept the Terms & Conditions",
    select_dates: "Configure your stay", select_duration: "Driving days",
    participants: "Participants", per_day: "/day", fixed: "flat rate", per_person: "/pers.",
    confirmed_title: "Booking confirmed! ✓", confirmed_msg: "Your reference:",
    low: "Low season", medium: "Medium season", high: "High season", peak: "Peak season",
    premium: "Premium", standard: "Standard", exclusive: "Exclusive", intensive: "Intensive", performance: "Performance", sessions: "sessions/day",
    admin: { planning: "Planning", bookings: "Bookings", new_booking: "New booking",
      settings: "Settings", dashboard: "LID Bookings", search: "Search...",
      status: "Status", all: "All", confirmed: "Confirmed", awaiting: "Pending",
      cancelled: "Cancelled", expired: "Expired", export: "Export CSV", total_bookings: "Bookings",
      revenue: "Confirmed rev.", occupancy: "Occupancy rate", upcoming: "Upcoming",
      confirm_transfer: "Confirm transfer", cancel: "Cancel", details: "Details",
      pricing: "Pricing", payment: "Payment", options_tab: "Options",
      planning_tab: "Planning", content: "Content & Languages", emails: "Emails",
      system: "System", save: "Save", week: "Week", instructors: "Instructors needed",
    }
  }
};

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', minimumFractionDigits:0 }).format(n);

// ── Calendar helpers ──
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDayOfMonth(y,m){ return (new Date(y,m,1).getDay()+6)%7; }
function dateStr(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function getSeason(ds){
  for(const s of SEASONS){ if(ds>=s.start && ds<=s.end) return s; }
  return null;
}

// ── Main App ──
export default function App() {
  const [view, setView] = useState("widget"); // widget | admin
  const [lang, setLang] = useState("fr");
  const t = T[lang];

  return (
    <div style={{ fontFamily:"'Satoshi', 'DM Sans', -apple-system, sans-serif", background:"#ffffff", color:"#e8e6e3", minHeight:"100vh" }}>
      {/* Nav toggle */}
      <div style={{ display:"flex", justifyContent:"center", gap:4, padding:"16px 0 0", position:"sticky", top:0, zIndex:100, background:"linear-gradient(to bottom, #0a0a0f 60%, transparent)" }}>
        <button onClick={()=>setView("widget")} style={{ padding:"10px 24px", borderRadius:8, border:"1px solid " + (view==="widget"?"#c9a96e":"#333"), background:view==="widget"?"#c9a96e":"transparent", color:view==="widget"?"#0a0a0f":"#888", fontWeight:600, fontSize:13, cursor:"pointer", letterSpacing:0.5, transition:"all .2s" }}>
          🖥️ Widget Client
        </button>
        <button onClick={()=>setView("admin")} style={{ padding:"10px 24px", borderRadius:8, border:"1px solid " + (view==="admin"?"#c9a96e":"#333"), background:view==="admin"?"#c9a96e":"transparent", color:view==="admin"?"#0a0a0f":"#888", fontWeight:600, fontSize:13, cursor:"pointer", letterSpacing:0.5, transition:"all .2s" }}>
          ⚙️ Dashboard Admin
        </button>
        <div style={{ marginLeft:12, display:"flex", gap:4 }}>
          <button onClick={()=>setLang("fr")} style={{ padding:"10px 14px", borderRadius:8, border:"1px solid "+(lang==="fr"?"#c9a96e44":"#222"), background:lang==="fr"?"#c9a96e22":"transparent", color:lang==="fr"?"#c9a96e":"#555", fontSize:13, cursor:"pointer", fontWeight:600 }}>FR</button>
          <button onClick={()=>setLang("en")} style={{ padding:"10px 14px", borderRadius:8, border:"1px solid "+(lang==="en"?"#c9a96e44":"#222"), background:lang==="en"?"#c9a96e22":"transparent", color:lang==="en"?"#c9a96e":"#555", fontSize:13, cursor:"pointer", fontWeight:600 }}>EN</button>
        </div>
      </div>

      {view === "widget" ? <BookingWidget lang={lang} t={t} /> : <AdminDashboard lang={lang} t={t} />}
    </div>
  );
}

// ═══════════════════════════════════════
// BOOKING WIDGET
// ═══════════════════════════════════════
function BookingWidget({ lang, t }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("2026-02-15");
  const [nbDaysDriving, setNbDaysDriving] = useState(3);
  const [selectedVehicles, setSelectedVehicles] = useState([]);  // array of vehicle objects, length = nbDaysDriving
  const [selectedModule, setSelectedModule] = useState(null);
  const [nbPilots, setNbPilots] = useState(1);
  const [nbCompanions, setNbCompanions] = useState(0);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [roomMode, setRoomMode] = useState(null); // "all_single" | "max_double" | null
  const [includeLunch, setIncludeLunch] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cb");
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [formData, setFormData] = useState({ name:"", email:"", phone:"", company:"", country:"", notes:"" });
  const [calMonth, setCalMonth] = useState(1); // Feb 2026

  const nbDaysActivities = selectedActivities.length * 0.5;
  const nbDaysTotal = nbDaysDriving + nbDaysActivities;
  const nbNights = Math.ceil(nbDaysTotal) + 1;

  // Helper: format date
  const fmtDate = (iso) => {
    if(!iso) return "—";
    const d = new Date(iso);
    const opts = { day:"numeric", month:"long", year:"numeric" };
    return d.toLocaleDateString(lang==="fr"?"fr-FR":"en-GB", opts);
  };

  // Dates: arrival = day before first driving day, departure = day after last activity/driving day
  const arrivalDate = useMemo(() => {
    if(!selectedDate) return null;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, [selectedDate]);

  const lastActivityDate = useMemo(() => {
    if(!selectedDate) return null;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + Math.ceil(nbDaysTotal) - 1);
    return d.toISOString().split('T')[0];
  }, [selectedDate, nbDaysTotal]);

  const departureDate = useMemo(() => {
    if(!lastActivityDate) return null;
    const d = new Date(lastActivityDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [lastActivityDate]);

  const drivingEndDate = useMemo(() => {
    if(!selectedDate) return null;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + nbDaysDriving - 1);
    return d.toISOString().split('T')[0];
  }, [selectedDate, nbDaysDriving]);

  const season = getSeason(selectedDate);
  const seasonCoef = season?.coef || 1;

  // Trim vehicles when driving days change
  React.useEffect(() => {
    if(selectedVehicles.length > nbDaysDriving) {
      setSelectedVehicles(prev => prev.slice(0, nbDaysDriving));
    }
  }, [nbDaysDriving]);

  // Reset roomMode if person count drops to 1 (only single available)
  React.useEffect(() => {
    const total = nbPilots + nbCompanions;
    if(total === 1) setRoomMode(null);
  }, [nbPilots, nbCompanions]);

  const pricing = useMemo(() => {
    if(selectedVehicles.length === 0 || !selectedModule) return null;
    // Bloc 1: Pilotage — sum vehicle prices, × nb_pilots (each pilot pays full price)
    const vehiclesSum = selectedVehicles.reduce((sum, v) => sum + v.price * selectedModule.coef, 0);
    const pilotageTotal = vehiclesSum * nbPilots * seasonCoef;
    // Bloc 2: Forfait services (invisible to client, folded into price)
    const forfaitPilot = calcForfait('pilot', nbDaysTotal);
    const forfaitCompanion = calcForfait('companion', nbDaysTotal);
    const servicesTotal = (forfaitPilot * nbPilots) + (forfaitCompanion * nbCompanions);
    // Bloc 3: Activités
    let activitiesTotal = 0;
    selectedActivities.forEach(code => {
      const a = ACTIVITIES.find(x=>x.code===code);
      if(a) activitiesTotal += a.price * (nbPilots + nbCompanions);
    });
    // Bloc 4: Hôtel & Repas
    const totalPersons = nbPilots + nbCompanions;
    const singlePrice = ROOM_TYPES.find(r=>r.id==="single").price;
    const doublePrice = ROOM_TYPES.find(r=>r.id==="double").price;
    // Auto-compute room breakdown based on roomMode
    let nbSingles = 0, nbDoubles = 0;
    if(totalPersons === 1 || roomMode === "all_single") {
      nbSingles = totalPersons;
    } else if(roomMode === "max_double") {
      nbDoubles = Math.floor(totalPersons / 2);
      nbSingles = totalPersons % 2; // 1 single if odd, 0 if even
    }
    const hotelTotal = (singlePrice * nbSingles + doublePrice * nbDoubles) * nbNights;
    // Lunch = pilotage days + activity days (not arrival/departure days)
    const nbLunchDays = nbDaysDriving + Math.ceil(nbDaysActivities);
    const lunchTotal = includeLunch ? LUNCH_PRICE * totalPersons * nbLunchDays : 0;
    const accommodationTotal = hotelTotal + lunchTotal;
    // Bloc 5: Options
    let optTotal = 0;
    selectedOptions.forEach(code => {
      const o = OPTIONS.find(x=>x.code===code);
      if(o) optTotal += o.type==="per_day" ? o.price * nbDaysDriving : o.price;
    });
    const sub = pilotageTotal + servicesTotal + activitiesTotal + accommodationTotal + optTotal;
    let adj = 1;
    if(paymentMethod==="amex") adj = 1.02;
    if(paymentMethod==="virement") adj = 0.98;
    const rawTotal = sub * adj;
    // Round to nearest multiple of 25 when payment adjustment applies
    const total = adj !== 1 ? Math.round(rawTotal / 25) * 25 : rawTotal;
    return { vehiclesSum, pilotageTotal, servicesTotal, forfaitPilot, forfaitCompanion, activitiesTotal, hotelTotal, lunchTotal, accommodationTotal, nbSingles, nbDoubles, nbLunchDays, optTotal, sub, adj, total };
  }, [selectedVehicles, selectedModule, nbDaysDriving, nbDaysTotal, nbDaysActivities, nbNights, seasonCoef, nbPilots, nbCompanions, selectedActivities, roomMode, includeLunch, selectedOptions, paymentMethod]);

  const canNext = () => {
    if(step===1) return !!selectedDate;
    if(step===2) return selectedVehicles.length === nbDaysDriving;
    if(step===3) return !!selectedModule;
    if(step===4) return true; // activities optional
    if(step===5) return (nbPilots + nbCompanions) === 1 || !!roomMode; // 1 person = auto single, 2+ need choice
    if(step===6) return true; // options optional
    if(step===7) return formData.name && formData.email;
    if(step===8) return cgvAccepted;
    return true;
  };

  const stepNames = [t.step1, t.step2, t.step3, t.step4, t.step5, t.step6, t.step7, t.step8, t.step9];
  const goldGrad = "linear-gradient(135deg, #c9a96e, #e8d5a3, #c9a96e)";

  return (
    <div style={{ maxWidth:880, margin:"0 auto", padding:"24px 16px 60px" }}>
      {/* Header */}
      <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
        <div style={{ fontSize:11, letterSpacing:6, color:"#c9a96e", fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Lapland Ice Driving</div>
        <h1 style={{ fontSize:28, fontWeight:700, margin:0, background:goldGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{t.booking_title}</h1>
        <p style={{ color:"#888", fontSize:14, marginTop:6 }}>{t.subtitle}</p>
      </div>

      {/* Steps bar */}
      <div style={{ display:"flex", gap:2, marginBottom:32, padding:"0 8px" }}>
        {stepNames.map((name, i) => (
          <div key={i} onClick={()=>i+1<step && setStep(i+1)} style={{ flex:1, cursor:i+1<step?"pointer":"default" }}>
            <div style={{ height:3, borderRadius:2, background: i+1<=step ? "#c9a96e" : "#222", transition:"all .4s", marginBottom:6 }} />
            <div style={{ fontSize:10, color: i+1===step ? "#c9a96e" : i+1<step ? "#888" : "#444", fontWeight: i+1===step?700:400, textAlign:"center", letterSpacing:0.3 }}>
              {i+1}. {name}
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ background:"#ffffff", borderRadius:16, border:"1px solid #e5e5e5", padding:28, minHeight:400 }}>

        {/* ── Persistent stay recap (steps 2+) ── */}
        {step >= 2 && selectedDate && (
          <div style={{ marginBottom:24, padding:14, background:"#0a0a10", borderRadius:10, border:"1px solid #e5e5e5", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:1 }}>✈️ {lang==="fr"?"Arrivée":"Arrival"}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{fmtDate(arrivalDate)}</div>
              </div>
              <div>
                <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:1 }}>🏎️ {lang==="fr"?"Pilotage":"Driving"}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#c9a96e" }}>{fmtDate(selectedDate)} → {fmtDate(drivingEndDate)}</div>
              </div>
              {selectedActivities.length > 0 && (
                <div>
                  <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:1 }}>🏔️ {lang==="fr"?"Activités":"Activities"}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#3498DB" }}>{selectedActivities.length} × ½j</div>
                </div>
              )}
              <div>
                <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:1 }}>✈️ {lang==="fr"?"Départ":"Departure"}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{fmtDate(departureDate)}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"#888" }}>{nbNights} {t.nights}</div>
              {pricing && <div style={{ fontSize:16, fontWeight:700, color:"#c9a96e" }}>{fmt(pricing.total)} <span style={{ fontSize:10, fontWeight:400, color:"#888" }}>{lang==="fr"?"HT":"excl. VAT"}</span></div>}
            </div>
          </div>
        )}

        {/* ── STEP 1: Driving days + dates ── */}
        {step===1 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:4, color:"#1a1a1a" }}>{t.select_dates}</h2>
            <p style={{ color:"#666", fontSize:13, marginBottom:20 }}>{lang==="fr"?"Saison 2026 : 8 janvier — 22 mars":"2026 Season: January 8 — March 22"}</p>

            {/* Driving days */}
            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, color:"#888", fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:10 }}>🏎️ {t.driving_days}</label>
              <div style={{ display:"flex", gap:6 }}>
                {[1,2,3,4,5].map(d => (
                  <button key={d} onClick={()=>setNbDaysDriving(d)} style={{
                    flex:1, padding:"14px 8px", borderRadius:10, cursor:"pointer",
                    border: nbDaysDriving===d ? "2px solid #c9a96e" : "1px solid #252530",
                    background: nbDaysDriving===d ? "#c9a96e15" : "#0d0d14",
                    color: nbDaysDriving===d ? "#c9a96e" : "#888", fontWeight:600, fontSize:14,
                    transition:"all .2s"
                  }}>
                    {d} {d>1?t.days:t.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <Calendar
              month={calMonth} year={2026}
              selectedDate={selectedDate} nbDays={nbDaysDriving}
              onSelect={setSelectedDate}
              onMonthChange={setCalMonth}
              lang={lang}
            />

            {selectedDate && (
              <div style={{ marginTop:20, padding:16, background:"#fafafa", borderRadius:12, border:"1px solid #e5e5e5" }}>
                <div>
                  <div style={{ fontSize:12, color:"#888" }}>{lang==="fr"?"Pilotage sélectionné":"Selected driving"}</div>
                  <div style={{ fontSize:16, fontWeight:600, color:"#1a1a1a", marginTop:4 }}>
                    {selectedDate} → {drivingEndDate}
                  </div>
                  <div style={{ fontSize:12, color:"#c9a96e", marginTop:2 }}>
                    {nbDaysDriving} {nbDaysDriving>1?t.days:t.day} • {season ? t[season.type] : "—"} ({seasonCoef > 1 ? "+" : ""}{Math.round((seasonCoef-1)*100)}%)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Vehicles (pick N = nbDaysDriving) ── */}
        {step===2 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:4, color:"#1a1a1a" }}>{t.step2}</h2>
            <p style={{ color:"#666", fontSize:13, marginBottom:4 }}>
              {lang==="fr"
                ? `Choisissez ${nbDaysDriving} véhicule(s) pour vos ${nbDaysDriving} jour(s) de pilotage — vous pouvez choisir le même véhicule plusieurs fois`
                : `Choose ${nbDaysDriving} vehicle(s) for your ${nbDaysDriving} driving day(s) — you can pick the same vehicle more than once`}
            </p>
            <div style={{ fontSize:13, fontWeight:600, color: selectedVehicles.length === nbDaysDriving ? "#2ECC71" : "#c9a96e", marginBottom:20 }}>
              {selectedVehicles.length}/{nbDaysDriving} {lang==="fr"?"sélectionné(s)":"selected"}
            </div>

            {["supercar","gt","sport"].map(cat => (
              <div key={cat} style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, letterSpacing:3, color:"#c9a96e", fontWeight:700, textTransform:"uppercase", marginBottom:12, paddingBottom:6, borderBottom:"1px solid #e5e5e5" }}>{t[cat]}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:10 }}>
                  {VEHICLES[cat].map(v => {
                    const count = selectedVehicles.filter(sv => sv.id === v.id).length;
                    const canAdd = selectedVehicles.length < nbDaysDriving;
                    return (
                      <div key={v.id} style={{
                        padding:16, borderRadius:12, transition:"all .2s",
                        border: count > 0 ? "2px solid #c9a96e" : "1px solid #252530",
                        background: count > 0 ? "#c9a96e0a" : "#0d0d14",
                        position:"relative"
                      }}>
                        {count > 0 && <div style={{ position:"absolute", top:8, right:8, minWidth:22, height:22, borderRadius:6, background:"#c9a96e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#0a0a0f", padding:"0 6px" }}>×{count}</div>}
                        <div>
                          <div style={{ fontSize:15, fontWeight:600, color: count > 0 ? "#fff" : "#ccc" }}>{v.name}</div>
                          <div style={{ fontSize:11, color:"#666", marginTop:3 }}>{v.specs}</div>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                          <div style={{ fontSize:16, fontWeight:700, color:"#c9a96e" }}>{fmt(v.price)}<span style={{ fontSize:10, fontWeight:400, color:"#888" }}> {lang==="fr"?"HT":"excl. VAT"}/{t.day}</span></div>
                          <div style={{ display:"flex", gap:6 }}>
                            {count > 0 && <button onClick={()=>{ const idx = selectedVehicles.findIndex(sv=>sv.id===v.id); if(idx>=0) setSelectedVehicles(prev=>[...prev.slice(0,idx),...prev.slice(idx+1)]); }} style={{ width:30, height:30, borderRadius:6, border:"1px solid #c9a96e44", background:"#fafafa", color:"#c9a96e", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>}
                            {canAdd && <button onClick={()=>setSelectedVehicles(prev=>[...prev, v])} style={{ width:30, height:30, borderRadius:6, border:"1px solid #c9a96e44", background: canAdd ? "#c9a96e15" : "#0d0d14", color:"#c9a96e", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Selected vehicles summary */}
            {selectedVehicles.length > 0 && (
              <div style={{ padding:16, background:"#fafafa", borderRadius:12, border:"1px solid #e5e5e5" }}>
                <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>{lang==="fr"?"Vos véhicules":"Your vehicles"}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {selectedVehicles.map((v,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, background:"#c9a96e15", border:"1px solid #c9a96e33" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:v.color }} />
                      <span style={{ fontSize:12, color:"#1a1a1a", fontWeight:500 }}>{v.name}</span>
                      <span style={{ fontSize:11, color:"#c9a96e" }}>{fmt(v.price)} {lang==="fr"?"HT":"excl. VAT"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Module + Participants ── */}
        {step===3 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:20, color:"#1a1a1a" }}>{t.step3}</h2>

            {/* Modules */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:28 }}>
              {MODULES.map(m => {
                const sel = selectedModule?.id === m.id;
                const tierColors = { exclusive:"#FFD700", intensive:"#c9a96e", performance:"#888" };
                return (
                  <div key={m.id} onClick={()=>{setSelectedModule(m);setNbPilots(1);}} style={{
                    padding:20, borderRadius:12, cursor:"pointer", transition:"all .2s",
                    border: sel ? `2px solid ${tierColors[m.tier]}` : "1px solid #252530",
                    background: sel ? tierColors[m.tier]+"0a" : "#0d0d14"
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color: tierColors[m.tier], textTransform:"uppercase", marginBottom:6 }}>
                      {t[m.tier]}
                    </div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#1a1a1a" }}>{lang==="fr"?m.name_fr:m.name_en}</div>
                    <div style={{ fontSize:11, color:"#666", marginTop:4 }}>{lang==="fr"?m.desc_fr:m.desc_en}</div>
                    <div style={{ fontSize:13, color:tierColors[m.tier], marginTop:8, fontWeight:600 }}>{m.sessions} {t.sessions}</div>
                    <div style={{ fontSize:9, marginTop:6, padding:"3px 8px", borderRadius:4, background:"#c9a96e15", color:"#c9a96e", display:"inline-block" }}>🎯 Coaching 1:1</div>
                  </div>
                );
              })}
            </div>

            {/* Pilots */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
              <div>
                <label style={{ fontSize:12, color:"#c9a96e", fontWeight:600, display:"block", marginBottom:8 }}>🏎️ {t.pilots}</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <button onClick={()=>setNbPilots(Math.max(1,nbPilots-1))} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"#fafafa", color:"#1a1a1a", fontSize:18, cursor:"pointer" }}>−</button>
                  <span style={{ fontSize:20, fontWeight:700, width:40, textAlign:"center", color:"#c9a96e" }}>{nbPilots}</span>
                  <button onClick={()=>setNbPilots(Math.min(6, nbPilots+1))} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"#fafafa", color:"#1a1a1a", fontSize:18, cursor:"pointer" }}>+</button>
                  <span style={{ fontSize:11, color:"#555" }}>{lang==="fr"?"selon dispo véhicule":"based on availability"}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, color:"#3498DB", fontWeight:600, display:"block", marginBottom:8 }}>👤 {t.companions}</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <button onClick={()=>setNbCompanions(Math.max(0,nbCompanions-1))} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"#fafafa", color:"#1a1a1a", fontSize:18, cursor:"pointer" }}>−</button>
                  <span style={{ fontSize:20, fontWeight:700, width:40, textAlign:"center", color:"#3498DB" }}>{nbCompanions}</span>
                  <button onClick={()=>setNbCompanions(nbCompanions+1)} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"#fafafa", color:"#1a1a1a", fontSize:18, cursor:"pointer" }}>+</button>
                  <span style={{ fontSize:11, color:"#555" }}>{lang==="fr"?"sans limite":"no limit"}</span>
                </div>
              </div>
            </div>

            {/* Live price — services hidden, merged into total */}
            {pricing && (
              <div style={{ marginTop:20, padding:16, background:"#c9a96e0a", borderRadius:12, border:"1px solid #c9a96e22", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#888" }}>{lang==="fr"?"Prix estimé pilotage":"Estimated driving price"} ({nbDaysDriving}j × {nbPilots} {lang==="fr"?`pilote${nbPilots>1?"s":""}`:`driver${nbPilots>1?"s":""}`})</span>
                <span style={{ fontSize:22, fontWeight:700, color:"#c9a96e" }}>{fmt(pricing.pilotageTotal + pricing.servicesTotal)} <span style={{ fontSize:11, fontWeight:400, color:"#888" }}>{lang==="fr"?"HT":"excl. VAT"}</span></span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Activities ── */}
        {step===4 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:4, color:"#1a1a1a" }}>{t.step4}</h2>
            <p style={{ color:"#666", fontSize:13, marginBottom:20 }}>
              {lang==="fr" ? "Envie de prolonger votre séjour ? Ajoutez des activités — chaque activité ajoute une demi-journée à votre séjour." : "Want to extend your stay? Add activities — each one adds half a day to your trip."}
            </p>

            <div style={{ display:"grid", gap:10 }}>
              {ACTIVITIES.map(a => {
                const sel = selectedActivities.includes(a.code);
                const totalPersons = nbPilots + nbCompanions;
                const totalPrice = a.price * totalPersons;
                return (
                  <div key={a.code} onClick={()=>setSelectedActivities(prev => sel ? prev.filter(x=>x!==a.code) : [...prev, a.code])} style={{
                    padding:"16px 18px", borderRadius:12, cursor:"pointer", transition:"all .2s",
                    border: sel ? "1px solid #3498DB55" : "1px solid #252530",
                    background: sel ? "#3498DB08" : "#0d0d14",
                    display:"flex", justifyContent:"space-between", alignItems:"center"
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:22, height:22, borderRadius:4, border:"2px solid "+(sel?"#3498DB":"#444"), display:"flex", alignItems:"center", justifyContent:"center", background:sel?"#3498DB":"transparent", fontSize:12, color:"#1a1a1a", transition:"all .2s" }}>
                        {sel && "✓"}
                      </div>
                      <span style={{ fontSize:24 }}>{a.icon}</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:500, color: sel ? "#fff" : "#aaa" }}>{lang==="fr"?a.name_fr:a.name_en}</div>
                        <div style={{ fontSize:11, color:"#555" }}>{a.duration} • {fmt(a.price)}{t.per_person} • +½ {t.day}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#3498DB" }}>{fmt(totalPrice)}</div>
                      <div style={{ fontSize:10, color:"#555" }}>{totalPersons} pers.</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic stay summary */}
            <div style={{ marginTop:20, padding:16, background:"#fafafa", borderRadius:12, border:"1px solid #e5e5e5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:"#1a1a1a", fontWeight:600 }}>
                  {lang==="fr"?"Séjour total":"Total stay"}: {nbDaysTotal} {t.days} • {nbNights} {t.nights}
                </div>
                <div style={{ fontSize:11, color:"#888", marginTop:2 }}>
                  🏎️ {nbDaysDriving}j {lang==="fr"?"pilotage":"driving"}
                  {selectedActivities.length > 0 && <span> + 🏔️ {nbDaysActivities}j {lang==="fr"?"activités":"activities"}</span>}
                </div>
              </div>
              {pricing && selectedActivities.length > 0 && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"#888" }}>{t.activities}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#3498DB" }}>{fmt(pricing.activitiesTotal)}</div>
                </div>
              )}
            </div>

            {selectedActivities.length === 0 && (
              <div style={{ marginTop:12, textAlign:"center", fontSize:12, color:"#555" }}>
                {lang==="fr"?"Optionnel — passez à l'étape suivante si vous ne souhaitez pas d'activités":"Optional — skip to next step if you don't want activities"}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: Hôtel & Repas ── */}
        {step===5 && (() => {
          const totalPersons = nbPilots + nbCompanions;
          const onlyOne = totalPersons === 1;
          const singleP = ROOM_TYPES.find(r=>r.id==="single");
          const doubleP = ROOM_TYPES.find(r=>r.id==="double");
          // Compute breakdowns for each option
          const optAllSingle = { singles: totalPersons, doubles: 0, total: singleP.price * totalPersons * nbNights };
          const nbD = Math.floor(totalPersons / 2), nbS = totalPersons % 2;
          const optMaxDouble = { singles: nbS, doubles: nbD, total: (doubleP.price * nbD + singleP.price * nbS) * nbNights };

          // Build room description
          const descRooms = (s, d) => {
            const parts = [];
            if(d > 0) parts.push(`${d} ${lang==="fr"?"chambre":"room"}${d>1?"s":""} double/twin`);
            if(s > 0) parts.push(`${s} ${lang==="fr"?"chambre":"room"}${s>1?"s":""} single`);
            return parts.join(lang==="fr"?" + ":" + ");
          };

          const options = onlyOne ? [] : [
            { key:"max_double", label: lang==="fr"?"Chambres partagées (double/twin)":"Shared rooms (double/twin)", desc: descRooms(optMaxDouble.singles, optMaxDouble.doubles), price: optMaxDouble.total },
            { key:"all_single", label: lang==="fr"?"Chambres individuelles (single)":"Individual rooms (single)", desc: descRooms(optAllSingle.singles, 0), price: optAllSingle.total },
          ];

          return (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:4, color:"#1a1a1a" }}>{t.step5}</h2>
            <p style={{ color:"#666", fontSize:13, marginBottom:24 }}>
              {lang==="fr"
                ? `Votre séjour comprend ${nbNights} nuit(s) à l'hôtel Silverhatten, Arjeplog. Petit-déjeuner inclus.`
                : `Your stay includes ${nbNights} night(s) at Hotel Silverhatten, Arjeplog. Breakfast included.`}
            </p>

            {/* Room configuration */}
            <div style={{ fontSize:11, letterSpacing:3, color:"#c9a96e", fontWeight:700, textTransform:"uppercase", marginBottom:12, paddingBottom:6, borderBottom:"1px solid #e5e5e5" }}>
              {lang==="fr"?"Hébergement":"Accommodation"}
            </div>

            {onlyOne ? (
              /* 1 person — auto single, just display */
              <div style={{ padding:16, borderRadius:12, border:"2px solid #c9a96e", background:"#c9a96e0a", marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#1a1a1a" }}>{lang==="fr"?singleP.name_fr:singleP.name_en}</div>
                    <div style={{ fontSize:12, color:"#666", marginTop:3 }}>{singleP.icon} {lang==="fr"?"Petit-déjeuner inclus":"Breakfast included"} • 1 pers.</div>
                    <div style={{ fontSize:11, color:"#c9a96e", marginTop:6 }}>{fmt(singleP.price)} {lang==="fr"?"HT":"excl. VAT"}/{lang==="fr"?"nuit":"night"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, color:"#888" }}>1 {lang==="fr"?"chambre":"room"} × {nbNights} {t.nights}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:"#c9a96e", marginTop:4 }}>{fmt(singleP.price * nbNights)} <span style={{ fontSize:10, fontWeight:400 }}>{lang==="fr"?"HT":"excl. VAT"}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              /* 2+ persons — radio choice */
              <div style={{ display:"grid", gap:10, marginBottom:24 }}>
                {options.map(opt => {
                  const sel = roomMode === opt.key;
                  return (
                    <div key={opt.key} onClick={()=>setRoomMode(sel ? null : opt.key)} style={{
                      padding:16, borderRadius:12, cursor:"pointer", transition:"all .2s",
                      border: sel ? "2px solid #c9a96e" : "1px solid #252530",
                      background: sel ? "#c9a96e0a" : "#0d0d14"
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                          <div style={{ width:22, height:22, borderRadius:"50%", border:"2px solid "+(sel?"#c9a96e":"#444"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                            {sel && <div style={{ width:12, height:12, borderRadius:"50%", background:"#c9a96e" }} />}
                          </div>
                          <div>
                            <div style={{ fontSize:15, fontWeight:600, color: sel ? "#fff" : "#ccc" }}>{opt.label}</div>
                            <div style={{ fontSize:12, color:"#666", marginTop:3 }}>→ {opt.desc}</div>
                            <div style={{ fontSize:11, color:"#555", marginTop:4 }}>
                              {lang==="fr"?"Petit-déjeuner inclus":"Breakfast included"} • {nbNights} {t.nights}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:18, fontWeight:700, color: sel ? "#c9a96e" : "#555" }}>{fmt(opt.price)} <span style={{ fontSize:10, fontWeight:400 }}>{lang==="fr"?"HT":"excl. VAT"}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pub Lunch */}
            <div style={{ fontSize:11, letterSpacing:3, color:"#c9a96e", fontWeight:700, textTransform:"uppercase", marginBottom:12, paddingBottom:6, borderBottom:"1px solid #e5e5e5" }}>
              {lang==="fr"?"Restauration":"Dining"}
            </div>
            <div onClick={()=>setIncludeLunch(!includeLunch)} style={{
              padding:"14px 16px", borderRadius:10, cursor:"pointer", transition:"all .2s",
              border: includeLunch ? "1px solid #c9a96e55" : "1px solid #252530",
              background: includeLunch ? "#c9a96e08" : "#0d0d14",
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:20, height:20, borderRadius:4, border:"2px solid "+(includeLunch?"#c9a96e":"#444"), display:"flex", alignItems:"center", justifyContent:"center", background:includeLunch?"#c9a96e":"transparent", fontSize:12, color:"#0a0a0f", transition:"all .2s" }}>
                  {includeLunch && "✓"}
                </div>
                <span style={{ fontSize:18, marginRight:4 }}>🍽️</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color: includeLunch ? "#fff" : "#aaa" }}>Pub Lunch — Lounge privé Silverhatten</div>
                  <div style={{ fontSize:11, color:"#555" }}>
                    {fmt(LUNCH_PRICE)}/{lang==="fr"?"pers.":"pers."}/{lang==="fr"?"jour":"day"} • {nbDaysDriving + Math.ceil(nbDaysActivities)} {lang==="fr"?"jour(s) de pilotage & activités":"driving & activity day(s)"}
                  </div>
                </div>
              </div>
              {includeLunch && pricing && (
                <div style={{ fontSize:14, fontWeight:700, color:"#c9a96e" }}>{fmt(pricing.lunchTotal)} {lang==="fr"?"HT":"excl. VAT"}</div>
              )}
            </div>

            {/* Hotel subtotal */}
            {pricing && (
              <div style={{ marginTop:24, padding:16, background:"#c9a96e0a", borderRadius:12, border:"1px solid #c9a96e22", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#888" }}>{lang==="fr"?"Hébergement & repas":"Accommodation & meals"} ({nbNights} {t.nights})</span>
                <span style={{ fontSize:22, fontWeight:700, color:"#c9a96e" }}>{fmt(pricing.accommodationTotal)} <span style={{ fontSize:11, fontWeight:400, color:"#888" }}>{lang==="fr"?"HT":"excl. VAT"}</span></span>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── STEP 6: Options ── */}
        {step===6 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:20, color:"#1a1a1a" }}>{t.step6}</h2>
            <div style={{ display:"grid", gap:8 }}>
              {OPTIONS.map(o => {
                const sel = selectedOptions.includes(o.code);
                const price = o.type==="per_day" ? o.price * nbDaysDriving : o.price;
                return (
                  <div key={o.code} onClick={()=>setSelectedOptions(prev => sel ? prev.filter(x=>x!==o.code) : [...prev, o.code])} style={{
                    padding:"14px 16px", borderRadius:10, cursor:"pointer", transition:"all .2s",
                    border: sel ? "1px solid #c9a96e55" : "1px solid #252530",
                    background: sel ? "#c9a96e08" : "#0d0d14",
                    display:"flex", justifyContent:"space-between", alignItems:"center"
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:20, height:20, borderRadius:4, border:"2px solid "+(sel?"#c9a96e":"#444"), display:"flex", alignItems:"center", justifyContent:"center", background:sel?"#c9a96e":"transparent", fontSize:12, color:"#0a0a0f", transition:"all .2s" }}>
                        {sel && "✓"}
                      </div>
                      <span style={{ fontSize:18, marginRight:4 }}>{o.icon}</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:500, color: sel ? "#fff" : "#aaa" }}>{lang==="fr"?o.name_fr:o.name_en}</div>
                        <div style={{ fontSize:11, color:"#555" }}>{o.type==="per_day" ? `${fmt(o.price)}${t.per_day}` : t.fixed}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#c9a96e" }}>{fmt(price)}</div>
                  </div>
                );
              })}
            </div>

            {pricing && (
              <div style={{ marginTop:24, padding:16, background:"#c9a96e0a", borderRadius:12, border:"1px solid #c9a96e22", textAlign:"right" }}>
                <span style={{ fontSize:12, color:"#888" }}>{lang==="fr"?"Prix estimé":"Estimated price"}: </span>
                <span style={{ fontSize:22, fontWeight:700, color:"#c9a96e" }}>{fmt(pricing.total)} <span style={{ fontSize:11, fontWeight:400, color:"#888" }}>{lang==="fr"?"HT":"excl. VAT"}</span></span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 7: Form ── */}
        {step===7 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:20, color:"#1a1a1a" }}>{t.step7}</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {[["name",t.name,true],["email",t.email,true],["phone",t.phone,false],["company",t.company,false],["country",t.country,false]].map(([k,label,req])=>(
                <div key={k} style={{ gridColumn: k==="name"?"1 / -1":"auto" }}>
                  <label style={{ fontSize:11, color:"#888", fontWeight:600, display:"block", marginBottom:6 }}>{label} {req && <span style={{ color:"#c9a96e" }}>*</span>}</label>
                  <input value={formData[k]} onChange={e=>setFormData({...formData,[k]:e.target.value})}
                    style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1px solid #e5e5e5", background:"#fafafa", color:"#1a1a1a", fontSize:14, outline:"none", boxSizing:"border-box" }} />
                </div>
              ))}
              <div style={{ gridColumn:"1 / -1" }}>
                <label style={{ fontSize:11, color:"#888", fontWeight:600, display:"block", marginBottom:6 }}>{t.notes}</label>
                <textarea value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} rows={3}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1px solid #e5e5e5", background:"#fafafa", color:"#1a1a1a", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 8: Payment ── */}
        {step===8 && pricing && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:20, color:"#1a1a1a" }}>{t.recap}</h2>
            {/* Recap */}
            <div style={{ background:"#fafafa", borderRadius:12, padding:20, marginBottom:24, border:"1px solid #e5e5e5" }}>
              {[
                [lang==="fr"?"Arrivée":"Arrival", fmtDate(arrivalDate)],
                [lang==="fr"?"Départ":"Departure", fmtDate(departureDate)],
                ["🏎️ " + t.pilotage, `${fmtDate(selectedDate)} → ${fmtDate(drivingEndDate)} (${nbDaysDriving}j) × ${nbPilots} ${lang==="fr"?`pilote${nbPilots>1?"s":""}`:`driver${nbPilots>1?"s":""}`}`],
                [t.vehicle, selectedVehicles.map(v=>v.name).join(", ")],
                [t.module, lang==="fr"?selectedModule?.name_fr:selectedModule?.name_en],
                [t.season, season ? `${t[season.type]} (${seasonCoef>1?"+":""}${Math.round((seasonCoef-1)*100)}%)` : "—"],
              ].map(([k,v],i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i < 5 ? "1px solid #1a1a24" : "none" }}>
                  <span style={{ color:"#888", fontSize:13 }}>{k}</span>
                  <span style={{ color:"#444", fontSize:13, fontWeight:500 }}>{v}</span>
                </div>
              ))}

              {/* Pilotage price line */}
              <div style={{ borderTop:"1px solid #e5e5e5", paddingTop:8, marginTop:4, display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#c9a96e", fontSize:13 }}>🏎️ {t.pilotage}</span>
                <span style={{ color:"#c9a96e", fontSize:14, fontWeight:600 }}>{fmt(pricing.pilotageTotal + pricing.servicesTotal)} {lang==="fr"?"HT":"excl. VAT"}</span>
              </div>

              {selectedActivities.length > 0 && (
                <div style={{ borderTop:"1px solid #e5e5e5", paddingTop:8, marginTop:4 }}>
                  <div style={{ color:"#3498DB", fontSize:12, marginBottom:6 }}>🏔️ {t.activities} (+{nbDaysActivities}j):</div>
                  {selectedActivities.map(code => {
                    const a = ACTIVITIES.find(x=>x.code===code);
                    const p = a.price * (nbPilots + nbCompanions);
                    return <div key={code} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#666", padding:"3px 0" }}>
                      <span>{a.icon} {lang==="fr"?a.name_fr:a.name_en}</span><span style={{ color:"#3498DB" }}>{fmt(p)} {lang==="fr"?"HT":"excl. VAT"}</span>
                    </div>;
                  })}
                </div>
              )}

              {/* Hotel & Meals recap */}
              <div style={{ borderTop:"1px solid #e5e5e5", paddingTop:8, marginTop:4 }}>
                <div style={{ color:"#9B59B6", fontSize:12, marginBottom:6 }}>🏨 {lang==="fr"?"Hébergement & repas":"Accommodation & meals"} ({nbNights} {t.nights}):</div>
                {pricing && (() => {
                  const singleP = ROOM_TYPES.find(r=>r.id==="single");
                  const doubleP = ROOM_TYPES.find(r=>r.id==="double");
                  const lines = [];
                  if(pricing.nbDoubles > 0) lines.push({ icon: doubleP.icon, label: `${lang==="fr"?doubleP.name_fr:doubleP.name_en} ×${pricing.nbDoubles}`, amount: doubleP.price * pricing.nbDoubles * nbNights });
                  if(pricing.nbSingles > 0) lines.push({ icon: singleP.icon, label: `${lang==="fr"?singleP.name_fr:singleP.name_en} ×${pricing.nbSingles}`, amount: singleP.price * pricing.nbSingles * nbNights });
                  return lines.map((l,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#666", padding:"3px 0" }}>
                      <span>{l.icon} {l.label}</span>
                      <span style={{ color:"#9B59B6" }}>{fmt(l.amount)} {lang==="fr"?"HT":"excl. VAT"}</span>
                    </div>
                  ));
                })()}
                {includeLunch && pricing && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#666", padding:"3px 0" }}>
                    <span>🍽️ Pub Lunch ({nbPilots + nbCompanions} pers. × {pricing.nbLunchDays}j)</span>
                    <span style={{ color:"#9B59B6" }}>{fmt(pricing.lunchTotal)} {lang==="fr"?"HT":"excl. VAT"}</span>
                  </div>
                )}
              </div>

              {selectedOptions.length > 0 && (
                <div style={{ borderTop:"1px solid #e5e5e5", paddingTop:8, marginTop:4 }}>
                  <div style={{ color:"#888", fontSize:12, marginBottom:6 }}>{t.options}:</div>
                  {selectedOptions.map(code => {
                    const o = OPTIONS.find(x=>x.code===code);
                    const p = o.type==="per_day" ? o.price*nbDaysDriving : o.price;
                    return <div key={code} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#666", padding:"3px 0" }}>
                      <span>{o.icon} {lang==="fr"?o.name_fr:o.name_en}</span><span style={{ color:"#c9a96e" }}>{fmt(p)} {lang==="fr"?"HT":"excl. VAT"}</span>
                    </div>;
                  })}
                </div>
              )}
              <div style={{ borderTop:"1px solid #c9a96e44", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#c9a96e", fontWeight:700, fontSize:14 }}>{t.subtotal}</span>
                <span style={{ color:"#c9a96e", fontWeight:700, fontSize:16 }}>{fmt(pricing.sub)} {lang==="fr"?"HT":"excl. VAT"}</span>
              </div>
            </div>

            {/* Payment method */}
            <label style={{ fontSize:12, color:"#888", fontWeight:600, display:"block", marginBottom:10, letterSpacing:1, textTransform:"uppercase" }}>{t.payment_method}</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:24 }}>
              {[
                { key:"cb", label:t.cb, adj:"", icon:"💳" },
                { key:"amex", label:t.amex, adj:`+2% ${t.surcharge}`, icon:"💎" },
                { key:"virement", label:t.virement, adj:`-2% ${t.discount}`, icon:"🏦" },
              ].map(pm => (
                <div key={pm.key} onClick={()=>setPaymentMethod(pm.key)} style={{
                  padding:16, borderRadius:10, cursor:"pointer", textAlign:"center",
                  border: paymentMethod===pm.key ? "2px solid #c9a96e" : "1px solid #252530",
                  background: paymentMethod===pm.key ? "#c9a96e0a" : "#0d0d14", transition:"all .2s"
                }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{pm.icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: paymentMethod===pm.key ? "#fff" : "#aaa" }}>{pm.label}</div>
                  {pm.adj && <div style={{ fontSize:10, color: pm.key==="virement"?"#2ECC71":"#F39C12", marginTop:4 }}>{pm.adj}</div>}
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background:goldGrad, borderRadius:12, padding:20, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:700, color:"#0a0a0f" }}>{t.total}</span>
              <span style={{ fontSize:28, fontWeight:800, color:"#0a0a0f" }}>{fmt(pricing.total)} <span style={{ fontSize:14, fontWeight:600 }}>{lang==="fr"?"HT":"excl. VAT"}</span></span>
            </div>

            {/* CGV */}
            <div onClick={()=>setCgvAccepted(!cgvAccepted)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:8 }}>
              <div style={{ width:20, height:20, borderRadius:4, border:"2px solid "+(cgvAccepted?"#c9a96e":"#444"), background:cgvAccepted?"#c9a96e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#0a0a0f", transition:"all .2s" }}>{cgvAccepted&&"✓"}</div>
              <span style={{ fontSize:13, color:"#888" }}>{t.cgv}</span>
            </div>
          </div>
        )}

        {/* ── STEP 9: Confirmation ── */}
        {step===9 && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:64, marginBottom:20 }}>✓</div>
            <h2 style={{ fontSize:24, fontWeight:700, background:goldGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{t.confirmed_title}</h2>
            <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>{t.confirmed_msg}</p>
            <div style={{ fontSize:28, fontWeight:800, color:"#c9a96e", letterSpacing:3, padding:"16px 32px", background:"#c9a96e0a", border:"1px solid #c9a96e33", borderRadius:12, display:"inline-block" }}>
              LID-2026-{String(Math.floor(Math.random()*9000)+1000)}
            </div>
            {paymentMethod==="virement" && (
              <div style={{ marginTop:32, textAlign:"left", background:"#fafafa", borderRadius:12, padding:20, border:"1px solid #e5e5e5", maxWidth:440, margin:"32px auto 0" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F39C12", marginBottom:12 }}>🏦 {lang==="fr"?"Instructions de virement":"Bank transfer instructions"}</div>
                {[["IBAN","FR76 XXXX XXXX XXXX XXXX XXXX XXX"],["BIC","SOGEFRPP"],["Montant",fmt(pricing?.total||0)],["Référence","LID-2026-XXXX"],[lang==="fr"?"Date limite":"Deadline","17/02/2026 17:00"]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"6px 0", borderBottom:"1px solid #e5e5e5" }}>
                    <span style={{ color:"#888" }}>{k}</span><span style={{ color:"#444", fontFamily:"monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 9 && (
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:16, padding:"0 4px" }}>
          {step > 1 ? (
            <button onClick={()=>setStep(step-1)} style={{ padding:"14px 28px", borderRadius:10, border:"1px solid #333", background:"transparent", color:"#888", fontSize:14, fontWeight:600, cursor:"pointer" }}>{t.prev}</button>
          ) : <div/>}
          <button onClick={()=>canNext()&&setStep(step+1)} disabled={!canNext()} style={{
            padding:"14px 36px", borderRadius:10, border:"none",
            background: canNext() ? goldGrad : "#333", color: canNext() ? "#0a0a0f" : "#666",
            fontSize:14, fontWeight:700, cursor: canNext() ? "pointer" : "not-allowed",
            opacity: canNext() ? 1 : 0.5, transition:"all .2s"
          }}>
            {step===8 ? t.book : t.next} →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Calendar Component ──
function Calendar({ month, year, selectedDate, nbDays, onSelect, onMonthChange, lang }) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayLabels = lang==="fr"?["Lu","Ma","Me","Je","Ve","Sa","Di"]:["Mo","Tu","We","Th","Fr","Sa","Su"];
  const monthNames = lang==="fr"?["","Janvier","Février","Mars"]:["","January","February","March"];

  const endDateStr = useMemo(() => {
    if(!selectedDate) return null;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + nbDays - 1);
    return d.toISOString().split('T')[0];
  }, [selectedDate, nbDays]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <button onClick={()=>onMonthChange(Math.max(0,month-1))} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"transparent", color:"#888", fontSize:16, cursor:month<=0?"not-allowed":"pointer", opacity:month<=0?0.3:1 }}>←</button>
        <span style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>{monthNames[month]} {year}</span>
        <button onClick={()=>onMonthChange(Math.min(2,month+1))} style={{ width:36, height:36, borderRadius:8, border:"1px solid #333", background:"transparent", color:"#888", fontSize:16, cursor:month>=2?"not-allowed":"pointer", opacity:month>=2?0.3:1 }}>→</button>
      </div>

      {/* Season legend */}
      <div style={{ display:"flex", gap:12, marginBottom:12, flexWrap:"wrap" }}>
        {SEASONS.filter((s,i,a)=>a.findIndex(x=>x.type===s.type)===i).map(s=>(
          <div key={s.type} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#888" }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color }} />
            {lang==="fr"?s.label_fr:s.label_en}
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {dayLabels.map(d=>(
          <div key={d} style={{ textAlign:"center", fontSize:11, color:"#555", padding:"4px 0", fontWeight:600 }}>{d}</div>
        ))}
        {Array(firstDay).fill(null).map((_,i)=>(<div key={"e"+i}/>))}
        {Array.from({length:days},(_,i)=>{
          const ds = dateStr(year, month, i+1);
          const season = getSeason(ds);
          const inRange = selectedDate && endDateStr && ds >= selectedDate && ds <= endDateStr;
          const isStart = ds === selectedDate;
          const isEnd = ds === endDateStr;
          const inSeason = ds >= "2026-01-08" && ds <= "2026-03-22";
          return (
            <div key={i} onClick={()=>inSeason && onSelect(ds)} style={{
              textAlign:"center", padding:"10px 2px", borderRadius:8, cursor: inSeason?"pointer":"not-allowed",
              background: inRange ? "#c9a96e22" : "transparent",
              border: isStart||isEnd ? "2px solid #c9a96e" : "1px solid transparent",
              color: !inSeason ? "#333" : inRange ? "#c9a96e" : "#ccc",
              fontWeight: inRange ? 700 : 400, fontSize:13, transition:"all .15s",
              position:"relative"
            }}>
              {i+1}
              {season && inSeason && (
                <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:season.color }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — Dark Mode, Planning par Véhicule
// ═══════════════════════════════════════════════════════════════════════════

const BOOKINGS_MOCK = [
  { id:1, ref:"LID-2026-0042", client:"Marcus Weber", email:"m.weber@porsche.de", company:"Porsche AG", country:"DE", vehicle_id:4, start:"2026-02-09", end:"2026-02-11", days:3, module_id:1, status:"confirmed", payment:"paid", source:"website", amount:15390, admin:false },
  { id:2, ref:"LID-2026-0043", client:"Pierre Duval", email:"p.duval@ferrari.com", company:"Ferrari France", country:"FR", vehicle_id:1, start:"2026-02-10", end:"2026-02-12", days:3, module_id:1, status:"confirmed", payment:"paid", source:"phone", amount:17325, admin:false },
  { id:3, ref:"LID-2026-0044", client:"James Mitchell", email:"j.mitchell@mclaren.com", company:"McLaren London", country:"UK", vehicle_id:6, start:"2026-02-12", end:"2026-02-14", days:3, module_id:1, status:"awaiting_payment", payment:"awaiting_transfer", source:"website", amount:18270, admin:false },
  { id:4, ref:"LID-2026-0045", client:"[VIP] Événement Lamborghini", email:"", company:"Lamborghini", country:"IT", vehicle_id:3, start:"2026-02-14", end:"2026-02-16", days:3, module_id:1, status:"confirmed", payment:"not_applicable", source:"event", amount:0, admin:true },
  { id:5, ref:"LID-2026-0046", client:"Akira Tanaka", email:"a.tanaka@lexus.jp", company:"Lexus Japan", country:"JP", vehicle_id:8, start:"2026-02-10", end:"2026-02-10", days:1, module_id:2, status:"confirmed", payment:"paid", source:"website", amount:1732, admin:false },
  { id:6, ref:"LID-2026-0047", client:"Sophie Martin", email:"s.martin@gmail.com", company:"", country:"FR", vehicle_id:9, start:"2026-02-11", end:"2026-02-13", days:3, module_id:2, status:"confirmed", payment:"paid", source:"website", amount:4275, admin:false },
  { id:7, ref:"LID-2026-0048", client:"[STAFF] Test instructeurs", email:"", company:"LID", country:"SE", vehicle_id:11, start:"2026-02-09", end:"2026-02-09", days:1, module_id:1, status:"confirmed", payment:"not_applicable", source:"staff", amount:0, admin:true },
];

function AdminDashboard({ lang, t }) {
  const [adminView, setAdminView] = useState("planning");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [settingsTab, setSettingsTab] = useState("apparence");
  const [theme, setTheme] = useState({
    primary: "#c9a96e",
    darkMode: true,
    logoUrl: "",
    logoHeight: 40,
    showImages: true,
    showSpecs: true,
    cgvRequired: true,
    radius: 12,
  });
  const a = t.admin;

  const weekDays = useMemo(() => {
    const start = new Date("2026-02-09");
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const getSeason = (dateStr) => SEASONS.find(s => dateStr >= s.start && dateStr <= s.end);

  const getBookingsForCell = (vehicleId, dateStr) => {
    return BOOKINGS_MOCK.filter(b => b.vehicle_id === vehicleId && dateStr >= b.start && dateStr <= b.end && b.status !== "cancelled");
  };

  const allVehicles = [...VEHICLES.supercar, ...VEHICLES.gt, ...VEHICLES.sport];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#111118", borderRight: "1px solid #1a1a24", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid #1a1a24" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#c9a96e", fontWeight: 700 }}>LAPLAND ICE DRIVING</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{a.dashboard}</div>
        </div>

        {[
          { key: "planning", icon: "📅", label: a.planning },
          { key: "bookings", icon: "📋", label: a.bookings },
          { key: "settings", icon: "⚙️", label: a.settings },
        ].map(item => (
          <div key={item.key} onClick={() => setAdminView(item.key)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer",
            background: adminView === item.key ? "#c9a96e11" : "transparent",
            borderLeft: adminView === item.key ? "3px solid #c9a96e" : "3px solid transparent",
            color: adminView === item.key ? "#c9a96e" : "#888",
            fontWeight: adminView === item.key ? 600 : 400, fontSize: 13,
            transition: "all 0.2s"
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div style={{ padding: 16, marginTop: 30, borderTop: "1px solid #1a1a24" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Saison 2026</div>
          {[
            { label: a.total_bookings, value: "48", color: "#3498DB" },
            { label: a.revenue, value: "€387K", color: "#2ECC71" },
            { label: a.occupancy, value: "62%", color: "#F39C12" },
          ].map(stat => (
            <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 11, color: "#666" }}>{stat.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>

        {/* ══ PLANNING VIEW ══ */}
        {adminView === "planning" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>📅 {a.planning}</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>← {a.week}</button>
                <span style={{ fontSize: 13, color: "#c9a96e", fontWeight: 600, minWidth: 180, textAlign: "center" }}>
                  {weekDays[0].toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>{a.week} →</button>
              </div>
            </div>

            {/* Planning Grid */}
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr)", minWidth: 900 }}>
                {/* Header row */}
                <div style={{ padding: 10, background: "#111118", borderBottom: "1px solid #1a1a24" }} />
                {weekDays.map((d, i) => {
                  const ds = d.toISOString().split('T')[0];
                  const season = getSeason(ds);
                  return (
                    <div key={i} style={{ padding: "10px 6px", background: "#111118", borderBottom: "1px solid #1a1a24", textAlign: "center", borderLeft: "1px solid #1a1a24" }}>
                      <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>
                        {d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short" })}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{d.getDate()}</div>
                      {season && <div style={{ fontSize: 9, color: season.color, marginTop: 2 }}>{season.type === "peak" ? "🔥" : ""} {lang === "fr" ? season.label_fr : season.label_en}</div>}
                    </div>
                  );
                })}

                {/* Vehicle rows */}
                {["supercar", "gt", "sport"].map(cat => (
                  <React.Fragment key={cat}>
                    {/* Category header */}
                    <div style={{ gridColumn: "1 / -1", padding: "8px 12px", background: "#0d0d14", fontSize: 10, letterSpacing: 3, fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", borderBottom: "1px solid #1a1a24" }}>
                      {t[cat]}
                    </div>

                    {VEHICLES[cat].map(v => (
                      <React.Fragment key={v.id}>
                        {/* Vehicle name */}
                        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1a1a24", display: "flex", alignItems: "center", gap: 8, background: "#111118" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>{v.name}</div>
                            <div style={{ fontSize: 10, color: "#555" }}>{v.code} • {v.qty}×</div>
                          </div>
                        </div>

                        {/* Day cells */}
                        {weekDays.map((d, i) => {
                          const ds = d.toISOString().split('T')[0];
                          const bookings = getBookingsForCell(v.id, ds);
                          return (
                            <div key={v.id + "-" + i} style={{
                              padding: 4, borderBottom: "1px solid #1a1a24", borderLeft: "1px solid #1a1a24",
                              background: bookings.length > 0 ? (bookings[0].admin ? "#c9a96e08" : v.color + "15") : "#0a0a0f",
                              minHeight: 44, position: "relative"
                            }}>
                              {bookings.map(b => (
                                <div key={b.id} onClick={() => setSelectedBooking(b)} style={{
                                  fontSize: 10, padding: "4px 6px", borderRadius: 4,
                                  background: b.admin ? "#c9a96e22" : v.color + "33",
                                  border: `1px solid ${b.admin ? "#c9a96e55" : v.color + "55"}`,
                                  color: b.admin ? "#c9a96e" : "#ddd",
                                  marginBottom: 2, cursor: "pointer", fontWeight: 500,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                }}>
                                  {b.admin && "🔒 "}{b.client.split(' ')[0]}
                                  {b.status === "awaiting_payment" && <span style={{ color: "#F39C12" }}> ⏳</span>}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}

                {/* Instructors row */}
                <div style={{ padding: "10px 12px", background: "#111118", borderTop: "2px solid #c9a96e33", fontWeight: 700, fontSize: 11, color: "#c9a96e", display: "flex", alignItems: "center" }}>
                  👨‍🏫 {a.instructors}
                </div>
                {weekDays.map((d, i) => {
                  const ds = d.toISOString().split('T')[0];
                  const totalSessions = BOOKINGS_MOCK.filter(b => ds >= b.start && ds <= b.end && b.status !== "cancelled").reduce((sum, b) => {
                    const m = MODULES.find(x => x.id === b.module_id);
                    return sum + (m?.sessions || 0);
                  }, 0);
                  const instructors = Math.ceil(totalSessions / 16);
                  return (
                    <div key={"inst" + i} style={{ padding: 10, borderTop: "2px solid #c9a96e33", borderLeft: "1px solid #1a1a24", textAlign: "center", background: "#111118" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: instructors > 3 ? "#E74C3C" : instructors > 1 ? "#F39C12" : "#2ECC71" }}>{instructors}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ BOOKINGS VIEW ══ */}
        {adminView === "bookings" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>📋 {a.bookings}</h2>
              <div style={{ display: "flex", gap: 12 }}>
                <input placeholder={a.search} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #333", background: "#111118", color: "#fff", fontSize: 13, width: 200 }} />
                <select style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #333", background: "#111118", color: "#fff", fontSize: 13 }}>
                  <option>{a.all}</option>
                  <option>{a.confirmed}</option>
                  <option>{a.awaiting}</option>
                </select>
              </div>
            </div>

            <div style={{ background: "#111118", borderRadius: 12, border: "1px solid #1a1a24", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a24" }}>
                    {[a.ref || "Réf.", "Client", a.vehicle || "Véhicule", "Dates", "Module", a.status || "Statut", "Actions"].map(h => (
                      <th key={h} style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOKINGS_MOCK.map(b => {
                    const vehicle = allVehicles.find(v => v.id === b.vehicle_id);
                    const module = MODULES.find(m => m.id === b.module_id);
                    return (
                      <tr key={b.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                        <td style={{ padding: 12 }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#c9a96e" }}>{b.ref}</span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{b.client}</div>
                          {b.company && <div style={{ fontSize: 11, color: "#666" }}>{b.company}</div>}
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: vehicle?.color }} />
                            <span style={{ color: "#ddd", fontSize: 12 }}>{vehicle?.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: 12, color: "#888", fontSize: 12 }}>{b.start} → {b.end}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: module?.tier === "exclusive" ? "#c9a96e22" : module?.tier === "intensive" ? "#3498DB22" : "#2ECC7122", color: module?.tier === "exclusive" ? "#c9a96e" : module?.tier === "intensive" ? "#3498DB" : "#2ECC71" }}>
                            {lang === "fr" ? module?.name_fr : module?.name_en}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: b.status === "confirmed" ? "#2ECC7122" : "#F39C1222", color: b.status === "confirmed" ? "#2ECC71" : "#F39C12" }}>
                            {b.status === "confirmed" ? "✓ Confirmé" : "⏳ En attente"}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <button onClick={() => setSelectedBooking(b)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 11 }}>Voir</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ SETTINGS VIEW ══ */}
        {adminView === "settings" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 20px" }}>⚙️ {a.settings}</h2>

            {/* Settings Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {[
                { key: "apparence", label: lang === "fr" ? "Apparence" : "Appearance" },
                { key: "vehicules", label: lang === "fr" ? "Véhicules" : "Vehicles" },
                { key: "modules", label: "Modules" },
                { key: "options", label: "Options" },
                { key: "saisons", label: lang === "fr" ? "Saisons" : "Seasons" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setSettingsTab(tab.key)} style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: settingsTab === tab.key ? "#c9a96e" : "#111118",
                  color: settingsTab === tab.key ? "#000" : "#888",
                  transition: "all 0.2s"
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Apparence */}
            {settingsTab === "apparence" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>{lang === "fr" ? "Couleurs" : "Colors"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 6 }}>{lang === "fr" ? "Couleur principale" : "Primary color"}</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="color" value={theme.primary} onChange={e => setTheme({ ...theme, primary: e.target.value })} style={{ width: 50, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }} />
                        <input value={theme.primary} onChange={e => setTheme({ ...theme, primary: e.target.value })} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0f", color: "#fff", fontSize: 12, fontFamily: "monospace" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 6 }}>{lang === "fr" ? "Mode sombre" : "Dark mode"}</label>
                      <button onClick={() => setTheme({ ...theme, darkMode: !theme.darkMode })} style={{
                        padding: "10px 20px", borderRadius: 8, border: "1px solid #333", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: theme.darkMode ? "#333" : "#fff", color: theme.darkMode ? "#fff" : "#333"
                      }}>{theme.darkMode ? "🌙 Activé" : "☀️ Désactivé"}</button>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>Logo</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 6 }}>URL du logo</label>
                      <input value={theme.logoUrl} onChange={e => setTheme({ ...theme, logoUrl: e.target.value })} placeholder="https://..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0f", color: "#fff", fontSize: 12, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 6 }}>Hauteur (px)</label>
                      <input type="number" value={theme.logoHeight} onChange={e => setTheme({ ...theme, logoHeight: parseInt(e.target.value) || 40 })} style={{ width: 80, padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0f", color: "#fff", fontSize: 12 }} />
                    </div>
                  </div>
                </div>

                <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>{lang === "fr" ? "Affichage" : "Display"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ddd", cursor: "pointer" }}>
                      <input type="checkbox" checked={theme.showImages} onChange={e => setTheme({ ...theme, showImages: e.target.checked })} />
                      {lang === "fr" ? "Afficher les images véhicules" : "Show vehicle images"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ddd", cursor: "pointer" }}>
                      <input type="checkbox" checked={theme.showSpecs} onChange={e => setTheme({ ...theme, showSpecs: e.target.checked })} />
                      {lang === "fr" ? "Afficher les specs véhicules" : "Show vehicle specs"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ddd", cursor: "pointer" }}>
                      <input type="checkbox" checked={theme.cgvRequired} onChange={e => setTheme({ ...theme, cgvRequired: e.target.checked })} />
                      {lang === "fr" ? "CGV obligatoires" : "T&C required"}
                    </label>
                  </div>
                </div>

                <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>{lang === "fr" ? "Arrondi des coins" : "Border radius"}</h3>
                  <input type="range" min="0" max="24" value={theme.radius} onChange={e => setTheme({ ...theme, radius: parseInt(e.target.value) })} style={{ width: "100%" }} />
                  <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{theme.radius}px</div>
                </div>
              </div>
            )}

            {/* Véhicules */}
            {settingsTab === "vehicules" && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#fff" }}>{lang === "fr" ? "Flotte de véhicules" : "Vehicle fleet"}</h3>
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#c9a96e", color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Ajouter</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a24" }}>
                      <th style={{ padding: 10, textAlign: "left", color: "#666" }}>Nom</th>
                      <th style={{ padding: 10, textAlign: "left", color: "#666" }}>Code</th>
                      <th style={{ padding: 10, textAlign: "right", color: "#666" }}>Prix/jour</th>
                      <th style={{ padding: 10, textAlign: "center", color: "#666" }}>Qté</th>
                      <th style={{ padding: 10, textAlign: "center", color: "#666" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVehicles.map(v => (
                      <tr key={v.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                        <td style={{ padding: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#ddd" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
                            {v.name}
                          </div>
                        </td>
                        <td style={{ padding: 10, fontFamily: "monospace", color: "#888" }}>{v.code}</td>
                        <td style={{ padding: 10, textAlign: "right", color: "#c9a96e", fontWeight: 600 }}>{v.price.toLocaleString()} €</td>
                        <td style={{ padding: 10, textAlign: "center", color: "#888" }}>{v.qty}</td>
                        <td style={{ padding: 10, textAlign: "center" }}>
                          <button style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", marginRight: 6, fontSize: 11 }}>✏️</button>
                          <button style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modules */}
            {settingsTab === "modules" && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>Modules de pilotage</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {MODULES.map(m => (
                    <div key={m.id} style={{ background: "#0a0a0f", borderRadius: 8, padding: 16, border: "1px solid #1a1a24" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: m.tier === "exclusive" ? "#c9a96e" : m.tier === "intensive" ? "#3498DB" : "#2ECC71", marginBottom: 10 }}>{lang === "fr" ? m.name_fr : m.name_en}</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Sessions/jour: <b style={{ color: "#ddd" }}>{m.sessions}</b></div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Clients/véhicule: <b style={{ color: "#ddd" }}>{m.clients}</b></div>
                      <div style={{ fontSize: 12, color: "#888" }}>Coefficient: <b style={{ color: "#ddd" }}>×{m.coef}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            {settingsTab === "options" && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>Options & Extras</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a24" }}>
                      <th style={{ padding: 10, textAlign: "left", color: "#666" }}>Option</th>
                      <th style={{ padding: 10, textAlign: "right", color: "#666" }}>Prix</th>
                      <th style={{ padding: 10, textAlign: "center", color: "#666" }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPTIONS.map(o => (
                      <tr key={o.code} style={{ borderBottom: "1px solid #1a1a24" }}>
                        <td style={{ padding: 10, color: "#ddd" }}>{o.icon} {lang === "fr" ? o.name_fr : o.name_en}</td>
                        <td style={{ padding: 10, textAlign: "right", color: "#c9a96e", fontWeight: 600 }}>{o.price} €</td>
                        <td style={{ padding: 10, textAlign: "center", fontSize: 11, color: "#888" }}>{o.type === "per_day" ? "/jour" : "forfait"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Saisons */}
            {settingsTab === "saisons" && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 20, border: "1px solid #1a1a24" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#fff" }}>Saisonnalité 2026</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {SEASONS.map((s, i) => (
                    <div key={i} style={{ background: "#0a0a0f", borderRadius: 8, padding: 16, border: "2px solid " + s.color }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: s.color, marginBottom: 10 }}>{lang === "fr" ? s.label_fr : s.label_en}</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Coef: <b style={{ color: "#ddd" }}>×{s.coef}</b> ({s.coef < 1 ? "-" + ((1 - s.coef) * 100) + "%" : s.coef > 1 ? "+" + ((s.coef - 1) * 100) + "%" : "plein tarif"})</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{s.start} → {s.end}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Booking */}
      {selectedBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelectedBooking(null)}>
          <div style={{ background: "#111118", borderRadius: 16, padding: 24, maxWidth: 450, width: "95%", border: "1px solid #1a1a24" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#fff" }}>{selectedBooking.client}</h3>
                <div style={{ fontSize: 12, color: "#c9a96e", fontFamily: "monospace", marginTop: 4 }}>{selectedBooking.ref}</div>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: selectedBooking.status === "confirmed" ? "#2ECC7122" : "#F39C1222", color: selectedBooking.status === "confirmed" ? "#2ECC71" : "#F39C12", alignSelf: "flex-start" }}>
                {selectedBooking.status === "confirmed" ? "✓ Confirmé" : "⏳ En attente"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
              <div><span style={{ color: "#666" }}>Email:</span> <span style={{ color: "#ddd" }}>{selectedBooking.email || "—"}</span></div>
              <div><span style={{ color: "#666" }}>Société:</span> <span style={{ color: "#ddd" }}>{selectedBooking.company || "—"}</span></div>
              <div><span style={{ color: "#666" }}>Véhicule:</span> <span style={{ color: "#ddd" }}>{allVehicles.find(v => v.id === selectedBooking.vehicle_id)?.name}</span></div>
              <div><span style={{ color: "#666" }}>Dates:</span> <span style={{ color: "#ddd" }}>{selectedBooking.start} → {selectedBooking.end}</span></div>
              <div><span style={{ color: "#666" }}>Module:</span> <span style={{ color: "#ddd" }}>{MODULES.find(m => m.id === selectedBooking.module_id)?.[lang === "fr" ? "name_fr" : "name_en"]}</span></div>
              <div><span style={{ color: "#666" }}>Montant:</span> <span style={{ color: "#c9a96e", fontWeight: 700 }}>{selectedBooking.amount > 0 ? selectedBooking.amount.toLocaleString() + " €" : "N/A"}</span></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setSelectedBooking(null)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>{lang === "fr" ? "Fermer" : "Close"}</button>
              <button style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#c9a96e", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{lang === "fr" ? "Modifier" : "Edit"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
