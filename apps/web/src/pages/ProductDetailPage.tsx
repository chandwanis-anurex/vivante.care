import { useParams, Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { getProduct } from '@/lib/products';
import { ChevronLeft } from 'lucide-react';

export function ProductDetailPage() {
  const { slug } = useParams();
  const product = getProduct(slug);

  if (!product) {
    return (
      <PageShell>
        <div className="max-w-[640px] mx-auto px-6 py-28 text-center">
          <h1 className="text-3xl font-extrabold text-charcoal mb-3">Product not found</h1>
          <Link to="/" className="text-teal underline font-semibold">
            Back to home
          </Link>
        </div>
      </PageShell>
    );
  }

  const FallbackIcon = product.features[0].icon;

  return (
    <PageShell>
      <div className="max-w-[820px] mx-auto px-6 py-16">
        <Link
          to="/#how-it-works"
          className="inline-flex items-center gap-1 text-sm font-semibold text-charcoal/60 hover:text-navy mb-8"
        >
          <ChevronLeft size={16} /> Back to all products
        </Link>

        <div className="flex items-center gap-5 mb-2">
          {product.headshot ? (
            <img
              src={product.headshot}
              alt=""
              className={`w-20 h-20 rounded-full object-cover border-4 shadow-md ${product.ring}`}
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 bg-white shadow-md ${product.ring}`}
            >
              <FallbackIcon className={product.color} size={32} strokeWidth={1.5} />
            </div>
          )}
          <div>
            <h1 className={`text-5xl font-extrabold ${product.color}`}>{product.name}</h1>
            <div className="text-lg text-muted mt-1">{product.tagline}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8 mb-10">
          {product.features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 text-md font-semibold text-navy border border-charcoal/10 px-3.5 py-2"
            >
              <f.icon className={product.color} size={18} strokeWidth={1.8} />
              {f.label}
            </div>
          ))}
        </div>

        <Card accent={product.accent} className="mb-8">
          <div className="text-xl font-bold text-charcoal mb-5">How it works</div>
          <ol className="space-y-4">
            {product.howItWorks.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span
                  className={`shrink-0 w-7 h-7 flex items-center justify-center text-sm font-bold text-white bg-current ${product.color}`}
                >
                  <span className="text-white">{i + 1}</span>
                </span>
                <span className="text-base text-charcoal/80 leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        {!product.externalUrl && product.slug === 'homecare' && (
          <Card accent="neutral" className="text-center py-8">
            <p className="text-base text-charcoal/70 mb-4">
              VivanteHomeCare's certification program runs on its own site, which is coming soon.
            </p>
            <span className="inline-block text-md font-bold text-white bg-charcoal/30 px-6 py-3 cursor-not-allowed select-none">
              Visit VivanteHomeCare — Coming Soon
            </span>
          </Card>
        )}

        <div className="mt-10 text-center">
          <Link to="/" className="text-teal underline font-semibold">
            Back to home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
