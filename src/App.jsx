import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Home, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Euro, 
  Mail, 
  Phone, 
  Calendar, 
  Compass, 
  Share2, 
  Building, 
  Info, 
  X, 
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Award
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';

// Coordenadas geográficas reais das sedes de concelho para cálculo exato de distância
const MUNICIPALITIES_GEO = {
  "Moimenta da Beira": { lat: 40.9794, lon: -7.6138 },
  "Sernancelhe": { lat: 40.8981, lon: -7.4947 },
  "Tarouca": { lat: 41.0177, lon: -7.7770 },
  "Armamar": { lat: 41.1075, lon: -7.6917 },
  "Vila Nova de Paiva": { lat: 40.8523, lon: -7.7275 },
  "Aguiar da Beira": { lat: 40.8163, lon: -7.5434 },
  "Tabuaço": { lat: 41.1166, lon: -7.5683 }
};

const MUNICIPALITIES = Object.keys(MUNICIPALITIES_GEO);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Retorna distância em km
}

// Configuração Firebase resiliente
let db, auth, appId;
try {
  const firebaseConfig = JSON.parse(__firebase_config);
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'interiorizate-youth-portal';
} catch (e) {
  console.warn("Firebase config not found, falling back to local storage simulation.");
}

const initialJobs = [
  {
    id: "job-1",
    title: "Gestor de Redes Sociais e Marketing Digital",
    company: "Inovação Interior Lda",
    municipality: "Moimenta da Beira",
    type: "Híbrido",
    category: "Marketing",
    salary: "1100€ - 1300€",
    description: "Procuramos jovem dinâmico para gerir a comunicação digital de marcas locais. Excelente ambiente de trabalho no centro da vila e flexibilidade de horários.",
    contactName: "Ana Silva",
    contactEmail: "recrutamento@inovacaointerior.pt",
    contactPhone: "912345678",
    createdAt: new Date().toISOString()
  },
  {
    id: "job-2",
    title: "Programador Web Full-Stack (Júnior/Intermediate)",
    company: "Beira Tech Hub",
    municipality: "Sernancelhe",
    type: "Remoto / Presencial",
    category: "Tecnologia",
    salary: "1400€ - 1800€",
    description: "Oportunidade para desenvolver aplicações modernas integrando uma equipa jovem no interior. Apoio à fixação de residência no concelho.",
    contactName: "Carlos Pinto",
    contactEmail: "vagas@beiratech.pt",
    contactPhone: "931234567",
    createdAt: new Date().toISOString()
  },
  {
    id: "job-3",
    title: "Engenheiro Agrícola / Produção Frutícola",
    company: "Maçã de Armamar Cooperativa",
    municipality: "Armamar",
    type: "Presencial",
    category: "Agricultura & Ambiente",
    salary: "1200€ - 1500€",
    description: "Acompanhamento técnico da produção de maçã de montanha. Procuramos recém-licenciado com vontade de aprender e liderar equipas no terreno.",
    contactName: "Rui Moreira",
    contactEmail: "geral@macaarmamar.pt",
    contactPhone: "961234599",
    createdAt: new Date().toISOString()
  },
  {
    id: "job-4",
    title: "Técnico de Turismo e Guia Cultural",
    company: "Município de Tarouca",
    municipality: "Tarouca",
    type: "Presencial",
    category: "Turismo",
    salary: "1000€ - 1150€",
    description: "Promoção dos monumentos históricos do concelho (Mosteiro de Salzedas, Ponte de Ucanha). Fluência em Inglês e Francês valorizada.",
    contactName: "Gabinete de Apoio",
    contactEmail: "turismo@cm-tarouca.pt",
    contactPhone: "254679800",
    createdAt: new Date().toISOString()
  }
];

const initialRentals = [
  {
    id: "rent-1",
    title: "Apartamento T2 Renovado no Centro Histórico",
    municipality: "Moimenta da Beira",
    type: "Apartamento T2",
    price: 350,
    address: "Rua Direita, Moimenta da Beira",
    description: "Apartamento muito luminoso, totalmente mobilado e equipado. Ideal para jovens trabalhadores ou casais. Excelente isolamento térmico.",
    contactName: "D. Maria Santos",
    contactPhone: "919876543",
    contactEmail: "maria.santos@exemplo.pt",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "rent-2",
    title: "Quarto Individual em Casa Partilhada de Jovens",
    municipality: "Sernancelhe",
    type: "Quarto",
    price: 180,
    address: "Av. das Tílias, Sernancelhe",
    description: "Quarto com secretária e roupeiro em casa com ambiente jovem e descontraído. Contas partilhadas de água e luz. Internet rápida incluída.",
    contactName: "João Pedro",
    contactPhone: "928765432",
    contactEmail: "joaopedro@exemplo.com",
    imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "rent-3",
    title: "Moradia T3 Clássica com Quintal e Garagem",
    municipality: "Tabuaço",
    type: "Moradia T3",
    price: 450,
    address: "Lugar do Vale, Tabuaço",
    description: "Moradia tradicional na deslumbrante paisagem do Douro. Quintal com oliveiras, poço de água e espaço para pequena horta. Lareira para o inverno.",
    contactName: "António Costa",
    contactPhone: "967654321",
    contactEmail: "antoniocosta@exemplo.pt",
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'rentals' | 'info'
  const [jobs, setJobs] = useState([]);
  const [rentals, setRentals] = useState([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('Todos');
  const [radius, setRadius] = useState(15); // Raio em KM
  const [jobTypeFilter, setJobTypeFilter] = useState('Todos');
  const [maxPrice, setMaxPrice] = useState(600);
  
  // Submit Offer Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  
  // Alerts state
  const [notification, setNotification] = useState(null);

  // New Listing States
  const [newJob, setNewJob] = useState({
    title: '', company: '', municipality: 'Moimenta da Beira',
    type: 'Presencial', category: 'Tecnologia', salary: '',
    description: '', contactName: '', contactEmail: '', contactPhone: ''
  });

  const [newRental, setNewRental] = useState({
    title: '', municipality: 'Moimenta da Beira', type: 'Apartamento T1',
    price: '', address: '', description: '',
    contactName: '', contactPhone: '', contactEmail: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (!auth) {
      // Offline Simulation Fallback
      setJobs(initialJobs);
      setRentals(initialRentals);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Authentication failed:", err);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // Real-time listener for jobs
    const jobsPath = collection(db, 'artifacts', appId, 'public', 'data', 'jobs');
    const unsubscribeJobs = onSnapshot(jobsPath, (snapshot) => {
      const fetchedJobs = [];
      snapshot.forEach((doc) => {
        fetchedJobs.push({ id: doc.id, ...doc.data() });
      });
      // Merge with initial mock data if remote is empty to ensure rich content
      setJobs(fetchedJobs.length > 0 ? fetchedJobs : initialJobs);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setJobs(initialJobs);
    });

    // Real-time listener for rentals
    const rentalsPath = collection(db, 'artifacts', appId, 'public', 'data', 'rentals');
    const unsubscribeRentals = onSnapshot(rentalsPath, (snapshot) => {
      const fetchedRentals = [];
      snapshot.forEach((doc) => {
        fetchedRentals.push({ id: doc.id, ...doc.data() });
      });
      setRentals(fetchedRentals.length > 0 ? fetchedRentals : initialRentals);
    }, (error) => {
      console.error("Error fetching rentals:", error);
      setRentals(initialRentals);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeRentals();
    };
  }, [user]);

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Calcula municípios no raio de kms selecionado
  const getMunicipalitiesInRadius = (centerMuni, maxDistance) => {
    if (centerMuni === 'Todos') return MUNICIPALITIES;
    const centerCoords = MUNICIPALITIES_GEO[centerMuni];
    if (!centerCoords) return [centerMuni];

    return MUNICIPALITIES.filter(muni => {
      const targetCoords = MUNICIPALITIES_GEO[muni];
      const dist = calculateDistance(centerCoords.lat, centerCoords.lon, targetCoords.lat, targetCoords.lon);
      return dist <= maxDistance;
    });
  };

  const allowedMunicipalities = selectedMunicipality !== 'Todos' && radius > 0
    ? getMunicipalitiesInRadius(selectedMunicipality, radius)
    : [selectedMunicipality];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedMunicipality === 'Todos' || allowedMunicipalities.includes(job.municipality);
    const matchesType = jobTypeFilter === 'Todos' || job.type === jobTypeFilter;

    return matchesSearch && matchesLocation && matchesType;
  });

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rental.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rental.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = selectedMunicipality === 'Todos' || allowedMunicipalities.includes(rental.municipality);
    const matchesPrice = Number(rental.price) <= maxPrice;

    return matchesSearch && matchesLocation && matchesPrice;
  });

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.contactEmail) {
      triggerNotification("Por favor, preencha os campos obrigatórios.", "error");
      return;
    }

    const jobData = {
      ...newJob,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'), jobData);
        triggerNotification("Oferta de emprego publicada com sucesso!");
      } catch (err) {
        console.error("Error adding job to Firestore:", err);
        triggerNotification("Erro ao guardar dados. Simulado localmente.", "info");
        setJobs(prev => [ {id: Date.now().toString(), ...jobData}, ...prev ]);
      }
    } else {
      setJobs(prev => [ {id: Date.now().toString(), ...jobData}, ...prev ]);
      triggerNotification("Oferta publicada localmente (modo demonstração).");
    }

    setIsJobModalOpen(false);
    setNewJob({
      title: '', company: '', municipality: 'Moimenta da Beira',
      type: 'Presencial', category: 'Tecnologia', salary: '',
      description: '', contactName: '', contactEmail: '', contactPhone: ''
    });
  };

  const handleAddRental = async (e) => {
    e.preventDefault();
    if (!newRental.title || !newRental.price || !newRental.contactPhone) {
      triggerNotification("Por favor, preencha os campos obrigatórios.", "error");
      return;
    }

    const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";
    const rentalData = {
      ...newRental,
      price: Number(newRental.price),
      imageUrl: newRental.imageUrl || defaultImage,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rentals'), rentalData);
        triggerNotification("Oferta de alojamento publicada com sucesso!");
      } catch (err) {
        console.error("Error adding rental to Firestore:", err);
        triggerNotification("Erro ao guardar dados. Simulado localmente.", "info");
        setRentals(prev => [ {id: Date.now().toString(), ...rentalData}, ...prev ]);
      }
    } else {
      setRentals(prev => [ {id: Date.now().toString(), ...rentalData}, ...prev ]);
      triggerNotification("Alojamento publicado localmente (modo demonstração).");
    }

    setIsRentalModalOpen(false);
    setNewRental({
      title: '', municipality: 'Moimenta da Beira', type: 'Apartamento T1',
      price: '', address: '', description: '',
      contactName: '', contactPhone: '', contactEmail: '',
      imageUrl: ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border text-white transition-all duration-300 animate-bounce ${
          notification.type === 'error' ? 'bg-red-600 border-red-700' :
          notification.type === 'info' ? 'bg-amber-600 border-amber-700' : 'bg-emerald-600 border-emerald-700'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-semibold text-sm">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-emerald-950 p-2.5 rounded-xl font-bold text-lg flex items-center justify-center shadow-inner">
              IY
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Interiorizate Youth</h1>
              <p className="text-xs text-emerald-200">Portal de Atração & Fixação Territorial</p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'jobs' ? 'bg-emerald-800 text-emerald-200' : 'hover:bg-emerald-800/50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Emprego
            </button>
            <button 
              onClick={() => setActiveTab('rentals')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'rentals' ? 'bg-emerald-800 text-emerald-200' : 'hover:bg-emerald-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              Alojamento
            </button>
            <button 
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'info' ? 'bg-emerald-800 text-emerald-200' : 'hover:bg-emerald-800/50'
              }`}
            >
              <Info className="w-4 h-4" />
              Porquê o Interior?
            </button>

            <div className="h-6 w-[1px] bg-emerald-800 hidden md:block"></div>

            <button 
              onClick={() => activeTab === 'jobs' ? setIsJobModalOpen(true) : setIsRentalModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'jobs' ? 'Publicar Vaga' : 'Publicar Casa'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white py-12 px-4 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl"></div>
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 border border-emerald-700/50 rounded-full text-xs font-semibold text-emerald-200 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            O Teu Futuro Começa no Coração do Interior
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Emprego e Habitação na Beira Alta & Douro
          </h2>
          <p className="text-emerald-100 max-w-2xl mx-auto text-base sm:text-lg mb-8">
            Divulgamos oportunidades reais nos concelhos de Moimenta da Beira, Sernancelhe, Tarouca, Armamar, Vila Nova de Paiva, Aguiar da Beira e Tabuaço. Encontra a tua próxima etapa de vida aqui!
          </p>

          {/* Search panel */}
          <div className="bg-white rounded-2xl shadow-xl p-3 max-w-4xl mx-auto text-slate-700">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search text */}
              <div className="flex-1 flex items-center gap-2 border-b lg:border-b-0 lg:border-r border-slate-200 pb-2 lg:pb-0 px-2">
                <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <input 
                  type="text"
                  placeholder={activeTab === 'jobs' ? "Pesquisar profissões, empresas ou palavras-chave..." : "Procurar apartamentos, casas ou quartos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm font-medium focus:outline-none placeholder-slate-400 text-slate-800"
                />
              </div>

              {/* Municipality Select */}
              <div className="w-full lg:w-64 flex items-center gap-2 border-b lg:border-b-0 lg:border-r border-slate-200 pb-2 lg:pb-0 px-2">
                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="w-full text-left">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Concelho Alvo</label>
                  <select 
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    className="w-full text-sm font-semibold focus:outline-none bg-transparent"
                  >
                    <option value="Todos">Todos os Concelhos</option>
                    {MUNICIPALITIES.map(muni => (
                      <option key={muni} value={muni}>{muni}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Kms Radius Filter (Raio de Kms) */}
              <div className="w-full lg:w-60 flex items-center gap-2 px-2 pb-2 lg:pb-0">
                <Compass className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <div className="w-full text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Raio Geográfico</label>
                    <span className="text-xs font-bold text-emerald-700">{radius === 0 ? 'Exato' : `+${radius} km`}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={radius}
                    disabled={selectedMunicipality === 'Todos'}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          </div>
          {selectedMunicipality === 'Todos' && (
            <p className="text-xs text-emerald-300/80 mt-2">
              *Selecione um concelho para poder usar a pesquisa por raio de proximidade (Kms).
            </p>
          )}
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic statistics overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Empregos Ativos</p>
              <h4 className="text-lg font-bold">{jobs.length} ofertas</h4>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Casas / Quartos</p>
              <h4 className="text-lg font-bold">{rentals.length} imóveis</h4>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Municípios</p>
              <h4 className="text-lg font-bold">{MUNICIPALITIES.length} regiões</h4>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Interiorizate Youth</p>
              <h4 className="text-sm font-bold text-emerald-700 hover:underline">
                <a href="https://youth.interiorizate.pt" target="_blank" rel="noopener noreferrer">Aceder website ↗</a>
              </h4>
            </div>
          </div>
        </div>

        {/* Tab-driven layout render */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Filtering toolbar for Jobs */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-600">Filtrar por Regime:</span>
                <div className="flex flex-wrap gap-1">
                  {['Todos', 'Presencial', 'Híbrido', 'Remoto', 'Remoto / Presencial'].map(type => (
                    <button
                      key={type}
                      onClick={() => setJobTypeFilter(type)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        jobTypeFilter === type 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-700 font-bold">{filteredJobs.length}</strong> de {jobs.length} vagas de emprego
              </div>
            </div>

            {/* Jobs listing */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-slate-700">Nenhum emprego encontrado</h3>
                <p className="text-sm text-slate-400 mb-6">Tenta alargar o teu raio geográfico de quilómetros ou limpa os filtros de pesquisa atuais.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMunicipality('Todos');
                    setRadius(15);
                    setJobTypeFilter('Todos');
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => {
                  let distanceInfo = null;
                  if (selectedMunicipality !== 'Todos' && selectedMunicipality !== job.municipality) {
                    const center = MUNICIPALITIES_GEO[selectedMunicipality];
                    const target = MUNICIPALITIES_GEO[job.municipality];
                    if (center && target) {
                      const dist = calculateDistance(center.lat, center.lon, target.lat, target.lon);
                      distanceInfo = `Aprox. ${dist.toFixed(1)} km de ${selectedMunicipality}`;
                    }
                  }

                  return (
                    <div 
                      key={job.id} 
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                            {job.category || "Geral"}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Recente
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors mb-2 line-clamp-1">
                          {job.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                          <Building className="w-3.5 h-3.5" />
                          <span>{job.company}</span>
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-3 mb-4 min-h-[60px]">
                          {job.description}
                        </p>

                        <div className="border-t border-slate-100 pt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-600">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold">{job.municipality}</span>
                            </div>
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold">
                              {job.type}
                            </span>
                          </div>
                          
                          {distanceInfo && (
                            <div className="text-[11px] text-teal-600 font-bold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-md">
                              <Compass className="w-3 h-3" />
                              {distanceInfo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Euro className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-sm">{job.salary || 'A combinar'}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedItemDetails({ ...job, detailsType: 'job' })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          Candidatar-se
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rentals tab */}
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            {/* Filter toolbar for Rentals */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <span className="text-sm font-semibold text-slate-600 flex-shrink-0">Preço Máximo:</span>
                <input 
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-800 flex-shrink-0 bg-slate-100 px-2 py-1 rounded">
                  {maxPrice}€ / mês
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-700 font-bold">{filteredRentals.length}</strong> de {rentals.length} imóveis disponíveis
              </div>
            </div>

            {/* Rentals Listing Grid */}
            {filteredRentals.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Home className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-slate-700">Nenhum imóvel disponível</h3>
                <p className="text-sm text-slate-400 mb-6">Tenta alargar o preço limite, limpar a pesquisa ou expandir o raio geográfico.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMunicipality('Todos');
                    setRadius(15);
                    setMaxPrice(800);
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Limpar filtros de alojamento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRentals.map(rental => {
                  let distanceInfo = null;
                  if (selectedMunicipality !== 'Todos' && selectedMunicipality !== rental.municipality) {
                    const center = MUNICIPALITIES_GEO[selectedMunicipality];
                    const target = MUNICIPALITIES_GEO[rental.municipality];
                    if (center && target) {
                      const dist = calculateDistance(center.lat, center.lon, target.lat, target.lon);
                      distanceInfo = `Aprox. ${dist.toFixed(1)} km de ${selectedMunicipality}`;
                    }
                  }

                  return (
                    <div 
                      key={rental.id} 
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative h-48 bg-slate-200 overflow-hidden">
                        <img 
                          src={rental.imageUrl} 
                          alt={rental.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                          {rental.type}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-base text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2 mb-2 min-h-[48px]">
                            {rental.title}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                            {rental.description}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="font-semibold line-clamp-1">{rental.address || rental.municipality}</span>
                          </div>

                          {distanceInfo && (
                            <div className="text-[11px] text-teal-600 font-bold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-md">
                              <Compass className="w-3 h-3" />
                              {distanceInfo}
                            </div>
                          )}

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <div className="text-amber-600 font-extrabold text-lg">
                              {rental.price}€<span className="text-xs font-normal text-slate-400">/mês</span>
                            </div>

                            <button
                              onClick={() => setSelectedItemDetails({ ...rental, detailsType: 'rental' })}
                              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              Ver Detalhes
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-12">
            
            <div className="text-center space-y-4">
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Vantagens do Interior de Portugal
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">Porquê viver na Beira Alta & Douro Sul?</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Estes concelhos representam mais do que uma mudança de ares — representam uma extraordinária qualidade de vida, habitação acessível e comunidade coesa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-100 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white hover:border-emerald-200 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <Euro className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Custo de Vida Baixo</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Arrendamentos a um quarto ou metade do preço dos grandes centros urbanos e um menor custo de bens de primeira necessidade.
                </p>
              </div>

              <div className="border border-slate-100 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white hover:border-emerald-200 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Qualidade & Segurança</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sem trânsito, ar puro de montanha, segurança total para criar uma família e património histórico e natural incrível mesmo ao lado.
                </p>
              </div>

              <div className="border border-slate-100 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white hover:border-emerald-200 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Programas de Apoio</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Existem diversos apoios públicos governamentais e incentivos fiscais para jovens empreendedores e famílias se mudarem para territórios do interior.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-emerald-900">És um jovem candidato ou senhorio local?</h4>
                <p className="text-sm text-emerald-700 leading-relaxed max-w-xl">
                  Se precisas de mais apoio para encontrar o teu rumo ou habitação no interior, entra em contacto com o projeto <strong>Interiorizate Youth</strong> promovido pela Rede de Apoio Juvenil.
                </p>
              </div>
              <a 
                href="https://youth.interiorizate.pt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-3 rounded-xl shadow transition duration-200 text-sm whitespace-nowrap"
              >
                Visitar Website Oficial
              </a>
            </div>

          </div>
        )}

      </main>

      {/* Details modal */}
      {selectedItemDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button 
              onClick={() => setSelectedItemDetails(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedItemDetails.detailsType === 'rental' && (
              <div className="h-64 bg-slate-100">
                <img 
                  src={selectedItemDetails.imageUrl} 
                  alt={selectedItemDetails.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-slate-700 font-bold rounded-full text-xs mb-2">
                  {selectedItemDetails.detailsType === 'job' ? 'OFERTA DE EMPREGO' : 'ALUGUER DE IMÓVEL'}
                </span>
                <h3 className="text-2xl font-bold text-slate-800">
                  {selectedItemDetails.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {selectedItemDetails.address || selectedItemDetails.municipality} ({selectedItemDetails.municipality})
                </p>
              </div>

              {selectedItemDetails.detailsType === 'job' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl text-sm">
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Empresa</span>
                    <span className="font-bold text-slate-800">{selectedItemDetails.company}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Tipo / Regime</span>
                    <span className="font-bold text-slate-800">{selectedItemDetails.type}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Vencimento</span>
                    <span className="font-bold text-slate-800">{selectedItemDetails.salary || "A combinar"}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl text-sm">
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Tipologia</span>
                    <span className="font-bold text-slate-800">{selectedItemDetails.type}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Preço Aluguer</span>
                    <span className="font-bold text-amber-600">{selectedItemDetails.price}€ / mês</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Data Limite</span>
                    <span className="font-bold text-slate-800">Disponível imediato</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-sm">Descrição Detalhada:</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedItemDetails.description}
                </p>
              </div>

              {/* Contacts section */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  Informações de Contacto Direto
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <div>
                    <p className="text-xs text-slate-400">Pessoa Responsável</p>
                    <p className="font-bold text-emerald-950 text-sm">{selectedItemDetails.contactName || "Anunciante"}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {selectedItemDetails.contactEmail && (
                      <a 
                        href={`mailto:${selectedItemDetails.contactEmail}`}
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Enviar Email
                      </a>
                    )}
                    {selectedItemDetails.contactPhone && (
                      <a 
                        href={`tel:${selectedItemDetails.contactPhone}`}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ligar: {selectedItemDetails.contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job submission modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsJobModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              Publicar Nova Oferta de Emprego
            </h3>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Cargo*</label>
                <input 
                  type="text" required
                  placeholder="Ex: Designer Multimédia, Serralheiro, Enfermeiro..."
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa / Entidade*</label>
                  <input 
                    type="text" required
                    placeholder="Nome da empresa"
                    value={newJob.company}
                    onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concelho*</label>
                  <select 
                    value={newJob.municipality}
                    onChange={(e) => setNewJob({...newJob, municipality: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm bg-white"
                  >
                    {MUNICIPALITIES.map(muni => (
                      <option key={muni} value={muni}>{muni}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Regime de Trabalho</label>
                  <select 
                    value={newJob.type}
                    onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm bg-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                    <option value="Remoto / Presencial">Misto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor de Atividade</label>
                  <select 
                    value={newJob.category}
                    onChange={(e) => setNewJob({...newJob, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm bg-white"
                  >
                    <option value="Tecnologia">Tecnologia & IT</option>
                    <option value="Marketing">Marketing / Comunicação</option>
                    <option value="Saúde">Saúde & Bem-Estar</option>
                    <option value="Turismo">Turismo & Hotelaria</option>
                    <option value="Agricultura & Ambiente">Agricultura & Ambiente</option>
                    <option value="Administração">Administração / Serviços</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salário Proposto (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="Ex: 1100€ - 1250€ ou A combinar"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pessoa de Contacto</label>
                  <input 
                    type="text"
                    placeholder="Ex: Gabinete de RH"
                    value={newJob.contactName}
                    onChange={(e) => setNewJob({...newJob, contactName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email para Candidatura*</label>
                  <input 
                    type="email" required
                    placeholder="Ex: recrutamento@empresa.com"
                    value={newJob.contactEmail}
                    onChange={(e) => setNewJob({...newJob, contactEmail: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telemóvel (Opcional)</label>
                  <input 
                    type="tel"
                    placeholder="Ex: 912 345 678"
                    value={newJob.contactPhone}
                    onChange={(e) => setNewJob({...newJob, contactPhone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição Detalhada dos Requisitos e Oferta*</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Indique as funções, horários, competências procuradas e benefícios oferecidos pela empresa..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsJobModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-bold text-sm shadow-md"
                >
                  Publicar Emprego
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rental submission modal */}
      {isRentalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsRentalModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Home className="w-6 h-6 text-amber-500" />
              Publicar Oferta de Arrendamento
            </h3>

            <form onSubmit={handleAddRental} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Anúncio*</label>
                <input 
                  type="text" required
                  placeholder="Ex: Quarto mobilado, Apartamento T1 acolhedor..."
                  value={newRental.title}
                  onChange={(e) => setNewRental({...newRental, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concelho*</label>
                  <select 
                    value={newRental.municipality}
                    onChange={(e) => setNewRental({...newRental, municipality: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm bg-white"
                  >
                    {MUNICIPALITIES.map(muni => (
                      <option key={muni} value={muni}>{muni}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipologia*</label>
                  <select 
                    value={newRental.type}
                    onChange={(e) => setNewRental({...newRental, type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm bg-white"
                  >
                    <option value="Quarto">Quarto</option>
                    <option value="Apartamento T0/Studio">Apartamento T0 / Studio</option>
                    <option value="Apartamento T1">Apartamento T1</option>
                    <option value="Apartamento T2">Apartamento T2</option>
                    <option value="Apartamento T3+">Apartamento T3+</option>
                    <option value="Moradia">Moradia Inteira</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Mensal (€)*</label>
                  <input 
                    type="number" required min="1"
                    placeholder="Ex: 300"
                    value={newRental.price}
                    onChange={(e) => setNewRental({...newRental, price: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Morada / Zona</label>
                  <input 
                    type="text"
                    placeholder="Ex: Centro de Tarouca, Vila Nova de Paiva"
                    value={newRental.address}
                    onChange={(e) => setNewRental({...newRental, address: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link de Imagem (Opcional)</label>
                <input 
                  type="url"
                  placeholder="URL de imagem com início em http:// ou https://"
                  value={newRental.imageUrl}
                  onChange={(e) => setNewRental({...newRental, imageUrl: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proprietário / Contacto*</label>
                  <input 
                    type="text" required
                    placeholder="Nome do anunciante"
                    value={newRental.contactName}
                    onChange={(e) => setNewRental({...newRental, contactName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telemóvel*</label>
                  <input 
                    type="tel" required
                    placeholder="Ex: 912345678"
                    value={newRental.contactPhone}
                    onChange={(e) => setNewRental({...newRental, contactPhone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
                  <input 
                    type="email"
                    placeholder="Ex: email@servico.com"
                    value={newRental.contactEmail}
                    onChange={(e) => setNewRental({...newRental, contactEmail: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição do Imóvel*</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Indique os detalhes da habitação (se inclui despesas, mobilado, aquecimento, quintal, estacionamento, etc.)..."
                  value={newRental.description}
                  onChange={(e) => setNewRental({...newRental, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsRentalModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition font-bold text-sm shadow-md"
                >
                  Publicar Habitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-300">
            © 2026 Interiorizate Youth. Todos os direitos reservados.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Promovemos o desenvolvimento comunitário sustentável do interior português apoiando os jovens na sua fixação, emprego e integração cultural.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="https://youth.interiorizate.pt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Website Oficial</a>
            <span>•</span>
            <span className="text-amber-500 font-bold">Moimenta da Beira • Sernancelhe • Tarouca • Armamar • Vila Nova de Paiva • Aguiar da Beira • Tabuaço</span>
          </div>
        </div>
      </footer>
    </div>
  );
}