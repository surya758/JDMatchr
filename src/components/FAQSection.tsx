import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What exactly does this tool do?",
      answer:
        "We analyze multiple resumes against a job description you provide. Within seconds, you'll receive a ranked list of candidates with skill matches and fit scores.",
    },
    {
      question: "What file formats are supported?",
      answer:
        "You can upload resumes in PDF, JPG, PNG, and other image formats. The job description can be pasted directly into the text area.",
    },
    {
      question: "Is this tool accurate?",
      answer:
        "Yes — but like any AI system, it's not perfect. Our goal is to speed up your initial screening, not replace your judgment. Use it to shortlist, not make final decisions.",
    },
    {
      question: "Do I need to write prompts or train anything?",
      answer:
        'No prompts, no setup, no learning curve. Just paste your job description, upload resumes, and hit "Analyze." The tool works out of the box.',
    },
    {
      question: "What are the usage limits?",
      answer:
        "Free users can analyze 1 job per month. Pro plan users get 30 jobs per month with advanced features like PDF reports and detailed breakdowns.",
    },
    {
      question: "Who is this tool for?",
      answer:
        "It's built for HR professionals, recruiters, and hiring managers who need a fast way to screen candidates without spending hours manually reviewing resumes.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl mx-auto w-full pt-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HelpCircle className="w-5 h-5 text-text-muted" />
            <span className="font-aoenik text-sm text-text-muted uppercase tracking-wider">
              FAQ
            </span>
          </div>
          <h2 className="font-aoenik text-3xl md:text-4xl font-bold text-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="font-aoenik text-lg text-text-muted max-w-2xl mx-auto">
            Everything you need to know about JDMatchr
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-bg border border-border-custom rounded-xl overflow-hidden hover:bg-bg-light transition-colors duration-200"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-0"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-aoenik text-sm font-medium text-text pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  <div
                    className={`transform transition-transform duration-300 ease-in-out ${
                      openIndex === index ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-5 border-t border-border-custom bg-bg-light">
                  <p className="font-aoenik text-sm text-text-muted pt-4 leading-relaxed transform transition-transform duration-300 ease-in-out">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="font-aoenik text-sm text-text-muted mb-4">
            Still have questions?
          </p>
          <div className="bg-bg-light border border-border-custom rounded-xl px-6 py-4 inline-block">
            <span className="font-aoenik text-sm text-text">
              💬 <span className="font-medium">Get in touch:</span> We're here
              to help you streamline your hiring process
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
