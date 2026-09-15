import React from 'react';
import { Cpu, Radio, Sliders, BookOpen, AlertCircle } from 'lucide-react';
import { TechArchitecture } from '../components/landing/TechArchitecture';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export const About = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Top Header with ScrollReveal */}
      <ScrollReveal className="text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300/60 dark:border-[#1B6348] text-xs font-mono text-emerald-800 dark:text-[#8DE8C5] font-semibold mb-3 shadow-xs">
          DEEP LEARNING METHODOLOGY
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans">
          The Science Behind SignalScope
        </h1>
        <p className="text-[#3D5C49] dark:text-[#A8C7B8] mt-4 text-base sm:text-lg leading-relaxed">
          How modern generative diffusion and GAN models leave physical and mathematical signatures across spatial patch embeddings and high-frequency Fourier spectra.
        </p>
      </ScrollReveal>

      {/* Section 1: What is SignalScope? with ScrollReveal */}
      <ScrollReveal delay={0.1}>
        <section className="p-8 sm:p-10 rounded-3xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] space-y-4 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#103A2A] text-emerald-700 dark:text-[#21C58A] border border-emerald-200 dark:border-[#1B6348]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
                What is SignalScope?
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed mb-3">
              SignalScope is an automated media forensics platform engineered to detect synthetic imagery. Unlike naive binary classifiers that overfit to specific generator textures, SignalScope evaluates visual media through independent, complementary channels: <strong className="dark:text-[#E7F5EE]">spatial visual semantics</strong> and <strong className="dark:text-[#E7F5EE]">frequency-domain residuals</strong>.
            </p>
            <p className="text-sm sm:text-base text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
              By combining these representations through cross-attention fusion and applying post-hoc temperature scaling, SignalScope delivers well-calibrated likelihood estimates rather than ungrounded, over-confident declarations.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Section 2: Core Analysis Pillars with ScrollReveal */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spatial Analysis Pillar */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel spotlight-card border border-[#16A34A]/18 dark:border-[#1B6348] space-y-3 shadow-sm">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#103A2A] border border-emerald-200 dark:border-[#1B6348] flex items-center justify-center text-emerald-700 dark:text-[#21C58A] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0D331E] dark:text-[#E7F5EE] mb-2 font-sans">1. Spatial Domain (ViT-B/16)</h3>
              <p className="text-xs sm:text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
                The spatial branch utilizes a Vision Transformer backbone dividing the image into 16×16 non-overlapping patches. Multi-head self-attention enables the model to identify non-local semantic irregularities: inconsistent illumination vectors, mismatched specular reflections, and boundary blending artifacts.
              </p>
            </div>
          </div>

          {/* Frequency Analysis Pillar */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel spotlight-card border border-teal-500/20 dark:border-teal-700/40 space-y-3 shadow-sm">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-700/60 flex items-center justify-center text-teal-700 dark:text-teal-400 mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0D331E] dark:text-[#E7F5EE] mb-2 font-sans">2. Frequency Domain (2D-FFT)</h3>
              <p className="text-xs sm:text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
                Generative models rely on transposed convolutions or latent upsampling operations that imprint periodic lattice artifacts. By computing the 2D Fast Fourier Transform and evaluating the azimuthally-averaged power spectrum, SignalScope isolates high-frequency spikes invisible in spatial pixel space.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Architecture Deep Dive */}
      <TechArchitecture />

      {/* Section 3: Calibration & Temperature Scaling with ScrollReveal */}
      <ScrollReveal delay={0.15}>
        <section className="p-8 sm:p-10 rounded-3xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] space-y-4 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#103A2A] border border-emerald-200 dark:border-[#1B6348] text-emerald-700 dark:text-[#21C58A]">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
                Temperature Scaling & Probability Calibration
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed mb-3">
              Modern deep neural networks are notoriously overconfident: a model outputting 0.99 softmax probability often achieves only 80% empirical precision on out-of-distribution imagery.
            </p>
            <p className="text-sm sm:text-base text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
              SignalScope incorporates validation-set temperature scaling (<span className="font-mono text-emerald-700 dark:text-[#21C58A] font-bold">z / T</span>). By softening the logits with an optimized parameter <span className="font-mono text-emerald-700 dark:text-[#21C58A] font-bold">T</span>, an assessed score of 87% accurately indicates that 87 out of 100 identically scored images are synthetic.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Section 4: Responsible AI & Ethical Boundaries with ScrollReveal */}
      <ScrollReveal delay={0.15}>
        <section className="p-8 sm:p-10 rounded-3xl glass-panel spotlight-card border border-amber-300/60 dark:border-amber-700/40 space-y-4 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700/60 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
                Responsible AI & Ethical Boundaries
              </h2>
            </div>
            <div className="space-y-3 text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
              <p>
                SignalScope adheres strictly to honest uncertainty communication and media forensics ethics:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-[#3D5C49] dark:text-[#A8C7B8] pl-2">
                <li><strong className="dark:text-[#E7F5EE]">No Absolute Proof:</strong> Outputs are likelihood assessments based on statistical representations, never definitive legal or judicial verdicts.</li>
                <li><strong className="dark:text-[#E7F5EE]">No Facial or Demographic Profiling:</strong> Models are trained solely on general spatial textures and frequency signals, not biometrics.</li>
                <li><strong className="dark:text-[#E7F5EE]">No Political Fact Adjudication:</strong> The system evaluates media integrity, not the truthfulness of journalistic claims.</li>
                <li><strong className="dark:text-[#E7F5EE]">Explicit Uncertainty:</strong> Low-confidence scores near the decision threshold are clearly flagged as inconclusive.</li>
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
};
