import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  FileText,
  CheckCircle,
  Map,
  ArrowRight,
  Cpu,
  Layers,
  Search,
  Activity
} from 'lucide-react'

function HomeCitizen() {
  const intelligenceFlow = [
    {
      icon: Search,
      title: 'Scheme Discovery Agent',
      desc: 'Scans government databases using semantic retrieval and relevance scoring.'
    },
    {
      icon: Users,
      title: 'Eligibility Evaluation Agent',
      desc: 'Applies rule-based and contextual eligibility checks per citizen profile.'
    },
    {
      icon: FileText,
      title: 'Document Validation Agent',
      desc: 'Verifies document completeness, correctness, and scheme alignment.'
    },
    {
      icon: CheckCircle,
      title: 'Pathway Generation Agent',
      desc: 'Generates a personalized, step-by-step application roadmap.'
    }
  ]

  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-white text-slate-800">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 py-28 relative">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Cpu className="w-6 h-6 text-blue-700" />
                </div>
                <span className="text-blue-700 font-semibold tracking-wide">
                  AI-Powered Citizen Assistance Platform
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-slate-900">
                Find the Right Government Schemes
                <br />
                <span className="text-blue-700">
                  With Clarity & Confidence
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mb-10">
                Discover government schemes relevant to you, understand your
                eligibility clearly, and get guided through the application
                process — all in one place.
              </p>

              <div className="flex gap-4">
                <Link
                  to="/profile"
                  className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 transition"
                >
                  Start Evaluation
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="px-6 py-4 rounded-lg border border-blue-300 text-blue-700 bg-blue-50">
                  Secure • Transparent • Easy to Use
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden lg:block">
              <div className="relative bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-blue-700 mb-4 font-medium">
                  What This Platform Helps You With
                </div>

                <ul className="space-y-4 text-slate-600">
                  <li className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    Clear eligibility checks
                  </li>
                  <li className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-green-600" />
                    Step-by-step application guidance
                  </li>
                  <li className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    Trusted and explainable recommendations
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CITIZEN VALUE */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              What You Can Do on This Platform
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Designed to help citizens access government benefits
              without confusion or guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <Search className="w-8 h-8 text-blue-700 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Discover Relevant Schemes
              </h3>
              <p className="text-slate-600 text-sm">
                Find central and state government schemes applicable
                to your personal and socio-economic profile.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <CheckCircle className="w-8 h-8 text-blue-700 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Check Eligibility Clearly
              </h3>
              <p className="text-slate-600 text-sm">
                Understand eligibility upfront before spending time
                on applications or document collection.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <Map className="w-8 h-8 text-blue-700 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Follow the Right Steps
              </h3>
              <p className="text-slate-600 text-sm">
                Get a clear view of required documents, steps,
                and where to apply — all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT EXISTS */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">
            Why This Platform Was Built
          </h2>

          <p className="text-slate-600 leading-relaxed">
            Many citizens miss out on government benefits due to lack of awareness,
            unclear eligibility rules, complex documentation, or fragmented information
            across portals. This platform brings clarity by guiding citizens through
            the process in a structured, transparent, and easy-to-understand manner —
            helping ensure that welfare schemes reach the people they are meant for.
          </p>
        </div>
      </section>

      {/* INTELLIGENCE FLOW */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              How the System Thinks
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Each request is processed through a structured multi-agent
              intelligence pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {intelligenceFlow.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-400 transition"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-700" />
                  </div>

                  <h3 className="font-semibold text-lg mb-2 text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 bg-blue-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">
            Built for Fairness, Transparency & Trust
          </h2>

          <p className="text-slate-600 max-w-3xl mx-auto">
            This platform focuses on clarity and explainability — helping citizens
            understand why schemes are recommended and what steps are required,
            rather than relying on opaque or confusing systems.
          </p>
        </div>
      </section>

    </div>
  )
}

export default HomeCitizen
