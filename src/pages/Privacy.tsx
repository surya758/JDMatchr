import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";
import animationData from "../assets/animations/bg.json";

const Privacy = () => {
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
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          text: "When you create an account, we collect your name, email address, and other information you provide during registration.",
        },
        {
          subtitle: "Resume Data",
          text: "We process resumes and job descriptions that you upload to our platform for AI analysis and matching purposes.",
        },
        {
          subtitle: "Usage Information",
          text: "We collect information about how you use our service, including features accessed and analysis results.",
        },
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Provision",
          text: "We use your information to provide AI-powered resume screening and matching services.",
        },
        {
          subtitle: "Account Management",
          text: "To manage your account, process payments, and provide customer support.",
        },
        {
          subtitle: "Service Improvement",
          text: "To analyze usage patterns and improve our AI algorithms and user experience.",
        },
        {
          subtitle: "Communication",
          text: "To send you service-related notifications, updates, and marketing communications (with your consent).",
        },
      ],
    },
    {
      title: "Data Security",
      content: [
        {
          subtitle: "Encryption",
          text: "All data is encrypted in transit and at rest using industry-standard encryption protocols.",
        },
        {
          subtitle: "Access Controls",
          text: "We implement strict access controls to ensure only authorized personnel can access your data.",
        },
        {
          subtitle: "Regular Audits",
          text: "We conduct regular security audits and vulnerability assessments to maintain data security.",
        },
      ],
    },
    {
      title: "Data Sharing",
      content: [
        {
          subtitle: "No Third-Party Sharing",
          text: "We do not sell, rent, or share your personal information with third parties for marketing purposes.",
        },
        {
          subtitle: "Service Providers",
          text: "We may share data with trusted service providers who help us operate our platform, under strict confidentiality agreements.",
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information when required by law or to protect our rights and the safety of our users.",
        },
      ],
    },
    {
      title: "Your Rights",
      content: [
        {
          subtitle: "Data Access",
          text: "You have the right to access, update, or delete your personal information at any time.",
        },
        {
          subtitle: "Data Portability",
          text: "You can request a copy of your data in a machine-readable format.",
        },
        {
          subtitle: "Opt-Out",
          text: "You can opt out of marketing communications and certain data processing activities.",
        },
      ],
    },
    {
      title: "Data Retention",
      content: [
        {
          subtitle: "Account Data",
          text: "We retain your account information for as long as your account is active or as needed to provide services.",
        },
        {
          subtitle: "Resume Data",
          text: "Uploaded resumes and analysis results are retained according to your subscription plan and deletion preferences.",
        },
        {
          subtitle: "Deletion",
          text: "You can request deletion of your data at any time, and we will process such requests within 30 days.",
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
                Privacy Policy
              </h1>
              <p className="font-grotesk text-text-muted text-lg max-w-2xl mx-auto">
                Your privacy is important to us. This policy explains how
                JDMatchr collects, uses, and protects your personal information.
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
                    Contact Us
                  </h2>

                  <div className="space-y-4">
                    <p className="font-grotesk text-text-muted leading-relaxed">
                      If you have any questions about this Privacy Policy or our
                      data practices, please contact us:
                    </p>

                    <div className="space-y-2">
                      <p className="font-grotesk text-text">
                        <strong>Email:</strong>{" "}
                        <a
                          href="mailto:privacy@jdmatchr.com"
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

              {/* Policy Updates */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8">
                <h2 className="font-grotesk text-xl font-bold text-text mb-4">
                  Policy Updates
                </h2>
                <p className="font-grotesk text-text-muted leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the new Privacy
                  Policy on this page and updating the "Last updated" date. We
                  encourage you to review this Privacy Policy periodically to
                  stay informed about how we protect your information.
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

export default Privacy;
