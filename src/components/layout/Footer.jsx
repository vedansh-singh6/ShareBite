import { Link } from 'react-router-dom';
import { Mail, MapPin, Github, Heart } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-charcoal/5 bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal/60">
            ShareBite connects surplus food providers with NGOs and volunteers so good food
            reaches people — not landfills. A societal project by BMS Institute of Technology
            and Management, Bengaluru.
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-charcoal/45">
            Built with <Heart className="h-3.5 w-3.5 text-accent" /> for SDG 2 — Zero Hunger.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/50">Platform</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/#how-it-works" className="text-charcoal/70 hover:text-forest-700">How It Works</Link></li>
            <li><Link to="/about" className="text-charcoal/70 hover:text-forest-700">About the Project</Link></li>
            <li><Link to="/impact" className="text-charcoal/70 hover:text-forest-700">Our Impact</Link></li>
            <li><Link to="/register" className="text-charcoal/70 hover:text-forest-700">Become a Volunteer</Link></li>
            <li><Link to="/register?role=donor" className="text-charcoal/70 hover:text-forest-700">Donate Food</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/50">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-charcoal/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
              BMSIT&M, Yelahanka, Bengaluru 560064
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-forest-600" />
              <a href="mailto:sharebite@bmsit.in" className="hover:text-forest-700">sharebite@bmsit.in</a>
            </li>
            <li className="flex items-center gap-2">
              <Github className="h-4 w-4 shrink-0 text-forest-600" />
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-forest-700">Project Repository</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal/5">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-charcoal/45 sm:flex-row">
          <p>© {new Date().getFullYear()} ShareBite · Societal Project 2026–27 · Dept. of AI & ML, BMSIT&M</p>
          <p>Guide: Prof. Amitha S K · Demo data shown is illustrative</p>
        </div>
      </div>
    </footer>
  );
}