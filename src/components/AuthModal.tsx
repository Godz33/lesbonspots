import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (message: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorText('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const name = user.displayName ? user.displayName.split(' ')[0] : 'Voyageur';
      if (onAuthSuccess) {
        onAuthSuccess(`👋 Bienvenue, ${name} ! Connexion réussie.`);
      }
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setErrorText("⚠️ Le pop-up de connexion a été bloqué par votre navigateur. Veuillez autoriser les pop-ups pour ce site.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorText("⚠️ Connexion annulée.");
      } else {
        setErrorText(`❌ Une erreur est survenue lors de la connexion Google (${err.message})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorText('');

    if (!email || !password) {
      setErrorText("⚠️ Veuillez remplir tous les champs requis.");
      setIsLoading(false);
      return;
    }

    if (isSignUp && !firstName.trim()) {
      setErrorText("⚠️ Veuillez indiquer votre prénom pour personnaliser votre profil.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name
        await updateProfile(credential.user, {
          displayName: firstName.trim()
        });
        if (onAuthSuccess) {
          onAuthSuccess(`🎉 Compte créé avec succès ! Bienvenue ${firstName.trim()}.`);
        }
      } else {
        // Sign in user
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const name = credential.user.displayName || credential.user.email?.split('@')[0] || 'Voyageur';
        if (onAuthSuccess) {
          onAuthSuccess(`👋 Content de vous revoir, ${name} !`);
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = "L'adresse email n'est pas valide.";
      } else if (err.code === 'auth/user-disabled') {
        friendlyMessage = "Ce compte utilisateur a été désactivé.";
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = "Aucun utilisateur trouvé avec cette adresse email.";
      } else if (err.code === 'auth/wrong-password') {
        friendlyMessage = "Le mot de passe saisi est incorrect.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Cette adresse email est déjà associée à un compte existant.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Le mot de passe est trop faible. Veuillez saisir au moins 6 caractères.";
      } else if (err.code === 'auth/missing-password') {
        friendlyMessage = "Le mot de passe est requis.";
      }
      setErrorText(`❌ ${friendlyMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="auth-modal-overlay">
      {/* Backdrop backdrop blur */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#fbf7f3] border border-[#e3d5c5] px-6 pb-8 pt-10 text-left shadow-2xl transition-all w-full max-w-md space-y-6">
          
          {/* Close button with nice details */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-full transition-all cursor-pointer"
            id="close-auth-modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon Brand + Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#1e3427] text-white">
              <Sparkles className="h-6 w-6 text-[#ff6f3c] animate-pulse" />
            </div>
            <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              {isSignUp ? 'Créer un compte Voyageur' : 'Se connecter à l\'Espace Club'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              {isSignUp 
                ? 'Rejoignez les backpackers qui achètent et vendent au meilleur prix partout en Australie !' 
                : 'Retrouvez votre tableau de bord, gérez vos véhicules d\'aventure et échangez instantanément.'}
            </p>
          </div>

          {/* Google Quick Sign-In */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-700 font-bold text-sm py-3 px-5 rounded-2xl border border-[#e3d5c5] shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              id="google-signin-btn"
            >
              {/* Manual elegant simple inline SVG logo Google */}
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 2.152 15.522 1 12.24 1 6.012 1 1 6.012 1 12.24s5.012 11.24 11.24 11.24c6.5 0 10.82-4.57 10.82-11.014 0-.74-.08-1.3-.176-1.74H12.24z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <div className="relative flex py-2 items-center text-xs text-stone-400 font-mono">
              <div className="flex-grow border-t border-[#e3d5c5]/80"></div>
              <span className="flex-shrink mx-3">OU PAR ADRESSE EMAIL</span>
              <div className="flex-grow border-t border-[#e3d5c5]/80"></div>
            </div>
          </div>

          {/* Error Alert panel */}
          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 font-medium leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4" id="email-pass-auth-form">
            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-older font-mono">Votre Prénom *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white border border-[#e3d5c5] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-older font-mono">Adresse Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="votre.nom@adresse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none placeholder-stone-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-older font-mono">Mot de passe *</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Saisissez votre passe (min. 6 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none placeholder-stone-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1e3427] hover:bg-[#2c4c39] text-[#fbf7f3] font-bold text-xs py-3 px-5 rounded-2xl w-full transition-all shadow-md active:scale-97 cursor-pointer disabled:opacity-50"
              id="submit-auth-btn"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-dashed border-stone-200 animate-spin" />
                  Traitement en cours...
                </span>
              ) : (
                <span>{isSignUp ? 'Créer mon compte et rejoindre' : 'Me connecter à mon espace'}</span>
              )}
            </button>
          </form>

          {/* Toggle register / sign-in */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorText('');
              }}
              className="text-xs font-semibold text-[#b35431] hover:underline cursor-pointer"
              id="toggle-auth-mode"
            >
              {isSignUp 
                ? 'Vous avez déjà un compte ? Connectez-vous' 
                : 'Pas encore inscrit ? Créez un compte gratuitement'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
