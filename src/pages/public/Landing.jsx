import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, HeartHandshake, UtensilsCrossed, Building2, Bike, Users,
  PhoneCall, Timer, SearchX, Leaf, ClipboardList, Handshake, Truck, Gift,
  Sparkles, TrendingUp, Globe2,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Button, Badge, SectionHeading, Card } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { adminStats } from '../../lib/stats';
import { SDG_GOALS, HERO_IMAGE, FOOD_IMAGES, STATUS } from '../../lib/constants';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PROBLEMS = [
  {
    icon: PhoneCall,
    title: 'Manual coordination',
    desc: 'Donors rely on calls, messaging apps and personal contacts to find someone who can take surplus food.',
  },
  {
    icon: Timer,
    title: 'Delays cost food',
    desc: 'By the time a nearby NGO is found and pickup is arranged, perfectly edible food has often spoiled.',
  },
  {
    icon: SearchX,
    title: 'No visibility',
    desc: 'There is no shared record of what surplus exists, where it is, and how long it will stay safe to eat.',
  },
];

const STEPS = [
  { icon: ClipboardList, title: 'Register', desc: 'Donors list surplus food with quantity, location and a safe-collection deadline.', color: 'bg-mint text-forest-700' },
  { icon: Handshake, title: 'Match', desc: 'Nearby NGOs browse available donations and accept what they can redistribute.', color: 'bg-peach text-orange-700' },
  { icon: Truck, title: 'Collect', desc: 'Volunteers pick up the food and deliver it, confirming each step in the app.', color: 'bg-lavender text-violet-700' },
  { icon: Gift, title: 'Redistribute', desc: 'The NGO confirms receipt and the food reaches people who need it. Records update for everyone.', color: 'bg-blue-50 text-blue-700' },
];

const AUDIENCES = [
  {
    icon: UtensilsCrossed,
    title: 'Restaurants & Hotels',
    desc: 'Turn end-of-service surplus into meals for the community instead of waste.',
    img: FOOD_IMAGES[1],
    role: 'donor',
  },
  {
    icon: Building2,
    title: 'Hostels & PGs',
    desc: 'Mess kitchens regularly cook extra. List it before it goes to the bin.',
    img: FOOD_IMAGES[2],
    role: 'donor',
  },
  {
    icon: HeartHandshake,
    title: 'NGOs & Communities',
    desc: 'Browse verified donations nearby, accept them and coordinate collection.',
    img: FOOD_IMAGES[4],
    role: 'ngo',
  },
  {
    icon: Bike,
    title: 'Volunteers',
    desc: 'Take short collection tasks in your area and make a direct, visible impact.',
    img: FOOD_IMAGES[5],
    role: 'volunteer',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { donations, users } = useData();
  const stats = adminStats(users, donations);
  const completedMeals = stats.mealsRedirected;

  useEffect(() => {
    const id = location.state?.scrollTo;
    if (id) {
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  return (
    <div className="overflow-x-clip">
      <PublicNavbar />

      {/* ================= HERO ================= */}
      <section className="relative bg-hero-gradient pb-20 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sage/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-lavender/50 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <Badge tone="green" className="mb-5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Food redistribution, reimagined
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-5xl lg:text-6xl"
            >
              Good Food Deserves a{' '}
              <span className="relative whitespace-nowrap text-forest-600">
                Second Chance.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 220 10" fill="none" aria-hidden="true">
                  <path d="M2 7c60-6 150-6 216-3" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 max-w-lg text-lg leading-relaxed text-charcoal/65"
            >
              ShareBite connects surplus food providers with NGOs and volunteers —
              so edible food reaches people in time, not landfills.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button size="lg" icon={UtensilsCrossed} onClick={() => navigate('/register?role=donor')}>
                Donate Food
              </Button>
              <Button size="lg" variant="secondary" icon={Bike} onClick={() => navigate('/register?role=volunteer')}>
                Become a Volunteer
              </Button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              {[
                [`${completedMeals.toLocaleString('en-IN')}+`, 'meals redirected*'],
                [`${stats.ngos}`, 'NGO partners*'],
                [`${stats.volunteers}`, 'active volunteers*'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl font-extrabold text-forest-700">{value}</p>
                  <p className="text-xs font-medium text-charcoal/50">{label}</p>
                </div>
              ))}
              <p className="w-full text-[11px] text-charcoal/40">*Demo data for illustration</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl shadow-lift">
              <img
                src={HERO_IMAGE}
                alt="Fresh vegetables and wholesome food ready to be shared"
                className="h-[320px] w-full object-cover sm:h-[420px]"
              />
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -left-4 top-8 flex items-center gap-3 rounded-2xl p-3.5 shadow-card sm:-left-8"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest-600">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-charcoal">45 meals accepted</p>
                <p className="text-xs text-charcoal/55">Annapurna Foundation · just now</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="glass absolute -bottom-5 right-2 flex items-center gap-3 rounded-2xl p-3.5 shadow-card sm:right-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach text-orange-600">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-charcoal">Volunteer on the way</p>
                <p className="text-xs text-charcoal/55">Pickup in 12 minutes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="py-20" id="problem">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="The Problem"
              title="Edible food is wasted while people go hungry"
              subtitle="Restaurants, hostels, supermarkets and events generate surplus every day. Without a fast, coordinated way to redirect it, good food becomes waste."
              center
            />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <Card hover className="h-full p-7">
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-peach text-orange-600">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-charcoal">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{p.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-mint-fade py-20" id="how-it-works">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="How It Works"
              title="Four steps from surplus to smiles"
              subtitle="One shared pipeline keeps donors, NGOs and volunteers in sync — every status change is visible to everyone involved."
              center
            />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <Card hover className="relative h-full p-7">
                  <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-charcoal/5">
                    {i + 1}
                  </span>
                  <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-charcoal">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Button variant="secondary" size="lg" icon={ArrowRight} onClick={() => navigate('/register')}>
              Join the pipeline
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ================= AUDIENCES ================= */}
      <section className="py-20" id="who">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Who It's For"
              title="Built for everyone in the food chain"
              center
            />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.08}>
                <Card hover className="group h-full overflow-hidden">
                  <div className="h-36 overflow-hidden">
                    <img
                      src={a.img}
                      alt={a.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest-600">
                      <a.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-bold text-charcoal">{a.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">{a.desc}</p>
                    <Link
                      to={`/register?role=${a.role}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-700"
                    >
                      Get started <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= IMPACT ================= */}
      <section className="bg-charcoal py-20 text-white" id="impact">
        <div className="container-page">
          <Reveal>
            <div className="mb-12 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-sage">
                <TrendingUp className="h-3.5 w-3.5" /> Impact Dashboard
              </span>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Small actions, measurable change</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
                Live figures computed from platform records. Currently showing clearly-labelled demo data.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: completedMeals.toLocaleString('en-IN'), label: 'Meals redirected', icon: UtensilsCrossed },
              { value: stats.completed, label: 'Donations completed', icon: HeartHandshake },
              { value: stats.donors + stats.ngos + stats.volunteers, label: 'Platform members', icon: Users },
              { value: `${Math.round(completedMeals * 0.5)} kg`, label: 'CO₂e emissions avoided*', icon: Leaf },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur transition-colors hover:bg-white/10">
                  <s.icon className="mb-4 h-6 w-6 text-sage" />
                  <p className="font-display text-3xl font-extrabold">{s.value}</p>
                  <p className="mt-1 text-sm text-white/55">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <p className="text-xs text-white/40">
              Demo data · *Estimated at ~0.5 kg CO₂e per meal rescued, for illustration only.
            </p>
            <Link to="/impact" className="mt-4 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-sage hover:text-white">
              Explore the impact page <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= SDG ================= */}
      <section className="py-20" id="sdg">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Global Goals"
              title="Aligned with the UN Sustainable Development Goals"
              subtitle="ShareBite contributes directly to five SDGs through timely, coordinated food redistribution."
              center
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {SDG_GOALS.map((g, i) => (
              <Reveal key={g.id} delay={i * 0.07}>
                <Card hover className="h-full overflow-hidden">
                  <div className="flex h-20 items-center justify-center" style={{ backgroundColor: g.color }}>
                    <Globe2 className="absolute h-16 w-16 text-white/10" />
                    <span className="font-display text-3xl font-extrabold text-white">SDG {g.id}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-sm font-bold text-charcoal">{g.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-charcoal/55">{g.desc}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="pb-24">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-600 to-forest-800 px-8 py-16 text-center text-white shadow-lift sm:px-16">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sage/20 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
              <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">
                Ready to give food a second chance?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/70">
                Join as a donor, NGO or volunteer. It takes less than two minutes to start
                rescuing food in your neighbourhood.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="accent" onClick={() => navigate('/register')}>
                  Get Started — it's free
                </Button>
                <Button
                  size="lg"
                  className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => navigate('/login')}
                >
                  I already have an account
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}