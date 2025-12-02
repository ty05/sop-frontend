'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Sample blog posts data - later this can be moved to a CMS or database
const blogPostsData: Record<string, {
  title: string;
  content: string;
  date: string;
  author: string;
  category: string;
  image: string;
}> = {
  'getting-started-with-sop-manual': {
    title: 'Getting Started with SOP Manual',
    date: '2025-01-15',
    author: 'SOP Manual Team',
    category: 'Tutorial',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/video.png',
    content: `
## Welcome to SOP Manual

Creating effective operation manuals has never been easier. SOP Manual is designed to help businesses of all sizes create, manage, and share standard operating procedures with video and image annotations.

## Why SOP Manual?

Traditional paper manuals are difficult to update and maintain. Every time a procedure changes, you need to reprint and redistribute them. SOP Manual solves this problem by providing a digital platform where you can:

- Create interactive video tutorials with annotations
- Add helpful markers and text to images
- Generate QR codes for instant mobile access
- Update procedures in real-time
- Track who has viewed each manual

## Getting Started

### Step 1: Create Your First Document

Start by clicking the "+ New" button in your workspace. Give your document a descriptive title that clearly indicates what procedure it covers.

### Step 2: Add Steps

Break down your procedure into clear, manageable steps. Each step can include:

- Text instructions
- Checklists
- Images with annotations
- Videos with overlays

### Step 3: Upload and Annotate Media

Upload your training videos or photos. Use our built-in editor to add:

- Arrows pointing to important areas
- Text labels explaining key points
- Shapes highlighting specific regions
- Mosaic effects to blur sensitive information

### Step 4: Share with Your Team

Once your manual is ready, you can:

- Generate a QR code for easy mobile access
- Share a direct link with team members
- Export to PDF for offline use
- Set viewing permissions for different team members

## Best Practices

Here are some tips to create effective operation manuals:

1. **Keep it simple** - Break complex procedures into smaller steps
2. **Use visuals** - A picture is worth a thousand words
3. **Be consistent** - Use the same format and terminology throughout
4. **Get feedback** - Ask team members to review and test your manuals
5. **Update regularly** - Keep your manuals current as procedures evolve

## Next Steps

Ready to create your first manual? [Start your 14-day free trial](/documents) and see how easy it is to transform your training process.

Have questions? Check out our [FAQ](/landing#faq) or [contact us](/contact) for help.
    `
  },
  'best-practices-for-training-videos': {
    title: 'Best Practices for Training Videos',
    date: '2025-01-10',
    author: 'SOP Manual Team',
    category: 'Best Practices',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/image.png',
    content: `
## Creating Effective Training Videos

Training videos are one of the most powerful tools for employee onboarding and skill development. However, creating videos that people actually watch and learn from requires careful planning and execution.

## Planning Your Video

### Define Your Objective

Before you hit record, ask yourself:

- What should viewers be able to do after watching?
- What are the most common mistakes or questions?
- How long should the video be?

### Script Your Content

Even for informal videos, having an outline helps you:

- Stay focused on key points
- Avoid rambling or confusion
- Ensure consistent messaging
- Save time in production

## Recording Tips

### Lighting and Audio

Good production quality doesn't require expensive equipment:

- **Lighting**: Film near windows or use basic desk lamps
- **Audio**: Use a simple USB microphone or even earbuds
- **Background**: Choose a clean, uncluttered setting

### Keep It Short

Attention spans are limited. Best practices:

- Aim for 2-5 minutes per video
- Break long procedures into multiple short videos
- Focus on one task or concept per video

### Show, Don't Just Tell

- Demonstrate the actual task being performed
- Use close-up shots for detailed steps
- Point to specific areas as you explain

## Using SOP Manual's Annotation Features

Once you've recorded your video, enhance it with annotations:

### Text Overlays

- Add key points that viewers might miss
- Reinforce important safety warnings
- Provide additional context

### Arrows and Shapes

- Direct attention to specific areas
- Highlight buttons, switches, or controls
- Circle important details

### Time Markers

- Add chapter markers for easy navigation
- Mark key moments for quick reference
- Create a visual timeline of the procedure

## Making Videos Accessible

### QR Codes

Generate QR codes to:

- Place near equipment or workstations
- Print on training materials
- Add to physical manuals

### Mobile-First Design

Most employees will view on phones:

- Ensure text is readable on small screens
- Keep videos short for mobile viewing
- Test on different devices

## Measuring Success

Track how your videos perform:

- Monitor view counts
- Gather feedback from team members
- Update based on common questions
- Replace outdated content promptly

## Common Mistakes to Avoid

1. **Too much information** - One topic per video
2. **Poor audio** - Clear sound is more important than perfect video
3. **No structure** - Always have an intro, body, and conclusion
4. **Ignoring updates** - Review and refresh content regularly
5. **No call to action** - Tell viewers what to do next

## Get Started Today

Ready to create training videos your team will love? [Try SOP Manual free for 14 days](/documents) and see the difference professional annotations can make.
    `
  },
  'how-qr-codes-improve-workplace-efficiency': {
    title: 'How QR Codes Improve Workplace Efficiency',
    date: '2025-01-05',
    author: 'SOP Manual Team',
    category: 'Features',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/qr.png',
    content: `
## The Power of QR Codes in the Workplace

QR codes have become ubiquitous in our daily lives, from restaurant menus to payment systems. But their potential in workplace training and operations is often overlooked.

## What Are QR Codes?

QR (Quick Response) codes are two-dimensional barcodes that can be scanned with a smartphone camera. They instantly direct users to websites, documents, videos, or other digital content.

## Benefits in the Workplace

### Instant Access to Information

Instead of searching through binders or asking colleagues:

- Scan a QR code next to equipment for operating instructions
- Access troubleshooting guides at the point of need
- View safety procedures right where they apply
- Get updated information in real-time

### No More Outdated Manuals

With traditional printed manuals:

- Updates require reprinting and redistribution
- Old versions often remain in circulation
- It's hard to track which version people are using

With QR codes:

- Updates happen instantly for everyone
- No physical reprinting needed
- Always shows the latest version

### Perfect for On-the-Go Teams

For employees who move between locations:

- Service technicians can access repair guides on-site
- Retail staff can check procedures on the floor
- Restaurant workers can review recipes at the station
- Healthcare workers can verify protocols at point of care

## Real-World Use Cases

### Restaurants

**Equipment Stations**
- Coffee machine cleaning procedures
- Dishwasher operation and troubleshooting
- Food safety temperature charts

**Prep Areas**
- Recipe cards with video demonstrations
- Plating guides for consistency
- Allergen information

### Retail Stores

**Product Displays**
- Assembly instructions for demo units
- Return and exchange procedures
- Product knowledge videos

**Back Office**
- Inventory management guides
- POS system troubleshooting
- Opening and closing checklists

### Healthcare Facilities

**Equipment**
- Medical device operation guides
- Cleaning and sterilization procedures
- Maintenance schedules

**Stations**
- Patient care protocols
- Emergency procedures
- Medication administration guides

### Manufacturing

**Machinery**
- Operating instructions
- Safety procedures
- Maintenance schedules
- Troubleshooting guides

**Quality Control**
- Inspection checklists
- Defect identification guides
- Calibration procedures

## Best Practices for QR Code Implementation

### Strategic Placement

Place QR codes where they'll be most useful:

- At eye level for easy scanning
- Near the equipment or location they reference
- Protected from damage (laminated or in holders)
- Well-lit areas for reliable scanning

### Clear Instructions

Not everyone knows how to scan QR codes:

- Add simple instructions: "Scan with phone camera"
- Include a short URL as backup
- Provide a brief description of what they'll find

### Regular Testing

Ensure codes work properly:

- Test from different devices and distances
- Verify they link to the correct content
- Check that content loads quickly
- Update broken or outdated links

### Track Usage

Monitor which codes are being used:

- Identify which procedures need improvement
- See which locations need better training
- Understand peak usage times
- Measure training effectiveness

## Creating QR Codes with SOP Manual

SOP Manual makes it easy to generate QR codes for your operation manuals:

### Simple Process

1. Create your document with steps and media
2. Click the QR Code button
3. Download and print
4. Place near relevant equipment or locations

### Always Up-to-Date

When you update a document:

- The QR code stays the same
- Users always see the latest version
- No need to reprint codes
- Instant deployment of changes

### Mobile-Optimized

All content is automatically mobile-friendly:

- Easy to read on any phone
- Videos stream smoothly
- Images scale appropriately
- Navigation is touch-friendly

## Measuring Impact

After implementing QR codes, you should see:

### Reduced Training Time

- New employees get instant access to procedures
- Less time spent searching for information
- Faster onboarding process

### Fewer Errors

- Correct procedures always available
- Reduced reliance on memory
- Consistent execution across team

### Better Compliance

- Easy access increases manual usage
- Trackable views for audit purposes
- Up-to-date safety procedures

### Cost Savings

- Less paper and printing
- Reduced trainer hours
- Fewer mistakes and rework

## Getting Started

Ready to implement QR codes in your workplace?

1. [Start your free trial](/documents)
2. Create your first operation manual
3. Generate QR codes
4. Place them where your team needs them
5. Watch productivity improve

Have questions about QR codes? [Contact our team](/contact) for personalized guidance.
    `
  }
};

export default function BlogPostPage() {
  const t = useTranslations('blog');
  const params = useParams();
  const slug = params.slug as string;

  const post = blogPostsData[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('postNotFound')}</h1>
          <p className="text-gray-600 mb-8">{t('postNotFoundDescription')}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToBlog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/landing" className="text-xl md:text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              SOP Manual
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/blog"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              {t('backToBlog')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-gray-600">
            <span>{t('by')} {post.author}</span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-video object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: post.content
                .split('\n')
                .map(line => {
                  // Convert markdown-style headings
                  if (line.startsWith('## ')) {
                    return `<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">${line.slice(3)}</h2>`;
                  } else if (line.startsWith('### ')) {
                    return `<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${line.slice(4)}</h3>`;
                  } else if (line.startsWith('- ')) {
                    return `<li class="ml-6 mb-2">${line.slice(2)}</li>`;
                  } else if (line.match(/^\d+\./)) {
                    const match = line.match(/^(\d+)\.\s*(.+)/);
                    if (match) {
                      return `<li class="ml-6 mb-2">${match[2]}</li>`;
                    }
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return `<p class="font-bold text-gray-900 mt-6 mb-2">${line.slice(2, -2)}</p>`;
                  } else if (line.trim() === '') {
                    return '<br />';
                  } else if (!line.startsWith('<')) {
                    // Convert markdown links [text](url) to HTML
                    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    const processed = line.replace(linkRegex, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>');
                    return `<p class="mb-4">${processed}</p>`;
                  }
                  return line;
                })
                .join('')
            }}
          />
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('cta.subtitle')}
          </p>
          <Link
            href="/documents"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            {t('cta.button')}
          </Link>
        </div>

        {/* Related Posts */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('relatedPosts')}</h2>
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('viewAllPosts')}
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/legal" className="hover:text-white transition">Legal Notice</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
