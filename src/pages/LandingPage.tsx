import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, CheckCircle, Clock, FileText, Shield, BarChart } from 'lucide-react';
import HeroIllustration from '../components/illustrations/HeroIllustration';
import { Menu, X } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featureItems = [
    {
      icon: <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning models extract key information and identify critical points."
    },
    {
      icon: <Clock className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "Save Hours of Reading",
      description: "Get the essence of lengthy documents in minutes, not hours."
    },
    {
      icon: <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "Multiple Document Types",
      description: "Works with academic papers, reports, articles, contracts, and more."
    },
    {
      icon: <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "Secure Document Handling",
      description: "Your documents are processed securely. (Note: Review actual data handling for public claims)."
    },
    {
      icon: <BarChart className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "Customizable Outputs",
      description: "Tailor summary length and focus areas based on your specific needs (future feature)."
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: "High Accuracy",
      description: "Our summarization maintains context and captures nuanced information."
    }
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const featureListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const featureItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-accent-900 text-primary-900 dark:text-primary-100">
      {/* Responsive Navbar for Landing Page */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 relative">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="ml-3 text-2xl font-bold text-primary-800 dark:text-white">PDF Summarizer</span>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {['Features'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {item}
              </a>
            ))}
            <Link to="/login">
              <button className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-md">
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md font-medium shadow-md hover:bg-blue-600 transition-colors">
                Get Started Free
              </button>
            </Link>
          </div>
          {/* Hamburger for Mobile */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-16 right-0 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg py-3 flex flex-col items-stretch space-y-1 md:hidden animate-fade-in z-50">
              <a href="#features" className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2 rounded-md">
                Features
              </a>
              <Link to="/login">
                <button className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2 rounded-md text-left w-full">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md font-medium shadow-md hover:bg-blue-600 transition-colors w-full">
                  Get Started Free
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        id="hero"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <motion.div 
              className="lg:w-1/2 text-center lg:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900 dark:text-white leading-tight mb-6">
                Transform PDFs into <span className="text-blue-600 dark:text-blue-400">Smart Summaries</span>
              </h1>
              <p className="text-lg text-primary-700 dark:text-primary-200 mb-10 max-w-2xl mx-auto lg:mx-0">
                Extract key insights, save hours of reading, and never miss important information again. Our AI-powered tool distills complex PDFs into concise, actionable summaries.
              </p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity:0, y: 20 }}
                animate={{ opacity:1, y: 0 }}
                transition={{ duration:0.5, delay: 0.4}}
              >
                <Link to="/register"> 
                  <button className="w-full sm:w-auto px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold text-base shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out transform hover:scale-105">
                    Get Started Free
                  </button>
                </Link>
                <button 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 dark:bg-gray-700 dark:text-blue-300 rounded-lg font-semibold text-base shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out transform hover:scale-105">
                  See How It Works
                </button>
              </motion.div>
              <motion.div 
                className="mt-10 flex items-center justify-center lg:justify-start text-primary-600 dark:text-primary-300"
                initial={{ opacity:0, y: 20 }}
                animate={{ opacity:1, y: 0 }}
                transition={{ duration:0.5, delay: 0.6}}
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>No credit card required</span>
                <span className="mx-3 text-primary-300 dark:text-primary-500">•</span>
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Cancel anytime</span>
              </motion.div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2 mt-12 lg:mt-0"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800/50"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 dark:text-white mb-4">
              Why Choose Our PDF Summarizer
            </h2>
            <p className="text-lg text-primary-600 dark:text-primary-300 max-w-3xl mx-auto">
              Our advanced AI technology delivers accurate, concise summaries tailored to your needs, helping you work smarter, not harder.
            </p>
          </div>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={featureListVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {featureItems.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-gray-700/50 transition-shadow duration-300 flex flex-col items-start"
                variants={featureItemVariants}
              >
                <div className="p-3 rounded-full bg-blue-100 dark:bg-accent-700/30 mb-4">
                  {feature.icon} 
                </div>
                <h3 className="text-xl font-semibold text-primary-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-primary-600 dark:text-primary-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        id="cta"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-4xl mx-auto text-center bg-white dark:bg-gray-800 p-10 sm:p-16 rounded-xl shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 dark:text-white mb-6">
            Ready to Transform How You Handle Documents?
          </h2>
          <p className="text-lg text-primary-700 dark:text-primary-300 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals and students who save time and improve productivity with our smart PDF summarizer.
          </p>
          <Link to="/register">
            <button className="px-10 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out transform hover:scale-105">
              Start Your Free Trial Now
            </button>
          </Link>
        </div>
      </motion.section>

      {/* Footer for Landing Page */}
      <footer className="py-10 border-t border-primary-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-primary-500 dark:text-primary-400">
          <p>&copy; {new Date().getFullYear()} SmartSummarizer. All rights reserved.</p>
          <p className="mt-1">Built with Passion & AI by Saad and Abdullah.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 