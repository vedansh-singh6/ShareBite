import { Link } from 'react-router-dom';
import { GraduationCap, Target, Lightbulb, Users2, ArrowRight, BookOpen } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, SectionHeading, Badge, Button, Avatar } from '../../components/ui';

const TEAM = [
  'Pratyush Singh',
  'Vedansh Singh',
  'Anuneet Sharma',
  'Abhijeet Shankar Pathak',
];

const OBJECTIVES = [
  { icon: Target, title: 'Reduce avoidable food waste', desc: 'Give surplus edible food a fast, reliable path to people who need it.' },
  { icon: Lightbulb, title: 'Replace manual coordination', desc: 'One platform instead of scattered calls, messages and personal contacts.' },
  { icon: Users2, title: 'Empower communities', desc: 'Connect restaurants, hostels, NGOs and volunteers in a shared, transparent workflow.' },
];

export default function About() {
  return (
    <div>
      <PublicNavbar />
      <section className="bg-hero-gradient pb-16 pt-28">
        <div className="container-page">
          <Badge tone="green" className="mb-4">Societal Project · Academic Year 2026–27</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
            About ShareBite
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/65">
            A smart food waste redistribution platform built as a societal project at
            BMS Institute of Technology and Management, Yelahanka, Bengaluru —
            Department of Artificial Intelligence and Machine Learning.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SectionHeading
              eyebrow="Why we built it"
              title="From a campus observation to a community platform"
            />
            <div className="space-y-4 text-base leading-relaxed text-charcoal/70">
              <p>
                Every day, restaurants, college hostels, supermarkets, hotels and event
                organizers end up with perfectly edible surplus food. At the same time,
                many people in the same city face food insecurity. The gap is not a lack
                of food — it is a lack of <strong>timely, coordinated redistribution</strong>.
              </p>
              <p>
                Today this coordination happens over phone calls and messaging groups.
                It is slow, fragmented and hard to track. Food often spoils before a
                nearby receiver can be found and a pickup can be arranged.
              </p>
              <p>
                ShareBite centralizes the entire journey: donors register surplus food with
                quantity, location and a safety deadline; NGOs accept what they can use;
                volunteers collect and deliver; and every step is tracked in one shared
                record that all parties can see.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {OBJECTIVES.map((o) => (
                <Card key={o.title} className="p-5">
                  <o.icon className="mb-3 h-5 w-5 text-forest-600" />
                  <h3 className="font-display text-sm font-bold text-charcoal">{o.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-charcoal/55">{o.desc}</p>
                </Card>
              ))}
            </div>
            <Card className="border-lavender bg-lavender/30 p-6">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div>
                  <h3 className="font-display text-sm font-bold text-charcoal">Phase 1 scope & future work</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">
                    This MVP implements the complete donation workflow with role-based dashboards.
                    Planned extensions include surplus prediction for hostels (using consumption and
                    attendance data), smart NGO matching by distance and urgency, early alerts, and
                    live maps. These are intentionally out of scope for Phase 1.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-forest-600" />
                <h3 className="font-display text-base font-bold">Project Team</h3>
              </div>
              <ul className="space-y-3">
                {TEAM.map((name) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <span className="text-sm font-medium text-charcoal/80">{name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-cream p-4 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-charcoal/45">Project Guide</p>
                <p className="mt-1 font-semibold text-charcoal">Prof. Amitha S K</p>
                <p className="text-xs text-charcoal/55">Dept. of AI & ML, BMSIT&M</p>
              </div>
            </Card>
            <Card className="bg-mint/50 p-6">
              <h3 className="font-display text-base font-bold text-charcoal">Try the live demo</h3>
              <p className="mt-2 text-sm text-charcoal/60">
                Explore all four role dashboards with demo accounts — no signup needed.
              </p>
              <Link to="/login">
                <Button className="mt-4 w-full" icon={ArrowRight}>Open demo login</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}