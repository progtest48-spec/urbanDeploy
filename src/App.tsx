import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Car, 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  MapPin, 
  Trash2, 
  Info,
  Filter,
  X,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD_DPH5QZJIZoU7IeRjCHyrT0dRbOV9K1k",
  authDomain: "gen-lang-client-0094687133.firebaseapp.com",
  projectId: "gen-lang-client-0094687133",
  storageBucket: "gen-lang-client-0094687133.firebasestorage.app",
  messagingSenderId: "521348852814",
  appId: "1:521348852814:web:1430340d0188a30906e71f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

type Listing = {
  id: string;
  type: 'car' | 'building';
  category: 'rent' | 'buy';
  title: string;
  price: number;
  location: string;
  image: string;
  authorId: string;
  authorName?: string;
  specs?: Record<string, string>;
};

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeType, setActiveType] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubSnap = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
    });
    return () => { unsubAuth(); unsubSnap(); };
  }, []);

  const handleAddListing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await addDoc(collection(db, 'listings'), {
      ...data,
      price: Number(data.price),
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: serverTimestamp(),
      specs: data.type === 'car' ? { 'Engine': 'Standard', 'Seats': '5' } : { 'Size': '1,000 sqft', 'Bedrooms': '2' }
    });
    
    setIsModalOpen(false);
  };

  const filtered = listings.filter(item => {
    const mType = activeType === 'all' || item.type === activeType;
    const mCat = activeCategory === 'all' || item.category === activeCategory;
    const mSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const mMine = !showMyListings || (user && item.authorId === user.uid);
    return mType && mCat && mSearch && mMine;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Building2 size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">UrbanAm</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#666]">
            {['Marketplace', 'Services', 'Support'].map(item => (
              <button key={item} className="hover:text-[#1A1A1A] transition-colors">{item}</button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-[#1A1A1A] text-white text-sm font-bold rounded-full hover:bg-[#333] transition-all shadow-md active:scale-95"
                >
                  List Property
                </button>
                <div className="group relative">
                  <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer" alt="avatar" />
                  <div className="absolute top-full right-0 mt-2 p-2 hidden group-hover:block w-48">
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xl p-2">
                      <p className="text-xs text-[#999] px-3 py-2 border-b mb-1">{user.email}</p>
                      <button 
                        onClick={() => signOut(auth)}
                        className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
                className="px-6 py-2 bg-[#1A1A1A] text-white text-sm font-bold rounded-full hover:bg-[#333] transition-colors flex items-center gap-2 shadow-lg"
              >
                <LogIn size={18} /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Dynamic Header */}
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div>
              <h1 className="text-6xl md:text-8xl font-serif font-light tracking-tight mb-4 leading-none">
                Modern <br />
                <span className="italic font-normal">Living.</span>
              </h1>
              <p className="text-[#666] max-w-md text-lg">
                The most exclusive marketplace for high-end properties and premium mobility in Armenia.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="p-6 bg-white border border-[#E5E5E5] rounded-[2.5rem] flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold">120+ Listings</p>
                  <p className="text-xs text-[#999]">Updated live</p>
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Search & Filters */}
        <section className="mb-12 bg-white p-2 rounded-[2rem] shadow-xl border border-[#E5E5E5]">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#999]" size={20} />
              <input 
                type="text" 
                placeholder="Search premium cars, lofts, or apartments..."
                className="w-full pl-16 pr-6 py-5 bg-transparent outline-none text-lg font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1">
              <button 
                onClick={() => setActiveType('car')}
                className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-2 font-bold transition-all ${activeType === 'car' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'hover:bg-[#F5F5F5]'}`}
              >
                <Car size={20} /> Cars
              </button>
              <button 
                onClick={() => setActiveType('building')}
                className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-2 font-bold transition-all ${activeType === 'building' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'hover:bg-[#F5F5F5]'}`}
              >
                <Building2 size={20} /> Buildings
              </button>
              {activeType !== 'all' && (
                <button 
                  onClick={() => setActiveType('all')}
                  className="px-4 py-4 hover:bg-red-50 text-red-500 rounded-[1.5rem]"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-12">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-6">Market</h3>
              <div className="space-y-2">
                {['all', 'rent', 'buy'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${activeCategory === cat ? 'bg-[#1A1A1A] text-white shadow-md shadow-black/10' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            {user && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-6">Your Activity</h3>
                <button 
                  onClick={() => setShowMyListings(!showMyListings)}
                  className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-bold transition-all ${showMyListings ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
                >
                  {showMyListings ? 'Show Everything' : 'My Own Listings'}
                </button>
              </div>
            )}

            <div className="relative group overflow-hidden bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck size={120} />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10">Premium Concierge</h4>
              <p className="text-white/60 text-sm mb-6 leading-relaxed relative z-10">
                Our experts handle every detail from paperwork to delivery.
              </p>
              <button className="w-full py-4 bg-white text-[#1A1A1A] rounded-2xl text-sm font-extrabold hover:bg-[#F0F0F0] transition-colors relative z-10">
                Contact Agent
              </button>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm font-medium text-[#666]">
                Found <span className="text-[#1A1A1A] font-bold">{filtered.length}</span> results
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-[#666] cursor-pointer hover:text-[#1A1A1A]">
                <Filter size={16} />
                <span>Sort: Most Recent</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode='popLayout'>
                {filtered.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group bg-white rounded-[2.5rem] overflow-hidden border border-[#E5E5E5] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                  >
                    <div className="relative h-72 overflow-hidden">
                      <img 
                        src={item.image} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                        alt={item.title}
                      />
                      <div className="absolute top-6 left-6 flex gap-2">
                        <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">{item.category}</span>
                        <span className="px-4 py-1.5 bg-[#1A1A1A] text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">{item.type}</span>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A] leading-tight group-hover:text-amber-900 transition-colors">{item.title}</h3>
                          <div className="flex items-center gap-1.5 text-[#999] text-sm font-medium">
                            <MapPin size={14} className="text-amber-600" />
                            <span>{item.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-[#1A1A1A]">${item.price.toLocaleString()}</p>
                          {user && item.authorId === user.uid && (
                            <button 
                              onClick={() => deleteDoc(doc(db, 'listings', item.id))}
                              className="mt-3 p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-[#F0F0F0]">
                        <div className="flex gap-4">
                          {item.specs && Object.entries(item.specs).map(([k, v]) => (
                            <div key={k}>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-1">{k}</p>
                              <p className="text-xs font-bold">{v}</p>
                            </div>
                          ))}
                        </div>
                        <button className="p-3 bg-[#F5F5F5] rounded-2xl hover:bg-[#1A1A1A] hover:text-white transition-all transform group-hover:translate-x-1">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-[#E5E5E5]"
              >
                <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6 text-[#999]">
                  <Search size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Refine your search</h3>
                <p className="text-[#666] max-w-sm mx-auto">
                  We couldn't find any premium matches for your current filters.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E5E5E5] py-24 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
                <Building2 size={16} />
              </div>
              <span className="text-lg font-bold tracking-tight">UrbanAm</span>
            </div>
            <p className="text-[#666] max-w-xs text-lg leading-relaxed">
              Curating the finest mobility and residential experiences in Armenia. Confidence in every transaction.
            </p>
          </div>
          <div className="space-y-6">
            <h5 className="font-bold text-sm uppercase tracking-widest text-[#999]">Marketplace</h5>
            <ul className="space-y-4 text-sm font-bold text-[#666]">
              {['Rent Cars', 'Buy Cars', 'Luxury Stays', 'Commercial lofts'].map(link => (
                <li key={link}><button className="hover:text-[#1A1A1A] transition-colors">{link}</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-bold text-sm uppercase tracking-widest text-[#999]">Connect</h5>
            <ul className="space-y-4 text-sm font-bold text-[#666]">
              <li><button className="hover:text-[#1A1A1A]">Instagram</button></li>
              <li><button className="hover:text-[#1A1A1A]">WhatsApp</button></li>
              <li><button className="hover:text-[#1A1A1A]">Telegram</button></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Modern Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl p-12"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-3 bg-[#F5F5F5] rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-4xl font-serif font-light tracking-tight mb-8">List your <span className="italic font-normal underline decoration-amber-500/30">exclusive</span> property</h2>
              
              <form onSubmit={handleAddListing} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Type</label>
                    <select name="type" className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl outline-none font-bold appearance-none cursor-pointer hover:bg-[#F0F0F0] transition-colors">
                      <option value="car">Automobile</option>
                      <option value="building">Real Estate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Market</label>
                    <select name="category" className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl outline-none font-bold appearance-none cursor-pointer hover:bg-[#F0F0F0] transition-colors">
                      <option value="rent">Rent</option>
                      <option value="buy">Purchase</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Title / Model</label>
                  <input name="title" required type="text" placeholder="e.g. Porsche 911 GT3 or Cascade Penthouse" className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl border border-transparent focus:border-[#1A1A1A] focus:bg-white outline-none transition-all font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Price (USD)</label>
                    <input name="price" required type="number" placeholder="2500" className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl border border-transparent focus:border-[#1A1A1A] focus:bg-white outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Location</label>
                    <input name="location" required type="text" placeholder="Northern Avenue, Yerevan" className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl border border-transparent focus:border-[#1A1A1A] focus:bg-white outline-none transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#999]">High-Res Image URL</label>
                  <input name="image" required type="url" placeholder="https://..." className="w-full px-6 py-4 bg-[#F5F5F5] rounded-2xl border border-transparent focus:border-[#1A1A1A] focus:bg-white outline-none transition-all font-bold" />
                </div>
                <button type="submit" className="w-full py-5 bg-[#1A1A1A] text-white rounded-3xl font-extrabold hover:bg-[#333] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-black/20">
                  <Plus size={20} /> Publish to Marketplace
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
