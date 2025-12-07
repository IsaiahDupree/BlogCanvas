
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: {
    name: string
    avatar: string
    role: string
  }
  publishDate: string
  readTime: string
  views?: number
  seo?: {
    metaTitle: string
    metaDescription: string
  }
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How AI CRM Transforms Sales Processes',
    slug: 'how-ai-crm-transforms-sales-processes',
    excerpt: 'Discover how AI-powered CRM systems are revolutionizing the way sales teams manage relationships and close deals.',
    content: `
      <h2>The Challenge of Traditional CRM</h2>
      <p>Sales teams struggle with manual data entry, missed follow-ups, and lost opportunities. Traditional CRM systems require constant maintenance and often feel like a burden rather than a help.</p>
      
      <h2>How AI Changes Everything</h2>
      <p>AI-powered CRM systems automatically capture interactions, predict the best time to reach out, and prioritize your most valuable relationships.</p>
      
      <h3>Key Benefits:</h3>
      <ul>
        <li><strong>Automatic Data Entry:</strong> No more manual logging of calls and emails</li>
        <li><strong>Smart Reminders:</strong> AI tells you who to contact and when</li>
        <li><strong>Relationship Scoring:</strong> See which relationships need attention</li>
        <li><strong>Predictive Insights:</strong> Know which deals are likely to close</li>
      </ul>

      <h2>Real Results from Real Teams</h2>
      <p>Companies using AI CRM see 3x more deals closed and save 70% of time previously spent on admin work.</p>

      <blockquote>
        "Our team closed 40% more deals in the first quarter after switching to AI CRM. The automatic follow-ups alone were game-changing." - Sarah M., VP of Sales
      </blockquote>

      <h2>Getting Started with AI CRM</h2>
      <p>The best time to adopt AI CRM is now. Start small, measure results, and scale what works.</p>
    `,
    category: 'CRM',
    tags: ['AI', 'Sales', 'Automation', 'CRM'],
    author: {
      name: 'Sarah Johnson',
      avatar: 'SJ',
      role: 'Head of Content'
    },
    publishDate: 'December 1, 2024',
    readTime: '8 min read',
    views: 1243,
    seo: {
      metaTitle: 'How AI CRM Transforms Sales Processes - Complete Guide 2024',
      metaDescription: 'Discover how AI-powered CRM systems are revolutionizing sales. Learn about automatic data entry, smart reminders, and relationship scoring to close 3x more deals.'
    }
  },
  {
    id: 'cve-2025-55182',
    title: 'Summary of CVE-2025-55182',
    slug: 'summary-of-cve-2025-55182',
    excerpt: 'A critical-severity vulnerability in React Server Components affects React 19 and Next.js. Immediate upgrades are required.',
    content: `
      <h2>Summary</h2>
      <p>A critical-severity vulnerability in React Server Components (CVE-2025-55182) affects React 19 and frameworks that use it, including Next.js (CVE-2025-66478). Under certain conditions, specially crafted requests could lead to unintended remote code execution.</p>
      
      <p>We created new rules to address this vulnerability and quickly deployed to the Vercel WAF to automatically protect all projects hosted on Vercel at no cost. However, do not rely on the WAF for full protection. Immediate upgrades to a patched version are required. We also worked with the React team to deliver recommendations to the largest WAF and CDN providers.</p>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
        <p className="font-bold text-yellow-700">Important</p>
        <p>We still strongly recommend upgrading to a patched version regardless of your hosting provider.</p>
      </div>

      <h2>Impact</h2>
      <p>Applications using affected versions of the React Server Components implementation may process untrusted input in a way that allows an attacker to perform remote code execution. The vulnerability is present in versions 19.0, 19.1.0, 19.1.1, and 19.2.0 of the following packages:</p>
      
      <ul>
        <li><code>react-server-dom-parcel</code> (19.0.0, 19.1.0, 19.1.1, and 19.2.0)</li>
        <li><code>react-server-dom-webpack</code> (19.0.0, 19.1.0, 19.1.1, and 19.2.0)</li>
        <li><code>react-server-dom-turbopack</code> (19.0.0, 19.1.0, 19.1.1, and 19.2.0)</li>
      </ul>

      <p>These packages are included in the following frameworks and bundlers:</p>
      <ul>
        <li>Next.js with versions ≥14.3.0-canary.77, ≥15 and ≥16</li>
        <li>Other frameworks and plugins that embed or depend on React Server Components implementation (e.g., Vite, Parcel, React Router, RedwoodSDK, Waku)</li>
      </ul>

      <h2>Resolution</h2>
      <p>After creating mitigations to address this vulnerability, we deployed them across our globally-distributed platform to quickly protect our customers. We still recommend upgrading to the latest patched version.</p>
      
      <p>Updated releases of React and affected downstream frameworks include hardened handling of user inputs to prevent unintended behavior. All users should upgrade to a patched version as soon as possible. If you are on Next.js 14.3.0-canary.77 or a later canary release, downgrade to the latest stable 14.x release.</p>

      <h3>Fixed in:</h3>
      <ul>
        <li><strong>React:</strong> 19.0.1, 19.1.2, 19.2.1</li>
        <li><strong>Next.js:</strong> 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 15.6.0-canary.58, 16.0.7</li>
      </ul>

      <p>Frameworks and bundlers using the aforementioned packages should install the latest versions provided by their respective maintainers.</p>

      <h2>Credit</h2>
      <p>Thanks to Lachlan Davidson for identifying and responsibly reporting the vulnerability, and the Meta Security and React team for their partnership.</p>
      
      <h2>1. What’s changed since that report</h2>
      <p>When that log was written, the patched versions didn’t exist on npm. Now:</p>
      <ul>
        <li><strong>Next.js latest:</strong> 16.0.7</li>
        <li><strong>react latest:</strong> 19.2.1</li>
        <li><strong>react-dom latest:</strong> 19.2.1</li>
      </ul>
      <p>These are explicitly listed as the fixed versions for the React2Shell / RSC RCE advisory. So you can (and should) upgrade now.</p>

      <h2>2. Minimal upgrade commands</h2>
      <p>Assuming you’re already on Next 16.0.x and React 19.x (like your snippet):</p>

      <h3>With npm</h3>
      <pre><code># 1) Upgrade framework + UI libs
npm install next@16.0.7 react@19.2.1 react-dom@19.2.1 --save

# 2) (Recommended) Make sure RSC package is patched too
npm install react-server-dom-webpack@latest --save-dev</code></pre>

      <h3>With yarn</h3>
      <pre><code>yarn add next@16.0.7 react@19.2.1 react-dom@19.2.1
yarn add -D react-server-dom-webpack@latest</code></pre>

      <h3>With pnpm</h3>
      <pre><code>pnpm add next@16.0.7 react@19.2.1 react-dom@19.2.1
pnpm add -D react-server-dom-webpack@latest</code></pre>

      <p>Then:</p>
      <pre><code># Rebuild and run tests
npm run lint
npm run test
npm run build</code></pre>

      <p>Redeploy after a successful build — Vercel should stop blocking once it sees a patched <code>next</code> version.</p>

      <h2>3. Optional: use Vercel’s fixer script</h2>
      <p>Vercel shipped an npm helper that automatically updates affected Next.js apps:</p>
      <pre><code>npx fix-react2shell-next@latest</code></pre>
      <p>This scans your repo and bumps <code>next</code> (and related packages) to safe versions across workspaces/monorepos. You can still pin versions afterward in <code>package.json</code> if you want full control.</p>

      <h2>4. How to verify you actually got the latest</h2>
      <p>From your project root:</p>
      <pre><code># Check what’s actually installed
npm list next react react-dom react-server-dom-webpack

# Confirm these match the patched versions
npm view next@16.0.7 version
npm view react@19.2.1 version
npm view react-dom@19.2.1 version</code></pre>

      <p>You should now see:</p>
      <ul>
        <li><code>next@16.0.7</code></li>
        <li><code>react@19.2.1</code></li>
        <li><code>react-dom@19.2.1</code></li>
      </ul>

      <p>If Vercel was blocking deploys before, re-running the deployment after this upgrade should succeed.</p>

      <h2>5. If you aren’t on Next 16</h2>
      <p>If you’re pinned to another 15.x line, the safe patch versions are:</p>
      <ul>
        <li><strong>15.0.x → 15.0.5</strong></li>
        <li><strong>15.1.x → 15.1.9</strong></li>
        <li><strong>15.2.x → 15.2.6</strong></li>
        <li><strong>15.3.x → 15.3.6</strong></li>
        <li><strong>15.4.x → 15.4.8</strong></li>
        <li><strong>15.5.x → 15.5.7</strong></li>
      </ul>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
        <p className="font-bold text-blue-700">TL;DR</p>
        <p>Just bump Next to 16.0.7 and React/React-DOM to 19.2.1, rebuild, and redeploy. The patches are live now.</p>
      </div>

      <h2>References</h2>
      <ul>
        <li><a href="https://nextjs.org/blog/CVE-2025-66478" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Next.js GHSA</a></li>
        <li><a href="https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">React GHSA</a></li>
        <li><a href="https://vercel.com/blog/resources-for-protecting-against-react2shell" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vercel Resources</a></li>
      </ul>
    `,
    category: 'Security',
    tags: ['Security', 'Vulnerability', 'CVE', 'React', 'Next.js'],
    author: {
      name: 'Vercel Security',
      avatar: 'VS',
      role: 'Security Team'
    },
    publishDate: 'Dec 3, 2025',
    readTime: '2 min read',
    views: 5432,
    seo: {
      metaTitle: 'Summary of CVE-2025-55182 - Security Update',
      metaDescription: 'Critical security update regarding CVE-2025-55182 affecting React Server Components and Next.js. Immediate upgrade recommended.'
    }
  }
]
