import React, { useEffect, useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Loader, LoaderInline } from "../components/ui/loader";
import { useToast } from "../hooks/use-toast";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";
import animationData from "../assets/animations/bg.json";
import { submitContactForm, type ContactFormData } from "../lib/contact";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Trigger fade-in animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay for smooth entrance
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const contactData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      };

      const result = await submitContactForm(contactData);

      if (result.success) {
        // Show success message
        toast({
          title: "Message sent successfully!",
          description: result.message,
        });

        setSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: "", email: "", subject: "", message: "" });
        }, 3000);
      } else {
        // Show error message
        toast({
          title: "Failed to send message",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Failed to send message",
        description:
          "An unexpected error occurred. Please try again or contact us directly at surya@jdmatchr.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.message;

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk scrollbar-hide">
      {/* Lottie Background Animation */}
      <LottieBackground animationData={animationData} />

      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative md:border-l md:border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        <div className="relative z-9 px-4 sm:px-6 navbar-spacing pb-12 sm:pb-20 flex-1 flex items-center justify-center">
          <div
            className={`w-full max-w-md transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="group mb-8 flex items-center space-x-2 text-text-muted hover:text-text transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-grotesk text-sm">Back</span>
            </button>

            {/* Contact Form */}
            <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="font-grotesk text-2xl font-bold text-text mb-2">
                    Get in Touch
                  </h1>
                  <p className="font-grotesk text-text-muted">
                    Send us a message and we'll get back to you soon
                  </p>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="font-grotesk text-xl font-semibold text-text mb-2">
                      Message Sent!
                    </h3>
                    <p className="font-grotesk text-text-muted">
                      Thanks for reaching out. We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-grotesk text-sm font-medium text-text mb-2">
                          Name *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-grotesk text-sm font-medium text-text mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-grotesk text-sm font-medium text-text mb-2">
                        Subject
                      </label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What's this about?"
                        className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk"
                      />
                    </div>

                    <div>
                      <label className="block font-grotesk text-sm font-medium text-text mb-2">
                        Message *
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-grotesk font-medium py-3 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <LoaderInline isLoading={isSubmitting} size="sm" />
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
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

export default Contact;
