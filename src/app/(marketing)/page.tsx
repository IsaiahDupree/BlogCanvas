import Link from 'next/link'
import { 
  Sparkles, 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  CheckCircle,
  ArrowRight,
  Globe,
  FileText,
  Bot,
  Shield,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SITE_URL } from '@/lib/site-url'

export const metadata = {
  description: 'Organize blog research, drafts, review, and publishing in one content workflow.',
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    title: 'BlogCanvas - AI-Powered Content at Scale',
    description: 'Organize blog research, drafts, review, and publishing in one content workflow.',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">BlogCanvas</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/app">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Content Creation Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Build a better blog workflow<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              with AI assistance
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            BlogCanvas helps agencies and content teams organize research, drafts,
            reviews, and publishing in one content workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-lg">
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Watch Demo
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Explore the workflow before deciding whether it fits your team.
          </p>
        </div>

        {/* Workflow overview */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-xl font-bold text-white">Research</p>
                <p className="text-gray-400">Start with a source-aware brief</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">Create</p>
                <p className="text-gray-400">Shape drafts and editorial workflows</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">Review</p>
                <p className="text-gray-400">Keep feedback and approvals visible</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">Publish</p>
                <p className="text-gray-400">Connect approved content to your CMS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Content
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From research to publishing, BlogCanvas handles the entire content workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: 'AI Research Agent',
                description: 'Automatically researches your topic, finds credible sources, and gathers data points to support your content.',
                color: 'blue'
              },
              {
                icon: FileText,
                title: 'Smart Outline Generation',
                description: 'Generate multiple outline options with AI, then drag-and-drop to customize the perfect structure.',
                color: 'purple'
              },
              {
                icon: Zap,
                title: 'One-Click Drafts',
                description: 'Transform outlines into full, well-written drafts in seconds. Edit and refine with AI assistance.',
                color: 'yellow'
              },
              {
                icon: Target,
                title: 'SEO Optimization',
                description: 'Built-in SEO scoring, keyword optimization, and meta tag generation to rank higher on Google.',
                color: 'green'
              },
              {
                icon: Shield,
                title: 'Fact Checking',
                description: 'AI-powered fact verification catches inaccuracies before you publish. Stay credible.',
                color: 'red'
              },
              {
                icon: BarChart3,
                title: 'Content Analytics',
                description: 'Track performance, quality scores, and team productivity with detailed analytics.',
                color: 'indigo'
              },
              {
                icon: Users,
                title: 'Client Portal',
                description: 'Give clients access to review and approve content. Streamline the feedback process.',
                color: 'pink'
              },
              {
                icon: Globe,
                title: 'Multi-Channel Publishing',
                description: 'Publish directly to WordPress, Medium, or any CMS. Schedule posts in advance.',
                color: 'cyan'
              },
              {
                icon: Clock,
                title: 'Batch Processing',
                description: 'Create content calendars and generate multiple posts at once. Scale efficiently.',
                color: 'orange'
              }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-6 bg-white border rounded-xl hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From Idea to Published
            </h2>
            <p className="text-xl text-gray-600">
              Our AI agents handle the heavy lifting so you can focus on strategy
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Enter Your Topic', desc: 'Just type what you want to write about' },
              { step: '2', title: 'AI Researches', desc: 'Our agents gather sources and data' },
              { step: '3', title: 'Review & Edit', desc: 'Fine-tune the AI-generated content' },
              { step: '4', title: 'Publish', desc: 'One-click publishing to your CMS' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 bg-white border rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">Perfect for trying out BlogCanvas</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                $0<span className="text-lg font-normal text-gray-500">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {['5 blog posts/month', 'Basic AI research', 'SEO scoring', 'Export to HTML'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-white relative">
              <h3 className="text-lg font-semibold mb-2">Professional</h3>
              <p className="text-blue-100 mb-4">For growing content teams</p>
              <p className="text-4xl font-bold mb-6">
                $49<span className="text-lg font-normal text-blue-200">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {['Unlimited blog posts', 'Advanced AI agents', 'Client portal', 'WordPress integration', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">Start Free Trial</Button>
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="p-8 bg-white border rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Agency</h3>
              <p className="text-gray-600 mb-4">For agencies managing multiple clients</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                $199<span className="text-lg font-normal text-gray-500">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'Unlimited clients', 'White-label portal', 'API access', 'Dedicated support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Content Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Research, draft, review, and publish through one content workflow.
          </p>
          <Link href="/app">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
              Start Creating Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BlogCanvas</span>
              </div>
              <p className="text-sm">AI-powered content creation for teams that need to scale.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/app" className="hover:text-white">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-sm text-center">
            © {new Date().getFullYear()} BlogCanvas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
