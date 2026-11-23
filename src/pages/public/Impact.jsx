import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { UtensilsCrossed, Leaf, HeartHandshake, Users, ArrowRight, Info } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, SectionHeading, Badge, DemoBadge, Button } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { adminStats, donationsByDay, donationsByCategory } from '../../lib/stats';
import { CATEGORY_LABELS, SDG_GOALS } from '../../lib/constants';

const PIE_COLORS = ['#236B4E', '#57A37E', '#A8D5BA', '#F4A261', '#E9E4FA', '#8FC7A8', '#FBD9B8', '#B9DDC8'];

export default function Impact() {
  const { donations, users } = useData();
  const stats = adminStats(users, donations);
  const daily = useMemo(() => donationsByDay(donations, 14), [donations]);
  const byCategory = useMemo(
    () => donationsByCategory(donations, CATEGORY_LABELS),
    [donations]
  );

  return (
    <div>
      <PublicNavbar />
      <section className="bg-hero-gradient pb-14 pt-28">
        <div className="container-page">
          <Badge tone="green" className="mb-4">Impact</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
            Every meal counts.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-charcoal/65">
            These figures are computed live from donation records on the platform.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent/30 bg-peach/40 px-4 py-2.5 text-sm text-orange-800 max-w-xl">
            <Info className="h-4 w-4 shrink-0" />
            You are viewing <strong>demo data</strong> — illustrative records seeded for the MVP.
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page space-y-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: UtensilsCrossed, label: 'Meals redirected', value: stats.mealsRedirected.toLocaleString('en-IN'), tone: 'bg-mint text-forest-700' },
              { icon: HeartHandshake, label: 'Donations completed', value: stats.completed, tone: 'bg-peach text-orange-700' },
              { icon: Users, label: 'Community members', value: stats.users, tone: 'bg-lavender text-violet-700' },
              { icon: Leaf, label: 'CO₂e avoided (est.)', value: `${Math.round(stats.mealsRedirected * 0.5)} kg`, tone: 'bg-blue-50 text-blue-700' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card p-6"
              >
                <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="font-display text-3xl font-extrabold text-charcoal">{s.value}</p>
                <p className="mt-1 text-sm text-charcoal/55">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="p-6 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Meals rescued — last 14 days</h3>
                <DemoBadge />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mealsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#236B4E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#236B4E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#24332B80' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#24332B80' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #24332B10', fontSize: 12 }}
                      formatter={(v) => [`${v} meals`, 'Rescued']}
                    />
                    <Area type="monotone" dataKey="meals" stroke="#236B4E" strokeWidth={2.5} fill="url(#mealsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Donations by category</h3>
                <DemoBadge />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #24332B10', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <SectionHeading
              eyebrow="SDG Alignment"
              title="Contributing to five global goals"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {SDG_GOALS.map((g) => (
                <div key={g.id} className="rounded-2xl border border-charcoal/5 p-4">
                  <span
                    className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-extrabold text-white"
                    style={{ backgroundColor: g.color }}
                  >
                    {g.id}
                  </span>
                  <h4 className="font-display text-sm font-bold text-charcoal">{g.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal/55">{g.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="text-center">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight}>Add your impact — join ShareBite</Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}