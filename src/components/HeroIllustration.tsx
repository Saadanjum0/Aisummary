import React from 'react';
import { motion } from 'framer-motion';
// Note: The original code used inline SVGs, so lucide-react icons like Brain, FileText are not needed here unless re-added.

const HeroIllustration: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main PDF document */}
      <motion.div 
        className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-card overflow-hidden border border-primary-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* PDF Header */}
        <div className="bg-primary-100 dark:bg-gray-700 px-6 py-4 border-b border-primary-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-error-500 mr-2"></div>
              <div className="w-3 h-3 rounded-full bg-warning-500 mr-2"></div>
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
            </div>
            <div className="text-xs text-primary-500 dark:text-primary-300">research-paper.pdf</div>
          </div>
        </div>
        
        {/* PDF Content Placeholders */}
        <div className="p-6">
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="h-6 bg-primary-100 dark:bg-gray-700 rounded-full w-3/4 mb-2"></div>
              <div className="h-6 bg-primary-100 dark:bg-gray-700 rounded-full w-1/2"></div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-full"></div>
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-full"></div>
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-3/4"></div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <div className="h-6 bg-primary-100 dark:bg-gray-700 rounded-full w-2/3 mb-2"></div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-full"></div>
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-full"></div>
              <div className="h-4 bg-primary-50 dark:bg-gray-600 rounded-full w-5/6"></div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* AI Processing Animation */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ 
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full rounded-full bg-accent-500/30 dark:bg-accent-700/30 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-accent-500/60 dark:bg-accent-700/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-accent-500 dark:bg-accent-600 animate-ping"></div>
          </div>
        </div>
      </motion.div>
      
      {/* Summary Output Card */}
      <motion.div 
        className="absolute top-10 right-0 transform translate-x-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-card border border-primary-200 dark:border-gray-700 p-5 w-64"
        initial={{ opacity: 0, x: "30%" }}
        animate={{ opacity: 1, x: "20%" }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-700/30 flex items-center justify-center mr-3 text-accent-600 dark:text-accent-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-100">Summary</h3>
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-primary-50 dark:bg-gray-700 rounded-full w-full"></div>
          <div className="h-3 bg-primary-50 dark:bg-gray-700 rounded-full w-full"></div>
          <div className="h-3 bg-primary-50 dark:bg-gray-700 rounded-full w-3/4"></div>
          <div className="h-3 bg-primary-50 dark:bg-gray-700 rounded-full w-full"></div>
          <div className="h-3 bg-primary-50 dark:bg-gray-700 rounded-full w-5/6"></div>
        </div>
      </motion.div>
      
      {/* Keywords Output Card */}
      <motion.div 
        className="absolute bottom-10 left-0 transform -translate-x-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-card border border-primary-200 dark:border-gray-700 p-5 w-56"
        initial={{ opacity: 0, x: "-30%" }}
        animate={{ opacity: 1, x: "-20%" }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-700/30 flex items-center justify-center mr-3 text-accent-600 dark:text-accent-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 20L11 4M13 20L17 4M6 9H20M4 15H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-100">Key Points</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 bg-primary-50 dark:bg-gray-700 rounded-full text-xs text-primary-700 dark:text-primary-200">Machine Learning</div>
          <div className="px-3 py-1 bg-primary-50 dark:bg-gray-700 rounded-full text-xs text-primary-700 dark:text-primary-200">Data Analysis</div>
          <div className="px-3 py-1 bg-primary-50 dark:bg-gray-700 rounded-full text-xs text-primary-700 dark:text-primary-200">AI Models</div>
          <div className="px-3 py-1 bg-primary-50 dark:bg-gray-700 rounded-full text-xs text-primary-700 dark:text-primary-200">Research</div>
        </div>
      </motion.div>
      
      {/* Decorative elements */}
      <div className="absolute -z-10 top-20 -left-4 w-24 h-24 rounded-full bg-accent-100/50 dark:bg-accent-800/30"></div>
      <div className="absolute -z-10 -bottom-10 right-10 w-32 h-32 rounded-full bg-primary-100/70 dark:bg-primary-800/40"></div>
    </div>
  );
};

export default HeroIllustration; 