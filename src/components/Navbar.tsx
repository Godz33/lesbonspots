import React, { useState } from 'react';
import { Compass, FileText, PlusCircle, HelpCircle, MapPin, Sparkles, User, LogOut, ChevronDown, List, Heart } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: FirebaseUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'accueil', name: 'Acheter', icon: Compass, badge: 'Aventure' },
    { id: 'vendre', name: 'Vendre', icon: PlusCircle, highlight: true },
    { id: 'quiz', name: 'Quel véhicule est fait pour moi ?', icon: HelpCircle, badge: 'Aide' },
    { id: 'guide', name: 'Guide Rego', icon: FileText }
  ];

  const handleGoMyAds = () => {
    setActiveTab('mes-annonces');
    setDropdownOpen(false);
  };

  const handleGoFavorites = () => {
    setActiveTab('mes-favoris');
    setDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1e3427] text-[#fbf7f3] shadow-md border-b border-[#2c4737]" id="global-navbar">
      {/* Top Australian Outback Banner */}
      <div className="bg-[#b35431] text-[#fbf7f3] text-center text-xs py-1.5 px-4 font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="h-3 w-3 animate-pulse" />
        <span>Le compagnon n°1 des backpackers pour acheter ou revendre un véhicule en Australie 🐨🚗</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <button
            onClick={() => setActiveTab('accueil')}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#ff6f3c] rounded px-1 group text-left cursor-pointer"
            id="navbar-logo"
          >
            <div className="bg-[#b35431] text-[#fbf7f3] p-1.5 rounded-lg shadow-inner group-hover:bg-[#ff6f3c] transition-colors">
              <MapPin className="h-6 w-6 transform rotate-6 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <span className="font-bold sm:text-xl text-lg tracking-tight block text-[#fbf7f3]">
                Le Bon<span className="text-[#ff6f3c]"> Spot</span>
              </span>
              <span className="text-[10px] text-[#a0bfaa] uppercase tracking-widest block -mt-1 font-mono">
                Le Spot des Backpackers
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              if (item.highlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-md cursor-pointer ${
                      isActive
                        ? 'bg-[#ff6f3c] text-white ring-2 ring-white/20'
                        : 'bg-[#b35431] text-[#fbf7f3] hover:bg-[#c95f38] hover:scale-105 active:scale-95'
                    }`}
                    id={`nav-link-${item.id}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#ff6f3c] bg-[#14231b]'
                      : 'text-[#dcefe3] hover:text-[#fbf7f3] hover:bg-[#253f30]'
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 text-[8px] px-1 bg-[#ff6f3c] text-white rounded font-bold uppercase tracking-tighter">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6f3c] rounded-full mx-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Profile Dropdown or Login (Desktop) */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#a0bfaa] bg-[#14231b] py-1.5 px-3 rounded-full border border-[#2c4737]">
              <MapPin className="h-3 w-3 text-[#ff6f3c]" />
              <span>Heure standard d'Australie</span>
            </div>

            {user ? (
              <div className="relative" id="profile-dropdown-container">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#14231b] text-[#fbf7f3] hover:bg-[#253f30] font-semibold text-xs py-1.5 px-3 rounded-full border border-[#2c4737] shadow-sm cursor-pointer transition-all active:scale-97"
                  id="navbar-profile-btn"
                >
                  <div className="h-5 w-5 bg-[#ff6f3c] text-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold uppercase shrink-0">
                    {user.displayName ? user.displayName.slice(0, 2) : (user.email ? user.email.slice(0, 2) : 'V')}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[110px] truncate block text-[#fbf7f3]">
                    {user.displayName ? user.displayName.split(' ')[0] : 'Profil'}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-[#a0bfaa] transition-transform shrink-0 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#fbf7f3] border border-[#e3d5c5] shadow-xl py-2 z-20 text-stone-800"
                      id="navbar-profile-dropdown"
                    >
                      <button
                        onClick={handleGoMyAds}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs sm:text-sm font-bold hover:bg-stone-100 text-stone-700 transition"
                      >
                        <List className="h-4 w-4 text-[#b35431]" />
                        <span>Mes Annonces</span>
                      </button>
                      <button
                        onClick={handleGoFavorites}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs sm:text-sm font-bold hover:bg-stone-100 text-stone-700 transition"
                      >
                        <Heart className="h-4 w-4 text-[#ff6f3c] fill-[#ff6f3c]" />
                        <span>Mes Favoris</span>
                      </button>
                      <div className="border-t border-[#e3d5c5]/60 my-1"></div>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs sm:text-sm font-bold hover:bg-rose-50 text-rose-700 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-[#b35431] hover:bg-[#c95f38] text-white font-bold text-xs py-1.5 px-3.5 sm:px-4 rounded-full shadow-sm cursor-pointer transition-all active:scale-95"
                id="navbar-login-btn"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Navigation (Mobile-First specific bar at bottom or standard optimized) */}
      <div className="md:hidden bg-[#14231b] border-t border-[#2c4737] fixed bottom-0 left-0 right-0 z-50 shadow-lg" id="mobile-navbar-bar">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center relative cursor-pointer ${
                  isActive ? 'text-[#ff6f3c]' : 'text-[#a0bfaa] hover:text-white'
                } ${item.highlight ? 'text-[#ff6f3c]' : ''}`}
                id={`mobile-nav-${item.id}`}
              >
                {item.highlight ? (
                  <div className="bg-[#b35431] text-white p-2.5 rounded-full -mt-6 shadow-md border-4 border-[#14231b] active:scale-90 transition-transform">
                    <IconComponent className="h-5 w-5 text-[#fbf7f3]" />
                  </div>
                ) : (
                  <IconComponent className="h-5 w-5 mb-0.5" />
                )}
                <span className="text-[10px] font-semibold tracking-wider">
                  {item.name}
                </span>
                {isActive && !item.highlight && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#ff6f3c]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
