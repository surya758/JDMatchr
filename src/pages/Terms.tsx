import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";
import animationData from "../assets/animations/bg.json";

const Terms = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        {
          subtitle: "Agreement",
          text: "By accessing and using JDMatchr, you accept and agree to be bound by the terms and provision of this agreement.",
        },
        {
          subtitle: "Modifications",
          text: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.",
        },
      ],
    },
    {
      title: "Service Description",
      content: [
        {
          subtitle: "AI Resume Screening",
          text: "JDMatchr provides AI-powered resume analysis and job matching services to help streamline the recruitment process.",
        },
        {
          subtitle: "Service Availability",
          text: "We strive to maintain service availability but do not guarantee uninterrupted access to our platform.",
        },
        {
          subtitle: "Service Updates",
          text: "We may update, modify, or discontinue features of our service at any time with reasonable notice.",
        },
      ],
    },
    {
      title: "User Accounts",
      content: [
        {
          subtitle: "Account Creation",
          text: "You must provide accurate and complete information when creating an account and keep your account information updated.",
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.",
        },
        {
          subtitle: "Account Termination",
          text: "We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.",
        },
      ],
    },
    {
      title: "Acceptable Use",
      content: [
        {
          subtitle: "Permitted Use",
          text: "You may use JDMatchr solely for legitimate business purposes related to recruitment and hiring.",
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not use our service for illegal activities, to violate privacy rights, or to discriminate against protected classes.",
        },
        {
          subtitle: "Content Guidelines",
          text: "All uploaded content must be appropriate, legal, and comply with applicable employment laws and regulations.",
        },
      ],
    },
    {
      title: "Data and Privacy",
      content: [
        {
          subtitle: "Data Processing",
          text: "We process uploaded resumes and job descriptions solely to provide our AI matching services as described in our Privacy Policy.",
        },
        {
          subtitle: "Data Ownership",
          text: "You retain ownership of all data you upload to our platform. We do not claim ownership of your content.",
        },
        {
          subtitle: "Data Security",
          text: "We implement industry-standard security measures to protect your data, but cannot guarantee absolute security.",
        },
      ],
    },
    {
      title: "Subscription and Billing",
      content: [
        {
          subtitle: "Subscription Plans",
          text: "Various subscription plans are available with different features and usage limits as described on our pricing page.",
        },
        {
          subtitle: "Billing",
          text: "Subscription fees are billed in advance on a recurring basis. All fees are non-refundable except as required by law.",
        },
        {
          subtitle: "Cancellation",
          text: "You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.",
        },
      ],
    },
    {
      title: "Intellectual Property",
      content: [
        {
          subtitle: "Our IP",
          text: "JDMatchr and its technology, including AI algorithms and software, are protected by intellectual property laws.",
        },
        {
          subtitle: "User Content",
          text: "By uploading content, you grant us a license to process and analyze it solely to provide our services.",
        },
        {
          subtitle: "Restrictions",
          text: "You may not reverse engineer, copy, or create derivative works based on our platform or technology.",
        },
      ],
    },
    {
      title: "Disclaimers and Limitations",
      content: [
        {
          subtitle: "Service Disclaimer",
          text: "Our service is provided 'as is' without warranties of any kind. AI results are for informational purposes only.",
        },
        {
          subtitle: "Limitation of Liability",
          text: "Our liability is limited to the amount paid for the service. We are not liable for indirect or consequential damages.",
        },
        {
          subtitle: "Hiring Decisions",
          text: "Final hiring decisions remain your responsibility. Our AI analysis is a tool to assist, not replace, human judgment.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        <div className="relative z-10 px-4 sm:px-6 navbar-spacing pb-12 sm:pb-20 flex-1">
          <div
            className={`max-w-4xl mx-auto transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Back Button */}
            <button
              onClick={() => navigate("/")}
              className="group mb-8 flex items-center space-x-2 text-text-muted hover:text-text transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-grotesk text-sm">Back</span>
            </button>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-grotesk text-4xl font-bold text-text mb-4">
                Terms of Service
              </h1>
              <p className="font-grotesk text-text-muted text-lg max-w-2xl mx-auto">
                Please read these terms carefully before using JDMatchr. By
                using our service, you agree to these terms and conditions.
              </p>
              <p className="font-grotesk text-text-subtle text-sm mt-4">
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

                  <div className="relative z-10">
                    <h2 className="font-grotesk text-2xl font-bold text-text mb-6">
                      {section.title}
                    </h2>

                    <div className="space-y-6">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <h3 className="font-grotesk text-lg font-semibold text-text mb-2">
                            {item.subtitle}
                          </h3>
                          <p className="font-grotesk text-text-muted leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Information */}
              <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

                <div className="relative z-10">
                  <h2 className="font-grotesk text-2xl font-bold text-text mb-6">
                    Contact Information
                  </h2>

                  <div className="space-y-4">
                    <p className="font-grotesk text-text-muted leading-relaxed">
                      If you have any questions about these Terms of Service,
                      please contact us:
                    </p>

                    <div className="space-y-2">
                      <p className="font-grotesk text-text">
                        <strong>Email:</strong>{" "}
                        <a
                          href="mailto:legal@jdmatchr.com"
                          className="text-primary hover:text-primary/80 transition-colors duration-200"
                        >
                          surya@jdmatchr.com
                        </a>
                      </p>
                      <p className="font-grotesk text-text">
                        <strong>Contact Form:</strong>{" "}
                        <button
                          onClick={() => navigate("/contact")}
                          className="text-primary hover:text-primary/80 transition-colors duration-200 underline"
                        >
                          Use our contact form
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Governing Law */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8">
                <h2 className="font-grotesk text-xl font-bold text-text mb-4">
                  Governing Law
                </h2>
                <p className="font-grotesk text-text-muted leading-relaxed">
                  These terms shall be governed by and construed in accordance
                  with applicable laws. Any disputes arising from these terms or
                  your use of JDMatchr shall be resolved through binding
                  arbitration or in the appropriate courts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Terms;
